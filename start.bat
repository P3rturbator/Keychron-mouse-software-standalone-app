@echo off
echo ==========================================
echo Keychron Mouse Configuration Tool Launcher
echo ==========================================
echo.

:: Check for Node.js
echo Checking for Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from https://nodejs.org/
    echo.
    pause
    exit /b
)
echo Node.js found.

:: Check for npm
echo Checking for npm...
call npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not found!
    echo Please make sure Node.js is installed correctly.
    echo.
    pause
    exit /b
)
echo npm found.

:: Install dependencies if node_modules folder is missing
if not exist node_modules (
    echo.
    echo First time setup: Installing dependencies...
    echo This may take a minute, please wait...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
)

:: Start the application
echo.
echo Launching the application...
call npm start

if errorlevel 1 (
    echo.
    echo [ERROR] The application failed to start or crashed.
    pause
) else (
    echo.
    echo Application closed successfully.
    pause
)
