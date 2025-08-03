import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { supabase } from "@/lib/supabaseClient";


interface QueryResult {
    Decision:"Approved" | "Rejected";
    Amount:number | null;
    Justification:string[];

}

export async function POST(request: NextRequest) {
    try{
        const { query } = await request.json();
        if(!query){
            return NextResponse.json({
                error: "Query is required"
            }, { status: 400 });
            
        }
    const llm = new ChatGoogleGenerativeAI({
        // model: "gemini-2.5-flash",
        model:"gemini-2.5-pro",
        temperature: 0.1,
    });
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
    });
    const queryParsingPrompt = ChatPromptTemplate.fromTemplate(`
  You are an expert at parsing insurance-related queries. Extract key information from the user's query and return it as JSON.

  Query: {query}

  Extract the following information if available:
  - age: number (if mentioned)
  - gender: string (M/F/Male/Female if mentioned)
  - procedure: string (medical procedure, surgery, treatment)
  - location: string (city, state if mentioned)
  - policy_duration: string (how long they've had the policy)
  - other_details: string (any other relevant information)

  Return only a JSON object with these fields. Use null for missing information.
`);
    const parsedQuery = await queryParsingPrompt
        .pipe(llm)
        .pipe(new StringOutputParser())
        .invoke({ query });
        console.log("Parsed Query:", parsedQuery);
        const vectorStore=new SupabaseVectorStore(embeddings,{
            client: supabase,
            tableName: "documents",
            queryName: "match_documents",

        })
        const retriever = vectorStore.asRetriever({
            k:5,  // Number of documents to retrieve

                });
      const evaluationPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert insurance claims evaluator. Based on the provided context from policy documents, evaluate the insurance claim and make a decision.

Original Query: {input}
Parsed Information: {parsedInfo}

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

    const documentChain=await createStuffDocumentsChain({
        llm,
        prompt: evaluationPrompt,
  outputParser: new StringOutputParser(),
    })
    const retrievalChain =await createRetrievalChain({
        retriever,
        combineDocsChain: documentChain,
    })
    const result = await (await retrievalChain).invoke({
    input: query,
    parsedInfo: parsedQuery,  // Pass parsedQuery as a proper variable
});

    console.log("Evaluation Result:", result.answer);
    let parsedResult: QueryResult;
    try {
      const cleanedAnswer = result.answer.trim();
        
      const jsonMatch = cleanedAnswer.match(/\{[\s\S]*\}/);
      if(jsonMatch){
        parsedResult= JSON.parse(jsonMatch[0]);

      }
      else{
        throw new Error("No valid JSON found in the response");
      }
    } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError);
      
      // Fallback response
      parsedResult = {
        Decision: "Rejected",
        Amount: null,
        Justification: ["Unable to process the query due to parsing error. Please try again."]
      };



        
    }
    const response={
        Decision: parsedResult.Decision || "Rejected",
        Amount: parsedResult.Amount || null,
        Justification: Array.isArray(parsedResult.Justification)? parsedResult.Justification : ["No justification provided"],
        context:result.context?.map((doc: { pageContent: string; metadata: Record<string, unknown>}) => ({
            content: doc.pageContent.substring(0, 200)+ '...', // Limit to first 200 characters
            metadata: doc.metadata
        })) || []
    }
    return NextResponse.json(response);

}
   catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        Decision: "Rejected",
        Amount: null,
        Justification: ["System error occurred while processing the query"]
      },
      { status: 500 }
    );
  }
}