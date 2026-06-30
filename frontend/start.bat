@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    Personal Question Bank - Frontend Start
echo ========================================
echo.
echo Please select start mode:
echo   [1] Fast start (skip checks, start directly)
echo   [2] Full start (check env + install deps)
echo   [3] Exit
echo.
set /p choice=Enter option (default 1): 
if "%choice%"=="" set choice=1

if "%choice%"=="2" goto full_start
if "%choice%"=="3" exit /b 0

:fast_start
echo.
echo [Fast Start] Starting dev server...
goto start_service

:full_start
echo.
echo [1/2] Checking Node.js environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found, please install Node.js 18+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1" %%i in ('node --version 2^>^&1') do echo Node.js version: %%i

echo.
echo [2/2] Installing dependencies...
if not exist "node_modules" (
    echo Installing dependencies, please wait...
    npm install --registry=https://registry.npmmirror.com
) else (
    echo Dependencies already installed, skipping
)

echo.
echo Starting dev server...

:start_service
echo.
echo ========================================
echo    Frontend dev server starting...
echo    URL:      http://localhost:5173
echo    Backend:  http://localhost:8000
echo ========================================
echo.

npm run dev

pause
