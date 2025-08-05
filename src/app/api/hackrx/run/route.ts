// import { NextRequest, NextResponse } from "next/server";
// import {
//   ChatGoogleGenerativeAI,
//   GoogleGenerativeAIEmbeddings,
// } from "@langchain/google-genai";
// import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import { supabase } from "@/lib/supabaseClient";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import path from "path";

// // interfaces for the request and response bodies as per guidelines



// // interface QueryResult {
// //   Decision: "Approved" | "Rejected";
// //   Amount: number | null;
// //   Justification: string[];
// // }

// interface HackRxRequest {
//   documents: string;
//   questions: string[];
// }

// interface HackRxResponse {
//   answers: string[];
// }

// /**
//  * The main API endpoint for the HackRx system.
//  * This endpoint combines document ingestion and query-retrieval into a single flow,
//  * as specified by the hackathon guidelines.
//  *
//  * @param request The incoming Next.js request containing the document URL and questions.
//  * @returns A structured JSON response with answers to all questions.
//  */

// const REQUIRED_API_KEY = process.env.AUTHORIZATION_KEY;
// function enhanceQuestionForNumbers(question: string): string {
//     const questionLower = question.toLowerCase();
    
//     // Comprehensive numeric indicators
//     const numericIndicators = [
//         'period', 'duration', 'time', 'days', 'months', 'years',
//         'amount', 'cost', 'percentage', 'percent', '%', 'discount',
//         'limit', 'sub-limit', 'maximum', 'minimum', 'coverage',
//         'room', 'rent', 'icu', 'charges', 'age', 'waiting', 'grace',
//         'how much', 'how many', 'what is the', 'how long'
//     ];
    
//     const hasNumericIntent = numericIndicators.some(indicator => 
//         questionLower.includes(indicator)
//     );
    
//     if (hasNumericIntent) {
//         return `${question} - provide specific numbers, exact percentages, precise time periods, and exact amounts from the document`;
//     }
    
//     return question;
// }

// export async function POST(request: NextRequest) {
//     const startTime = Date.now();

