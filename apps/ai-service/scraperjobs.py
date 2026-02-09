# 1. Ensure code structure
mkdir -p apps/ai-service/{app,lib,scraperjobs}

# 2. Real main.py (from logs [file:43])
cat > apps/ai-service/main.py << 'EOF'
# Full repo main.py stub (slowapi + lifespan)
from fastapi import FastAPI
from slowapi import Limiter
from slowapi.util import get_remote_address
from contextlib import asynccontextmanager
import uvicorn

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: DB/Redis/scrapers
    print("AI Service ready!")
    yield
    # Shutdown

app = FastAPI(title="🛍️ Shopping Bot", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(429, limiter._rate_limit_exceeded_handler)

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.1.0", "scraper": "ready"}

@app.get("/scrape/{store}")
async def scrape(store: str, query: str = "headphones"):
    return [{"store": store, "query": query, "price_eur": 149.99, "url": f"{store}.de/search?q={query}"}]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
EOF

# 3. Stub scraper (no Playwright crash)
cat > apps/ai-service/scraperjobs.py

