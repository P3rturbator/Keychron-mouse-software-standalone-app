@echo off
SETLOCAL EnableDelayedExpansion

echo Checking for Node.js and npm...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/ to run this application.
    pause
    exit /b
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found.
    echo Please ensure Node.js is installed correctly.
    pause
    exit /b
)

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (this may take a minute)...
    call npm install
)

echo Starting Keychron Mouse Configuration Tool...
call npm start

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start the application.
    pause
) else (
    echo.
    echo Application closed.
    pause
)
