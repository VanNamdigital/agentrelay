# Configuration

Create `.env` from `.env.example`, then set at least:

```env
SESSION_SECRET=use_a_long_random_session_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ALLOWED_TELEGRAM_USER_IDS=123456789
PROJECTS=C:/path/to/project-one,D:/path/to/project-two
```

## Server Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `ADMIN_PORT` | `3456` | Express dashboard/API port |
| `HOST` | `127.0.0.1` | Server bind host |
| `ALLOW_LAN` | `false` | Allows LAN binding when explicitly enabled |
| `AUTH_COOKIE_SECURE` | `false` | Use secure cookies behind HTTPS |
| `ADMIN_CORS_ORIGINS` | local URLs | Allowed dashboard/API origins |
| `SESSION_SECRET` | none | Required long random session secret |
| `PROJECTS_BASE_DIR` | empty | Optional comma-separated allowed project roots |
| `UPDATE_CHECK_ENABLED` | `true` | Enables npm update checks after login |

`PROJECTS_BASE_DIR` is optional. Set it when you want to restrict project paths to one or more local folders.

## Telegram

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `ALLOWED_TELEGRAM_USER_IDS` | Comma-separated Telegram user IDs allowed to use the bot |
| `TELEGRAM_ENABLED` | Optional preloaded channel enabled flag |

## CLI Commands

CLI commands can be set explicitly:

```env
CODEX_COMMAND=codex
OPENCODE_COMMAND=opencode
CLAUDE_COMMAND=
GEMINI_COMMAND=
KIRO_COMMAND=
KILOCODE_COMMAND=
AIDER_COMMAND=
GOOSE_COMMAND=
GITHUB_COPILOT_COMMAND=
CRUSH_COMMAND=
COMMAND_CODE_COMMAND=
```

The dashboard scan checks `PATH` plus common Windows install folders such as npm global, user `.local/bin`, Cargo, Kiro, GitHub CLI, WinGet links, and Claude local install folders.

## Models

Models can be imported from `.env`:

```env
CODEX_MODELS=gpt-5.5,gpt-5.4,gpt-5.4-mini,gpt-5.3-codex
CLAUDE_MODELS=claude-3-5-sonnet,claude-3-7-sonnet,claude-sonnet-4,claude-opus-4
COMMAND_CODE_MODELS=default
```

Other providers can be configured in the dashboard by adding model rows manually.

## Optional Bot Channels

Telegram is the implemented runtime today. WhatsApp, Zalo, Discord, Slack, Messenger, LINE, WeChat Work, and Web Chat credentials are stored so adapters can be added later.

## Provider API Keys

AgentRelay does not require provider API keys if the local CLI already manages credentials. Optional keys can be stored in `.env` for future adapter use:

```env
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
OPENCODE_API_KEY=
```
