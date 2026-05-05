# AgentRelay

AgentRelay is a local-first Telegram bot and admin dashboard for controlling AI CLI providers from your own machine.

It is intended for personal local use. Do not expose it directly to the internet.

<table>
  <tr>
    <td width="50%">
      <img src="images/Screenshot%201.png" alt="AgentRelay dashboard" width="100%">
    </td>
    <td width="50%">
      <img src="images/Screenshot%202.png" alt="AgentRelay Telegram bot menu" width="100%">
    </td>
  </tr>
</table>

## Features

- Local admin dashboard at `http://127.0.0.1:3456/dashboard`
- Telegram bot access control by user ID
- SQLite-backed settings, projects, bot channels, and CLI provider registry
- CLI provider detection and model management, including PATH and common local install locations
- Secret redaction in log and settings views
- Localhost-only server binding by default

## Requirements

- Node.js 20.19 or newer
- npm
- A Telegram bot token from BotFather if you want Telegram control
- At least one supported CLI provider installed locally if you want to run AI tasks

## Supported CLI Providers

<table>
  <tr>
    <td align="center" width="120">
      <img src="images/provider-icons/claude.svg" width="48" height="48" alt="Claude Code icon"><br>
      <strong>Claude Code</strong><br>
      <code>claude</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/codex.svg" width="48" height="48" alt="Codex icon"><br>
      <strong>Codex</strong><br>
      <code>codex</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/opencode.svg" width="48" height="48" alt="OpenCode icon"><br>
      <strong>OpenCode</strong><br>
      <code>opencode</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/gemini.svg" width="48" height="48" alt="Gemini icon"><br>
      <strong>Gemini</strong><br>
      <code>gemini</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/github-copilot.svg" width="48" height="48" alt="GitHub Copilot icon"><br>
      <strong>Copilot</strong><br>
      <code>github-copilot</code>
    </td>
  </tr>
  <tr>
    <td align="center" width="120">
      <img src="images/provider-icons/kiro.svg" width="48" height="48" alt="Kiro icon"><br>
      <strong>Kiro</strong><br>
      <code>kiro</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/kilocode.svg" width="48" height="48" alt="Kilo Code icon"><br>
      <strong>Kilo Code</strong><br>
      <code>kilocode</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/aider.svg" width="48" height="48" alt="Aider icon"><br>
      <strong>Aider</strong><br>
      <code>aider</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/goose.svg" width="48" height="48" alt="Goose icon"><br>
      <strong>Goose</strong><br>
      <code>goose</code>
    </td>
    <td align="center" width="120">
      <img src="images/provider-icons/crush.svg" width="48" height="48" alt="Crush icon"><br>
      <strong>Crush</strong><br>
      <code>crush</code>
    </td>
  </tr>
</table>

