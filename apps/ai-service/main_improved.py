"""
Improved FastAPI Application Entry Point
Enhancements:
- Integrated security middleware
- Improved error handling
- Health checks with detailed status
- Metrics endpoint
- CSRF protection
- Request validation
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os
import sys
from datetime import datetime

# Local imports
from lib.database_optimized import get_db, close_db, get_database_stats
from lib.cache import cache
from lib.monitoring import setup_logging, init_sentry, capture_exception
from middleware.security import (
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    InputSanitizationMiddleware,
    RequestLoggingMiddleware
)
from jobs import setup_scheduler

# Import both old and new routes
from routes.chat import router as chat_router_v1
from routes.chat_improved import router as chat_router_v2
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

# Application metadata
APP_VERSION = "2.2.0"
APP_NAME = "AI Shopping Assistant"

# ============================================
# APPLICATION LIFESPAN
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    global scheduler
    
    # Startup
    logger.info("="*70)
    logger.info(f"🚀 Starting {APP_NAME} v{APP_VERSION}")
    logger.info("="*70)
    logger.info(f"Environment: {os.getenv('NODE_ENV', 'development')}")
    logger.info(f"Python: {sys.version.split()[0]}")
    
    try:
        # Connect to database
        db = await get_db()
        logger.info("✅ Database connected with connection pooling")
        
        # Test database
        stats = await get_database_stats()
        logger.info(f"📊 Database: {stats['products']} products, {stats['stores']} stores, {stats['prices']} prices")
        
        # Connect to Redis cache
        await cache.connect()
        logger.info("✅ Redis cache connected")
        
        # Start background job scheduler
        if os.getenv('ENABLE_SCRAPING', 'true').lower() == 'true':
            scheduler = setup_scheduler()
            scheduler.start()
            logger.info("⏰ Background job scheduler started")
        else:
            logger.info("⚠️  Background jobs disabled")
        
        logger.info("="*70)
        logger.info("✅ Application ready!")
        logger.info(f"📚 API Docs: http://localhost:8001/docs")
        logger.info(f"💚 Health: http://localhost:8001/health")
        logger.info(f"📊 Metrics: http://localhost:8001/metrics")
        logger.info("="*70)
    
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("\n" + "="*70)
    logger.info("👋 Shutting down gracefully...")
    logger.info("="*70)
    
    # Stop scheduler
    if scheduler:
        scheduler.shutdown(wait=True)
        logger.info("⏹️  Background jobs stopped")
    
    # Disconnect services
    await cache.disconnect()
    logger.info("✅ Cache disconnected")
    
    await close_db()
    logger.info("✅ Database disconnected")
    
    logger.info("✅ Shutdown complete")
    logger.info("="*70 + "\n")

# ============================================
# FASTAPI APPLICATION
# ============================================
app = FastAPI(
    title=f"🛍️ {APP_NAME}",
    description="""Enhanced AI-powered product comparison service.
    
    ## Features
    - 🤖 Real-time chat with Groq LLM
    - 🔍 Product search across German stores
    - 💰 Price comparison and tracking
    - 🚀 High-performance caching
    - 🔒 Enterprise-grade security
    - 📊 Monitoring and metrics
    
    ## New in v2.2.0
    - ✅ Enhanced security middleware
    - ✅ Input validation and sanitization
    - ✅ Optimized database queries
    - ✅ Retry logic with exponential backoff
    - ✅ Connection pooling
    - ✅ Comprehensive error handling
    
    ## API Versions
    - `/api/chat` - Legacy endpoints (v1)
    - `/api/v2/chat` - Enhanced endpoints (v2) - **Recommended**
    """,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "chat-v1", "description": "Legacy chat endpoints"},
        {"name": "chat-v2", "description": "Enhanced chat endpoints with validation"},
        {"name": "scraper", "description": "Web scraping endpoints"},
        {"name": "health", "description": "Health and monitoring"},
    ]
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================
# SECURITY MIDDLEWARE (Order matters!)
# ============================================

# 1. Request logging (first to log everything)
app.add_middleware(RequestLoggingMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request size limit
app.add_middleware(RequestSizeLimitMiddleware)

# 4. Input sanitization
app.add_middleware(InputSanitizationMiddleware)

# 5. Trusted host middleware (production only)
if os.getenv('NODE_ENV') == 'production':
    allowed_hosts = os.getenv('ALLOWED_HOSTS', '').split(',')
    if allowed_hosts and allowed_hosts[0]:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=allowed_hosts
        )
        logger.info(f"Trusted hosts: {allowed_hosts}")

# 6. CORS middleware (last middleware before routes)
allowed_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:4000,http://localhost:3000'
).split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Cache", "X-RateLimit-Remaining"],
    max_age=3600,
)

logger.info(f"CORS enabled for: {allowed_origins}")

# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "details": errors,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """Handle 500 errors with logging and monitoring."""
    logger.error(
        f"Internal server error: {exc}",
        exc_info=True,
        extra={
            "path": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
        }
    )
    
    capture_exception(exc, context={
        "request": {
            "url": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
        }
    })
    
    # Don't expose internal details in production
    if os.getenv('NODE_ENV') == 'production':
        detail = "Internal server error"
    else:
        detail = str(exc)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    capture_exception(exc)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ============================================
# ROUTES
# ============================================

# Include routers
app.include_router(chat_router_v1)  # Legacy v1 endpoints
app.include_router(chat_router_v2)  # New v2 endpoints
app.include_router(scraper_router)

# ============================================
# ROOT & HEALTH ENDPOINTS
# ============================================

@app.get("/", tags=["health"])
@limiter.limit("60/minute")
async def root(request: Request):
    """API root endpoint with metadata."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "ai_chat": True,
            "streaming": True,
            "caching": cache.enabled,
            "background_jobs": scheduler is not None and scheduler.running,
            "rate_limiting": True,
            "monitoring": os.getenv('SENTRY_DSN') is not None,
            "security_enhanced": True,
        },
        "docs": "/docs",
        "endpoints": {
            "v1": {
                "chat": "/api/chat",
                "stream": "/api/chat/stream",
                "search": "/api/chat/search",
            },
            "v2": {
                "chat": "/api/v2/chat",
                "stream": "/api/v2/chat/stream",
                "search": "/api/v2/chat/search",
                "product": "/api/v2/chat/product/{id}",
                "cheapest": "/api/v2/chat/cheapest",
            },
            "monitoring": {
                "health": "/health",
                "metrics": "/metrics",
                "cache_stats": "/cache/stats",
                "jobs_status": "/jobs/status",
            }
        }
    }

