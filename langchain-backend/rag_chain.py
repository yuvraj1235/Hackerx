from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI
from vectorstore import get_supabase_vectorstore
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import tempfile

# Setup
retriever = get_supabase_vectorstore().as_retriever()

llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.getenv("GOOGLE_API_KEY"))

rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    return_source_documents=False,  # or True if you want traceability
    chain_type="stuff"
)
async def embed_pdf(content: bytes, filename: str):
    # Step 1: Save PDF to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    # Step 2: Load and split
    loader = PyPDFLoader(tmp_path)
    documents = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(documents)
    
    # Optional: Clean up the temp file
    os.remove(tmp_path)