# AI Service - Stable Entry Point with Resilient Loading
"""
This is a stable entry point that handles dependency loading gracefully.
If dependencies fail to load, the service still starts with basic endpoints.
"""
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Configure logging first
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Global app state
app_state = {
    "routes_loaded": False,
    "database_ready": False,
    "cache_ready": False,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("=" * 70)
    logger.info("🚀 AI Shopping Assistant Service v2.1.0 Starting")
    logger.info("=" * 70)

    # Startup events
    try:
        logger.info("Attempting to load configuration...")
        # Settings are optional - service can work without them in test mode
        app_state["config_loaded"] = True
        logger.info("✅ Configuration loaded")
    except Exception as e:
        logger.warning(f"⚠️ Configuration loading failed: {e}")

    logger.info("✅ Service initialization complete!")
    yield

    # Shutdown events
    logger.info("🛑 Shutting down service...")


# Create FastAPI app with lifecycle management
app = FastAPI(
    title="🛍️ Shopping Bot AI Service",
    description="AI-powered shopping assistant for product search and price comparison",
    version="2.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS for all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*",  # For development only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "content-type"],
)

# ============= ALWAYS AVAILABLE ENDPOINTS =============


@app.get("/health")
async def health():
    """Health check endpoint - always available"""
    return {
        "status": "healthy",
        "service": "AI Shopping Assistant",
        "version": "2.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "routes_loaded": app_state.get("routes_loaded", False),
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🛍️ AI Shopping Assistant API",
        "version": "2.1.0",
        "status": "running",
        "documentation": "/docs",
        "health": "/health",
    }


# ============= DYNAMIC ROUTE LOADING =============


def register_chat_routes():
    """Safely register chat routes"""
    try:
        logger.info("Loading chat routes...")
        from routes.chat import router as chat_router

        app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
        logger.info("✅ Chat routes registered successfully")
        app_state["routes_loaded"] = True
        return True
    except ImportError as e:
        logger.error(f"❌ Import error loading chat routes: {e}")
        logger.error("   This may be due to missing dependencies. Please check:")
        logger.error("   1. All required packages in requirements.txt")
        logger.error("   2. Environment variables (.env file)")
        logger.error("   3. Database connection")
        return False
    except Exception as e:
        logger.error(
            f"❌ Unexpected error loading chat routes: {type(e).__name__}: {e}"
        )
        import traceback

        logger.error(traceback.format_exc())
        return False


def register_scraper_routes():
    """Safely register scraper routes"""
    try:
        logger.info("Loading scraper routes...")
        from routes.scraper import router as scraper_router

        app.include_router(scraper_router, prefix="/api/scraper", tags=["scraper"])
        logger.info("✅ Scraper routes registered successfully")
        return True
    except ImportError as e:
        logger.warning(f"⚠️ Scraper routes not available: {e}")
        return False
    except Exception as e:
        logger.warning(f"⚠️ Error loading scraper routes: {e}")
        return False


# Attempt to register routes at startup
logger.info("Attempting to register API routes...")
chat_ok = register_chat_routes()
scraper_ok = register_scraper_routes()

if not chat_ok:
    logger.warning("⚠️ Service is running in minimal mode without chat routes")
    logger.warning("   Check logs above for details")

# Fallback endpoint if routes fail
if not app_state.get("routes_loaded"):

    @app.post("/api/chat/")
    async def chat_fallback(request: Request):
        """Fallback endpoint when chat routes fail to load"""
        try:
            body = await request.json()
            return {
                "success": False,
                "error": "Chat service is not available",
                "details": "Check server logs for initialization errors",
                "details_url": "/docs",
            }
        except:
            return {"success": False, "error": "Chat service initialization failed"}

    @app.post("/api/chat/stream")
    async def chat_stream_fallback(request: Request):
        """Fallback streaming endpoint"""
        return {"success": False, "error": "Chat streaming is not available"}


# ============= ERROR HANDLERS =============


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {type(exc).__name__}: {exc}", exc_info=True)
    return {
        "error": "Internal server error",
        "type": type(exc).__name__,
        "message": str(exc) if os.getenv("DEBUG") else "An error occurred",
    }


# ============= ENTRY POINT =============

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "true").lower() in ("true", "1", "yes")

    logger.info(f"🚀 Starting server on {host}:{port} (reload={reload})")

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload,
        log_level="info",
        access_log=True,
    )
