# 🚀 Chat-Bot: Complete Running & Testing Guide

## 📋 Architecture Overview

Your application is a microservices architecture with:

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Browser                              │
│            http://localhost:3000 (Next.js UI)                │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌───▼────┐ ┌──▼─────┐
    │   Web   │ │  API   │ │   AI   │
    │ :3000   │ │ :4000  │ │ :8001  │
    │ Next.js │ │Express │ │FastAPI │
    └────┬────┘ └───┬────┘ └──┬─────┘
         │          │         │
         └──────────┼─────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐         ┌───▼──────┐
    │PostgreSQL│         │  Redis   │
    │  :5432   │         │  :6379   │
    └──────────┘         └──────────┘
```

**Current Status:**

- ✅ AI Service (8001) - Running
- ✅ API Server (4000) - Running
- ✅ PostgreSQL (5432) - Running
- ✅ Redis (6379) - Running
- ⭕ Web Frontend (3000) - Not running yet

---

## 🎯 QUICK SETUP (3 Steps)

### Option A: Docker (Recommended for stability)

```bash
# Step 1: Start all services
docker-compose up -d

# Step 2: Check if everything is running
docker-compose ps

# Step 3: Test the chat
curl http://localhost:8001/health | jq .
```

### Option B: Development (with hot reload)

```bash
# Step 1: Start database and cache
make db-up

# Step 2: Install dependencies
pnpm install

# Step 3: Start all services (in one command)
pnpm dev

# Or run in separate terminals:
# Terminal 1: pnpm dev
# Terminal 2: cd apps/web && pnpm dev
```

---

## 🧪 TESTING GUIDE

### 1️⃣ Verify Services Are Running

```bash
# Check all containers
docker-compose ps

# Expected output:
# NAME                  STATUS
# chat-bot-ai-service   Up
# chat-bot-db           Up
# chat-bot-redis        Up
```

### 2️⃣ Test AI Service Health

```bash
# Health check
curl http://localhost:8001/health | jq .

# Expected response:
{
  "status": "healthy",
  "service": "AI Shopping Assistant",
  "version": "2.1.0",
  "routes_loaded": true
}
```

### 3️⃣ Test Chat Endpoint

#### Simple Message

```bash
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "hello",
    "conversation_history": []
  }' | jq .
```

**Expected Response:**

```json
{
  "success": true,
  "response": "Hallo! 👋 Welcome to the AI Shopping Assistant! ...",
  "products": [],
  "intent": "general"
}
```

#### Ask About Products

```bash
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "I want to buy headphones under 100 euros",
    "conversation_history": []
  }' | jq .response
```

#### Multi-turn Conversation

```bash
# First message
RESPONSE=$(curl -s -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What headphones do you recommend?",
    "conversation_history": []
  }')

# Get the AI response
AI_RESPONSE=$(echo $RESPONSE | jq -r '.response')
echo "AI: $AI_RESPONSE"

# Follow-up message (with history)
curl -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"Are they wireless?\",
    \"conversation_history\": [
      {\"role\": \"user\", \"content\": \"What headphones do you recommend?\"},
      {\"role\": \"assistant\", \"content\": \"$AI_RESPONSE\"}
    ]
  }" | jq .
```

### 4️⃣ Test Streaming Endpoint

```bash
# Stream chat response
curl -N -X POST http://localhost:8001/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "hello",
    "conversation_history": []
  }'

# You should see streaming output like:
# data: {"type": "message", "content": "Hello"}
# data: {"type": "message", "content": "! ..."}
# data: [DONE]
```

### 5️⃣ Test Available Routes

```bash
# Check chat routes
curl http://localhost:8001/api/chat/test | jq .

# Expected response:
{
  "status": "ok",
  "message": "Chat service is responding",
  "endpoints": {
    "post_chat": "/api/chat/",
    "post_stream": "/api/chat/stream",
    "test": "/api/chat/test"
  }
}
```

### 6️⃣ Test Database (Optional)

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d chatbot_dev

# In the PostgreSQL shell:
SELECT table_name FROM information_schema.tables
WHERE table_schema='public';

# Exit with: \q
```

### 7️⃣ Check Redis Cache (Optional)

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check keys:
KEYS *

