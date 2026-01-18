@echo off
setlocal enabledelayedexpansion
REM Helper script to start Spectrum on Windows

echo.
echo ========================================
echo   Spectrum - Image Converter
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [OK] Docker is running

REM Default Windows volume mounts
set SPECTRUM_USERS_MOUNT=C:\Users
set SPECTRUM_VOLUMES_MOUNT=C:\
set SPECTRUM_VOLUMES_DRIVE=C
set SPECTRUM_EXTRA_MOUNT=

REM Auto-detect mapped network drives
echo [INFO] Scanning for network drives...
set "found_nas="
for %%d in (D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    if exist "%%d:\" (
        for /f "tokens=2,*" %%a in ('net use %%d: 2^>nul ^| findstr /i "Remote"') do (
            if "!found_nas!"=="" (
                set "found_nas=%%d"
                set "SPECTRUM_VOLUMES_MOUNT=%%d:\"
                set "SPECTRUM_VOLUMES_DRIVE=%%d"
                echo [OK] Found network drive %%d: ^(%%b^)
            )
        )
    )
)

REM Load manual NAS configuration if it exists (overrides auto-detect)
if exist "nas-config.bat" (
    echo [OK] Loading saved NAS configuration...
    call nas-config.bat
)

if "!found_nas!"=="" (
    if not exist "nas-config.bat" (
        echo [INFO] No network drives detected - using local C:\ drive
        echo      To use a NAS: Map it to a drive letter first
    )
)

echo.
echo [CONFIG] Volumes mount: %SPECTRUM_VOLUMES_MOUNT%
echo [CONFIG] Drive letter: %SPECTRUM_VOLUMES_DRIVE%
echo.
echo Starting services...
echo.

docker compose up --build

REM Open browser after delay (optional)
REM timeout /t 5 /nobreak >nul
REM start http://localhost:3000

endlocal
