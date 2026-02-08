from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    api_port: int = 8001
    api_host: str = "0.0.0.0"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ]
    
    class Config:
        env_file = "../../.env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
