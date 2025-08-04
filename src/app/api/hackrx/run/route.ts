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
import { supabase } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "path";

// interfaces for the request and response bodies as per guidelines



// interface QueryResult {
//   Decision: "Approved" | "Rejected";
//   Amount: number | null;
//   Justification: string[];
// }

interface HackRxRequest {
  documents: string;
  questions: string[];
}

interface HackRxResponse {
  answers: string[];
}

/**
 * The main API endpoint for the HackRx system.
 * This endpoint combines document ingestion and query-retrieval into a single flow,
 * as specified by the hackathon guidelines.
 *
 * @param request The incoming Next.js request containing the document URL and questions.
 * @returns A structured JSON response with answers to all questions.
 */

const REQUIRED_API_KEY = process.env.AUTHORIZATION_KEY;

export async function POST(request: NextRequest) {
    const startTime = Date.now();

  try {
    // STEP:0  AUTHENTICATION CHECK
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
    if (token !== REQUIRED_API_KEY) {
      return NextResponse.json(
        {
          error: "Invalid API key",
        },
        { status: 401 }
      );
    }
    // Step-1: Input Validation
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

    // Step-2: Document Ingestion (Memory-based logic to avoid filesystem issues)
    console.log("Starting document ingestion from URL:", documentUrl);

    // Download the document from the provided URL
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
      // Handle EML files by parsing as text since UnstructuredEmailLoader needs file paths
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

    // Add validation for empty documents
    if (!docs || docs.length === 0) {
      return NextResponse.json(
        {
          error: "No content could be extracted from the document",
        },
        { status: 400 }
      );
    }

   const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,  // Larger chunks to preserve context
    chunkOverlap: 300,  // More overlap to avoid losing connections
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
});
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Add validation for split documents
    if (!splitDocs || splitDocs.length === 0) {
      return NextResponse.json(
        {
          error: "Document could not be processed into chunks",
        },
        { status: 400 }
      );
    }

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

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
    });

    // Store the documents and their embeddings in Supabase
    await SupabaseVectorStore.fromDocuments(enrichedDocs, embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });
    console.log("Document processed and stored in Supabase successfully.");

    // Step 3: Query Processing (Logic adapted from your original query route)
    console.log(
      "Starting query processing for",
      questions.length,
      "questions."
    );

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp", // Updated to a more recent model
      temperature: 0.1,
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    // const retriever = vectorStore.asRetriever({ k: 5 });

//     const retriever = vectorStore.asRetriever({
//     searchType: "similarity",
//     k: 10,  // Increase from default to get more context
// });
const retriever = vectorStore.asRetriever({
    searchType: "similarity",
    k: 15  // Increased from 10 to get more relevant chunks
});

const promptTemplate = ChatPromptTemplate.fromTemplate(`
    You are an expert document analyst specializing in extracting EXACT details from policy documents, contracts, and legal texts.
    
    CRITICAL INSTRUCTIONS:
    - Extract EXACT numbers, percentages, time periods, and amounts from the document
    - Quote SPECIFIC clause numbers, section references, and policy terms
    - Use the EXACT wording and terminology from the source document
    - Include ALL relevant conditions, exceptions, and limitations
    - If multiple plans exist (Plan A, Plan B, etc.), specify which plan applies
    
    Response Requirements:
    1. Start with direct answer using document's exact terminology
    2. Include PRECISE numbers: "thirty-six (36) months", "5%", "Rs. 10,000", etc.
    3. Reference SPECIFIC clauses: "Section 4.2.1", "Clause 8", "Table of Benefits"
    4. Include ALL conditions and exceptions mentioned
    5. Use document's exact definitions and language
    
    EXAMPLES OF PRECISION REQUIRED:
    - NOT: "waiting period applies" → YES: "waiting period of thirty-six (36) months"
    - NOT: "discount available" → YES: "5% No Claim Discount on base premium"
    - NOT: "room rent limits" → YES: "1% of Sum Insured for room rent, 2% for ICU"
    
    Document Context:
    {context}
    
    Question: {input}
    
    Extract and provide the MOST SPECIFIC, DETAILED answer with exact numbers, clauses, and conditions from the document:
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

    const answers: string[] = [];

    // Process each question individually

    // for (const question of questions) {
    //   console.log("Processing question:", question);

    //   try {
    //     const result = await retrievalChain.invoke({ input: question });

    //     let parsedResult: QueryResult;
    //     try {
    //       const cleanedAnswer = result.answer.trim();
    //       // More robust JSON extraction
    //       const jsonMatch = cleanedAnswer.match(/\{[\s\S]*?\}/);
    //       if (jsonMatch) {
    //         parsedResult = JSON.parse(jsonMatch[0]);
    //       } else {
    //         throw new Error("No valid JSON found in the response");
    //       }
    //     } catch (parseError) {
    //       console.error("Failed to parse LLM response as JSON:", parseError);
    //       console.error("Raw response:", result.answer);
    //       parsedResult = {
    //         Decision: "Rejected",
    //         Amount: null,
    //         Justification: [
    //           "Unable to process the query due to a parsing error. Please try rephrasing your question.",
    //         ],
    //       };
    //     }

    //     // Validate parsed result structure
    //     const validatedResult: QueryResult = {
    //       Decision:
    //         parsedResult.Decision === "Approved" ||
    //         parsedResult.Decision === "Rejected"
    //           ? parsedResult.Decision
    //           : "Rejected",
    //       Amount:
    //         typeof parsedResult.Amount === "number"
    //           ? parsedResult.Amount
    //           : null,
    //       Justification:
    //         Array.isArray(parsedResult.Justification) &&
    //         parsedResult.Justification.length > 0
    //           ? parsedResult.Justification
    //           : ["No justification provided"],
    //     };

    //     answers.push(validatedResult);
    //   } catch (queryError) {
    //     console.error("Error processing question:", question, queryError);
    //     answers.push({
    //       Decision: "Rejected",
    //       Amount: null,
    //       Justification: [
    //         "Error occurred while processing this query. Please try again.",
    //       ],
    //     });
    //   }
    // }
 for (const question of questions) {
    try {
        console.log(`Processing question: ${question}`);
        
        // Enhanced query for better specificity
        const enhancedQuery = `${question} - provide specific numbers, percentages, time periods, clause references, and exact conditions`;
        
        const result = await retrievalChain.invoke({
            input: enhancedQuery
        });
        
        let answer = result.answer || "Unable to determine from the provided policy document.";
        
        // If answer seems generic, try original question
        if (answer.length < 100 || (!answer.includes('%') && !answer.includes('month') && !answer.includes('day') && !answer.includes('year'))) {
            const fallbackResult = await retrievalChain.invoke({
                input: question
            });
            
            if (fallbackResult.answer && fallbackResult.answer.length > answer.length) {
                answer = fallbackResult.answer;
            }
        }
        
        answers.push(answer);
        
    } catch (error) {
        console.error(`Error processing question: ${question}`, error);
        answers.push("Unable to process this question due to an error. Please try again.");
    }
}

    console.log("All queries processed. Returning final response.");
    const finalResponse: HackRxResponse = { answers:answers };
    const processingTime = Date.now() - startTime;
console.log(`Processing completed in ${processingTime}ms`);
    return NextResponse.json(finalResponse);
    
  } catch (error) {
    console.error("Error in HackRx API:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + (error as Error).message },
      { status: 500 }
    );
  }
}
