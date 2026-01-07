#!/bin/bash
# Helper script to start Michi Image Converter

echo "🖼️  Starting Michi Image Converter..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo "🚀 Starting services with docker compose..."
echo ""

docker compose up --build

# Open browser after a delay (optional)
# sleep 5 && open http://localhost:3000
