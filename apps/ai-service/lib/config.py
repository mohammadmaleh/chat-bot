from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # AI Configuration
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    
    # API Configuration
    api_port: int = 8001
    api_host: str = "0.0.0.0"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ]
    
    # Environment
    environment: str = "development"
    
    class Config:
        # Look for .env in project root (4 levels up from this file)
        env_file = str(Path(__file__).parent.parent.parent.parent / ".env")
        case_sensitive = False
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
