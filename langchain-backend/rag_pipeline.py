# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import SupabaseVectorStore
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_community.document_loaders import UnstructuredPDFLoader, UnstructuredWordDocumentLoader, UnstructuredEmailLoader

# from document_loader import load_document
# from vectorstore import get_supabase_vectorstore  # your own code
# from rag_chain import rag_chain
# import os
# from langchain_google_genai import GoogleGenerativeAIEmbeddings

# embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/embedding-001",
#     google_api_key=os.environ["GOOGLE_API_KEY"]
# )

# def process_questions(file_path, questions):
#     # Load document (based on extension)
#     docs = load_document(file_path)

#     # Chunking
#     splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#     chunks = splitter.split_documents(docs)

#     # Store in Supabase
#     vectorstore = get_supabase_vectorstore()
#     vectorstore.add_documents(chunks)

#     # Query with RAG chain
#     responses = []
#     for question in questions:
#         result = rag_chain.run(question)
#         responses.append(result)

#     return responses
