#!/usr/bin/env bash
set -euo pipefail

echo "Setting up AgentRelay..."
echo

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is not installed. Install Node.js first."
    exit 1
fi

echo "Node.js: $(node --version)"
echo

echo "Installing backend dependencies..."
npm install

echo "Installing dashboard dependencies..."
(cd dashboard && npm install && npm run build)

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Edit .env before first run: SESSION_SECRET, TELEGRAM_BOT_TOKEN, allowed users, and projects."
fi

echo
echo "Setup complete."
echo "Start with: npm start"
echo "Dashboard: http://127.0.0.1:3456/dashboard"
