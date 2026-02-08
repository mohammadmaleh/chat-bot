from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from lib.config import settings
from lib.database import connect_db, disconnect_db
from routes.chat import router as chat_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting AI Service...")
    await connect_db()
    logger.info("✅ AI Service ready!")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down AI Service...")
    await disconnect_db()
    logger.info("✅ AI Service stopped")

app = FastAPI(
    title="🤖 AI Shopping Assistant API",
    description="Groq-powered price comparison chatbot for German stores",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/")
def root():
    return {
        "message": "🚀 AI Shopping Assistant Ready!",
        "status": "alive",
        "ai_provider": "Groq",
        "model": settings.groq_model,
        "environment": settings.environment
    }

@app.get("/health")
async def health():
    from lib.database import prisma
    
    db_status = "connected" if prisma.is_connected() else "disconnected"
    
    return {
        "status": "healthy",
        "backend": "FastAPI + Groq + Prisma",
        "database": db_status,
        "port": settings.api_port
    }
