# Getting Started

## Requirements

- Node.js 20.19 or newer
- npm
- A Telegram bot token from BotFather if you want Telegram control
- At least one supported local CLI provider if you want to run AI tasks

## Local Setup

Windows:

```bat
setup-dashboard.bat
```

macOS/Linux:

```bash
chmod +x setup-dashboard.sh
./setup-dashboard.sh
```

Manual setup:

```bash
npm install
npm run install:dashboard
npm run build:dashboard
cp .env.example .env
npm start
```

On Windows, use `copy .env.example .env`.

`npm start` checks whether the built dashboard exists. If `public/dashboard/index.html` is missing, it installs dashboard dependencies when needed and builds the dashboard before starting the server.

## Global Local Install

```bash
npm install -g .
agentrelay
```

The `agentrelay` command creates a minimal local `.env` when one does not exist, builds the dashboard if needed, starts the admin server, and opens the Web UI. Use `agentrelay --no-open` to start without launching a browser.

After this package is published to npm:

```bash
npm install -g @vannamdigital/agentrelay
agentrelay
```

Global installs store runtime config, SQLite data, and logs in `~/.agentrelay` by default. Set `AGENTRELAY_HOME` before running `agentrelay` if you want a different data directory.

## First Login

Open:

```text
http://127.0.0.1:3456/dashboard
```

Default first-run admin credentials:

```text
admin / 123456
```

Change this password immediately after first login. The dashboard forces a password change for the default account.
