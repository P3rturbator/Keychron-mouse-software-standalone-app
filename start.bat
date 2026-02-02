@echo off
SETLOCAL EnableDelayedExpansion

echo Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/ to run this application.
    pause
    exit /b
)

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (this may take a minute)...
    npm install
)

echo Starting Keychron Mouse Configuration Tool...
npm start

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start the application.
    pause
)
