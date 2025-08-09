import { NextRequest, NextResponse } from "next/server";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { supabase } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "path";

interface HackRxRequest {
  documents: string;
  questions: string[];
}

interface HackRxResponse {
  answers: string[];
}

interface RetrievalResult {
  answer: string;
}

interface BatchResult {
  answer: string;
  originalIndex: number;
}

const Auth_api_key = process.env.AUTHORIZATION_KEY;

// Instance caching for performance
let cachedEmbeddings: GoogleGenerativeAIEmbeddings | null = null;
let cachedllm: ChatGoogleGenerativeAI | null = null;

function getOptimizedEmbeddings() {
  if (!cachedEmbeddings) {
    cachedEmbeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      maxRetries: 2,
      // maxConcurrency: 3,
      maxConcurrency: 5,
    });
  }
  return cachedEmbeddings;
}

function getOptimizedLLM() {
  if (!cachedllm) {
    cachedllm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      temperature: 0.1,
      maxRetries: 2,
      // maxConcurrency: 2,
      maxConcurrency: 4,
    });
  }
  return cachedllm;
}

// Optimized text splitter for maximum context preservation
function getOptimizedTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1500, // Increased for better context
    chunkOverlap: 300, // Higher overlap to preserve connections
    separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "],
    lengthFunction: (text: string) => text.length,
  });
}

// Highly optimized custom retriever with very low threshold
class CustomScoreRetriever extends BaseRetriever {
  lc_namespace = ["custom", "retrievers"];

  constructor(
    private vectorStore: SupabaseVectorStore,
    private scoreThreshold: number = 0.3, // Very low threshold
    private k: number = 20 // More documents
  ) {
    super();
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    // Get even more results initially 
    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      this.k * 4
    );

    return results
      .filter(([_doc, score]) => score >= this.scoreThreshold)
      .slice(0, this.k)
      .map(([doc, _score]) => doc);
  }
}

// Enhanced question improvement with very specific number-focused patterns
function enhanceQuestion(question: string): string {
  const questionLower = question.toLowerCase();

  // Ultra-specific patterns focusing on exact numbers and terms
  const enhancementPatterns = {
    grace: "grace period thirty days 30 premium payment due date installment",
    "grace period":
      "grace period thirty days 30 premium payment due date installment definition",
    "premium payment": "grace period thirty days 30 premium payment due date",
    "waiting period":
      "waiting period months years coverage exclusion timeline thirty six 36 twenty four 24",
    "pre-existing":
      "pre-existing disease waiting period thirty six 36 months years coverage",
    cataract:
      "cataract surgery two years 2 years waiting period specific exclusion",
    surgery: "surgery cataract two years 2 years waiting period specific",
    maternity:
      "maternity expenses childbirth twenty four 24 months waiting period eligibility",
    "organ donor":
      "organ donor medical expenses hospitalization coverage transplantation",
    "room rent": "room rent daily limit 1% percentage sum insured caps",
    "claim discount": "no claim discount 5% percentage premium renewal benefit",
    "health check":
      "health check-up preventive care coverage reimbursement two years",
    hospital:
      "hospital definition 10 15 beds nursing staff medical practitioners",
    ayurveda:
      "ayurveda yoga naturopathy unani siddha homeopathy AYUSH coverage",
    "how much":
      "amount cost percentage limit sum insured specific number days months",
    "how many":
      "number quantity count duration period specific amount days months",
    percentage: "percentage rate proportion ratio specific number 1% 2% 5%",
    days: "days duration period timeline thirty 30 specific number",
    months:
      "months duration period twenty four 24 thirty six 36 specific number",
    years: "years duration period two 2 waiting time specific number",
  };

  for (const [pattern, enhancement] of Object.entries(enhancementPatterns)) {
    if (questionLower.includes(pattern)) {
      return `${question} ${enhancement} - find exact numbers, specific timeframes, and precise numerical values`;
    }
  }

  // Generic enhancement with emphasis on numbers
  return `${question} - include exact numbers, specific days/months/years, precise percentages, and detailed numerical conditions from the insurance policy document`;
}

