
# 🛍️ German Price Comparison AI Assistant

> **A modern, conversational AI-powered price comparison platform for German online stores**

## 🎯 Project Vision

This application is a **conversational AI shopping assistant** that helps users:
- 🔍 Find the best prices across all major German online stores
- 🎁 Get personalized gift suggestions for people they barely know
- 💬 Compare products through natural conversation (not traditional search)
- 💰 Discover the lowest prices with real-time data
- 🎯 Receive smart recommendations based on their needs

### The Core Idea
Instead of manually searching multiple German e-commerce sites, users have a **natural conversation** with an AI that:
1. Asks clarifying questions about what they need
2. Understands context ("I need a gift for my colleague who likes coffee")
3. Searches and compares prices across all German online stores
4. Suggests the best options with reasoning
5. Provides direct links to purchase

---

## 🏗️ Technical Architecture

### Tech Stack (Modern & Cutting-Edge 2026)

#### **Frontend** (`apps/web`)
- **Next.js 16** - React framework with App Router
- **React 19** - Latest with React Compiler optimization
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Modern styling with shadcn/ui components
- **TanStack Query (React Query)** - Server state management & caching
- **Turbo Mode** - Ultra-fast dev server

#### **Backend** (`apps/api`)
- **FastAPI (Python)** - Async API framework
- **Uvicorn** - Production ASGI server
- **PostgreSQL** - Main database (coming soon)
- **Prisma ORM** - Type-safe database access (coming soon)
- **Redis** - Caching layer for prices (planned)

#### **Shared Packages** (`packages/`)
- **@chat-bot/types** - Shared TypeScript types
- **@chat-bot/database** - Prisma schema & client (planned)

#### **Monorepo Tools**
- **Turborepo** - Build system orchestration
- **pnpm Workspaces** - Package management

---

## 📋 Features Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Monorepo setup with Turborepo
- [x] Next.js frontend with modern UI
- [x] FastAPI backend with CORS
- [x] Basic project structure
- [ ] Database schema design
- [ ] Prisma ORM integration

### 🔄 Phase 2: Database & Authentication
- [ ] PostgreSQL setup with Prisma
- [ ] User authentication (NextAuth.js or Clerk)
- [ ] User profiles and preferences
- [ ] Session management
- [ ] Protected routes

### 🤖 Phase 3: AI Conversation Engine
- [ ] OpenAI/Claude API integration
- [ ] Conversation memory system
- [ ] Context-aware question generation
- [ ] Intent recognition (gift vs. personal purchase)
- [ ] Multi-turn dialogue management

### 🕷️ Phase 4: Price Scraping System
- [ ] Web scrapers for major German stores:
  - Amazon.de
  - MediaMarkt
  - Saturn
  - Otto.de
  - Zalando
  - And more...
- [ ] Background job queue (Bull/BullMQ)
- [ ] Scheduled price updates
- [ ] Price history tracking
- [ ] Stock availability monitoring

### 💳 Phase 5: Monetization & Payments
- [ ] Stripe integration for EU payments
- [ ] Subscription tiers (Free, Pro, Business)
- [ ] Payment webhooks
- [ ] PayPal integration (optional)
- [ ] Usage limits and quotas

### 🚀 Phase 6: Advanced Features
- [ ] Product recommendations ML model
- [ ] Price drop alerts
- [ ] Wishlist management
- [ ] Share comparison results
- [ ] Browser extension
- [ ] Mobile app (React Native)

---

## 🗄️ Database Schema (Planned)

### Core Tables

```prisma
// Users & Authentication
User
  - id, email, name, password_hash
  - subscription_tier, created_at, updated_at
  - preferences (JSON)

// Products & Prices
Product
  - id, name, brand, category
  - description, image_url, ean, gtin
  - created_at, updated_at

Price
  - id, product_id, store_id
  - price, currency, availability
  - scraped_at, url

Store
  - id, name, domain, logo_url
  - country, active, scraper_config

// Conversations
Conversation
  - id, user_id, title
  - created_at, updated_at, status

Message
  - id, conversation_id, role (user/assistant)
  - content, metadata (JSON)
  - created_at

// Subscriptions & Payments
Subscription
  - id, user_id, stripe_subscription_id
  - plan, status, current_period_end
  - created_at, canceled_at
```

