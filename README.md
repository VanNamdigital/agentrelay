# AgentRelay

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js >=20.19](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen.svg)](package.json)
[![npm package](https://img.shields.io/badge/npm-%40vannamdigital%2Fagentrelay-red.svg)](https://www.npmjs.com/package/@vannamdigital/agentrelay)

AgentRelay is a local-first Telegram bot and admin dashboard for controlling AI CLI providers from your own machine.

It is intended for personal local use. Do not expose it directly to the internet.

> Runtime support note: the Telegram bot currently has verified prompt execution for OpenCode CLI. Other CLI providers are being updated and may be limited to detection/configuration until their runners are completed.

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
- SQLite-backed settings, projects, bot channels, provider registry, and model registry
- Async local CLI detection across PATH and common install locations
- Secret redaction in logs, settings views, and task summaries
- Localhost-only server binding by default

## Quick Start

```bash
npm install
npm run install:dashboard
npm run build:dashboard
cp .env.example .env
npm start
```

On Windows, use `copy .env.example .env` or run `setup-dashboard.bat`.

Open:

```text
http://127.0.0.1:3456/dashboard
```

Default first-run admin credentials:

```text
admin / 123456
```

Change this password immediately after first login.

## Supported CLI Providers

<table>
  <tr>
    <td align="center" width="120"><img src="images/provider-icons/claude.svg" width="48" height="48" alt="Claude Code icon"><br><strong>Claude Code</strong><br><code>claude</code></td>
    <td align="center" width="120"><img src="images/provider-icons/codex.svg" width="48" height="48" alt="Codex icon"><br><strong>Codex</strong><br><code>codex</code></td>
    <td align="center" width="120"><img src="images/provider-icons/opencode.svg" width="48" height="48" alt="OpenCode icon"><br><strong>OpenCode</strong><br><code>opencode</code></td>
    <td align="center" width="120"><img src="images/provider-icons/command-code.svg" width="48" height="48" alt="Command Code icon"><br><strong>Command Code</strong><br><code>command-code</code></td>
    <td align="center" width="120"><img src="images/provider-icons/gemini.svg" width="48" height="48" alt="Gemini icon"><br><strong>Gemini</strong><br><code>gemini</code></td>
  </tr>
  <tr>
    <td align="center" width="120"><img src="images/provider-icons/kiro.svg" width="48" height="48" alt="Kiro icon"><br><strong>Kiro</strong><br><code>kiro</code></td>
    <td align="center" width="120"><img src="images/provider-icons/kilocode.svg" width="48" height="48" alt="Kilo Code icon"><br><strong>Kilo Code</strong><br><code>kilocode</code></td>
    <td align="center" width="120"><img src="images/provider-icons/aider.svg" width="48" height="48" alt="Aider icon"><br><strong>Aider</strong><br><code>aider</code></td>
    <td align="center" width="120"><img src="images/provider-icons/github-copilot.svg" width="48" height="48" alt="GitHub Copilot icon"><br><strong>Copilot</strong><br><code>github-copilot</code></td>
    <td align="center" width="120"><img src="images/provider-icons/crush.svg" width="48" height="48" alt="Crush icon"><br><strong>Crush</strong><br><code>crush</code></td>
  </tr>
</table>

## Documentation

- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [CLI providers](docs/providers.md)
- [Telegram bot](docs/telegram-bot.md)
- [Security hardening](docs/security.md)
- [Development](docs/development.md)
- [Publishing](docs/publishing.md)
- [Upgrading](docs/upgrading.md)

Internal design notes remain in `wiki/`.
