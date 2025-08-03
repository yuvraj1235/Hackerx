// import { NextRequest, NextResponse } from 'next/server';
// import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import { supabase } from "@/lib/supabaseClient";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";
// import path from "path";
// import { writeFile, unlink } from "fs/promises";
// import { existsSync, mkdirSync } from "fs";

// // Define the interfaces for the request and response bodies as per guidelines
// interface QueryResult {
//     Decision: "Approved" | "Rejected";
//     Amount: number | null;
//     Justification: string[];
// }

// interface HackRxRequest {
//     documents: string;
//     questions: string[];
// }

// interface HackRxResponse {
//     answers: QueryResult[];
// }

// /**
//  * The main API endpoint for the HackRx system.
//  * This endpoint combines document ingestion and query-retrieval into a single flow,
//  * as specified by the hackathon guidelines.
//  * * @param request The incoming Next.js request containing the document URL and questions.
//  * @returns A structured JSON response with answers to all questions.
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const { documents: documentUrl, questions } = await request.json() as HackRxRequest;

//         // --- Step 1: Input Validation ---
//         if (!documentUrl || !questions || questions.length === 0) {
//             return NextResponse.json({
//                 error: "Document URL and at least one question are required."
//             }, { status: 400 });
//         }

//         // --- Step 2: Document Ingestion (Logic adapted from your original upload route) ---
//         console.log("Starting document ingestion from URL:", documentUrl);
        
//         // Ensure a temporary directory exists for file downloads
//         const tmpDir = path.join(process.cwd(), "tmp");
//         if (!existsSync(tmpDir)) {
//             mkdirSync(tmpDir, { recursive: true });
//         }

//         // Download the document from the provided URL
//         const response = await fetch(documentUrl);
//         if (!response.ok) {
//             throw new Error(`Failed to download document from URL: ${documentUrl}`);
//         }
        
//         const bytes = await response.arrayBuffer();
//         const buffer = Buffer.from(bytes);

//         // Save the document to a temporary file
//         const fileName = path.basename(new URL(documentUrl).pathname);
//         const filePath = path.join(tmpDir, fileName);
//         await writeFile(filePath, buffer);
//         console.log(`Document saved to temporary path: ${filePath}`);

//         // Load the document using the correct loader based on file extension
//         let loader;
//         const fileExtension = path.extname(fileName).toLowerCase();

//         if (fileExtension === ".pdf") {
//             loader = new PDFLoader(filePath);
//         } else if (fileExtension === ".docx") {
//             loader = new DocxLoader(filePath);
//         } else if (fileExtension === ".eml") {
//             loader = new UnstructuredLoader(filePath);
//         } else {
//             await unlink(filePath); // Clean up
//             return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
//         }

//         const docs = await loader.load();
//         const textSplitter = new RecursiveCharacterTextSplitter({
//             chunkSize: 1000,
//             chunkOverlap: 200,
//         });
//         const splitDocs = await textSplitter.splitDocuments(docs);
//         const enrichedDocs = splitDocs.map((doc, index) => ({
//             ...doc,
//             metadata: {
//                 ...doc.metadata,
//                 chunkIndex: index,
//                 fileName: fileName,
//                 uploadedAt: new Date().toISOString(),
//             }
//         }));

//         const embeddings = new GoogleGenerativeAIEmbeddings({
//             model: "text-embedding-004",
//         });

//         // Store the documents and their embeddings in Supabase
//         await SupabaseVectorStore.fromDocuments(
//             enrichedDocs,
//             embeddings,
//             {
//                 client: supabase,
//                 tableName: "documents",
//                 queryName: "match_documents",
//             }
//         );
//         console.log("Document processed and stored in Supabase successfully.");
//         await unlink(filePath); // Clean up the temporary file

//         // --- Step 3: Query Processing (Logic adapted from your original query route) ---
//         console.log("Starting query processing for", questions.length, "questions.");

//         const llm = new ChatGoogleGenerativeAI({
//             model: "gemini-2.5-pro",
//             temperature: 0.1,
//         });

//         const vectorStore = new SupabaseVectorStore(embeddings, {
//             client: supabase,
//             tableName: "documents",
//             queryName: "match_documents",
//         });

//         const retriever = vectorStore.asRetriever({ k: 5 });

//         const evaluationPrompt = ChatPromptTemplate.fromTemplate(`
// You are an expert insurance claims evaluator. Based on the provided context from policy documents, evaluate the insurance claim and make a decision.

// Original Query: {input}

// Context from Policy Documents:
// {context}

