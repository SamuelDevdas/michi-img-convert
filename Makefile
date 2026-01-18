# Spectrum - Workflow Commands

# Default: Help
.PHONY: help
help:
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commands:"
	@echo "  setup          Check requirements (Docker)"
	@echo "  start          Build and start services in the background"
	@echo "  stop           Stop services"
	@echo "  restart        Restart services"
	@echo "  logs           Follow service logs"
	@echo "  open           Open the app in your browser"
	@echo "  clean          Remove containers and artifacts"
	@echo "  shell-backend  Open a shell in the backend container"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run all tests (unit, API, frontend, E2E)"
	@echo "  test-unit      Run backend unit tests"
	@echo "  test-api       Run backend API integration tests"
	@echo "  test-frontend  Run frontend component tests"
	@echo "  test-e2e       Run E2E tests (requires running containers)"
	@echo ""

.PHONY: setup
setup:
	@echo "🔍 Checking requirements..."
	@docker info >/dev/null 2>&1 || (echo "❌ Docker is not running. Please start Docker Desktop." && exit 1)
	@echo "✅ Docker is ready."

.PHONY: start
start: setup
	@echo "🚀 Starting Spectrum..."
	@docker compose up --build -d
	@echo "✅ Services started in background."
	@echo "👉 Run 'make logs' to see output, or 'make open' to launch the app."

.PHONY: stop
stop:
	@echo "🛑 Stopping services..."
	@docker compose down
	@echo "✅ Services stopped."

.PHONY: restart
restart: stop start

.PHONY: logs
logs:
	@docker compose logs -f

.PHONY: open
open:
	@echo "🌐 Opening http://localhost:3000..."
	@open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000 manually"

.PHONY: clean
clean: stop
	@echo "🧹 Cleaning up..."
	@docker system prune -f
	@echo "✅ Cleanup complete."

.PHONY: shell-backend
shell-backend:
	@docker exec -it michi-backend /bin/bash

# Testing Commands
.PHONY: test
test:
	@./run_tests.sh all

.PHONY: test-unit
test-unit:
	@./run_tests.sh unit

.PHONY: test-api
test-api:
	@./run_tests.sh api

.PHONY: test-frontend
test-frontend:
	@./run_tests.sh frontend

.PHONY: test-e2e
test-e2e:
	@./run_tests.sh e2e
