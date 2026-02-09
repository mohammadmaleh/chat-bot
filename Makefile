# mohammadmaleh/chat-bot Makefile
dev:
	pnpm turbo dev  # web:3000 + api:8000 + ai:8001 hot-reload

dev-ai:
	cd apps/ai-service && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001

db-up:
	docker compose up db redis -d

scrape-test:
	curl "localhost:8001/scrape/thomann?query=headphones"

clean:
	docker compose down -v && pnpm turbo clean

