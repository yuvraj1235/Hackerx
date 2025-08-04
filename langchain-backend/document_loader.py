# import os
# from langchain_community.document_loaders import UnstructuredPDFLoader, UnstructuredWordDocumentLoader, UnstructuredEmailLoader

# def load_document(file_path):
#     ext = os.path.splitext(file_path)[-1].lower()

#     if ext == ".pdf":
#         return UnstructuredPDFLoader(file_path).load()
#     elif ext == ".docx":
#         return UnstructuredWordDocumentLoader(file_path).load()
#     elif ext == ".eml":
#         return UnstructuredEmailLoader(file_path).load()
#     else:
#         raise ValueError("Unsupported file format")
