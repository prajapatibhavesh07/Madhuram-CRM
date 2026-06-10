@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   MADHURAM FULL PRODUCTION DEPLOYMENT (IIS)
echo ===================================================
echo.

:: 1. Privilege Check
echo [1/5] Checking for Administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator!
    echo Please right-click this file and select 'Run as Administrator'.
    pause
    exit /b 1
)
echo [OK] Administrator privileges confirmed.

:: 2. Configuration Check
set "API_IP=192.168.3.165"
set "FRONTEND_DIR=D:\bhavesh\Madhuram-CRM\react-app"
set "BACKEND_DIR=D:\bhavesh\Madhuram-CRM\express-mongo-backend"
set "STAGING_DIR=D:\production\Madhuram"
set "IIS_DIR=C:\inetpub\wwwroot\Madhuram"

echo.
echo [2/5] Setting Frontend IP to %API_IP%...
:: Update .env.production file
echo VITE_API_BASE_URL=http://%API_IP%:5000> "%FRONTEND_DIR%\.env.production"
echo [OK] .env.production updated.

:: 3. Build Process
echo.
echo [3/5] Building Frontend (This may take a minute)...
cd /d "%FRONTEND_DIR%"
call npm run build
if %errorLevel% neq 0 (
    echo [ERROR] Frontend build failed! Check for code errors.
    pause
    exit /b 1
)
echo [OK] Build complete.

:: 4. Prepare Staging
echo.
echo [4/5] Preparing Staging and API files...
if not exist "%STAGING_DIR%\server" mkdir "%STAGING_DIR%\server"
:: Copy build to staging
robocopy "%FRONTEND_DIR%\dist" "%STAGING_DIR%" /E /Z /R:1 /W:1 /XD "server" "uploads" >nul

:: Copy backend to staging (exclude node_modules)
robocopy "%BACKEND_DIR%" "%STAGING_DIR%\server" /E /Z /R:1 /W:1 /XD "node_modules" ".git" >nul
:: Ensure backend .env has the right IP/Port if needed
if exist "%BACKEND_DIR%\.env.production" (
    copy /y "%BACKEND_DIR%\.env.production" "%STAGING_DIR%\server\.env" >nul
)

:: 5. Final Move to IIS
echo.
echo [5/5] Deploying to IIS Root: %IIS_DIR%...
:: Create IIS dir if it doesn't exist
if not exist "%IIS_DIR%" mkdir "%IIS_DIR%"

:: Final Sync to IIS
robocopy "%STAGING_DIR%" "%IIS_DIR%" /E /Z /R:3 /W:5

echo.
echo ===================================================
echo   DEPLOYMENT SUCCESSFUL!
echo ===================================================
echo IP Address: %API_IP%
echo URL: http://%API_IP%
echo.
pause
