.PHONY: dev backend frontend install clean help

# Default target - run both backend and frontend
dev:
	@echo "Starting backend and frontend servers..."
	@make -j2 backend frontend

# Start backend server
backend:
	@echo "Starting Python backend on port 5000..."
	@cd backend && python app.py

# Start frontend development server
frontend:
	@echo "Starting frontend dev server..."
	@npm run dev

# Install all dependencies
install:
	@echo "Installing frontend dependencies..."
	@npm install
	@echo "Installing backend dependencies..."
	@cd backend && pip install -r requirements.txt

# Clean build artifacts and caches
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/ node_modules/ backend/__pycache__/ backend/models/__pycache__/
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete!"

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make dev       - Run both backend and frontend servers"
	@echo "  make backend   - Run only the backend server"
	@echo "  make frontend  - Run only the frontend server"
	@echo "  make install   - Install all dependencies"
	@echo "  make clean     - Clean build artifacts and caches"
	@echo "  make help      - Show this help message"