## Quick Start

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
copy .env.example .env
npm start
```

On macOS/Linux, use this instead of `copy`:

```bash
cp .env.example .env
```

`npm start` also checks whether the built dashboard exists. If `public/dashboard/index.html` is missing, it installs dashboard dependencies when needed and builds the dashboard before starting the server.

Global local install:

```bash
npm install -g .
agentrelay
```

The `agentrelay` command creates a minimal local `.env` when one does not exist, builds the dashboard if needed, starts the admin server, and opens the Web UI. Use `agentrelay --no-open` when you want to start the server without launching a browser.

After this package is published to npm, users can install without cloning the repo:

```bash
npm install -g @vannamdigital/agentrelay
agentrelay
```

Global installs store runtime config, SQLite data, and logs in `~/.agentrelay` by default. Set `AGENTRELAY_HOME` before running `agentrelay` if you want a different data directory.

## Update Notifications

The dashboard checks npm for a newer `@vannamdigital/agentrelay` version after login. When a newer package is available, it shows an update banner with the exact command to run, then the user should restart AgentRelay.

For global installs:

```bash
npm install -g @vannamdigital/agentrelay@latest
agentrelay
```

For cloned repo installs, pull the latest source, reinstall dependencies, rebuild the dashboard, and restart:

```bash
git pull
npm install
npm run build:dashboard
npm start
```

Set `UPDATE_CHECK_ENABLED=false` to disable the npm update check.

If you installed version `2.0.1` globally, migrate any legacy runtime data once before updating:

```powershell
$legacy = Join-Path (npm root -g) '@vannamdigital\agentrelay'
$target = Join-Path $HOME '.agentrelay'
New-Item -ItemType Directory -Force -Path $target
if ((Test-Path "$legacy\.env") -and -not (Test-Path "$target\.env")) { Copy-Item "$legacy\.env" "$target\.env" }
if ((Test-Path "$legacy\data") -and -not (Test-Path "$target\data")) { Copy-Item "$legacy\data" "$target\data" -Recurse }
```

## Configure `.env`

Create `.env` from `.env.example`, then set at least:

```env
SESSION_SECRET=use_a_long_random_session_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ALLOWED_TELEGRAM_USER_IDS=123456789
PROJECTS=C:/path/to/project-one,D:/path/to/project-two
```

Useful local defaults:

```env
ADMIN_PORT=3456
HOST=127.0.0.1
ALLOW_LAN=false
AUTH_COOKIE_SECURE=false
PROJECTS_BASE_DIR=
```

`PROJECTS_BASE_DIR` is optional. Set it when you want to restrict project paths to one or more local folders.

Optional bot channels can also be preloaded from `.env`. Telegram is the only implemented runtime today; WhatsApp, Zalo, Discord, Slack, Messenger, LINE, WeChat Work, and Web Chat credentials are stored so adapters can be added later.

CLI commands can be set explicitly with variables such as `CLAUDE_COMMAND`, `GEMINI_COMMAND`, `KIRO_COMMAND`, `AIDER_COMMAND`, `GOOSE_COMMAND`, `GITHUB_COPILOT_COMMAND`, and `CRUSH_COMMAND`. The dashboard scan checks `PATH` plus common Windows install folders such as npm global, user `.local/bin`, Cargo, Kiro, GitHub CLI, WinGet links, and Claude local install folders.

## Run

```bash
npm start
```

Open:

```text
http://127.0.0.1:3456/dashboard
```

Default first-run admin credentials:

```text
admin / 123456
```

Change this password immediately after first login. The dashboard forces a password change for the default account.

## Development

Backend:

```bash
npm run check
npm test
```

Dashboard:

```bash
cd dashboard
npm install
npm run dev
```

Build dashboard artifact:

```bash
npm run build:dashboard
```

## Project Structure

```text
src/
  index.js                 # main entry point
  bot/                     # Telegram bot lifecycle and configuration
  server/                  # Express API and React SPA host
  cli/                     # local CLI provider detector
  config/                  # SQLite store and migrations
dashboard/                 # React SPA source
wiki/                      # source-of-truth docs and roadmap
scripts/                   # local setup/runtime helper scripts
```

## Security Notes

- The admin server binds to `127.0.0.1` by default.
- Set `ALLOW_LAN=true` only when you intentionally want access from other devices on your LAN.
- Do not expose this app to the internet without a reverse proxy, HTTPS, strong auth, and a reviewed deployment config.
- `.env`, `data/`, `logs/`, SQLite files, `node_modules/`, and built dashboard artifacts are git-ignored.
- `SESSION_SECRET` is required and must be a long random value.
- Session cookies use `httpOnly` and `sameSite=lax`; set `AUTH_COOKIE_SECURE=true` only behind HTTPS.
- `/api` routes have a lightweight in-memory rate limiter.
- Log views and Telegram task summaries redact token/key/secret/password/private-key-looking values before rendering.

## Publishing This Repo

Before pushing to GitHub, verify:

```bash
npm run check
npm test
npm run build:dashboard
npm audit --omit=dev --audit-level=moderate
```

Do not commit:

- `.env`
- `data/`
- `logs/`
- `node_modules/`
- `dashboard/node_modules/`
- `public/dashboard/`

## Documentation

- `wiki/00-source-of-truth.md`
- `wiki/08-tech-debt-and-risks.md`
- `wiki/09-upgrade-roadmap.md`
