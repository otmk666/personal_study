@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    Personal Question Bank - One-Click Start
echo ========================================
echo.
echo Please select start mode:
echo   [1] Fast start (skip checks, start directly)
echo   [2] Full start (check env + install deps + init)
echo   [3] Start backend only
echo   [4] Start frontend only
echo   [5] Exit
echo.
set /p choice=Enter option (default 1): 
if "%choice%"=="" set choice=1

if "%choice%"=="2" goto full_start
if "%choice%"=="3" goto only_backend
if "%choice%"=="4" goto only_frontend
if "%choice%"=="5" exit /b 0

:fast_start
echo.
echo ========================================
echo   [Fast Start] Starting backend and frontend...
echo ========================================
goto start_both

:full_start
echo.
echo ========================================
echo   [Full Start] Checking environment...
echo ========================================
echo.
echo ===== Backend Check =====
cd backend
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found, please install Python 3.10+
    pause
    exit /b 1
)
echo Installing backend dependencies...
py -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if not exist "data\question_bank.db" (
    py init_data.py
    echo Database initialized
)
cd ..

echo.
echo ===== Frontend Check =====
cd frontend
node --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Node.js not found, skipping frontend check
) else (
    if not exist "node_modules" (
        echo Installing frontend dependencies...
        npm install --registry=https://registry.npmmirror.com
    ) else (
        echo Frontend dependencies already installed
    )
)
cd ..

:start_both
echo.
echo ========================================
echo   Starting backend service...
echo ========================================
cd backend
start "Backend" cmd /k "py -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Starting frontend service...
echo ========================================
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo   Startup complete!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   (Both services are running in new windows)
echo ========================================
echo.
pause
exit /b 0

:only_backend
cd backend
start "Backend" cmd /k "py -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..
echo Backend started: http://localhost:8000
pause
exit /b 0

:only_frontend
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..
echo Frontend started: http://localhost:5173
pause
exit /b 0
