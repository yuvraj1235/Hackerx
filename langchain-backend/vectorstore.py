# import os
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_community.vectorstores import SupabaseVectorStore
# from supabase import create_client, Client

# from dotenv import load_dotenv
# load_dotenv()

# SUPABASE_URL = os.environ["SUPABASE_URL"]
# SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
# GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]

# def get_supabase_vectorstore():
#     embeddings = GoogleGenerativeAIEmbeddings(
#         model="models/embedding-001",
#         google_api_key=GOOGLE_API_KEY,
#     )

#     client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

#     vectorstore = SupabaseVectorStore(
#         client=client,
#         embedding=embeddings,
#         table_name="documents",  # Or your table
#         query_name="match_documents",
#     )

#     return vectorstore