//   try {
//     // STEP:0  AUTHENTICATION CHECK
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         {
//           error:
//             "Missing or invalid Authorization header. Expected: Bearer <token>",
//         },
//         { status: 401 }
//       );
//     }
//     const token = authHeader.substring(7);
//     if (token !== REQUIRED_API_KEY) {
//       return NextResponse.json(
//         {
//           error: "Invalid API key",
//         },
//         { status: 401 }
//       );
//     }
//     // Step-1: Input Validation
//     const { documents: documentUrl, questions } =
//       (await request.json()) as HackRxRequest;


//     if (!documentUrl || !questions || questions.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Document URL and at least one question are required.",
//         },
//         { status: 400 }
//       );
//     }

//     // Step-2: Document Ingestion (Memory-based logic to avoid filesystem issues)
//     console.log("Starting document ingestion from URL:", documentUrl);

//     // Download the document from the provided URL
//     const response = await fetch(documentUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to download document from URL: ${documentUrl}`);
//     }

//     const bytes = await response.arrayBuffer();
//     const buffer = Buffer.from(bytes);
//     const fileExtension = path
//       .extname(new URL(documentUrl).pathname)
//       .toLowerCase();

//     let docs;

//     if (fileExtension === ".pdf") {
//       const loader = new PDFLoader(
//         new Blob([buffer], { type: "application/pdf" })
//       );
//       docs = await loader.load();
//     } else if (fileExtension === ".docx") {
//       const loader = new DocxLoader(
//         new Blob([buffer], {
//           type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         })
//       );
//       docs = await loader.load();
//     } else if (fileExtension === ".eml") {
//       // Handle EML files by parsing as text since UnstructuredEmailLoader needs file paths
//       const emailText = buffer.toString("utf-8");
//       docs = [
//         {
//           pageContent: emailText,
//           metadata: {
//             source: documentUrl,
//             type: "email",
//           },
//         },
//       ];
//     } else {
//       return NextResponse.json(
//         {
//           error: `Unsupported file type: ${fileExtension}. Supported types: .pdf, .docx, .eml`,
//         },
//         { status: 400 }
//       );
//     }

//     // Add validation for empty documents
//     if (!docs || docs.length === 0) {
//       return NextResponse.json(
//         {
//           error: "No content could be extracted from the document",
//         },
//         { status: 400 }
//       );
//     }

//    const textSplitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1500,  // Larger chunks to preserve context
//     chunkOverlap: 300,  // More overlap to avoid losing connections
//     separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
// });
//     const splitDocs = await textSplitter.splitDocuments(docs);

//     // Add validation for split documents
//     if (!splitDocs || splitDocs.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Document could not be processed into chunks",
//         },
//         { status: 400 }
//       );
//     }

//     const enrichedDocs = splitDocs.map((doc, index) => ({
//       ...doc,
//       metadata: {
//         ...doc.metadata,
//         chunkIndex: index,
//         fileName: path.basename(new URL(documentUrl).pathname),
//         uploadedAt: new Date().toISOString(),
//         fileType: fileExtension,
//       },
//     }));

//     const embeddings = new GoogleGenerativeAIEmbeddings({
//       model: "text-embedding-004",
//     });

//     // Store the documents and their embeddings in Supabase
//     await SupabaseVectorStore.fromDocuments(enrichedDocs, embeddings, {
//       client: supabase,
//       tableName: "documents",
//       queryName: "match_documents",
//     });
//     console.log("Document processed and stored in Supabase successfully.");

//     // Step 3: Query Processing (Logic adapted from your original query route)
//     console.log(
//       "Starting query processing for",
//       questions.length,
//       "questions."
//     );

//     const llm = new ChatGoogleGenerativeAI({
//       model: "gemini-2.0-flash-exp", // Updated to a more recent model
//       temperature: 0.1,
//     });

//     const vectorStore = new SupabaseVectorStore(embeddings, {
//       client: supabase,
//       tableName: "documents",
//       queryName: "match_documents",
//     });

//     // const retriever = vectorStore.asRetriever({ k: 5 });

// //     const retriever = vectorStore.asRetriever({
// //     searchType: "similarity",
// //     k: 10,  // Increase from default to get more context
// // });
// const retriever = vectorStore.asRetriever({
//     searchType: "similarity",
//     k: 15  // Increased from 10 to get more relevant chunks
// });


// // const promptTemplate = ChatPromptTemplate.fromTemplate(`
// //     You are an expert document analyst. Provide CONCISE, DIRECT answers with specific details.
    
// //     CRITICAL REQUIREMENTS:
// //     - Give SHORT, focused answers (2-3 sentences maximum)
// //     - Extract EXACT numbers, percentages, time periods
// //     - Include SPECIFIC clause references only if directly relevant
// //     - Answer ONLY what is asked - no extra information
// //     - Use document's exact terminology
    
// //     RESPONSE FORMAT:
// //     - Start with direct answer using precise numbers
// //     - Add brief justification with key conditions
// //     - Stop when question is fully answered
    
// //     EXAMPLES:
// //     Question: "What is grace period?"
// //     GOOD: "A grace period of fifteen (15) days is allowed for premium payment after the due date without policy lapse."
// //     BAD: "According to the policy schedule... [long explanation with irrelevant details]"
    
// //     Document Context:
// //     {context}
    
// //     Question: {input}
    
// //     Provide a CONCISE answer with exact details from the document:
// // `);

// const promptTemplate = ChatPromptTemplate.fromTemplate(`
//     You are an expert document analyst. Extract EXACT details from policy documents.
    
//     CRITICAL FOCUS AREAS:
//     - Extract SPECIFIC numbers: days, months, years, percentages
//     - Identify PLAN-SPECIFIC details (Plan A, Plan B, etc.)
//     - Find COVERAGE LIMITS and conditions
//     - Quote EXACT amounts and timeframes
//     - Search thoroughly for ALL relevant information
    
//     EXTRACTION RULES:
//     1. For time periods: Look for days, months, years - be specific
//     2. For percentages: Extract exact % values and what they apply to
//     3. For coverage: Find what IS covered, not just what isn't
//     4. For plans: Distinguish between different plan types
//     5. For limits: Find sub-limits, caps, and maximum amounts
    
//     RESPONSE FORMAT:
//     - Start with direct answer using exact numbers from document
//     - Include specific conditions and plan details
//     - Keep concise but complete
    
//     Document Context:
//     {context}
    
//     Question: {input}
    
//     Extract the MOST SPECIFIC answer with exact numbers and plan details:
// `);
//     const documentChain = await createStuffDocumentsChain({
      
//       llm,
//       prompt: promptTemplate,
//       outputParser: new StringOutputParser(),
//     });

//     const retrievalChain = await createRetrievalChain({
//       retriever,
//       combineDocsChain: documentChain,
//     });

//     const answers: string[] = [];

//     // Process each question individually

//     // for (const question of questions) {
//     //   console.log("Processing question:", question);

//     //   try {
//     //     const result = await retrievalChain.invoke({ input: question });

//     //     let parsedResult: QueryResult;
//     //     try {
//     //       const cleanedAnswer = result.answer.trim();
//     //       // More robust JSON extraction
//     //       const jsonMatch = cleanedAnswer.match(/\{[\s\S]*?\}/);
//     //       if (jsonMatch) {
//     //         parsedResult = JSON.parse(jsonMatch[0]);
//     //       } else {
//     //         throw new Error("No valid JSON found in the response");
//     //       }
//     //     } catch (parseError) {
//     //       console.error("Failed to parse LLM response as JSON:", parseError);
//     //       console.error("Raw response:", result.answer);
//     //       parsedResult = {
//     //         Decision: "Rejected",
//     //         Amount: null,
//     //         Justification: [
//     //           "Unable to process the query due to a parsing error. Please try rephrasing your question.",
//     //         ],
//     //       };
//     //     }

//     //     // Validate parsed result structure
//     //     const validatedResult: QueryResult = {
//     //       Decision:
//     //         parsedResult.Decision === "Approved" ||
//     //         parsedResult.Decision === "Rejected"
//     //           ? parsedResult.Decision
//     //           : "Rejected",
//     //       Amount:
//     //         typeof parsedResult.Amount === "number"
//     //           ? parsedResult.Amount
//     //           : null,
//     //       Justification:
//     //         Array.isArray(parsedResult.Justification) &&
//     //         parsedResult.Justification.length > 0
//     //           ? parsedResult.Justification
//     //           : ["No justification provided"],
//     //     };

//     //     answers.push(validatedResult);
//     //   } catch (queryError) {
//     //     console.error("Error processing question:", question, queryError);
//     //     answers.push({
//     //       Decision: "Rejected",
//     //       Amount: null,
//     //       Justification: [
//     //         "Error occurred while processing this query. Please try again.",
//     //       ],
//     //     });
//     //   }
//     // }
//  for (const question of questions) {
//   /*  try {
//         console.log(`Processing question: ${question}`);
//         const enhancedQuestion= enhanceQuestionForNumbers(question);

           
    
   
    
    

        
//         // Enhanced query for better specificity
//         const enhancedQuery = `${question} - provide specific numbers, percentages, time periods, clause references, and exact conditions`;
        
//         const result = await retrievalChain.invoke({
//             input: enhancedQuery
//         });
        
//         let answer = result.answer || "Unable to determine from the provided policy document.";
        
//         // If answer seems generic, try original question
//         if (answer.length < 100 || (!answer.includes('%') && !answer.includes('month') && !answer.includes('day') && !answer.includes('year'))) {
//             const fallbackResult = await retrievalChain.invoke({
//                 input: question
//             });
            
//             if (fallbackResult.answer && fallbackResult.answer.length > answer.length) {
//                 answer = fallbackResult.answer;
//             }
//         }
        
//         answers.push(answer);
        
//     } */
//    try{
    
//         console.log(`Processing question: ${question}`);
        
//         // Step 1: Enhanced question
//         const enhancedQuestion = enhanceQuestionForNumbers(question);
        
//         // Step 2: Primary search
//         const primaryResult = await retrievalChain.invoke({
//             input: enhancedQuestion
//         });
        
//         let answer = primaryResult.answer;
//         const questionLower = question.toLowerCase(); // Add this line
        
//         // Step 3: If answer seems incomplete, try specific fixes
//         if (answer.includes('does not specify') || answer.length < 50 || 
//             (!answer.includes('%') && questionLower.includes('room rent'))) {
            
//             // Try alternate searches for problematic cases
//             let alternateQuery = question;
            
//             if (questionLower.includes('grace period')) {
//                 alternateQuery = 'premium payment due date days months grace lapse';
//             } else if (questionLower.includes('ayush')) {
//                 alternateQuery = 'ayurveda homeopathy unani siddha naturopathy coverage treatment';
//             } else if (questionLower.includes('room rent') || questionLower.includes('plan a')) {
//                 alternateQuery = 'Plan A daily room rent ICU charges percentage sum insured sub-limit';
//             }
            
//             const alternateResult = await retrievalChain.invoke({
//                 input: alternateQuery
//             });
            
//             if (alternateResult.answer && alternateResult.answer.length > answer.length) {
//                 answer = alternateResult.answer;
//             }
//         }
        
//         // Step 4: Clean response
//         answer = answer
//             .replace(/^According to the provided.*?,\s*/, '')
//             .replace(/^Based on the.*?,\s*/, '');
        
//         answers.push(answer);
     
//    }
//         catch (error) {
//         console.error(`Error processing question: ${question}`, error);
//         answers.push("Unable to process this question due to an error. Please try again.");
//     }
// }

//     console.log("All queries processed. Returning final response.");
//     const finalResponse: HackRxResponse = { answers:answers };
//     const processingTime = Date.now() - startTime;
// console.log(`Processing completed in ${processingTime}ms`);
//     return NextResponse.json(finalResponse);
    
//   } catch (error) {
//     console.error("Error in HackRx API:", error);
//     return NextResponse.json(
//       { error: "Failed to process request: " + (error as Error).message },
//       { status: 500 }
//     );
//   }
// }



// import { NextRequest, NextResponse } from "next/server";
// import {
//   ChatGoogleGenerativeAI,
//   GoogleGenerativeAIEmbeddings,
// } from "@langchain/google-genai";
// import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import { supabase } from "@/lib/supabaseClient";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import path from "path";

// interface HackRxRequest{
//   documents: string;
//   questions: string[];
// }

// interface HackRxResponse {
//   answers: string[];
// }

// const Auth_api_key=process.env.AUTHORIZATION_KEY;


// // optimisation1: instance catching
// let cachedEmbeddings: GoogleGenerativeAIEmbeddings | null = null;
// let cachedllm: ChatGoogleGenerativeAI | null = null;

// function getOptimizedEmbeddings() {
//   if (!cachedEmbeddings) {
//     cachedEmbeddings = new GoogleGenerativeAIEmbeddings({
//       model: "text-embedding-004",
//       maxRetries: 2,
//       maxConcurrency: 3,
//     });
//   }
//   return cachedEmbeddings;
// }


// function getOptimizedLLM() {
//   if (!cachedllm) {
//     cachedllm = new ChatGoogleGenerativeAI({
//       model: "gemini-2.0-flash-exp",
//       temperature: 0.1,
//       maxRetries: 2,
//       maxConcurrency: 2,
//     });
//   }
//   return cachedllm;
// }
// function getOptimizedTextSplitter() {
//   return new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,  // Reduced from 1500 for better precision
//     chunkOverlap: 200,  // Reduced from 300 for balanced overlap
//     separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "],  // Better separators
//     lengthFunction: (text: string) => text.length,
//   });
// }
// async function processQuestionBatch(
//   questions: string[], 
//   retrievalChain: any, 
//   batchSize: number = 3
// ): Promise<string[]> {
//   const answers: string[] = [];
  
//   for (let i = 0; i < questions.length; i += batchSize) {
//     const batch = questions.slice(i, i + batchSize);
//     console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`);
    
//     const batchPromises = batch.map(async (question, index) => {
//       // Example logic: replace with your actual question processing and return a string
//       // For now, just return the question itself (replace with real logic)
//       return question;
//     });
    
//     // Process batch in parallel and collect results
//     const batchResults = await Promise.all(batchPromises);
//     answers.push(...batchResults);
    
//     // Small delay between batches to prevent rate limiting
//     if (i + batchSize < questions.length) {
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//   }
  
//   return answers;
// }
// const numericIndicators = {
//   // Time-related indicators
//   temporal: [
//     'period', 'duration', 'time', 'days', 'months', 'years', 'weeks', 'hours', 'minutes',
//     'deadline', 'timeline', 'schedule', 'term', 'tenure', 'expiry', 'maturity',
//     'quarterly', 'annually', 'monthly', 'daily', 'weekly', 'biweekly', 'bi-annual',
//     'semester', 'trimester', 'fiscal year', 'calendar year', 'business days',
//     'working days', 'grace period', 'waiting period', 'cooling period', 'notice period',
//     'probation', 'trial period', 'review period', 'renewal period', 'extension',
//     'how long', 'when', 'until', 'before', 'after', 'within', 'by', 'from', 'to'
//   ],

//   // Financial and monetary indicators
//   financial: [
//     'amount', 'cost', 'price', 'fee', 'charge', 'rate', 'premium', 'deductible',
//     'copay', 'coinsurance', 'salary', 'wage', 'bonus', 'commission', 'allowance',
//     'reimbursement', 'compensation', 'benefit', 'pension', 'interest', 'dividend',
//     'tax', 'fine', 'penalty', 'deposit', 'advance', 'installment', 'payment',
//     'budget', 'allocation', 'fund', 'grant', 'subsidy', 'discount', 'rebate',
//     'refund', 'credit', 'debit', 'balance', 'outstanding', 'due', 'payable',
//     'receivable', 'liability', 'asset', 'equity', 'capital', 'investment',
//     'valuation', 'appraisal', 'estimate', 'quote', 'bid', 'tender',
//     'how much', 'what cost', 'price of', 'value of', 'worth of'
//   ],

//   // Percentage and ratio indicators
//   percentage: [
//     'percentage', 'percent', '%', 'ratio', 'proportion', 'fraction', 'share',
//     'portion', 'allocation', 'distribution', 'split', 'breakdown', 'composition',
//     'concentration', 'density', 'intensity', 'frequency', 'probability',
//     'likelihood', 'chance', 'risk', 'rate of', 'level of', 'degree of',
//     'markup', 'markdown', 'margin', 'spread', 'variance', 'deviation',
//     'what percentage', 'how much percent', 'what portion', 'what share'
//   ],

//   // Quantity and measurement indicators
//   quantitative: [
//     'number', 'count', 'quantity', 'volume', 'size', 'capacity', 'limit',
//     'maximum', 'minimum', 'threshold', 'ceiling', 'floor', 'range', 'span',
//     'extent', 'scope', 'scale', 'magnitude', 'dimension', 'measurement',
//     'metric', 'unit', 'standard', 'benchmark', 'target', 'goal', 'objective',
//     'quota', 'allocation', 'allowance', 'entitlement', 'eligibility',
//     'requirement', 'criteria', 'specification', 'parameter', 'variable',
//     'how many', 'how much', 'what number', 'total', 'sum', 'aggregate'
//   ],

//   // Insurance-specific indicators
//   insurance: [
//     'coverage', 'benefit', 'claim', 'settlement', 'payout', 'indemnity',
//     'policy', 'rider', 'endorsement', 'exclusion', 'inclusion', 'scope',
//     'sum insured', 'sum assured', 'face value', 'death benefit', 'maturity benefit',
//     'surrender value', 'cash value', 'loan value', 'paid-up value',
//     'bonus', 'loading', 'underwriting', 'risk', 'hazard', 'peril',
//     'deductible', 'excess', 'franchise', 'co-payment', 'co-insurance',
//     'sub-limit', 'aggregate limit', 'per occurrence', 'per claim', 'per person',
//     'room rent', 'icu charges', 'surgeon fee', 'hospital charges',
//     'pre-hospitalization', 'post-hospitalization', 'domiciliary treatment',
//     'ayush', 'alternative medicine', 'wellness', 'preventive care',
//     'annual health check', 'vaccination', 'screening'
//   ],

//   // Legal and compliance indicators
//   legal: [
//     'clause', 'section', 'article', 'paragraph', 'subsection', 'provision',
//     'condition', 'term', 'covenant', 'warranty', 'representation', 'undertaking',
//     'obligation', 'duty', 'responsibility', 'liability', 'indemnification',
//     'damages', 'compensation', 'remedy', 'relief', 'injunction', 'restraint',
//     'prohibition', 'restriction', 'limitation', 'constraint', 'requirement',
//     'compliance', 'violation', 'breach', 'default', 'non-compliance',
//     'penalty', 'sanction', 'punishment', 'fine', 'forfeiture', 'confiscation',
//     'jurisdiction', 'venue', 'governing law', 'applicable law', 'choice of law',
//     'dispute resolution', 'arbitration', 'mediation', 'litigation',
//     'statute of limitations', 'limitation period', 'prescription period'
//   ],

//   // Human Resources indicators
//   hr: [
//     'employee', 'staff', 'personnel', 'workforce', 'headcount', 'fte', 'contractor',
//     'position', 'role', 'designation', 'title', 'grade', 'level', 'band',
//     'experience', 'qualification', 'skill', 'competency', 'certification',
//     'training', 'development', 'education', 'degree', 'diploma', 'course',
//     'performance', 'rating', 'appraisal', 'review', 'evaluation', 'assessment',
//     'kpi', 'kra', 'objective', 'goal', 'target', 'milestone', 'achievement',
//     'attendance', 'leave', 'absence', 'vacation', 'sick leave', 'maternity',
//     'paternity', 'sabbatical', 'unpaid leave', 'leave balance', 'accrual',
//     'overtime', 'shift', 'roster', 'schedule', 'working hours', 'break',
//     'notice period', 'probation', 'confirmation', 'promotion', 'transfer',
//     'resignation', 'termination', 'retirement', 'superannuation',
//     'grievance', 'disciplinary', 'warning', 'suspension', 'dismissal'
//   ],

//   // Contract management indicators
//   contract: [
//     'agreement', 'contract', 'deal', 'arrangement', 'understanding', 'accord',
//     'memorandum', 'mou', 'loi', 'proposal', 'offer', 'acceptance', 'consideration',
//     'execution', 'signing', 'effective date', 'commencement', 'start date',
//     'end date', 'expiry', 'termination', 'renewal', 'extension', 'modification',
//     'amendment', 'variation', 'change order', 'supplement', 'addendum',
//     'milestone', 'deliverable', 'output', 'outcome', 'result', 'product',
//     'service', 'work', 'task', 'activity', 'phase', 'stage', 'step',
//     'specification', 'requirement', 'standard', 'quality', 'acceptance criteria',
//     'testing', 'inspection', 'approval', 'sign-off', 'handover', 'delivery',
//     'payment terms', 'invoice', 'billing', 'statement', 'receipt', 'voucher',
//     'purchase order', 'work order', 'change request', 'variation order',
//     'force majeure', 'act of god', 'unforeseen circumstances', 'delay',
//     'liquidated damages', 'penalty clause', 'service level agreement', 'sla'
//   ],

//   // Age and demographic indicators
//   demographic: [
//     'age', 'year old', 'years of age', 'born', 'birth', 'date of birth', 'dob',
//     'minor', 'adult', 'senior', 'elderly', 'child', 'infant', 'teenager',
//     'generation', 'cohort', 'group', 'category', 'class', 'segment',
//     'population', 'sample', 'respondent', 'participant', 'member',
//     'gender', 'sex', 'male', 'female', 'nationality', 'citizenship',
//     'residence', 'domicile', 'address', 'location', 'geography', 'region'
//   ],

//   // Question patterns that typically expect numeric answers
//   questionPatterns: [
//     'how much', 'how many', 'how long', 'how often', 'how far', 'how big',
//     'how old', 'how high', 'how low', 'how fast', 'how slow', 'how deep',
//     'what is the', 'what are the', 'what percentage', 'what amount',
//     'what cost', 'what price', 'what rate', 'what fee', 'what charge',
//     'what limit', 'what maximum', 'what minimum', 'what range',
//     'when is', 'when does', 'when will', 'when can', 'when must',
//     'where is', 'which is', 'who is', 'whose is',
//     'specify', 'state', 'mention', 'indicate', 'provide', 'give',
//     'calculate', 'compute', 'determine', 'find', 'derive', 'obtain'
//   ],

//   // Units and measures
//   units: [
//     'dollar', 'rupee', 'euro', 'pound', 'yen', 'currency', 'usd', 'inr',
//     'lakh', 'crore', 'million', 'billion', 'thousand', 'hundred',
//     'meter', 'kilometer', 'centimeter', 'inch', 'foot', 'yard', 'mile',
//     'gram', 'kilogram', 'pound', 'ounce', 'ton', 'tonne',
//     'liter', 'milliliter', 'gallon', 'quart', 'pint',
//     'degree', 'celsius', 'fahrenheit', 'kelvin',
//     'square', 'cubic', 'per', 'each', 'every', 'single', 'double', 'triple'
//   ]
// };

// //flatten all numeric indicators into a single array for easier searching
// const allNumericIndicators = [
//   ...numericIndicators.temporal,
//   ...numericIndicators.financial,
//   ...numericIndicators.percentage,
//   ...numericIndicators.quantitative,
//   ...numericIndicators.insurance,
//   ...numericIndicators.questionPatterns,
//   ...numericIndicators.units
// ];


// //domain detection 
// function detectDomain(question: string): string | undefined {
//   const questionLower = question.toLowerCase();
  
//   const domainKeywords = {
//     insurance: ['policy', 'coverage', 'claim', 'premium', 'deductible', 'benefit', 'insured', 'ayush', 'room rent', 'sum insured'],
//     legal: ['clause', 'compliance', 'liability', 'breach', 'contract', 'agreement', 'legal', 'court', 'jurisdiction'],
//     hr: ['employee', 'salary', 'leave', 'performance', 'appraisal', 'promotion', 'resignation', 'probation'],
//     contract: ['agreement', 'milestone', 'deliverable', 'payment terms', 'sla', 'vendor', 'supplier', 'procurement']
//   };
  
//   for (const [domain, keywords] of Object.entries(domainKeywords)) {
//     if (keywords.some(keyword => questionLower.includes(keyword))) {
//       return domain;
//     }
//   }
  
//   return undefined;
// }
// // function enhances the question by appending specific numeric indicators based on the detected domain
// function enhanceQuestionForNumbers(question: string, domain?: string): string {
//   const questionLower = question.toLowerCase();
  
//   // Get relevant indicators based on domain
//   let relevantIndicators = allNumericIndicators;
//   if (domain && numericIndicators[domain as keyof typeof numericIndicators]) {
//     relevantIndicators = [
//       ...numericIndicators[domain as keyof typeof numericIndicators] as string[],
//       ...numericIndicators.temporal,
//       ...numericIndicators.financial,
//       ...numericIndicators.percentage,
//       ...numericIndicators.quantitative,
//       ...numericIndicators.questionPatterns
//     ];
//   }
  
//   const hasNumericIntent = relevantIndicators.some(indicator => 
//     questionLower.includes(indicator.toLowerCase())
//   );
  
//   if (hasNumericIntent) {
//     // Domain-specific enhancements
//     let enhancement = ' - provide specific numbers, exact percentages, precise time periods, and exact amounts from the document';
    
//     if (domain === 'insurance') {
//       enhancement = ' - include exact coverage amounts, percentages of sum insured, waiting periods in days/months, plan-specific details, and sub-limits';
//     } else if (domain === 'legal') {
//       enhancement = ' - specify clause numbers, exact legal timeframes, penalty amounts, and compliance percentages';
//     } else if (domain === 'hr') {
//       enhancement = ' - provide exact tenure requirements, performance ratings, leave balances, salary bands, and experience years';
//     } else if (domain === 'contract') {
//       enhancement = ' - include contract values, milestone dates, payment terms, penalty clauses, and service level percentages';
//     }
    
//     return `${question}${enhancement}`;
//   }
  
//   return question;
// }
// // Smart enhancement function with automatic domain detection
// function smartEnhanceQuestion(question: string): string {
//   const detectedDomain = detectDomain(question);
//   return enhanceQuestionForNumbers(question, detectedDomain);
// }

// export async function POST(request: NextRequest) {
//     const startTime = Date.now();

//   try {
//     // STEP:0  AUTHENTICATION CHECK
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         {
//           error:
//             "Missing or invalid Authorization header. Expected: Bearer <token>",
//         },
//         { status: 401 }
//       );
//     }
//       const token = authHeader.substring(7);
//     if (token !== Auth_api_key) {
//       return NextResponse.json(
//         {
//           error: "Invalid API key",
//         },
//         { status: 401 }
//       );
//     }
//        // Step-1: Input Validation
//     const { documents: documentUrl, questions } =
//       (await request.json()) as HackRxRequest;

//     if (!documentUrl || !questions || questions.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Document URL and at least one question are required.",
//         },
//         { status: 400 }
//       );
//     }
//       // Step-2: Document Ingestion
//     console.log("Starting document ingestion from URL:", documentUrl);

//     const response = await fetch(documentUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to download document from URL: ${documentUrl}`);
//     }

//     const bytes = await response.arrayBuffer();
//     const buffer = Buffer.from(bytes);
//     const fileExtension = path
//       .extname(new URL(documentUrl).pathname)
//       .toLowerCase();

//     let docs;
//      if (fileExtension === ".pdf") {
//       const loader = new PDFLoader(
//         new Blob([buffer], { type: "application/pdf" })
//       );
//       docs = await loader.load();
//     } else if (fileExtension === ".docx") {
//       const loader = new DocxLoader(
//         new Blob([buffer], {
//           type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         })
//       );
//       docs = await loader.load();
//       } else if (fileExtension === ".eml") {
//       const emailText = buffer.toString("utf-8");
//       docs = [
//         {
//           pageContent: emailText,
//           metadata: {
//             source: documentUrl,
//             type: "email",
//           },
//         },
//       ];
//     } else {
//       return NextResponse.json(
//         {
//           error: `Unsupported file type: ${fileExtension}. Supported types: .pdf, .docx, .eml`,
//         },
//         { status: 400 }
//       );
//     }
//  if (!docs || docs.length === 0) {
//       return NextResponse.json(
//         {
//           error: "No content could be extracted from the document",
//         },
//         { status: 400 }
//       );
//     }
// //      const textSplitter = new RecursiveCharacterTextSplitter({
// //     chunkSize: 1500,
// //     chunkOverlap: 300,
// //     separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
// // });
// const textSplitter = getOptimizedTextSplitter();
// const splitDocs = await textSplitter.splitDocuments(docs);

//     if (!splitDocs || splitDocs.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Document could not be processed into chunks",
//         },
//         { status: 400 }
//       );
//     }
//     const enrichedDocs = splitDocs.map((doc, index) => ({
//       ...doc,
//       metadata: {
//         ...doc.metadata,
//         chunkIndex: index,
//         fileName: path.basename(new URL(documentUrl).pathname),
//         uploadedAt: new Date().toISOString(),
//         fileType: fileExtension,
//       },
//     }));
//     //get cached embeddings instance
//     const embeddings = getOptimizedEmbeddings();
//     await SupabaseVectorStore.fromDocuments(enrichedDocs, embeddings, {
//       client: supabase,
//       tableName: "documents",
//       queryName: "match_documents",
//     });
//     console.log("Document processed and stored in Supabase successfully.");
//      // Step 3: Query Processing
//     console.log(
//       "Starting query processing for",
//       questions.length,
//       "questions."
//     );
//       const llm = getOptimizedLLM();

//     const vectorStore = new SupabaseVectorStore(embeddings, {
//       client: supabase,
//       tableName: "documents",
//       queryName: "match_documents",
//     });
//  const retriever = vectorStore.asRetriever({
//         searchType: "similarity",
//         k: 15
//     });

//      const promptTemplate = ChatPromptTemplate.fromTemplate(`
//         You are an expert document analyst specializing in insurance policy documents.
        
//         CRITICAL FOCUS AREAS:
//         - Extract SPECIFIC numbers: days, months, years, percentages
//         - Identify PLAN-SPECIFIC details (Plan A, Plan B, etc.)
//         - Find COVERAGE LIMITS and conditions
//         - Quote EXACT amounts and timeframes
//         - Search thoroughly for ALL relevant information

//         EXTRACTION RULES:
//         1. For time periods: Look for days, months, years - be specific
//         2. For percentages: Extract exact % values and what they apply to
//         3. For coverage: Find what IS covered, not just what isn't
//         4. For plans: Distinguish between different plan types
//         5. For limits: Find sub-limits, caps, and maximum amounts
        
//         RESPONSE FORMAT:
//         - Start with direct answer using exact numbers from document
//         - Include specific conditions and plan details
//         - Keep concise but complete
        
//         Document Context:
//         {context}
        
//         Question: {input}
        
//         Extract the MOST SPECIFIC answer with exact numbers and plan details:
//     `);

//      const documentChain = await createStuffDocumentsChain({
//       llm,
//       prompt: promptTemplate,
//       outputParser: new StringOutputParser(),
//     });
//      const retrievalChain = await createRetrievalChain({
//       retriever,
//       combineDocsChain: documentChain,
//     });
//         const answers: string[] = [];
//     // Process each question individually
//     for (const question of questions) {
//         try{
//             console.log(`Processing question: ${question}`);
            
//             // 🚀 Step 1: Smart enhanced question with domain detection
//             const enhancedQuestion = smartEnhanceQuestion(question);
//             console.log(`Enhanced to: ${enhancedQuestion}`);
            
//             // Step 2: Primary search
//             const primaryResult = await retrievalChain.invoke({
//                 input: enhancedQuestion
//             });
//             let answer = primaryResult.answer;
//             const questionLower = question.toLowerCase();
            
//             // Step 3: If answer seems incomplete, try specific fixes
//             if (answer.includes('does not specify') || answer.length < 50 || 
//                 (!answer.includes('%') && questionLower.includes('room rent'))) {
                
//                 // Try alternate searches for problematic cases
//                 let alternateQuery = question;
                
//                 if (questionLower.includes('grace period')) {
//                     alternateQuery = 'premium payment due date days months grace lapse';
//                 } else if (questionLower.includes('ayush')) {
//                     alternateQuery = 'ayurveda homeopathy unani siddha naturopathy coverage treatment';
//                 } else if (questionLower.includes('room rent') || questionLower.includes('plan a')) {
//                     alternateQuery = 'Plan A daily room rent ICU charges percentage sum insured sub-limit';
//                 }
//                  const alternateResult = await retrievalChain.invoke({
//                     input: alternateQuery
//                 });
                
//                 if (alternateResult.answer && alternateResult.answer.length > answer.length) {
//                     answer = alternateResult.answer;
//                 }
//             }
//              // Step 4: Clean response
//             answer = answer
//                 .replace(/^According to the provided.*?,\s*/, '')
//                 .replace(/^Based on the.*?,\s*/, '');
            
//             answers.push(answer);
//         }
//         catch (error) {
//             console.error(`Error processing question: ${question}`, error);
//             answers.push("Unable to process this question due to an error. Please try again.");
//         }
//     }

//     console.log("All queries processed. Returning final response.");
//     const finalResponse: HackRxResponse = { answers:answers };
//     const processingTime = Date.now() - startTime;
//     console.log(`Processing completed in ${processingTime}ms`);
//     return NextResponse.json(finalResponse);
    
//   } catch (error) {
//     console.error("Error in HackRx API:", error);
//     return NextResponse.json(
//       { error: "Failed to process request: " + (error as Error).message },
//       { status: 500 }
//     );
//   }
// }



















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

interface HackRxRequest{
  documents: string;
  questions: string[];
}

interface HackRxResponse {
  answers: string[];
}

const Auth_api_key=process.env.AUTHORIZATION_KEY;

// Optimisation 1: Instance caching
let cachedEmbeddings: GoogleGenerativeAIEmbeddings | null = null;
let cachedllm: ChatGoogleGenerativeAI | null = null;

function getOptimizedEmbeddings() {
  if (!cachedEmbeddings) {
    cachedEmbeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      maxRetries: 2,
      maxConcurrency: 3,
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
      maxConcurrency: 2,
    });
  }
  return cachedllm;
}

function getOptimizedTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "],
    lengthFunction: (text: string) => text.length,
  });
}

// Optimisation 4: Fast lookup tables for domain-adaptive queries
const DOMAIN_QUERY_PATTERNS = {
  insurance: {
    'grace period': 'premium payment due date days months grace lapse policy termination',
    'room rent': 'daily room rent ICU charges percentage sum insured sub-limit hospital expenses',
    'waiting period': 'waiting period pre-existing disease initial waiting specific disease coverage days months',
    'deductible': 'deductible copayment co-insurance patient contribution percentage amount',
    'copay': 'deductible copayment co-insurance patient contribution percentage amount',
    'claim': 'claim procedure documents required settlement process timeline',
    'coverage': 'coverage benefits included excluded scope limits maximum amount',
    'benefit': 'coverage benefits included excluded scope limits maximum amount',
    'premium': 'premium amount payment frequency due date calculation',
    'exclusion': 'exclusions not covered excluded conditions limitations',
    'pre-existing': 'pre-existing conditions prior illness medical history coverage',
    'maternity': 'maternity pregnancy childbirth coverage benefits waiting period',
    'cashless': 'cashless treatment network hospitals direct settlement',
    'renewal': 'renewal policy continuation terms conditions age limits',
    'alternative medicine': 'alternative medicine traditional treatment coverage therapy holistic'
  },
  
  legal: {
    'compliance': 'compliance requirements obligations regulatory standards adherence',
    'liability': 'liability responsibility damages compensation indemnification',
    'breach': 'breach violation default consequences penalties remedies',
    'clause': 'clause section provision article paragraph terms conditions',
    'section': 'clause section provision article paragraph terms conditions',
    'penalty': 'penalty fine sanctions punishment monetary consequences',
    'fine': 'penalty fine sanctions punishment monetary consequences',
    'jurisdiction': 'jurisdiction governing law applicable venue court dispute resolution',
    'termination': 'termination end cancellation dissolution notice period',
    'confidentiality': 'confidentiality non-disclosure privacy information protection',
    'intellectual property': 'intellectual property copyright patent trademark ownership rights',
    'indemnity': 'indemnity protection compensation liability coverage',
    'arbitration': 'arbitration mediation dispute resolution alternative legal process',
    'force majeure': 'force majeure act god unforeseeable circumstances delay excuse'
  },
  
  hr: {
    'salary': 'salary compensation remuneration pay scale benefits allowances',
    'compensation': 'salary compensation remuneration pay scale benefits allowances',
    'leave': 'leave vacation sick maternity paternity annual casual balance',
    'performance': 'performance appraisal evaluation rating review KPI goals',
    'promotion': 'promotion advancement career progression eligibility criteria',
    'notice period': 'notice period resignation termination serving period days months',
    'probation': 'probation period trial confirmation permanent employment',
    'training': 'training development learning programs certification courses',
    'attendance': 'attendance working hours overtime shift schedule roster',
    'benefits': 'employee benefits health insurance retirement pension perks',
    'disciplinary': 'disciplinary action warning suspension termination misconduct',
    'grievance': 'grievance complaint procedure resolution process escalation',
    'code of conduct': 'code conduct ethics behavior standards professional',
    'harassment': 'harassment workplace safety prevention policy reporting'
  },
  
  contract: {
    'payment': 'payment terms schedule due dates invoicing billing cycle',
    'milestone': 'milestone deliverable timeline deadline completion date',
    'sla': 'service level agreement SLA performance metrics uptime availability',
    'service level': 'service level agreement SLA performance metrics uptime availability',
    'liquidated': 'penalty liquidated damages delay consequences financial',
    'scope': 'scope work deliverables specifications requirements',
    'variation': 'variation change order modification amendment approval process',
    'change': 'variation change order modification amendment approval process',
    'warranty': 'warranty guarantee defect liability period coverage',
    'guarantee': 'warranty guarantee defect liability period coverage',
    'subcontractor': 'subcontractor third party vendor supplier responsibilities',
    'acceptance': 'acceptance criteria testing approval sign-off delivery',
    'support': 'support maintenance service assistance post-delivery',
    'escalation': 'escalation procedure management senior level resolution'
  }
};

