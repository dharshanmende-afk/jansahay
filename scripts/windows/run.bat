@echo off
title JanSahay AI - Full Stack Launcher
setlocal

echo ========================================================
echo   Launching JanSahay AI Full-Stack Platform
echo   Backend:  Node.js + Express (Port 5000)
echo   Frontend: React 18 + Vite (Port 5173)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0..\.."

echo [1/2] Starting Node.js / Express Backend Server (Port 5000)...
start "JanSahay AI - Backend Service" cmd /k "cd /d "%ROOT_DIR%\server" && npm.cmd start"

echo [2/2] Starting React 18 + Vite Frontend (Port 5173)...
start "JanSahay AI - Frontend Application" cmd /k "cd /d "%ROOT_DIR%\client" && npm.cmd run dev"

echo.
echo ========================================================
echo Services launched in dedicated console windows!
echo.
echo - Web App:  http://localhost:5173
echo - API:      http://localhost:5000/api
echo ========================================================
echo.
pause