---

## 🎨 User Experience Flow

### Example Conversation:

**User:** "I need a birthday gift for my coworker"

**AI:** "I'd love to help! A few quick questions:
- What's your budget?
- Do you know any of their interests or hobbies?
- What's the occasion's formality level?"

**User:** "Around 30€, they like coffee, casual workplace"

**AI:** "Perfect! I found these options across German stores:

1. **De'Longhi Milk Frother** - €24.99 at MediaMarkt
   ⭐ 4.5/5 (230 reviews) | In stock | Free shipping
   
2. **Coffee Bean Subscription (3 months)** - €29.90 at Tchibo
   ⭐ 4.8/5 (450 reviews) | Delivered to their home
   
3. **Premium Coffee Gift Set** - €32.50 at Amazon.de
   ⭐ 4.6/5 (189 reviews) | Prime delivery

Would you like more details on any of these?"

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+
- PostgreSQL 15+ (coming soon)
- Redis (optional, for caching)

### Installation

```bash
# Clone repository
git clone https://github.com/mohammadmaleh/chat-bot.git
cd chat-bot

# Install dependencies
pnpm install

# Install Python dependencies
cd apps/api
pip install -r requirements.txt
cd ../..

# Run development servers
pnpm dev  # Starts both Next.js (3000) and FastAPI (8001)
```

### Environment Variables (Coming Soon)

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/chatbot"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI APIs
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

---

## 📚 Learning Goals

This project is built with a **learning-first approach**. Each phase teaches:

- **Database Design**: Relational modeling, migrations, indexing
- **Authentication**: JWT, sessions, OAuth, security best practices
- **AI Integration**: Prompt engineering, context management, streaming responses
- **Web Scraping**: Ethics, rate limiting, data normalization, anti-bot measures
- **Payment Systems**: Stripe webhooks, subscription management, European payment methods
- **Scalability**: Caching strategies, background jobs, horizontal scaling
- **Modern Frontend**: React 19 features, server components, optimistic updates
- **API Design**: RESTful principles, WebSockets, error handling

---

## 🎯 Business Model

### Free Tier
- 10 conversations per month
- Basic price comparison
- Ads displayed

### Pro Tier (€9.99/month)
- Unlimited conversations
- Price drop alerts
- No ads
- Priority support
- Price history graphs

### Business Tier (€29.99/month)
- Everything in Pro
- API access
- Bulk product comparison
- Custom integrations
- Dedicated account manager

---

## 🌍 Target Market

**Primary:** German consumers (18-45 years old) who:
- Shop online frequently
- Want to save money
- Value convenience over manual price checking
- Struggle with gift-giving decisions

**Secondary:** 
- Small businesses doing procurement
- Dropshippers looking for arbitrage opportunities
- Gift services and concierge platforms

---

## 🔐 Legal & Compliance

- **GDPR Compliant** - EU data protection regulations
- **Transparent Scraping** - Respecting robots.txt and rate limits
- **Affiliate Disclosures** - Clear commission notifications (if applicable)
- **Price Accuracy** - Timestamped data with disclaimers
- **Terms of Service** - User agreement and privacy policy

---

## 📞 Contact & Contributing

**Developer:** Mohamad Al Maleh
**Email:** mohammad.maleh@gmail.com
**GitHub:** [@mohammadmaleh](https://github.com/mohammadmaleh)

### Contributing Guidelines (Future)
- Fork the repository
- Create a feature branch
- Follow existing code style
- Write tests for new features
- Submit a pull request

---

## 📄 License

MIT License (or choose appropriate license)

---

## 🚀 Current Status

**Stage:** Foundation & Planning  
**Last Updated:** February 2026  
**Next Milestone:** Database schema implementation with Prisma

---

## 💡 Why This Will Succeed

1. **Unique UX**: Conversational interface vs. traditional comparison sites
2. **German Market Gap**: Limited AI-powered shopping assistants in German
3. **Gift Discovery**: Solves the "what to buy for someone I don't know well" problem
4. **Modern Tech**: Built with 2026's best practices, scalable from day one
5. **Clear Monetization**: Proven freemium SaaS model

---

**Built with ❤️ in Munich, Germany** 🇩🇪