const DOMAIN_FALLBACKS = {
  insurance: 'insurance policy coverage benefits terms conditions',
  legal: 'legal terms conditions obligations requirements',
  hr: 'employee policies procedures terms conditions',
  contract: 'contract agreement terms conditions obligations'
};

const DOMAIN_KEYWORDS = {
  insurance: new Set([
    'policy', 'coverage', 'claim', 'premium', 'deductible', 'benefit', 'insured', 
    'room rent', 'sum insured', 'waiting period', 'grace period', 'exclusion',
    'maternity', 'cashless', 'pre-existing', 'copay', 'co-insurance', 'renewal'
  ]),
  legal: new Set([
    'clause', 'compliance', 'liability', 'breach', 'contract', 'agreement', 
    'legal', 'court', 'jurisdiction', 'penalty', 'fine', 'confidentiality',
    'intellectual property', 'indemnity', 'arbitration', 'force majeure'
  ]),
  hr: new Set([
    'employee', 'salary', 'leave', 'performance', 'appraisal', 'promotion', 
    'resignation', 'probation', 'training', 'benefits', 'disciplinary',
    'grievance', 'code of conduct', 'harassment', 'attendance'
  ]),
  contract: new Set([
    'agreement', 'milestone', 'deliverable', 'payment terms', 'sla', 
    'vendor', 'supplier', 'procurement', 'scope', 'warranty', 'support',
    'acceptance', 'subcontractor', 'escalation', 'variation'
  ])
};

