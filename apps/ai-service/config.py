"""
Configuration Module
Centralized configuration management with Pydantic validation.
Loads and validates all environment variables.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with type validation."""
    
    # ============================================
    # DATABASE CONFIGURATION
    # ============================================
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/chatbot_dev?schema=public",
        description="PostgreSQL connection string"
    )
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)
    postgres_user: str = Field(default="postgres")
    postgres_password: str = Field(default="postgres")
    postgres_db: str = Field(default="chatbot_dev")
    
    # ============================================
    # AI SERVICE CONFIGURATION
    # ============================================
    groq_api_key: str = Field(
        default="",
        description="Groq API key for LLM inference"
    )
    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq model identifier"
    )
    groq_temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    groq_max_tokens: int = Field(default=2048, ge=1, le=8192)
    
    # ============================================
    # REDIS CONFIGURATION
    # ============================================
    redis_url: str = Field(default="redis://localhost:6379/0")
    redis_host: str = Field(default="localhost")
    redis_port: int = Field(default=6379)
    redis_password: Optional[str] = Field(default=None)
    redis_db: int = Field(default=0, ge=0, le=15)
    
    # Cache TTL in seconds
    cache_ttl_products: int = Field(default=3600)  # 1 hour
    cache_ttl_prices: int = Field(default=1800)    # 30 minutes
    cache_ttl_search: int = Field(default=600)     # 10 minutes
    
    # ============================================
    # SECURITY CONFIGURATION
    # ============================================
    jwt_secret_key: str = Field(
        default="dev_secret_key_change_in_production_min_32_chars",
        min_length=32,
        description="JWT secret key for token signing"
    )
    jwt_algorithm: str = Field(default="HS256")
    jwt_access_token_expire_minutes: int = Field(default=30)
    jwt_refresh_token_expire_days: int = Field(default=7)
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=20, ge=1)
    rate_limit_per_hour: int = Field(default=500, ge=1)
    rate_limit_enabled: bool = Field(default=True)
    
    # CORS Configuration
    allowed_origins: List[str] = Field(
        default=["http://localhost:4000", "http://localhost:3000"]
    )
    allowed_origins_regex: Optional[str] = Field(default=None)
    
    # ============================================
    # SCRAPING CONFIGURATION
    # ============================================
    use_rotating_user_agents: bool = Field(default=True)
    scraper_timeout_ms: int = Field(default=30000, ge=5000)
    scraper_max_retries: int = Field(default=3, ge=1, le=10)
    
    # Proxy settings
    use_proxy: bool = Field(default=False)
    proxy_url: Optional[str] = Field(default=None)
    proxy_username: Optional[str] = Field(default=None)
    proxy_password: Optional[str] = Field(default=None)
    
    # Store domains
    amazon_domain: str = Field(default="amazon.de")
    thomann_domain: str = Field(default="thomann.de")
    mediamarkt_domain: str = Field(default="mediamarkt.de")
    
    # ============================================
    # MONITORING & LOGGING
    # ============================================
    sentry_dsn: Optional[str] = Field(default=None)
    sentry_environment: str = Field(default="development")
    sentry_traces_sample_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    
    log_level: str = Field(default="INFO")
    log_format: str = Field(default="json")  # or 'text'
    
    # ============================================
    # EMAIL CONFIGURATION
    # ============================================
    smtp_host: Optional[str] = Field(default=None)
    smtp_port: int = Field(default=587)
    smtp_user: Optional[str] = Field(default=None)
    smtp_password: Optional[str] = Field(default=None)
    smtp_from: Optional[str] = Field(default=None)
    
    sendgrid_api_key: Optional[str] = Field(default=None)
    
    # ============================================
    # BACKGROUND JOBS
    # ============================================
    job_queue_scraper_interval_hours: int = Field(default=6)
    job_queue_price_update_interval_hours: int = Field(default=2)
    job_queue_cleanup_old_prices_days: int = Field(default=30)
    
    # ============================================
    # FEATURE FLAGS
    # ============================================
    enable_scraping: bool = Field(default=True)
    enable_price_alerts: bool = Field(default=False)
    enable_conversation_history: bool = Field(default=True)
    enable_affiliate_links: bool = Field(default=False)
    
    # ============================================
    # APPLICATION
    # ============================================
    node_env: str = Field(default="development")
    api_port: int = Field(default=8001, ge=1000, le=65535)
    web_port: int = Field(default=4000, ge=1000, le=65535)
    
    # API URLs
    next_public_api_url: str = Field(default="http://localhost:8001")
    next_public_frontend_url: str = Field(default="http://localhost:4000")
    
    @validator('allowed_origins', pre=True)
    def parse_allowed_origins(cls, v):
        """Parse comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('groq_api_key')
    def validate_groq_key(cls, v):
        """Warn if using default API key in non-dev environment."""
        if not v or v == "":
            print("⚠️  WARNING: GROQ_API_KEY not set. AI features will not work.")
        return v
    
    @validator('jwt_secret_key')
    def validate_jwt_secret(cls, v, values):
        """Ensure JWT secret is changed in production."""
        if values.get('node_env') == 'production' and 'dev_secret_key' in v:
            raise ValueError(
                "🚨 CRITICAL: Change JWT_SECRET_KEY in production! "
                "Generate with: openssl rand -hex 32"
            )
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.node_env.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.node_env.lower() == "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
        # Allow environment variables to override .env file
        env_prefix = ""


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()


# Export singleton instance
settings = get_settings()


# Validation on import
if settings.is_production:
    # Production checks
    assert settings.database_url != "postgresql://postgres:postgres@localhost:5432/chatbot_dev", \
        "🚨 Change DATABASE_URL in production!"
    
    assert "localhost" not in settings.database_url, \
        "🚨 DATABASE_URL should not use localhost in production!"
    
    assert settings.postgres_password != "postgres", \
        "🚨 Change POSTGRES_PASSWORD in production!"
    
    if not settings.sentry_dsn:
        print("⚠️  WARNING: SENTRY_DSN not set in production. Error tracking disabled.")


if __name__ == "__main__":
    # Print configuration for debugging
    print("\n" + "="*50)
    print("🔧 CONFIGURATION LOADED")
    print("="*50)
    print(f"Environment: {settings.node_env}")
    print(f"API Port: {settings.api_port}")
    print(f"Database: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")
    print(f"Redis: {settings.redis_host}:{settings.redis_port}")
    print(f"Groq Model: {settings.groq_model}")
    print(f"Rate Limiting: {settings.rate_limit_enabled}")
    print(f"Scraping Enabled: {settings.enable_scraping}")
    print(f"Allowed Origins: {settings.allowed_origins}")
    print("="*50 + "\n")
