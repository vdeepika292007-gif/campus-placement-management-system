@echo off
setlocal enabledelayedexpansion
title Campus Placement Management System (CPMS) Launcher

echo ===============================================================================
echo       Campus Placement Management System (CPMS) - Server Launcher
echo ===============================================================================
echo.

:: 1. Navigate to script directory
cd /d "%~dp0"

:: 2. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not detected in your PATH.
    echo Please install Node.js (v18, v20, or newer) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 3. Check and install dependencies if missing
if not exist "node_modules\" (
    echo [INFO] node_modules not detected. Installing project dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies via npm install.
        pause
        exit /b 1
    )
)

:: 4. Stop any existing / stale server listening on port 3000
echo [INFO] Checking for stale processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":3000[ ]" ^| findstr "LISTENING"') do (
    echo [INFO] Terminating old process on port 3000 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>nul
)

:: 5. Clean stale database locks
if exist "prisma\pgdata\postmaster.pid" (
    echo [INFO] Removing stale database lock (postmaster.pid)...
    del /f /q "prisma\pgdata\postmaster.pid" >nul 2>nul
)

:: 6. Verify and seed demo database if needed
if not exist "prisma\pgdata\base\" (
    echo [INFO] Initializing embedded PostgreSQL database and demo records...
    call npm run prisma:seed
    call npm run seed:demo
)

echo.
echo ===============================================================================
echo   CPMS Server starting on: http://localhost:3000
echo.
echo   PRE-SEEDED DEMO ACCOUNTS:
echo     Student Portal: aarav.sharma@student.edu  ^|  StudentDemo@123
echo     Admin Portal:   admin@placement.edu      ^|  AdminDemo@123
echo ===============================================================================
echo.
echo [INFO] Opening default browser in 3 seconds...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 7. Launch Next.js Dev Server
call npm run dev

:: Clean lock on normal or interrupted exit
if exist "prisma\pgdata\postmaster.pid" (
    del /f /q "prisma\pgdata\postmaster.pid" >nul 2>nul
)

echo.
echo Server stopped.
pause

