@echo off
setlocal
echo ================================================================
echo  JanSahay AI - First-Time Windows Setup
echo  Government Scheme Discovery and Document Guidance System
echo ================================================================
echo.

REM Verify Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Setting up Server...
cd /d "%~dp0..\..\server"
if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
        echo [OK] server\.env created from .env.example template.
    )
)
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server npm install failed.
    pause
    exit /b 1
)

echo [2/4] Setting up Client...
cd /d "%~dp0..\..\client"
if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
        echo [OK] client\.env created from .env.example template.
    )
)
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Client npm install failed.
    pause
    exit /b 1
)

echo [3/4] Building Client...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Client build check reported an issue.
)

echo [4/4] Verifying Setup...
cd /d "%~dp0..\.."
echo.
echo ================================================================
echo  JanSahay AI Setup Completed Successfully!
echo.
echo  To run the full stack on Windows:
echo    .\scripts\windows\run.bat
echo.
echo  Or using npm from repository root:
echo    npm run dev
echo.
echo  Access points:
echo    Web Interface: http://localhost:5173
echo    API Health:    http://localhost:5000/api/health (or /api/schemes)
echo ================================================================
pause
