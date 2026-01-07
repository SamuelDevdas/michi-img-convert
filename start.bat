@echo off
REM Helper script to start Spectrum on Windows

echo 🖼️  Starting Spectrum...
echo.

REM Check if Docker is running (basic check)
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo 🚀 Starting services with docker compose...
echo.

docker compose up --build

REM Open browser after delay (optional)
REM timeout /t 5 /nobreak >nul
REM start http://localhost:3000
