@echo off
REM NAS Drive Setup Wizard for Spectrum
REM This script helps configure network drives for use with Spectrum

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Spectrum - NAS Drive Setup Wizard
echo ========================================
echo.

REM Check for existing config
if exist "nas-config.bat" (
    echo Found existing configuration:
    type nas-config.bat | findstr "SPECTRUM_"
    echo.
    choice /c YN /m "Do you want to reconfigure"
    if !errorlevel! equ 2 (
        echo.
        echo Keeping existing configuration.
        goto :end
    )
)

echo This wizard will help you connect your NAS/network drive.
echo.

REM Step 1: Check for mapped network drives
echo Step 1: Detecting mapped network drives...
echo.

set "found_drives="
for %%d in (D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    if exist "%%d:\" (
        for /f "tokens=2,*" %%a in ('net use %%d: 2^>nul ^| findstr /i "Remote"') do (
            echo   [%%d:] %%b
            set "found_drives=!found_drives! %%d"
        )
    )
)

if "!found_drives!"=="" (
    echo   No mapped network drives found.
    echo.
    echo   To map a NAS share, run this command first:
    echo   net use Z: \\YOUR-NAS\ShareName /persistent:yes
    echo.
    echo   Then run this wizard again.
    goto :end
)

echo.
echo Step 2: Select your photos drive
echo.
set /p "drive_letter=Enter the drive letter where your photos are (e.g., Z): "

REM Validate input
set "drive_letter=!drive_letter:~0,1!"
call :uppercase !drive_letter! drive_letter

if not exist "!drive_letter!:\" (
    echo.
    echo Error: Drive !drive_letter!: does not exist or is not accessible.
    goto :end
)

echo.
echo Step 3: Testing access to !drive_letter!:\
dir "!drive_letter!:\" >nul 2>&1
if !errorlevel! neq 0 (
    echo Error: Cannot access drive !drive_letter!:. Make sure the network share is connected.
    goto :end
)
echo   Drive is accessible.

REM Step 4: Create configuration file
echo.
echo Step 4: Saving configuration...

(
    echo @echo off
    echo REM Spectrum NAS Configuration - Auto-generated
    echo REM Drive: !drive_letter!:
    echo.
    echo set SPECTRUM_VOLUMES_MOUNT=!drive_letter!:\
    echo set SPECTRUM_VOLUMES_DRIVE=!drive_letter!
) > nas-config.bat

echo   Configuration saved to nas-config.bat
echo.

REM Step 5: Docker Desktop reminder
echo ========================================
echo   IMPORTANT: Docker Desktop Setup
echo ========================================
echo.
echo You must share drive !drive_letter!: in Docker Desktop:
echo.
echo   1. Open Docker Desktop
echo   2. Go to Settings ^> Resources ^> File Sharing
echo   3. Add !drive_letter!:\ to the shared paths
echo   4. Click "Apply ^& Restart"
echo.
echo Once Docker is configured, run: start.bat
echo.

:end
pause
exit /b

:uppercase
set "%2=%~1"
for %%a in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    set "%2=!%2:%%a=%%a!"
)
exit /b
