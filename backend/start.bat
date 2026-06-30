@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    Personal Question Bank - Backend Start
echo ========================================
echo.
echo Please select start mode:
echo   [1] Fast start (skip checks, start directly)
echo   [2] Full start (check env + install deps + init)
echo   [3] Exit
echo.
set /p choice=Enter option (default 1): 
if "%choice%"=="" set choice=1

if "%choice%"=="2" goto full_start
if "%choice%"=="3" exit /b 0

:fast_start
echo.
echo [Fast Start] Starting service...
goto start_service

:full_start
echo.
echo [1/3] Checking Python environment...
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found, please install Python 3.10+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo Python version: %%i

echo.
echo [2/3] Installing dependencies...
py -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo.
echo [3/3] Initializing data...
if not exist "data\question_bank.db" (
    py init_data.py
    echo Database initialized
) else (
    echo Database exists, skipping init
)

echo.
echo Starting service...

:start_service
echo.
echo ========================================
echo    Backend service starting...
echo    URL:  http://localhost:8000
echo    Docs: http://localhost:8000/docs
echo ========================================
echo.

py -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
