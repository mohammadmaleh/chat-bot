from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lib.config import settings
from routes.chat import router as chat_router

app = FastAPI(
    title="🤖 AI Shopping Assistant API",
    description="Groq-powered price comparison chatbot for German stores",
    version="1.0.0"
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
        "model": settings.groq_model
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "backend": "FastAPI + Groq",
        "port": settings.api_port
    }
