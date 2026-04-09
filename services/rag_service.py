from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

class RAGService:
    def __init__(self, policies_dir: str = "data/policies"):
        self.policies_dir = policies_dir
        # Using a small, efficient model suitable for a demo
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None
        self._initialize_vector_store()

    def _initialize_vector_store(self):
        # Load documents
        loader = DirectoryLoader(self.policies_dir, glob="*.txt", loader_cls=TextLoader)
        documents = loader.load()
        
        if not documents:
            print("No policy documents found. RAG will not have context.")
            return

        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = text_splitter.split_documents(documents)
        
        # Create vector store
        self.vector_store = FAISS.from_documents(docs, self.embeddings)
        print(f"Initialized FAISS vector store with {len(docs)} chunks.")

    def get_relevant_context(self, query: str, k: int = 3) -> str:
        if not self.vector_store:
            return ""
        
        docs = self.vector_store.similarity_search(query, k=k)
        context = "\n".join([doc.page_content for doc in docs])
        return context

# Singleton instance
rag_service = RAGService()
