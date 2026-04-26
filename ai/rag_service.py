import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

class RAGService:
    def __init__(self, base_policies_dir: str = "data/policies"):
        self.base_policies_dir = base_policies_dir
        # Using a small, efficient model suitable for a demo
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_stores = {} # organization_id -> FAISS instance

    def _get_org_policies_dir(self, organization_id: int) -> str:
        return os.path.join(self.base_policies_dir, str(organization_id))

    def initialize_organization_store(self, organization_id: int):
        """
        Loads or creates a vector store for a specific organization.
        """
        org_dir = self._get_org_policies_dir(organization_id)
        if not os.path.exists(org_dir):
            os.makedirs(org_dir, exist_ok=True)
            # Create a dummy file if empty so loader doesn't fail
            dummy_path = os.path.join(org_dir, "default_policy.txt")
            if not os.listdir(org_dir):
                with open(dummy_path, "w") as f:
                    f.write("Welcome to our support. We are here to help you.")

        # Load documents
        loader = DirectoryLoader(org_dir, glob="*.txt", loader_cls=TextLoader)
        documents = loader.load()
        
        if not documents:
            print(f"No policy documents found for Organization {organization_id}.")
            return

        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = text_splitter.split_documents(documents)
        
        # Create vector store
        self.vector_stores[organization_id] = FAISS.from_documents(docs, self.embeddings)
        print(f"Initialized FAISS vector store for Organization {organization_id} with {len(docs)} chunks.")

    def get_relevant_context(self, organization_id: int, query: str, k: int = 3) -> str:
        if organization_id not in self.vector_stores:
            self.initialize_organization_store(organization_id)
        
        vector_store = self.vector_stores.get(organization_id)
        if not vector_store:
            return ""
        
        docs = vector_store.similarity_search(query, k=k)
        context = "\n".join([doc.page_content for doc in docs])
        return context

# Singleton instance
rag_service = RAGService()
