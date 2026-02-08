"""
FastAPI Application Entry Point
AI-powered shopping assistant with security, rate limiting, and monitoring.
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
import structlog
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

# Local imports
from config import settings
from middleware.security import setup_security, limiter
from lib.database import connect_db, disconnect_db
from routes.chat import router as chat_router
from routes.scraper import router as scraper_router

# ============================================
# STRUCTURED LOGGING SETUP
# ============================================
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if settings.log_format == "json"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# ============================================
# SENTRY ERROR TRACKING
# ============================================
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
        # Capture errors
        send_default_pii=False,  # Don't send personal info
        attach_stacktrace=True,
        # Performance
        profiles_sample_rate=0.1 if settings.is_production else 0,
    )
    logger.info("sentry_initialized", environment=settings.sentry_environment)

# ============================================
# APPLICATION LIFESPAN
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info(
        "startup_initiated",
        environment=settings.node_env,
        api_port=settings.api_port,
        rate_limit=f"{settings.rate_limit_per_minute}/min",
    )
    
    # Connect to database
    await connect_db()
    logger.info("database_connected", host=settings.postgres_host)
    
    # Additional startup tasks
    if settings.enable_scraping:
        logger.info("scraping_enabled", stores=["amazon", "thomann"])
    
    logger.info(
        "api_ready",
        version=app.version,
        docs_url=f"http://localhost:{settings.api_port}/docs",
    )
    
    yield
    
    # Shutdown
    logger.info("shutdown_initiated")
    await disconnect_db()
    logger.info("database_disconnected")

# ============================================
# FASTAPI APPLICATION
# ============================================
app = FastAPI(
    title="🛒 AI Shopping Assistant",
    description=(
        "AI-powered product comparison service with live scraping. "
        "Built with FastAPI, Groq LLM, and Playwright."
    ),
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    # Production settings
    debug=not settings.is_production,
    # Add contact info
    contact={
        "name": "AI Shopping Assistant",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
    },
)

# ============================================
# SECURITY MIDDLEWARE
# ============================================
setup_security(app)

# ============================================
# ROUTES
# ============================================
app.include_router(chat_router, tags=["Chat"])
app.include_router(scraper_router, tags=["Scraper"])

# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================
@app.get(
    "/",
    summary="API Information",
    description="Get API metadata and available endpoints",
)
@limiter.limit(f"{settings.rate_limit_per_minute * 2}/minute")  # Higher limit for info
async def root():
    """API root endpoint with metadata."""
    return {
        "message": "AI Shopping Assistant API",
        "version": "2.1.0",
        "environment": settings.node_env,
        "status": "operational",
        "features": {
            "ai_chat": True,
            "live_scraping": settings.enable_scraping,
            "price_alerts": settings.enable_price_alerts,
            "conversation_history": settings.enable_conversation_history,
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "chat": "/api/chat",
            "scraper": "/api/scraper",
        },
        "rate_limits": {
            "per_minute": settings.rate_limit_per_minute,
            "per_hour": settings.rate_limit_per_hour,
        },
    }


@app.get(
    "/health",
    summary="Health Check",
    description="Check service health and dependencies",
    tags=["Monitoring"],
)
@limiter.limit("100/minute")  # High limit for health checks
async def health():
    """Health check endpoint for monitoring."""
    
    # Check database connection
    try:
        from lib.database import prisma
        await prisma.store.count()  # Simple query to test connection
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:50]}"
        logger.error("database_health_check_failed", error=str(e))
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": "2.1.0",
        "environment": settings.node_env,
        "services": {
            "api": "operational",
            "database": db_status,
            "cache": "redis active",
            "ai": "groq llama-3.3-70b",
            "scraper": "playwright ready" if settings.enable_scraping else "disabled",
        },
        "configuration": {
            "rate_limiting": settings.rate_limit_enabled,
            "cors_origins": len(settings.allowed_origins),
            "scraping_enabled": settings.enable_scraping,
        },
        "port": settings.api_port,
    }


@app.get(
    "/metrics",
    summary="Prometheus Metrics",
    description="Metrics for monitoring (Prometheus format)",
    tags=["Monitoring"],
)
async def metrics():
    """Prometheus metrics endpoint."""
    # TODO: Implement Prometheus metrics
    # from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return {"message": "Metrics endpoint - implement Prometheus client"}


# ============================================
# ERROR HANDLERS
# ============================================
@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors with logging."""
    logger.error(
        "internal_server_error",
        path=str(request.url),
        method=request.method,
        error=str(exc),
    )
    return {"error": "Internal server error", "status": 500}


# ============================================
# STARTUP MESSAGE
# ============================================
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 Starting AI Shopping Assistant")
    print("="*60)
    print(f"Environment: {settings.node_env}")
    print(f"Port: {settings.api_port}")
    print(f"Docs: http://localhost:{settings.api_port}/docs")
    print(f"Health: http://localhost:{settings.api_port}/health")
    print(f"Rate Limit: {settings.rate_limit_per_minute}/min")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.api_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )
