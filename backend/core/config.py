import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Second Opinion - AI Clinical Reasoning Trainer"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./second_opinion.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkeychangeinproduction123456789")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Groq API config
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_URL: str = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

settings = Settings()
