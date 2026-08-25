@echo off
title Portfolio Generator Agent Launcher
echo ====================================================
echo 🚀 Launching AI Portfolio Generator Agent...
echo ====================================================

REM 1. Automated Port Cleanup (Kills previous instances on 3001, 5173, 5174)
echo 🧹 Cleaning up any previous instances on ports 3001, 5173, 5174...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Set local Node path
set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo 2. Starting Backend API Server (Port 3001)...
start "Portfolio Backend (Port 3001)" cmd /k "set PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH% && npm run dev --prefix apps/server"

timeout /t 2 /nobreak >nul

echo 3. Starting Frontend Web Studio (Port 5173)...
start "Portfolio Web Studio (Port 5173)" cmd /k "set PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH% && npm run dev --prefix apps/web"

timeout /t 3 /nobreak >nul

echo 4. Opening Browser at http://localhost:5173 ...
start http://localhost:5173

echo ====================================================
echo ✅ System is running!
echo • Frontend: http://localhost:5173
echo • Backend:  http://localhost:3001
echo ====================================================
pause
