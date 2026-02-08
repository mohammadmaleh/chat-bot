from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from lib.database import connect_db, disconnect_db
from routes.chat import router as chat_router

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
    description="AI-powered product comparison service",
    version="1.0.0",
    lifespan=lifespan
)

# FIXED: Allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to ["http://localhost:4000", "https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/")
async def root():
    return {
        "message": "AI Shopping Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "backend": "FastAPI + Groq + Prisma",
        "database": "connected",
        "port": 8001
    }
