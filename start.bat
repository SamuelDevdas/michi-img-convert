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

REM Windows volume mounts for Docker (edit if your photos are on another drive)
set SPECTRUM_USERS_MOUNT=C:\Users
set SPECTRUM_VOLUMES_MOUNT=C:\

docker compose up --build

REM Open browser after delay (optional)
REM timeout /t 5 /nobreak >nul
REM start http://localhost:3000
