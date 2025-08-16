@echo off
echo ================================
echo  Coffee House Payment Server
echo ================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if package.json exists
if not exist server-package.json (
    echo Creating package.json...
    copy server-package.json package.json
)

:: Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

:: Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Please copy server.env.example to .env and add your API keys
    echo.
    echo Creating .env from example...
    copy server.env.example .env
    echo.
    echo Please edit .env file with your actual API keys before testing payments.
    echo.
)

:: Start the server
echo Starting server on http://localhost:3000...
echo Press Ctrl+C to stop the server
echo.
node server.js

pause 