# 🎯 Quick Reference Guide - Chat-Bot Running & Testing

## ✅ Current Status

All core services are **actively running and healthy**:

```
✅ AI Service         → http://localhost:8001       (FastAPI)
✅ API Server         → http://localhost:4000       (Express/Node)
✅ PostgreSQL         → localhost:5432              (Database)
✅ Redis             → localhost:6379              (Cache)
⭕ Web Frontend      → http://localhost:3000       (Not started yet)
```

---

## 🚀 What You Can Do RIGHT NOW

### 1. Test Chat via Command Line

```bash
# Simple hello
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello","conversation_history":[]}'

# Ask about products
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"show me gaming laptops under 1500 euros","conversation_history":[]}'

# Check if chat service is up
curl http://localhost:8001/api/chat/test
```

### 2. Real-Time Testing (Watch It Work)

```bash
# Open three terminal windows:

# Terminal 1 - Watch AI service logs
docker-compose logs -f ai-service

# Terminal 2 - Your testing
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"test message","conversation_history":[]}'

# Terminal 3 - Monitor resource usage
docker stats
```

### 3. API Documentation

Visit: http://localhost:8001/docs
(Swagger UI - auto-generated API docs)

---

## 🎨 Run the Web Frontend

When you're ready to access the full UI:

```bash
# Option 1: Start web frontend only (fastest)
cd apps/web
pnpm dev

# Option 2: Start everything with hot reload
pnpm dev

# Then visit: http://localhost:3000
```

---

## 📊 Service Details

### AI Service (`apps/ai-service`)

- **Tech**: FastAPI (Python) + Groq AI
- **Port**: 8001
- **Key Endpoints**:
  - `GET  /health` - Health check
  - `POST /api/chat/` - Send chat message
  - `POST /api/chat/stream` - Stream chat response
  - `GET  /api/chat/test` - Service status
  - `GET  /docs` - Swagger docs

### API Server (`apps/api`)

- **Tech**: Express (Node.js)
- **Port**: 4000
- **Purpose**: Backend API for web frontend

### Web Frontend (`apps/web`)

- **Tech**: Next.js (React)
- **Port**: 3000
- **Purpose**: User interface

### Database & Cache

- **PostgreSQL**: Port 5432 (Users, products, conversations)
- **Redis**: Port 6379 (Caching, rate limiting)

---

## 🔧 Common Tasks

### Monitor Services

```bash
# All containers
docker-compose ps

# Specific service logs
docker-compose logs ai-service -f

# Database logs
docker-compose logs db -f

# Resource usage
docker stats
```

### Restart Services

```bash
# Restart AI service
docker-compose restart ai-service

# Restart all
docker-compose restart

# Full rebuild
docker-compose up -d --build
```

### Execute Commands in Containers

```bash
# Check Python packages
docker-compose exec ai-service pip list

# Access database
docker-compose exec db psql -U postgres -d chatbot_dev

# Check Redis
docker-compose exec redis redis-cli PING
```

---

## 🧪 Testing Examples

### Example 1: Simple Chat

```bash
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "hello",
    "conversation_history": []
  }'
```

**Response:**

```json
{
  "success": true,
  "response": "Hallo! 👋 Welcome to the AI Shopping Assistant!...",
  "products": [],
  "intent": "general"
}
```

### Example 2: Multi-Turn Conversation

```bash
# Message 1
RESP1=$(curl -s -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"recommend headphones","conversation_history":[]}')

# Message 2 (with history)
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"are they wireless?\",
    \"conversation_history\": [
      {\"role\": \"user\", \"content\": \"recommend headphones\"},
      {\"role\": \"assistant\", \"content\": \"$(echo $RESP1 | jq -r '.response')\"}
    ]
  }"
```

### Example 3: Stream Response

```bash
curl -N -X POST http://localhost:8001/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"tell me about headphones","conversation_history":[]}'
```

Expected: Live streaming text chunks (Server-Sent Events)

---

## 📱 To Test the Web UI

### When Ready:

```bash
# 1. Start web frontend
cd apps/web && pnpm dev

# 2. Open browser
open http://localhost:3000
# or just navigate to http://localhost:3000

# 3. Try the chat interface
# Type a message and send
```

---

## ⚡ Development Workflow

```bash
# Full development environment (hot reload everything)
pnpm dev

# Or selective:
cd apps/web && pnpm dev           # Frontend only
cd apps/api && pnpm dev           # Backend only
make dev-ai                         # AI service only
```

---

## 🛠️ Makefile Commands

```bash
make dev          # Run all with hot reload
make dev-ai       # AI service only
make db-up        # Start database & redis
make scrape-test  # Test scraper endpoint
make clean        # Clean everything
```

---

## 📝 Files You May Want to Check

- [RUNNING_AND_TESTING.md](./RUNNING_AND_TESTING.md) - Full detailed guide
- [Dockerfile](./apps/ai-service/Dockerfile) - AI service container
- [docker-compose.yml](./docker-compose.yml) - Service definitions
- [Makefile](./Makefile) - Convenient shortcuts
- [.env](./.env) - Configuration

---

## 🎉 You're All Set!

Your chat-bot application is:

- ✅ **Running** - All services active
- ✅ **Tested** - APIs responding correctly
- ✅ **Ready** - For development or deployment

### Next Steps:

1. **Test via CLI** (now) - Use the curl commands above
2. **Start Web UI** (when ready) - `cd apps/web && pnpm dev`
3. **Make Changes** - Edit code and watch hot reload
4. **Deploy** - Use `docker-compose up -d` for production

---

## 🔗 Quick Links

- AI Docs: http://localhost:8001/docs
- Web UI: http://localhost:3000 (when running)
- Database: postgresql://postgres:postgres@localhost:5432/chatbot_dev
- Redis: redis://localhost:6379

---

## ❓ Need Help?

Check the [RUNNING_AND_TESTING.md](./RUNNING_AND_TESTING.md) file for:

- Detailed architecture overview
- Comprehensive testing guide
- Troubleshooting section
- Load testing instructions
- API Documentation