// Instructions:
// 1. Analyze the query against the provided policy context
// 2. Make a clear decision: "Approved" or "Rejected"
// 3. If approved, determine the coverage amount (use null if not specified)
// 4. Provide detailed justification referencing specific clauses or sections

// Return your response as a valid JSON object in exactly this format:
// {{
//   "Decision": "Approved" or "Rejected",
//   "Amount": number or null, 
//   "Justification": ["reason 1 with clause reference", "reason 2 with clause reference"]
// }}

// Important: Reference specific clauses, sections, or policy terms in your justification. Each justification should include the source like "[Clause 3.2]" or "[Section 5.1]".
// `); 

//         const documentChain = await createStuffDocumentsChain({
//             llm,
//             prompt: evaluationPrompt,
//             outputParser: new StringOutputParser(),
//         });

//         const retrievalChain = await createRetrievalChain({
//             retriever,
//             combineDocsChain: documentChain,
//         });

//         const answers: QueryResult[] = [];

//         // Process each question individually
//         for (const question of questions) {
//             console.log("Processing question:", question);
//             const result = await retrievalChain.invoke({ input: question });

//             let parsedResult: QueryResult;
//             try {
//                 const cleanedAnswer = result.answer.trim();
//                 const jsonMatch = cleanedAnswer.match(/\{[\s\S]*\}/);
//                 if (jsonMatch) {
//                     parsedResult = JSON.parse(jsonMatch[0]);
//                 } else {
//                     throw new Error("No valid JSON found in the response");
//                 }
//             } catch (parseError) {
//                 console.error('Failed to parse LLM response as JSON:', parseError);
//                 parsedResult = {
//                     Decision: "Rejected",
//                     Amount: null,
//                     Justification: ["Unable to process the query due to a parsing error."],
//                 };
//             }

//             answers.push({
//                 Decision: parsedResult.Decision || "Rejected",
//                 Amount: parsedResult.Amount || null,
//                 Justification: Array.isArray(parsedResult.Justification)
//                     ? parsedResult.Justification
//                     : ["No justification provided"],
//             });
//         }
        
//         console.log("All queries processed. Returning final response.");
//         const finalResponse: HackRxResponse = { answers };
//         return NextResponse.json(finalResponse);

//     } catch (error) {
//         console.error('Error in HackRx API:', error);
//         return NextResponse.json(
//             { error: 'Failed to process request: ' + (error as Error).message },
//             { status: 500 }
//         );
//     }
// }

import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
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

// Define the interfaces for the request and response bodies as per guidelines
interface QueryResult {
    Decision: "Approved" | "Rejected";
    Amount: number | null;
    Justification: string[];
}

interface HackRxRequest {
    documents: string;
    questions: string[];
}

interface HackRxResponse {
    answers: QueryResult[];
}

/**
 * The main API endpoint for the HackRx system.
 * This endpoint combines document ingestion and query-retrieval into a single flow,
 * as specified by the hackathon guidelines.
 *
 * @param request The incoming Next.js request containing the document URL and questions.
 * @returns A structured JSON response with answers to all questions.
 */
