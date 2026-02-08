.PHONY: help start stop restart logs clean dev kill-ports status seed-stores check-db fresh migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

kill-ports: ## Kill processes on ports 3000, 4000, 8001
	@echo "🔪 Killing processes on ports 3000, 4000, 8001..."
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:4000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@-pkill -f "next dev" 2>/dev/null || true
	@-pkill -f "tsx watch" 2>/dev/null || true
	@-rm -f apps/web/.next/dev/lock 2>/dev/null || true
	@echo "✅ Ports cleared"

start: ## Start all Docker services only
	@echo "🚀 Starting Docker services..."
	@docker-compose up -d
	@echo "⏳ Waiting for databases..."
	@sleep 5
	@echo "✅ Docker services ready!"
	@docker-compose ps


migrate: ## Run Prisma migrations (development)
	@echo "🗄️  Running database migrations..."
	@cd apps/ai-service && prisma migrate dev
	@echo "✅ Migrations complete!"

migrate-deploy: ## Deploy Prisma migrations (production)
	@echo "🗄️  Deploying database migrations..."
	@cd apps/ai-service && prisma migrate deploy
	@echo "✅ Migrations deployed!"



dev: kill-ports start migrate ## Start development mode (with cleanup and migrations)
	@echo "🌐 Starting development servers..."
	@pnpm run dev

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	@docker-compose down
	@$(MAKE) kill-ports

restart: stop dev ## Restart all services

logs: ## Show logs from all services
	@docker-compose logs -f

logs-ai: ## Show Python AI service logs
	@docker-compose logs -f ai-service

clean: ## Stop and remove all containers, volumes
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@$(MAKE) kill-ports
	@echo "✅ Cleanup complete"

seed-stores: ## Seed database with Amazon and Thomann stores (run after 'make start')
	@echo "🌱 Seeding stores..."
	@cd apps/ai-service && python check_stores.py

check-db: ## Check database contents
	@echo "🔍 Checking database..."
	@cd apps/ai-service && python check_database.py

fresh: clean start migrate seed-stores dev ## Fresh start: clean, migrate, seed, dev

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@echo "🌐 URLs:"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Node.js API: http://localhost:4000"
	@echo "  Python AI:   http://localhost:8001"
	@echo "  PostgreSQL:  localhost:5432"
	@echo "  Redis:       localhost:6379"
