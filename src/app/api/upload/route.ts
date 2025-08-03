import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import {supabase } from "@/lib/supabaseClient";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir, access, constants } from "fs/promises";
import { existsSync } from "fs";
import path from "path"

// const loader=new PDFLoader(uploadedFilePath);
// const docs=await loader.load();
// const splitter = new RecursiveCharacterTextSplitter({chunkSize :1000,
//     chunkOverlap:200});
// const chunks= await splitter.splitDocuments(docs);
// const embeddings = new GoogleGenerativeAIEmbeddings(
//     {
//         model: "text-embedding-004",

//     }
// );

// await SupabaseVectorStore.fromDocuments(
//     chunks,
//     embeddings,
//     {
//         client: supabase,
//         tableName: "documents",
//         queryName: "match_documents",
//     }
// )

export async function POST(request: NextRequest){
    try {
        const formData=await request.formData(); 
        const file=formData.get("file") as File; // Ensure the file is of type File
        if(!file) {
            return  NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        console.log("current working directory:", process.cwd());
        const tmpDir=path.join(process.cwd(), "tmp");
        console.log("Tmp directory path:", tmpDir);
        console.log("Tmp directory exists:", existsSync(tmpDir));
         try {
            await access(tmpDir, constants.W_OK);
            console.log("Directory is writable");
        } catch (accessError) {
            console.error("Directory access error:", accessError);
            // Try to create it
            await mkdir(tmpDir, { recursive: true });
            console.log("Created directory");
        }

        const bytes = await file.arrayBuffer(); 
        const buffer=Buffer.from(bytes);
        const filePath = path.join(process.cwd(), "tmp", file.name);
        await writeFile(filePath, buffer);
        let loader;
        const fileExtension = path.extname(file.name).toLowerCase();

        if(fileExtension===".pdf") {
            loader = new PDFLoader(filePath);
        } else if(fileExtension === ".docx") {
            // Assuming you have a TextLoader for .txt files
            loader = new DocxLoader(filePath); // Replace with actual TextLoader import
        } else {
            await unlink(filePath); // Clean up the temporary file
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

        }

        const docs=await loader.load();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs=await textSplitter.splitDocuments(docs);
           const enrichedDocs = splitDocs.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      }
    }));

    const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
        });
        await SupabaseVectorStore.fromDocuments(
            enrichedDocs,
            embeddings,
            {
                client: supabase,
                tableName: "documents",
                queryName: "match_documents",
            }
        );
        await unlink(filePath); // Clean up the temporary file
        return NextResponse.json({ message: "File processed and stored successfully" }, { status:
    200 });
        
    } catch (error) {
        console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  
        
    }
}

