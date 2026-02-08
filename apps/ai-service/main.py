from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from lib.database import connect_db, disconnect_db
from routes.chat import router as chat_router
from routes.scraper import router as scraper_router  # ADD THIS LINE

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AI Service...")
    await connect_db()
    print("✅ AI Service ready!")
    yield
    print("👋 Shutting down AI Service...")
    await disconnect_db()

app = FastAPI(
    title="AI Shopping Assistant",
    description="AI-powered product comparison service with live scraping",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(scraper_router)  # ADD THIS LINE

@app.get("/")
async def root():
    return {
        "message": "AI Shopping Assistant API",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "chat": "/api/chat",
            "scraper": "/api/scraper"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "backend": "FastAPI + Groq + Prisma",
        "database": "connected",
        "scraper": "Amazon.de ready",
        "cache": "Redis active",
        "port": 8001
    }
