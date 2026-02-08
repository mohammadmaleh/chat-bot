"""FastAPI Application Entry Point - Enhanced with caching and monitoring."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os

# Local imports
from lib.database import connect_db, disconnect_db
from lib.cache import cache
from lib.monitoring import setup_logging, init_sentry, capture_exception
from routes.chat import router as chat_router
from routes.scraper import router as scraper_router

# ============================================
# LOGGING & MONITORING SETUP
# ============================================
setup_logging()
init_sentry()

logger = logging.getLogger(__name__)

# ============================================
# RATE LIMITING SETUP
# ============================================
limiter = Limiter(key_func=get_remote_address)

# ============================================
# APPLICATION LIFESPAN
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting AI Service...")
    
    # Connect to database
    await connect_db()
    logger.info("✅ Database connected")
    
    # Connect to Redis cache
    await cache.connect()
    
    logger.info("✅ AI Service ready!")
    logger.info(f"📚 Docs: http://localhost:8001/docs")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down AI Service...")
    await cache.disconnect()
    await disconnect_db()

# ============================================
# FASTAPI APPLICATION
# ============================================
app = FastAPI(
    title="🛍️ AI Shopping Assistant",
    description="AI-powered product comparison service with live scraping, caching, and monitoring",
    version="2.1.0",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================
# CORS MIDDLEWARE
# ============================================
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:4000,http://localhost:3000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ROUTES
# ============================================
app.include_router(chat_router)
app.include_router(scraper_router)

# ============================================
# ROOT & HEALTH ENDPOINTS
# ============================================
@app.get("/")
@limiter.limit("60/minute")
async def root(request: Request):
    """API root endpoint with metadata."""
    return {
        "message": "AI Shopping Assistant API",
        "version": "2.1.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "chat": "/api/chat",
            "chat_stream": "/api/chat/stream",
            "scraper": "/api/scraper",
            "health": "/health",
            "cache_stats": "/cache/stats",
        }
    }

@app.get("/health")
@limiter.limit("100/minute")
async def health(request: Request):
    """Health check endpoint for monitoring."""
    try:
        from lib.database import prisma
        await prisma.store.count()
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "error"
    
    cache_stats = await cache.get_stats()
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": "2.1.0",
        "backend": "FastAPI + Groq + Prisma",
        "services": {
            "database": db_status,
            "cache": cache_stats,
            "scraper": "Playwright ready",
        },
        "port": 8001
    }

@app.get("/cache/stats")
@limiter.limit("20/minute")
async def cache_stats(request: Request):
    """Get cache statistics."""
    stats = await cache.get_stats()
    return stats

# ============================================
# ERROR HANDLERS
# ============================================
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """Handle 500 errors with logging and Sentry."""
    logger.error(
        f"Internal server error: {exc}",
        extra={
            "path": str(request.url),
            "method": request.method,
        }
    )
    capture_exception(exc, context={
        "request": {
            "url": str(request.url),
            "method": request.method,
        }
    })
    return {"error": "Internal server error", "status": 500}

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 Starting AI Shopping Assistant")
    print("="*60)
    print(f"📚 Docs: http://localhost:8001/docs")
    print(f"💚 Health: http://localhost:8001/health")
    print(f"📊 Cache Stats: http://localhost:8001/cache/stats")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
