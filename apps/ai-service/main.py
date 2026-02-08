"""FastAPI Application Entry Point - Enhanced with caching, monitoring, and background jobs."""
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
from jobs import setup_scheduler
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

# Global scheduler reference
scheduler = None

# ============================================
# APPLICATION LIFESPAN
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    global scheduler
    
    # Startup
    logger.info("🚀 Starting AI Service...")
    logger.info(f"Environment: {os.getenv('NODE_ENV', 'development')}")
    
    # Connect to database
    await connect_db()
    logger.info("✅ Database connected")
    
    # Connect to Redis cache
    await cache.connect()
    
    # Start background job scheduler
    if os.getenv('ENABLE_SCRAPING', 'true').lower() == 'true':
        scheduler = setup_scheduler()
        scheduler.start()
        logger.info("⏰ Background job scheduler started")
    else:
        logger.info("⚠️ Background jobs disabled")
    
    logger.info("✅ AI Service ready!")
    logger.info(f"📚 API Docs: http://localhost:8001/docs")
    logger.info(f"💚 Health Check: http://localhost:8001/health")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down AI Service...")
    
    # Stop scheduler
    if scheduler:
        scheduler.shutdown(wait=True)
        logger.info("⏹️ Background jobs stopped")
    
    # Disconnect services
    await cache.disconnect()
    await disconnect_db()
    logger.info("✅ Shutdown complete")

# ============================================
# FASTAPI APPLICATION
# ============================================
app = FastAPI(
    title="🛍️ AI Shopping Assistant",
    description="""AI-powered product comparison service with:
    - Real-time chat interface with Groq LLM
    - Live web scraping (Amazon, Thomann)
    - Redis caching for performance
    - Background job scheduling
    - Rate limiting and security
    - Comprehensive monitoring
    """,
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================
# CORS MIDDLEWARE
# ============================================
allowed_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:4000,http://localhost:3000,http://localhost:8000'
).split(',')

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
        "features": {
            "ai_chat": True,
            "streaming": True,
            "caching": cache.enabled,
            "background_jobs": scheduler is not None and scheduler.running,
            "rate_limiting": True,
            "monitoring": os.getenv('SENTRY_DSN') is not None,
        },
        "docs": "/docs",
        "endpoints": {
            "chat": "/api/chat",
            "chat_stream": "/api/chat/stream",
            "search": "/api/chat/search",
            "scraper": "/api/scraper",
            "health": "/health",
            "cache_stats": "/cache/stats",
            "jobs_status": "/jobs/status",
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
    
    jobs_status = "disabled"
    if scheduler:
        jobs_status = "running" if scheduler.running else "stopped"
        
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": "2.1.0",
        "environment": os.getenv('NODE_ENV', 'development'),
        "services": {
            "database": db_status,
            "cache": cache_stats,
            "background_jobs": jobs_status,
            "scraper": "ready",
        },
        "timestamp": __import__('datetime').datetime.utcnow().isoformat() + "Z"
    }

@app.get("/cache/stats")
@limiter.limit("20/minute")
async def cache_stats_endpoint(request: Request):
    """Get cache statistics."""
    stats = await cache.get_stats()
    return stats

@app.get("/jobs/status")
@limiter.limit("20/minute")
async def jobs_status(request: Request):
    """Get background jobs status."""
    if not scheduler:
        return {
            "enabled": False,
            "message": "Background jobs are disabled"
        }
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    
    return {
        "enabled": True,
        "running": scheduler.running,
        "jobs": jobs,
        "count": len(jobs)
    }

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

# ============================================
# STARTUP BANNER
# ============================================
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("🚀 AI Shopping Assistant - Starting Server")
    print("="*70)
    print(f"📚 API Documentation: http://localhost:8001/docs")
    print(f"💚 Health Check: http://localhost:8001/health")
    print(f"📊 Cache Stats: http://localhost:8001/cache/stats")
    print(f"⏰ Jobs Status: http://localhost:8001/jobs/status")
    print(f"")
    print(f"🔒 Features Enabled:")
    print(f"   - Rate Limiting: 20 requests/minute")
    print(f"   - Redis Caching: {os.getenv('ENABLE_REDIS_CACHE', 'true')}")
    print(f"   - Background Jobs: {os.getenv('ENABLE_SCRAPING', 'true')}")
    print(f"   - Monitoring: {'Yes' if os.getenv('SENTRY_DSN') else 'No'}")
    print("="*70 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