# Get value:
GET key_name

# Exit with: EXIT
```

---

## 📊 Testing Automation Script

Create a file `test-chat.sh`:

```bash
#!/bin/bash

echo "🧪 Running Chat-Bot Tests..."
echo ""

# Test 1: Health
echo "✓ Test 1: AI Service Health"
curl -s http://localhost:8001/health | jq '.status'
echo ""

# Test 2: Simple chat
echo "✓ Test 2: Simple Chat"
RESPONSE=$(curl -s -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello","conversation_history":[]}')
echo $RESPONSE | jq '.success'
echo ""

# Test 3: Chat with specific query
echo "✓ Test 3: Headphones Query"
curl -s -X POST http://localhost:8001/api/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"message":"show me gaming headphones","conversation_history":[]}' | \
  jq '.response' | head -3
echo ""

echo "✅ All tests completed!"
```

Run it:

```bash
chmod +x test-chat.sh
./test-chat.sh
```

---

## 🛠️ Common Commands

### Docker Commands

```bash
# Start services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ai-service

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Rebuild single service
docker-compose up -d --build ai-service

# Execute command in container
docker-compose exec ai-service python --version

# View resource usage
docker stats
```

### Make Commands (Shorthand)

```bash
# Development mode (hot reload)
make dev

# AI service only
make dev-ai

# Start database/redis
make db-up

# Clean up
make clean

# Test scraper
make scrape-test
```

### NPM/PNPM Commands

```bash
# Install dependencies
pnpm install

# Start all dev servers
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Type checking
pnpm type-check

# Start services
pnpm start           # with docker
pnpm dev:full        # docker + dev
```

---

## 🌐 Testing via Web UI (When Started)

Once the web frontend is running on port 3000:

1. **Open Browser**: http://localhost:3000
2. **Chat Interface**: Type in the chat input box
3. **Example Queries**:
   - "Show me the best headphones"
   - "I want to buy a laptop under 1000 euros"
   - "Compare iPhone prices"
   - "What's on sale today?"

---

## ❌ Troubleshooting

### Issue: "Port already in use"

```bash
# Find what's using the port
lsof -i :8001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8002 docker-compose up -d
```

### Issue: "Chat returns error"

```bash
# Check service logs
docker-compose logs ai-service

# Rebuild and restart
docker-compose up -d --build ai-service

# Check if dependencies are installed
docker-compose exec ai-service pip list | grep groq
```

### Issue: "Cannot connect to database"

```bash
# Verify database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Check connection
docker-compose exec db pg_isready
```

### Issue: "Pnpm dependencies issue"

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or just
pnpm install --force
```

### Issue: "Services won't start"

```bash
# Full cleanup
docker-compose down -v

# Rebuild everything
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs
```

---

## 📈 Performance Testing

### Load Test (optional, requires `ab` or `hey`)

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test 100 requests
hey -n 100 -c 10 -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test","conversation_history":[]}' \
  http://localhost:8001/api/chat/
```

### Monitor Resources

```bash
# Watch Docker resource usage
docker stats --no-stream

# Monitor system
top
# or
htop (if installed)
```

---

## 📝 API Documentation

### AI Chat Endpoint

**Endpoint**: `POST /api/chat/`

**Request:**

```json
{
  "message": "string (required)",
  "conversation_history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "response": "string (AI response)",
  "products": [],
  "intent": "string"
}
```

### Streaming Endpoint

**Endpoint**: `POST /api/chat/stream`

**Response**: Server-Sent Events (SSE)

```
data: {"type": "message", "content": "chunk..."}
data: [DONE]
```

---

## ✅ Final Checklist

- [ ] All Docker containers running (`docker-compose ps`)
- [ ] AI service healthy (`curl http://localhost:8001/health`)
- [ ] Chat endpoint responding (`curl -X POST http://localhost:8001/api/chat/`)
- [ ] Database accessible (optional check)
- [ ] No errors in logs (`docker-compose logs`)
- [ ] Web UI accessible (once started)

---

## 🎉 You're All Set!

Your chat-bot application is fully operational. Start chatting and testing!

For more details, check the individual README files in:

- `/apps/web` - Frontend
- `/apps/api` - Backend API
- `/apps/ai-service` - AI Service