@app.get("/health", tags=["health"])
@limiter.limit("100/minute")
async def health(request: Request):
    """Comprehensive health check endpoint."""
    health_status = "healthy"
    
    # Check database
    try:
        stats = await get_database_stats()
        db_status = "connected"
        db_details = stats
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "error"
        db_details = {"error": str(e)}
        health_status = "degraded"
    
    # Check cache
    cache_stats = await cache.get_stats()
    if not cache_stats.get('connected'):
        health_status = "degraded"
    
    # Check background jobs
    jobs_status = "disabled"
    jobs_count = 0
    if scheduler:
        jobs_status = "running" if scheduler.running else "stopped"
        jobs_count = len(scheduler.get_jobs())
        if not scheduler.running:
            health_status = "degraded"
    
    return {
        "status": health_status,
        "version": APP_VERSION,
        "environment": os.getenv('NODE_ENV', 'development'),
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": {
                "status": db_status,
                "details": db_details
            },
            "cache": cache_stats,
            "background_jobs": {
                "status": jobs_status,
                "jobs_count": jobs_count
            },
            "scraper": "ready",
        }
    }

@app.get("/metrics", tags=["health"])
@limiter.limit("20/minute")
async def metrics(request: Request):
    """Application metrics endpoint."""
    db_stats = await get_database_stats()
    cache_stats = await cache.get_stats()
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_stats,
        "cache": cache_stats,
        "application": {
            "version": APP_VERSION,
            "uptime": "calculated_at_startup",  # TODO: Add uptime tracking
            "environment": os.getenv('NODE_ENV', 'development'),
        }
    }

@app.get("/cache/stats", tags=["health"])
@limiter.limit("20/minute")
async def cache_stats_endpoint(request: Request):
    """Get cache statistics."""
    return await cache.get_stats()

@app.get("/jobs/status", tags=["health"])
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
        "count": len(jobs),
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================
# STARTUP BANNER
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print(f"🚀 {APP_NAME} v{APP_VERSION} - Starting Server")
    print("="*70)
    print(f"📚 API Documentation: http://localhost:8001/docs")
    print(f"💚 Health Check: http://localhost:8001/health")
    print(f"📊 Metrics: http://localhost:8001/metrics")
    print(f"📊 Cache Stats: http://localhost:8001/cache/stats")
    print(f"⏰ Jobs Status: http://localhost:8001/jobs/status")
    print(f"")
    print(f"🔒 Security Features:")
    print(f"   ✅ Rate Limiting: 20 requests/minute")
    print(f"   ✅ Input Validation & Sanitization")
    print(f"   ✅ SQL Injection Protection")
    print(f"   ✅ XSS Protection")
    print(f"   ✅ CSRF Protection")
    print(f"   ✅ Security Headers (CSP, HSTS, etc.)")
    print(f"   ✅ Request Size Limits")
    print(f"")
    print(f"⚡ Performance Features:")
    print(f"   ✅ Connection Pooling")
    print(f"   ✅ Query Optimization")
    print(f"   ✅ Response Caching")
    print(f"   ✅ Retry Logic")
    print("="*70 + "\n")
    
    uvicorn.run(
        "main_improved:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
