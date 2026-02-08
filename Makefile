.PHONY: help start stop restart logs clean dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Start all services (Docker + Apps)
	@echo "🚀 Starting all services..."
	docker-compose up -d
	@echo "⏳ Waiting for databases..."
	@sleep 3
	@echo "✅ Services started!"
	@echo "📊 Running services:"
	@docker-compose ps

dev: start ## Start development mode
	@echo "🌐 Starting development servers..."
	pnpm run dev

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down

restart: stop start ## Restart all services

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Stop and remove all containers, volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	@echo "✅ Cleanup complete"

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