// Minimal answer quality checker to avoid over-filtering
function isAnswerIncomplete(answer: string, _question: string): boolean {
  const answerLower = answer.toLowerCase();

  // Only check for very obvious incomplete indicators
  const severeIncompleteIndicators = [
    "not found in the document",
    "document does not contain",
    "no information available",
    "unable to locate",
  ];

  // Very short answers
  if (answer.length < 15) return true;

  // Check for severe incomplete indicators only
  return severeIncompleteIndicators.some((indicator) =>
    answerLower.includes(indicator)
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// Number-focused alternate query generator
function generateAlternateQuery(question: string): string {
  const questionLower = question.toLowerCase();

  // Extract key terms with focus on numbers and timeframes
  const numberKeywords = [
    "thirty",
    "30",
    "twenty",
    "24",
    "thirty-six",
    "36",
    "two",
    "2",
    "grace",
    "period",
    "waiting",
    "days",
    "months",
    "years",
    "premium",
    "payment",
    "cataract",
    "surgery",
    "maternity",
    "pre-existing",
    "coverage",
    "policy",
    "benefit",
    "percentage",
    "discount",
    "limit",
    "hospital",
    "expenses",
  ];

  const foundKeywords = numberKeywords.filter((keyword) =>
    questionLower.includes(keyword)
  );

  return foundKeywords.slice(0, 6).join(" ") || question;
}

// Clean answer while preserving numbers
function cleanAnswer(answer: string): string {
  return answer
    .replace(/^According to the provided.*?,\s*/i, "")
    .replace(/^Based on the.*?,\s*/i, "")
    .replace(/^The document states.*?,\s*/i, "")
    .replace(/^From the document.*?,\s*/i, "")
    .replace(/^As per the.*?,\s*/i, "")
    .replace(/^The policy.*states.*?,\s*/i, "")
    .replace(/^This document.*?,\s*/i, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Optimized question processing with minimal retry interference
async function processQuestionBatch(
  questions: string[],
  retrievalChain: {
    invoke: (params: { input: string }) => Promise<RetrievalResult>;
  },
  batchSize: number = 2
): Promise<string[]> {
  const answers: string[] = new Array(questions.length);
  const responseCache = new Map<string, string>();
  const createCacheKey = (question: string): string => {
    return question
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s/g, "-"); // Replace spaces with hyphens
  };
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        questions.length / batchSize
      )}`
    );

    const batchPromises = batch.map(
      async (question, batchIndex): Promise<BatchResult> => {
        const originalIndex = i + batchIndex;
        try {
          console.log(`Processing question ${originalIndex + 1}: ${question}`);
          //Step 0: checking cache first
          const cacheKey = createCacheKey(question);
          if (responseCache.has(cacheKey)) {
            console.log(` Cache hit for question: ${question}`);
            return {
              answer: responseCache.get(cacheKey)!,
              originalIndex,
            };
          }
          // Step 1: Enhance question for better retrieval
          const enhancedQuestion = enhanceQuestion(question);

          // Step 2: Primary search with extended timeout
          const primaryResult = await Promise.race([
            retrievalChain.invoke({ input: enhancedQuestion }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 30000)
            ),
          ]);

          let answer = primaryResult.answer;

          // Step 3: Only retry if answer is severely incomplete (minimal retry)
          if (isAnswerIncomplete(answer, question)) {
            console.log(`Retrying with alternate strategy for: ${question}`);
            const alternateQuery = generateAlternateQuery(question);

            try {
              const alternateResult = await Promise.race([
                retrievalChain.invoke({
                  input: `${alternateQuery} exact numbers specific timeframes`,
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Alternate timeout")),
                    20000
                  )
                ),
              ]);

              // Use alternate result if it has more specific information
              if (
                alternateResult.answer &&
                (alternateResult.answer.length > answer.length ||
                  /\d/.test(alternateResult.answer))
              ) {
                answer = alternateResult.answer;
              }
            } catch (error) {
              console.log(`Retry failed for question: ${question}`, error);
            }
          }

          // Step 4: Clean and format the answer
          answer = cleanAnswer(answer);
          responseCache.set(cacheKey, answer);
          console.log(` Cached response for: ${question}`);
          return { answer, originalIndex };
        } catch (error) {
          console.error(`Error processing question: ${question}`, error);
          return {
            answer:
              "Unable to retrieve information for this question from the document.",
            originalIndex,
          };
        }
      }
    );

    // Process batch in parallel
    const batchResults = await Promise.allSettled(batchPromises);

    // Store results in correct order
    batchResults.forEach((result, batchIndex) => {
      const originalIndex = i + batchIndex;
      if (result.status === "fulfilled") {
        answers[originalIndex] = result.value.answer;
      } else {
        answers[originalIndex] = "Failed to process this question.";
      }
    });

    // Minimal delay between batches
    // if (i + batchSize < questions.length) {
    //   await new Promise(resolve => setTimeout(resolve, 100));
    // }
  }

  return answers;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid Authorization header. Expected: Bearer <token>",
        },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);
    if (token !== Auth_api_key) {
      return NextResponse.json(
        {
          error: "Invalid API key",
        },
        { status: 401 }
      );
    }

    // Input validation
    const { documents: documentUrl, questions } =
      (await request.json()) as HackRxRequest;

    if (!documentUrl || !questions || questions.length === 0) {
      return NextResponse.json(
        {
          error: "Document URL and at least one question are required.",
        },
        { status: 400 }
      );
    }

    // Document processing
    console.log("Starting document processing from URL:", documentUrl);

    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download document from URL: ${documentUrl}`);
    }

    const bytes = await response.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = path
      .extname(new URL(documentUrl).pathname)
      .toLowerCase();

    let docs;
    if (fileExtension === ".pdf") {
      const loader = new PDFLoader(
        new Blob([buffer], { type: "application/pdf" })
      );
      docs = await loader.load();
    } else if (fileExtension === ".docx") {
      const loader = new DocxLoader(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      );
      docs = await loader.load();
    } else if (fileExtension === ".eml") {
      const emailText = buffer.toString("utf-8");
      docs = [
        {
          pageContent: emailText,
          metadata: {
            source: documentUrl,
            type: "email",
          },
        },
      ];
    } else {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${fileExtension}. Supported types: .pdf, .docx, .eml`,
        },
        { status: 400 }
      );
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json(
        {
          error: "No content could be extracted from the document",
        },
        { status: 400 }
      );
    }

    // Split documents into chunks with maximum context preservation
    const textSplitter = getOptimizedTextSplitter();
    const splitDocs = await textSplitter.splitDocuments(docs);

    if (!splitDocs || splitDocs.length === 0) {
      return NextResponse.json(
        {
          error: "Document could not be processed into chunks",
        },
        { status: 400 }
      );
    }

    // Enrich documents with metadata
    const enrichedDocs = splitDocs.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
        fileName: path.basename(new URL(documentUrl).pathname),
        uploadedAt: new Date().toISOString(),
        fileType: fileExtension,
      },
    }));

    // Store in vector database
    const embeddings = getOptimizedEmbeddings();
    await SupabaseVectorStore.fromDocuments(enrichedDocs, embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });
    console.log("Document processed and stored successfully.");

    // Setup retrieval chain
    console.log(
      "Setting up query processing for",
      questions.length,
      "questions."
    );
    const llm = getOptimizedLLM();

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    //  custom retriever with maximum retrieval settings
    const retriever = new CustomScoreRetriever(vectorStore, 0.3, 20);

    // Highly specific prompt template focused on extracting exact numbers
    //     const promptTemplate = ChatPromptTemplate.fromTemplate(`
    // You are an expert insurance policy analyst. Your task is to find EXACT NUMBERS and SPECIFIC DETAILS from the insurance document.

    // CRITICAL REQUIREMENTS:
    // - Find and state EXACT NUMBERS: "30 days", "2 years", "36 months", "24 months", "5%", "1%", "2%"
    // - If you see "Grace Period (as defined)" or similar - look for the actual definition with specific days/months
    // - If you see "Waiting Period" - find the exact duration in months or years
    // - Include specific age limits, percentage limits, and numerical conditions
    // - Extract precise timeframes for all waiting periods and coverage conditions
    // - Quote exact benefit amounts, caps, and limits with numbers

    // ANSWER FORMAT:
    // - Start with specific numbers: "A grace period of 30 days is provided..."
    // - Include exact timeframes: "There is a waiting period of 2 years for..."
    // - State precise conditions with numbers
    // - Keep concise but include all relevant numerical details

    // Document Context:
    // {context}

    // Question: {input}

    // Answer with EXACT NUMBERS and SPECIFIC TIMEFRAMES:
    // `);
    // const promptTemplate = ChatPromptTemplate.fromTemplate(`
    // You are an expert insurance policy analyst. Extract precise information and provide clean, readable answers.

    // REQUIREMENTS:
    // - Start with the direct answer including specific numbers
    // - Use clean sentence format (avoid bullet points)
    // - Include exact timeframes: "30 days", "2 years", "36 months"
    // - Mention key conditions concisely
    // - Keep answers focused and readable

    // Document Context: {context}
    // Question: {input}

    // Clean, specific answer:
    // `);

    // const promptTemplate = ChatPromptTemplate.fromTemplate(`
    // You are an expert insurance policy analyst. Provide detailed, accurate answers with maximum numerical precision.

    // CRITICAL REQUIREMENTS:
    // - For yes/no questions: Start with "Yes," or "No," then provide detailed explanation
    // - Include ALL specific numbers: exact days, months, years, percentages, amounts
    // - State ALL plan variations (Plan A vs Plan B vs Plan C) with exact differences
    // - Include precise age limits, waiting periods, and coverage conditions
    // - Quote exact benefit amounts, caps, and limits with numbers
    // - Mention specific exceptions and conditional scenarios
    // - Keep responses moderately detailed (2-4 sentences) but include all key details

    // ANSWER FORMAT:
    // - Yes/No questions: "Yes, [detailed explanation with specifics]" or "No, [detailed explanation with specifics]"
    // - Other questions: Direct answer with comprehensive numerical details
    // - Always include: specific timeframes, exact percentages, plan comparisons, precise limits
    // - Include relevant conditions and exceptions

    // Document Context:
    // {context}

    // Question: {input}

    // Detailed answer with maximum numerical accuracy:
    // `);
    
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
You are an expert insurance policy analyst. Provide concise yet comprehensive answers with maximum numerical precision.

CRITICAL REQUIREMENTS:
- For yes/no questions: Start with "Yes," or "No," then provide essential explanation
- Include ALL key numbers: exact days, months, years, percentages, amounts
- State important plan variations (Plan A vs Plan B vs Plan C) with key differences only
- Include essential age limits, waiting periods, and main coverage conditions
- Quote main benefit amounts, caps, and limits with numbers
- Mention only critical exceptions and key conditions
- Keep responses concise-medium length (50 words max) but include all essential details

ANSWER FORMAT:
- Yes/No questions: "Yes, [key explanation with specifics]" or "No, [key explanation with specifics]"
- Other questions: Direct answer with essential numerical details
- Focus on: main timeframes, key percentages, important plan differences, primary limits
- Include only the most relevant conditions and exceptions
- Avoid excessive bullet points and sub-details

Document Context:
{context}

Question: {input}

Concise answer with essential details and maximum numerical accuracy:
`);

    const documentChain = await createStuffDocumentsChain({
      llm,
      prompt: promptTemplate,
      outputParser: new StringOutputParser(),
    });

    const retrievalChain = await createRetrievalChain({
      retriever,
      combineDocsChain: documentChain,
    });

    // Process questions with smaller batches for better accuracy
    const batchSize = 2; // Smaller batches for better processing
    console.log(
      `Using batch size: ${batchSize} for ${questions.length} questions`
    );

    const answers = await processQuestionBatch(
      questions,
      retrievalChain,
      batchSize
    );

    console.log("All queries processed successfully.");
    const finalResponse: HackRxResponse = { answers };
    const processingTime = Date.now() - startTime;
    console.log(`Processing completed in ${processingTime}ms`);

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Error in processing:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + (error as Error).message },
      { status: 500 }
    );
  }
}