export async function POST(request: NextRequest) {
    try {
        const { documents: documentUrl, questions } = await request.json() as HackRxRequest;

        // --- Step 1: Input Validation ---
        if (!documentUrl || !questions || questions.length === 0) {
            return NextResponse.json({
                error: "Document URL and at least one question are required."
            }, { status: 400 });
        }

        // --- Step 2: Document Ingestion (Memory-based logic to avoid filesystem issues) ---
        console.log("Starting document ingestion from URL:", documentUrl);
        
        // Download the document from the provided URL
        const response = await fetch(documentUrl);
        if (!response.ok) {
            throw new Error(`Failed to download document from URL: ${documentUrl}`);
        }
        
        const bytes = await response.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = path.extname(new URL(documentUrl).pathname).toLowerCase();
        
        let docs;
        
        if (fileExtension === ".pdf") {
            const loader = new PDFLoader(new Blob([buffer], { type: 'application/pdf' }));
            docs = await loader.load();
        } else if (fileExtension === ".docx") {
            const loader = new DocxLoader(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
            docs = await loader.load();
        } else if (fileExtension === ".eml") {
            // Handle EML files by parsing as text since UnstructuredEmailLoader needs file paths
            const emailText = buffer.toString('utf-8');
            docs = [{
                pageContent: emailText,
                metadata: {
                    source: documentUrl,
                    type: 'email'
                }
            }];
        } else {
            return NextResponse.json({ 
                error: `Unsupported file type: ${fileExtension}. Supported types: .pdf, .docx, .eml` 
            }, { status: 400 });
        }
        
        // Add validation for empty documents
        if (!docs || docs.length === 0) {
            return NextResponse.json({
                error: "No content could be extracted from the document"
            }, { status: 400 });
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        
        // Add validation for split documents
        if (!splitDocs || splitDocs.length === 0) {
            return NextResponse.json({
                error: "Document could not be processed into chunks"
            }, { status: 400 });
        }

        const enrichedDocs = splitDocs.map((doc, index) => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                chunkIndex: index,
                fileName: path.basename(new URL(documentUrl).pathname),
                uploadedAt: new Date().toISOString(),
                fileType: fileExtension,
            }
        }));

        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
        });

        // Store the documents and their embeddings in Supabase
        await SupabaseVectorStore.fromDocuments(
            enrichedDocs,
            embeddings,
            {
                client: supabase,
                tableName: "documents",
                queryName: "match_documents",
            }
        );
        console.log("Document processed and stored in Supabase successfully.");

        // --- Step 3: Query Processing (Logic adapted from your original query route) ---
        console.log("Starting query processing for", questions.length, "questions.");

        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash-exp", // Updated to a more recent model
            temperature: 0.1,
        });

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: supabase,
            tableName: "documents",
            queryName: "match_documents",
        });

        const retriever = vectorStore.asRetriever({ k: 5 });

        const evaluationPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert insurance claims evaluator. Based on the provided context from policy documents, evaluate the insurance claim and make a decision.

Original Query: {input}

Context from Policy Documents:
{context}

Instructions:
1. Analyze the query against the provided policy context
2. Make a clear decision: "Approved" or "Rejected"
3. If approved, determine the coverage amount (use null if not specified)
4. Provide detailed justification referencing specific clauses or sections

Return your response as a valid JSON object in exactly this format:
{{
  "Decision": "Approved" or "Rejected",
  "Amount": number or null, 
  "Justification": ["reason 1 with clause reference", "reason 2 with clause reference"]
}}

Important: Reference specific clauses, sections, or policy terms in your justification. Each justification should include the source like "[Clause 3.2]" or "[Section 5.1]".
`); 

        const documentChain = await createStuffDocumentsChain({
            llm,
            prompt: evaluationPrompt,
            outputParser: new StringOutputParser(),
        });

        const retrievalChain = await createRetrievalChain({
            retriever,
            combineDocsChain: documentChain,
        });

        const answers: QueryResult[] = [];

        // Process each question individually
        for (const question of questions) {
            console.log("Processing question:", question);
            
            try {
                const result = await retrievalChain.invoke({ input: question });

                let parsedResult: QueryResult;
                try {
                    const cleanedAnswer = result.answer.trim();
                    // More robust JSON extraction
                    const jsonMatch = cleanedAnswer.match(/\{[\s\S]*?\}/);
                    if (jsonMatch) {
                        parsedResult = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error("No valid JSON found in the response");
                    }
                } catch (parseError) {
                    console.error('Failed to parse LLM response as JSON:', parseError);
                    console.error('Raw response:', result.answer);
                    parsedResult = {
                        Decision: "Rejected",
                        Amount: null,
                        Justification: ["Unable to process the query due to a parsing error. Please try rephrasing your question."],
                    };
                }

                // Validate parsed result structure
                const validatedResult: QueryResult = {
                    Decision: (parsedResult.Decision === "Approved" || parsedResult.Decision === "Rejected") 
                        ? parsedResult.Decision 
                        : "Rejected",
                    Amount: typeof parsedResult.Amount === 'number' ? parsedResult.Amount : null,
                    Justification: Array.isArray(parsedResult.Justification) && parsedResult.Justification.length > 0
                        ? parsedResult.Justification
                        : ["No justification provided"],
                };

                answers.push(validatedResult);
                
            } catch (queryError) {
                console.error('Error processing question:', question, queryError);
                answers.push({
                    Decision: "Rejected",
                    Amount: null,
                    Justification: ["Error occurred while processing this query. Please try again."],
                });
            }
        }
        
        console.log("All queries processed. Returning final response.");
        const finalResponse: HackRxResponse = { answers };
        return NextResponse.json(finalResponse);

    } catch (error) {
        console.error('Error in HackRx API:', error);
        return NextResponse.json(
            { error: 'Failed to process request: ' + (error as Error).message },
            { status: 500 }
        );
    }
}