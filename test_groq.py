import sys
import os

# Add project root to path
sys.path.append('/Users/girishkumarsamal/Downloads/Flowdesk')

from services.ai_service import ai_service
from core.config import settings

print(f"Testing Groq with key: {settings.GROQ_API_KEY[:10]}...")

try:
    res = ai_service.analyze_sentiment("I am very happy today!")
    print(f"Sentiment Analysis Result: {res}")
    
    reply = ai_service.generate_reply("Hi, what is your name?")
    print(f"AI Reply: {reply}")
    
except Exception as e:
    print(f"TEST FAILED: {e}")
