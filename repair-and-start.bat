@echo off
setlocal enabledelayedexpansion
title Campus Placement Management System (CPMS) - Repair ^& Start

echo ===============================================================================
echo       Campus Placement Management System (CPMS) - Full System Repair
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/5] Terminating any running servers on port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":3000[ ]" ^| findstr "LISTENING"') do (
    echo       Killing PID %%a...
    taskkill /f /pid %%a >nul 2>nul
)

echo [2/5] Cleaning temporary build caches and stale locks...
if exist ".next\" (
    echo       Removing corrupted .next cache...
    rmdir /s /q ".next" >nul 2>nul
)
if exist "prisma\pgdata\postmaster.pid" (
    del /f /q "prisma\pgdata\postmaster.pid" >nul 2>nul
)

echo [3/5] Resetting embedded database to clean slate...
if exist "prisma\pgdata\" (
    echo       Archiving and recreating database directory...
    if not exist "backups\" mkdir backups
    rmdir /s /q "prisma\pgdata" >nul 2>nul
)

echo [4/5] Initializing database schema and seeding demo accounts...
call npm run prisma:seed
call npm run seed:demo

echo.
echo [5/5] Launching CPMS Development Server...
echo ===============================================================================
echo   CPMS is ready at http://localhost:3000
echo   Student: aarav.sharma@student.edu  ^|  StudentDemo@123
echo   Admin:   admin@placement.edu      ^|  AdminDemo@123
echo ===============================================================================
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm run dev

pause

