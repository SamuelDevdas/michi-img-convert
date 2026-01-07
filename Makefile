# Michi Image Converter - Workflow Commands

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

.PHONY: setup
setup:
	@echo "🔍 Checking requirements..."
	@docker info >/dev/null 2>&1 || (echo "❌ Docker is not running. Please start Docker Desktop." && exit 1)
	@echo "✅ Docker is ready."

.PHONY: start
start: setup
	@echo "🚀 Starting Michi Image Converter..."
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
