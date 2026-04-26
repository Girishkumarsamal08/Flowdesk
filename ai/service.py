import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from core.config import settings
from ai.rag_service import rag_service

class AIService:
    def __init__(self):

        self.llm = None

    def _get_llm(self):
        if self.llm:
            return self.llm
        
        if settings.GROQ_API_KEY and "your_groq_api_key_here" not in settings.GROQ_API_KEY:
            try:

                self.llm = ChatGroq(temperature=0, groq_api_key=settings.GROQ_API_KEY, model_name="llama-3.3-70b-versatile")
            except Exception as e:
                print(f"Failed to initialize Groq LLM: {e}")
        return self.llm

    def generate_reply(self, organization_id: int, customer_query: str, history: str = "", tone: str = "professional") -> dict:
        llm = self._get_llm()
        if not llm:
            return {
                "content": "System is currently unable to generate AI responses: GROQ_API_KEY not configured or invalid.",
                "reasoning": "GROQ_API_KEY missing"
            }

        context = rag_service.get_relevant_context(organization_id, customer_query)

        prompt = ChatPromptTemplate.from_messages([
            ("system", f"You are a professional customer support agent. Answer the customer query accurately using ONLY the provided company policies. Use a {tone} tone. If the answer is not in the context, politely inform them you are escalating this to a human specialist. Keep it concise.\n\nContext Policies:\n{{context}}\n\nPrevious Conversation History:\n{{history}}"),
            ("human", "{query}")
        ])

        chain = prompt | llm
        
        try:
            response = chain.invoke({"context": context, "history": history, "query": customer_query})
            return {
                "content": response.content,
                "reasoning": f"Retrieved Context: {context[:200]}..." if context else "No relevant context found in policies."
            }
        except Exception as e:
            print(f"ERROR: generate_reply failed: {e}")
            return {
                "content": "We are experiencing technical difficulties generating a reply. A support agent will look into this shortly.",
                "reasoning": f"Error: {str(e)}"
            }

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
            ("system", "Summarize the following customer support conversation thread in exactly one short, professional sentence. Focus on the main problem and current status."),
            ("human", "{history}")
        ])
        
        chain = prompt | llm
        
        try:
            response = chain.invoke({"history": history})
            return response.content.strip()
        except Exception as e:
            print(f"ERROR: summarize_thread failed: {e}")
            return "Failed to generate summary."

    def polish_response(self, draft: str, customer_name: str, company_name: str) -> str:

        fallback = f"""Dear {customer_name},

We sincerely apologize for the inconvenience you’ve experienced.

Thank you for bringing this to our attention. {draft if draft else "We are currently investigating the matter you raised."} We understand how frustrating this situation must be, and we truly appreciate your patience while we look into it. Our team is currently reviewing your request and working towards a quick resolution.

In the meantime, please rest assured that your issue is being treated with priority. We will keep you updated and ensure that it is resolved at the earliest.

If you have any additional details or questions, feel free to reply to this email — we’re here to help.

Thank you for your understanding.

Best regards,
Support Team
{company_name}"""

        llm = self._get_llm()
        if not llm:
            return fallback
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are a professional customer support polisher. 
Take the executive's rough notes and transform them into a sincere, professional email.
Use this EXACT format:

{fallback}"""),
            ("human", f"Executive Notes: {draft}")
        ])
        
        chain = prompt | llm
        
        try:
            response = chain.invoke({"customer_name": customer_name, "company_name": company_name})
            content = response.content.replace("[Customer Name]", customer_name).replace("[Company Name]", company_name)
            return content
        except Exception as e:
            print(f"ERROR: polish_response failed: {e}")
            return fallback

ai_service = AIService()