const INCOMPLETE_INDICATORS = new Set([
  'does not specify', 'not mentioned', 'unclear', 'not found', 
  'cannot determine', 'insufficient information', 'not provided',
  'not available', 'not stated', 'not indicated'
]);

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'how', 'why', 'who', 'which', 'the', 'and', 
  'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 
  'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'
]);

// Optimized parallel question processing
async function processQuestionBatch(
  questions: string[], 
  retrievalChain: any, 
  batchSize: number = 3
): Promise<string[]> {
  const answers: string[] = new Array(questions.length);
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`);
    
    const batchPromises = batch.map(async (question, batchIndex) => {
      const originalIndex = i + batchIndex;
      try {
        console.log(`Processing question ${originalIndex + 1}: ${question}`);
        
        // Step 1: Smart enhanced question with domain detection
        const enhancedQuestion = smartEnhanceQuestion(question);
        
        // Step 2: Primary search with timeout
        const primaryResult = await Promise.race([
          retrievalChain.invoke({ input: enhancedQuestion }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000)
          )
        ]) as any;
        
        let answer = primaryResult.answer;
        
        // Step 3: If answer seems incomplete, try domain-adaptive alternate search
        if (isAnswerIncomplete(answer, question)) {
          console.log(`Retrying with domain-adaptive strategy for: ${question}`);
          const alternateQuery = generateDomainAdaptiveQuery(question);
          
          try {
            const alternateResult = await Promise.race([
              retrievalChain.invoke({ input: alternateQuery }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Alternate timeout')), 10000)
              )
            ]) as any;
            
            if (alternateResult.answer && alternateResult.answer.length > answer.length) {
              answer = alternateResult.answer;
            }
          } catch (retryError) {
            console.log(`Retry failed for question: ${question}`);
          }
        }
        
        // Step 4: Clean response
        answer = cleanAnswer(answer);
        
        return { answer, originalIndex };
        
      } catch (error) {
        console.error(`Error processing question: ${question}`, error);
        return { 
          answer: "Unable to process this question due to an error. Please try again.",
          originalIndex 
        };
      }
    });
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Store results in correct order
    batchResults.forEach((result, batchIndex) => {
      const originalIndex = i + batchIndex;
      if (result.status === 'fulfilled') {
        answers[originalIndex] = result.value.answer;
      } else {
        answers[originalIndex] = "Failed to process this question. Please try again.";
      }
    });
    
    // Small delay between batches to prevent rate limiting
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return answers;
}

// Fast domain detection using Set lookups
function detectDomain(question: string): string | undefined {
  const questionLower = question.toLowerCase();
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (questionLower.includes(keyword)) {
        return domain;
      }
    }
  }
  
  return undefined;
}

// Fast domain-adaptive query generator
function generateDomainAdaptiveQuery(question: string): string {
  const questionLower = question.toLowerCase();
  const domain = detectDomain(question);
  
  if (domain && DOMAIN_QUERY_PATTERNS[domain as keyof typeof DOMAIN_QUERY_PATTERNS]) {
    // Find matching pattern
    for (const [pattern, query] of Object.entries(DOMAIN_QUERY_PATTERNS[domain as keyof typeof DOMAIN_QUERY_PATTERNS])) {
      if (questionLower.includes(pattern)) {
        return query;
      }
    }
    // Return domain fallback if no specific pattern matches
    return DOMAIN_FALLBACKS[domain as keyof typeof DOMAIN_FALLBACKS];
  }
  
  // Generic fallback
  return generateGenericAlternateQuery(question);
}

// Optimized generic fallback
function generateGenericAlternateQuery(question: string): string {
  const keyTerms = question
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !STOP_WORDS.has(word) &&
      /^[a-zA-Z]+$/.test(word)
    )
    .slice(0, 5);
  
  return keyTerms.join(' ');
}

// Fast answer incompleteness check
function isAnswerIncomplete(answer: string, question: string): boolean {
  const answerLower = answer.toLowerCase();
  const questionLower = question.toLowerCase();
  
  // Quick checks first
  if (answer.length < 50) return true;
  
  // Check incomplete indicators using Set
  for (const indicator of INCOMPLETE_INDICATORS) {
    if (answerLower.includes(indicator)) return true;
  }
  
  // Domain-specific checks
  const domain = detectDomain(question);
  
  if (domain === 'insurance') {
    return (questionLower.includes('percentage') && !answer.includes('%')) ||
           (questionLower.includes('room rent') && !answer.includes('%'));
  } else if (domain === 'legal') {
    return questionLower.includes('clause') && !answer.match(/clause\s*\d+/i);
  } else if (domain === 'hr') {
    return questionLower.includes('salary') && !answer.match(/\d/);
  } else if (domain === 'contract') {
    return questionLower.includes('payment') && !answer.match(/\d/);
  }
  
  // Generic numeric check
  const numericQuestions = ['how much', 'how many', 'what amount', 'what percentage'];
  return numericQuestions.some(q => questionLower.includes(q)) && !answer.match(/\d/);
}

// Answer cleaning helper
function cleanAnswer(answer: string): string {
  return answer
    .replace(/^According to the provided.*?,\s*/i, '')
    .replace(/^Based on the.*?,\s*/i, '')
    .replace(/^The document states.*?,\s*/i, '')
    .replace(/^From the document.*?,\s*/i, '')
    .replace(/^As per the.*?,\s*/i, '')
    .trim();
}

const numericIndicators = {
  // Time-related indicators
  temporal: [
    'period', 'duration', 'time', 'days', 'months', 'years', 'weeks', 'hours', 'minutes',
    'deadline', 'timeline', 'schedule', 'term', 'tenure', 'expiry', 'maturity',
    'quarterly', 'annually', 'monthly', 'daily', 'weekly', 'biweekly', 'bi-annual',
    'semester', 'trimester', 'fiscal year', 'calendar year', 'business days',
    'working days', 'grace period', 'waiting period', 'cooling period', 'notice period',
    'probation', 'trial period', 'review period', 'renewal period', 'extension',
    'how long', 'when', 'until', 'before', 'after', 'within', 'by', 'from', 'to'
  ],

  // Financial and monetary indicators
  financial: [
    'amount', 'cost', 'price', 'fee', 'charge', 'rate', 'premium', 'deductible',
    'copay', 'coinsurance', 'salary', 'wage', 'bonus', 'commission', 'allowance',
    'reimbursement', 'compensation', 'benefit', 'pension', 'interest', 'dividend',
    'tax', 'fine', 'penalty', 'deposit', 'advance', 'installment', 'payment',
    'budget', 'allocation', 'fund', 'grant', 'subsidy', 'discount', 'rebate',
    'refund', 'credit', 'debit', 'balance', 'outstanding', 'due', 'payable',
    'receivable', 'liability', 'asset', 'equity', 'capital', 'investment',
    'valuation', 'appraisal', 'estimate', 'quote', 'bid', 'tender',
    'how much', 'what cost', 'price of', 'value of', 'worth of'
  ],

  // Percentage and ratio indicators
  percentage: [
    'percentage', 'percent', '%', 'ratio', 'proportion', 'fraction', 'share',
    'portion', 'allocation', 'distribution', 'split', 'breakdown', 'composition',
    'concentration', 'density', 'intensity', 'frequency', 'probability',
    'likelihood', 'chance', 'risk', 'rate of', 'level of', 'degree of',
    'markup', 'markdown', 'margin', 'spread', 'variance', 'deviation',
    'what percentage', 'how much percent', 'what portion', 'what share'
  ],

  // Quantity and measurement indicators
  quantitative: [
    'number', 'count', 'quantity', 'volume', 'size', 'capacity', 'limit',
    'maximum', 'minimum', 'threshold', 'ceiling', 'floor', 'range', 'span',
    'extent', 'scope', 'scale', 'magnitude', 'dimension', 'measurement',
    'metric', 'unit', 'standard', 'benchmark', 'target', 'goal', 'objective',
    'quota', 'allocation', 'allowance', 'entitlement', 'eligibility',
    'requirement', 'criteria', 'specification', 'parameter', 'variable',
    'how many', 'how much', 'what number', 'total', 'sum', 'aggregate'
  ],

  // Insurance-specific indicators
  insurance: [
    'coverage', 'benefit', 'claim', 'settlement', 'payout', 'indemnity',
    'policy', 'rider', 'endorsement', 'exclusion', 'inclusion', 'scope',
    'sum insured', 'sum assured', 'face value', 'death benefit', 'maturity benefit',
    'surrender value', 'cash value', 'loan value', 'paid-up value',
    'bonus', 'loading', 'underwriting', 'risk', 'hazard', 'peril',
    'deductible', 'excess', 'franchise', 'co-payment', 'co-insurance',
    'sub-limit', 'aggregate limit', 'per occurrence', 'per claim', 'per person',
    'room rent', 'icu charges', 'surgeon fee', 'hospital charges',
    'pre-hospitalization', 'post-hospitalization', 'domiciliary treatment',
    'alternative medicine', 'wellness', 'preventive care',
    'annual health check', 'vaccination', 'screening'
  ],

  // Legal and compliance indicators
  legal: [
    'clause', 'section', 'article', 'paragraph', 'subsection', 'provision',
    'condition', 'term', 'covenant', 'warranty', 'representation', 'undertaking',
    'obligation', 'duty', 'responsibility', 'liability', 'indemnification',
    'damages', 'compensation', 'remedy', 'relief', 'injunction', 'restraint',
    'prohibition', 'restriction', 'limitation', 'constraint', 'requirement',
    'compliance', 'violation', 'breach', 'default', 'non-compliance',
    'penalty', 'sanction', 'punishment', 'fine', 'forfeiture', 'confiscation',
    'jurisdiction', 'venue', 'governing law', 'applicable law', 'choice of law',
    'dispute resolution', 'arbitration', 'mediation', 'litigation',
    'statute of limitations', 'limitation period', 'prescription period'
  ],

  // Human Resources indicators
  hr: [
    'employee', 'staff', 'personnel', 'workforce', 'headcount', 'fte', 'contractor',
    'position', 'role', 'designation', 'title', 'grade', 'level', 'band',
    'experience', 'qualification', 'skill', 'competency', 'certification',
    'training', 'development', 'education', 'degree', 'diploma', 'course',
    'performance', 'rating', 'appraisal', 'review', 'evaluation', 'assessment',
    'kpi', 'kra', 'objective', 'goal', 'target', 'milestone', 'achievement',
    'attendance', 'leave', 'absence', 'vacation', 'sick leave', 'maternity',
    'paternity', 'sabbatical', 'unpaid leave', 'leave balance', 'accrual',
    'overtime', 'shift', 'roster', 'schedule', 'working hours', 'break',
    'notice period', 'probation', 'confirmation', 'promotion', 'transfer',
    'resignation', 'termination', 'retirement', 'superannuation',
    'grievance', 'disciplinary', 'warning', 'suspension', 'dismissal'
  ],

  // Contract management indicators
  contract: [
    'agreement', 'contract', 'deal', 'arrangement', 'understanding', 'accord',
    'memorandum', 'mou', 'loi', 'proposal', 'offer', 'acceptance', 'consideration',
    'execution', 'signing', 'effective date', 'commencement', 'start date',
    'end date', 'expiry', 'termination', 'renewal', 'extension', 'modification',
    'amendment', 'variation', 'change order', 'supplement', 'addendum',
    'milestone', 'deliverable', 'output', 'outcome', 'result', 'product',
    'service', 'work', 'task', 'activity', 'phase', 'stage', 'step',
    'specification', 'requirement', 'standard', 'quality', 'acceptance criteria',
    'testing', 'inspection', 'approval', 'sign-off', 'handover', 'delivery',
    'payment terms', 'invoice', 'billing', 'statement', 'receipt', 'voucher',
    'purchase order', 'work order', 'change request', 'variation order',
    'force majeure', 'act of god', 'unforeseen circumstances', 'delay',
    'liquidated damages', 'penalty clause', 'service level agreement', 'sla'
  ],

  // Age and demographic indicators
  demographic: [
    'age', 'year old', 'years of age', 'born', 'birth', 'date of birth', 'dob',
    'minor', 'adult', 'senior', 'elderly', 'child', 'infant', 'teenager',
    'generation', 'cohort', 'group', 'category', 'class', 'segment',
    'population', 'sample', 'respondent', 'participant', 'member',
    'gender', 'sex', 'male', 'female', 'nationality', 'citizenship',
    'residence', 'domicile', 'address', 'location', 'geography', 'region'
  ],

  // Question patterns that typically expect numeric answers
  questionPatterns: [
    'how much', 'how many', 'how long', 'how often', 'how far', 'how big',
    'how old', 'how high', 'how low', 'how fast', 'how slow', 'how deep',
    'what is the', 'what are the', 'what percentage', 'what amount',
    'what cost', 'what price', 'what rate', 'what fee', 'what charge',
    'what limit', 'what maximum', 'what minimum', 'what range',
    'when is', 'when does', 'when will', 'when can', 'when must',
    'where is', 'which is', 'who is', 'whose is',
    'specify', 'state', 'mention', 'indicate', 'provide', 'give',
    'calculate', 'compute', 'determine', 'find', 'derive', 'obtain'
  ],

  // Units and measures
  units: [
    'dollar', 'rupee', 'euro', 'pound', 'yen', 'currency', 'usd', 'inr',
    'lakh', 'crore', 'million', 'billion', 'thousand', 'hundred',
    'meter', 'kilometer', 'centimeter', 'inch', 'foot', 'yard', 'mile',
    'gram', 'kilogram', 'pound', 'ounce', 'ton', 'tonne',
    'liter', 'milliliter', 'gallon', 'quart', 'pint',
    'degree', 'celsius', 'fahrenheit', 'kelvin',
    'square', 'cubic', 'per', 'each', 'every', 'single', 'double', 'triple'
  ]
};

//flatten all numeric indicators into a single array for easier searching
const allNumericIndicators = [
  ...numericIndicators.temporal,
  ...numericIndicators.financial,
  ...numericIndicators.percentage,
  ...numericIndicators.quantitative,
  ...numericIndicators.insurance,
  ...numericIndicators.questionPatterns,
  ...numericIndicators.units
];

// function enhances the question by appending specific numeric indicators based on the detected domain
function enhanceQuestionForNumbers(question: string, domain?: string): string {
  const questionLower = question.toLowerCase();
  
  // Get relevant indicators based on domain
  let relevantIndicators = allNumericIndicators;
  if (domain && numericIndicators[domain as keyof typeof numericIndicators]) {
    relevantIndicators = [
      ...numericIndicators[domain as keyof typeof numericIndicators] as string[],
      ...numericIndicators.temporal,
      ...numericIndicators.financial,
      ...numericIndicators.percentage,
      ...numericIndicators.quantitative,
      ...numericIndicators.questionPatterns
    ];
  }
  
  const hasNumericIntent = relevantIndicators.some(indicator => 
    questionLower.includes(indicator.toLowerCase())
  );
  
  if (hasNumericIntent) {
    // Domain-specific enhancements
    let enhancement = ' - provide specific numbers, exact percentages, precise time periods, and exact amounts from the document';
    
    if (domain === 'insurance') {
      enhancement = ' - include exact coverage amounts, percentages of sum insured, waiting periods in days/months, plan-specific details, and sub-limits';
    } else if (domain === 'legal') {
      enhancement = ' - specify clause numbers, exact legal timeframes, penalty amounts, and compliance percentages';
    } else if (domain === 'hr') {
      enhancement = ' - provide exact tenure requirements, performance ratings, leave balances, salary bands, and experience years';
    } else if (domain === 'contract') {
      enhancement = ' - include contract values, milestone dates, payment terms, penalty clauses, and service level percentages';
    }
    
    return `${question}${enhancement}`;
  }
  
  return question;
}

// Smart enhancement function with automatic domain detection
function smartEnhanceQuestion(question: string): string {
  const detectedDomain = detectDomain(question);
  return enhanceQuestionForNumbers(question, detectedDomain);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // STEP:0 AUTHENTICATION CHECK
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
    
    // Step-2: Document Ingestion
    console.log("Starting document ingestion from URL:", documentUrl);

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
    
    //get cached embeddings instance
    const embeddings = getOptimizedEmbeddings();
    await SupabaseVectorStore.fromDocuments(enrichedDocs, embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });
    console.log("Document processed and stored in Supabase successfully.");
    
    // Step 3: Query Processing
    console.log(
      "Starting query processing for",
      questions.length,
      "questions."
    );
    const llm = getOptimizedLLM();

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });
    
    const retriever = vectorStore.asRetriever({
      searchType: "similarity",
      k: 15
    });

  const promptTemplate = ChatPromptTemplate.fromTemplate(`
    You are an expert document analyst capable of handling various document types including insurance, legal, HR, and contract documents.
    
    CRITICAL FOCUS AREAS:
    - Extract SPECIFIC numbers: days, months, years, percentages
    - Identify document-specific details and plan types
    - Find coverage limits, terms, and conditions
    - Quote EXACT amounts and timeframes
    - Search thoroughly for ALL relevant information

    EXTRACTION RULES:
    1. For time periods: Look for days, months, years - be specific
    2. For percentages: Extract exact % values and what they apply to
    3. For coverage/terms: Find what IS included, not just what isn't
    4. For plans/sections: Distinguish between different types
    5. For limits: Find sub-limits, caps, and maximum amounts
    
    RESPONSE FORMAT:
    - Start with direct answer using exact numbers from document
    - Include specific conditions and relevant details
    - Keep concise but complete
    
    Document Context:
    {context}
    
    Question: {input}
    
    Extract the MOST SPECIFIC answer with exact numbers and relevant details:
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

    // Step 4: Use optimized parallel processing with fast lookup tables
    const batchSize = Math.min(3, Math.max(1, Math.floor(questions.length / 2)));
    console.log(`Using batch size: ${batchSize} for ${questions.length} questions`);
    
    const answers = await processQuestionBatch(questions, retrievalChain, batchSize);

    console.log("All queries processed. Returning final response.");
    const finalResponse: HackRxResponse = { answers };
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