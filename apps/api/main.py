from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="🤖 ChatBot API",
    description="Scalable AI Chatbot Backend (FastAPI 2026)",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "🚀 ChatBot API Ready!", "status": "alive"}

@app.get("/health")
def health():
    return {"status": "healthy", "backend": "FastAPI", "port": 8001}

@app.post("/chat")
def chat(message: dict):
    return {
        "success": True,
        "role": "assistant",
        "content": f"Echo: {message.get('content', 'Hello World!')}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001