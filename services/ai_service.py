import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from core.config import settings
from services.rag_service import rag_service

class AIService:
    def __init__(self):
        # We will initialize the LLM lazily to avoid crashing if API key is not set initially
        self.llm = None

    def _get_llm(self):
        if self.llm:
            return self.llm
        
        if settings.GROQ_API_KEY and "your_groq_api_key_here" not in settings.GROQ_API_KEY:
            try:
                # Optimized for speed and correctness
                self.llm = ChatGroq(temperature=0, groq_api_key=settings.GROQ_API_KEY, model_name="llama-3.3-70b-versatile")
            except Exception as e:
                print(f"Failed to initialize Groq LLM: {e}")
        return self.llm

    def generate_reply(self, customer_query: str, history: str = "") -> str:
        llm = self._get_llm()
        if not llm:
            return "System is currently unable to generate AI responses: GROQ_API_KEY not configured or invalid."

        # Get context from RAG
        context = rag_service.get_relevant_context(customer_query)

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a professional customer support agent for Flowdesk. Answer the customer query accurately using ONLY the provided company policies. If the answer is not in the context, politely inform them you are escalating this to a human specialist. Keep it concise.\n\nContext Policies:\n{context}\n\nPrevious Conversation History:\n{history}"),
            ("human", "{query}")
        ])

        chain = prompt | llm
        
        try:
            response = chain.invoke({"context": context, "history": history, "query": customer_query})
            return response.content
        except Exception as e:
            print(f"ERROR: generate_reply failed: {e}")
            return "We are experiencing technical difficulties generating a reply. A support agent will look into this shortly."

    def analyze_sentiment(self, text: str) -> str:
        llm = self._get_llm()
        if not llm:
            return "neutral"
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a highly accurate sentiment analysis tool. Your task is to identify the emotional tone of customer support messages.
Respond with EXACTLY ONE WORD: 'positive', 'neutral', or 'negative'.

Follow these rules:
1. If the user mentions 'angry', 'upset', 'terrible', 'frustrated', 'money back', 'refund now', or uses excessive exclamation marks, MUST be 'negative'.
2. If the user is just asking a question neutrally, it is 'neutral'.
3. If the user is thankful, it is 'positive'.

TEXT: {text}"""),
        ])
        
        chain = prompt | llm
        
        try:
            response = chain.invoke({"text": text})
            res = response.content.lower().strip().replace(".", "")
            # Safety check to ensure we only return one of the three
            for s in ["negative", "positive", "neutral"]:
                if s in res:
                    return s
            return "neutral"
        except Exception as e:
            print(f"ERROR: analyze_sentiment failed: {e}")
            return "neutral"

    def summarize_thread(self, history: str) -> str:
        llm = self._get_llm()
        if not llm:
            return "Summary unavailable: AI not configured."
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Summarize this support thread into two sentences. First: the core problem. Second: the current customer state/expectation."),
            ("human", "Support Thread History:\n{history}")
        ])
        
        chain = prompt | llm
        
        try:
            response = chain.invoke({"history": history})
            return response.content.strip()
        except Exception as e:
            print(f"ERROR: summarize_thread failed: {e}")
            return "Unable to generate summary at this time."

ai_service = AIService()
