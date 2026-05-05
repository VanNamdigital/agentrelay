@echo off
setlocal

echo Setting up AgentRelay...
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Install Node.js first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js: %NODE_VERSION%
echo.

echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 exit /b 1

echo Installing dashboard dependencies...
pushd dashboard
call npm install
if %ERRORLEVEL% NEQ 0 (
    popd
    exit /b 1
)

echo Building dashboard...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    popd
    exit /b 1
)
popd

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo Edit .env before first run: SESSION_SECRET, TELEGRAM_BOT_TOKEN, allowed users, and projects.
)

echo.
echo Setup complete.
echo Start with: npm start
echo Dashboard: http://127.0.0.1:3456/dashboard
