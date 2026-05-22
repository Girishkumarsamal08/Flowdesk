import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Flowdesk"
    DATABASE_URL: str = "sqlite:///./flowdesk.db"
    GROQ_API_KEY: str | None = None
    ESCALATION_REPLY_THRESHOLD: int = 5
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
