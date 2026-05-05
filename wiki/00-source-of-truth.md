# AgentRelay - Source of Truth

> Last updated: 2026-04-30
> Status: modular runtime is the active source of truth.

## 1. System Overview

AgentRelay is a local Telegram bot plus admin dashboard for controlling AI CLI tools from a single machine. The active architecture is no longer the old root `index.js` monolith. The runtime now starts from `src/index.js` and uses the modular `src/` tree.

Primary goals:

- Control local AI CLI providers through Telegram.
- Manage bot, users, projects, providers, models, and logs from an admin dashboard.
- Keep runtime configuration in SQLite instead of scattered process memory.
- Preserve local-first operation; no Docker or multi-instance deployment exists yet.

## 2. Active Runtime

```text
npm start -> node src/index.js
```

`src/index.js` loads `.env`, starts the Express admin server, imports initial configuration into SQLite, and starts the Telegram bot if `telegram_enabled=true` is stored in the database.

The removed legacy root `index.js` used in-memory session state and only handled the older monolithic Telegram flow. New work must target `src/`.

## 3. Repository Structure

```text
bot/
  src/
    index.js                 # main process bootstrap
    bot/                     # Telegram bot lifecycle and SQLite-backed config
    server/                  # Express API and React SPA host
      middleware/            # auth and rate-limit middleware
      routes/                # single API route module
    cli/                     # CLI provider detection and model discovery helpers
    config/                  # better-sqlite3 store and migrations
    auth/                    # password hashing
    settingsConfig.js        # env/settings utilities and secret redaction
    utils.js                 # shared text/formatting helpers
  dashboard/                 # React SPA source
  tests/                     # Vitest tests
  wiki/                      # consolidated documentation
```

## 4. Business Logic

Current capabilities:

- Telegram bot lifecycle management through `src/bot/index.js`.
- SQLite-backed settings, admin users, Telegram allowlist users, projects, CLI providers, and models.
- CLI provider registry supports 10 providers:
  `codex`, `opencode`, `claude`, `gemini`, `kiro`, `kilocode`, `aider`, `goose`, `github-copilot`, `crush`.
- Admin dashboard exists as one React SPA source tree in `dashboard/`, served by Express at `/dashboard/`.

Important limitation:

- Full Telegram command parity from the deleted monolith still needs to be completed inside `src/bot/`.
- CLI task execution still lacks a durable queue, retry policy, and persisted task/session state.

## 5. Architecture

```text
Telegram user
    |
    v
Telegraf bot (src/bot)
    |
    v
SQLite config store (src/config/store.js)
    |
    +--> CLI provider registry and models
    +--> Projects and allowed Telegram users

Browser
    |
    v
Express admin/API server (src/server)
    |
    +--> Internal API (/api)
    +--> React SPA source/build path (dashboard/ -> public/dashboard)
```

## 6. Configuration

Required environment:

```env
SESSION_SECRET=change_this_to_a_long_random_session_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ALLOWED_TELEGRAM_USER_IDS=123456789
PROJECTS=G:/projects/project-one,G:/projects/project-two
```

Optional runtime defaults:

```env
ADMIN_PORT=3456
ADMIN_CORS_ORIGINS=http://127.0.0.1:3456,http://localhost:3456,http://127.0.0.1:3000,http://localhost:3000
TASK_TIMEOUT_MINUTES=120
CODEX_COMMAND=codex
OPENCODE_COMMAND=opencode
```

Do not commit `.env`, `data/`, `logs/`, SQLite files, generated sessions, or local build/cache output.

## 7. Security Baseline

Implemented in the consolidated runtime:

- `.env` is ignored by git.
- Admin passwords use `bcryptjs`.
- Admin session cookies are `httpOnly`.
- `SESSION_SECRET` is required; no hardcoded session secret fallback remains.
- CORS is restricted to configured origins instead of `origin: true`.
- `/api` has a lightweight in-memory rate limiter.
- Log views redact secret-looking values before rendering.

Still missing:

- Helmet.js headers.
- CSRF protection.
- Central request validation.
- Central log redaction at write time.
- Persistent/distributed rate limiting.
- API contract/OpenAPI spec.

## 8. API Contract

The internal API currently lives in `src/server/routes/api.js`.

Known status:

- No OpenAPI spec.
- No API versioning.
- Request validation is minimal and route-local.
- React dev proxy now targets the active default server port `3456`.

## 9. Frontend/UI

Current UI state:

- React SPA under `dashboard/` is the primary product admin UI served at `/dashboard/`.
- The SPA includes login, forced first password change, dashboard, bot configuration, CLI providers, projects, access control, logs, and general settings.
- The old server-rendered dashboard has been removed to keep one UI path.
- Responsive behavior exists for desktop/tablet, but full accessibility QA is still pending.

## 10. Database

SQLite is managed through `better-sqlite3` in `src/config/store.js`.

Current schema version: `2`

Tracked entities:

- `settings`
- `admin_users`
- `telegram_users`
- `projects`
- `cli_providers`
- `cli_models`

Known gap:

- Runtime session/task state is not fully consolidated into SQLite yet.

## 11. Runtime/Operations

Current status:

- Local Node.js runtime only.
- No Dockerfile or docker-compose.
- No PM2/systemd config.
- No health endpoint or metrics endpoint.
- SQLite WAL mode is enabled.
- SQLite is not suitable for multi-instance runtime without redesign.

## 12. Testing

Current tests:

- `tests/settingsConfig.test.js`
- `tests/utils.test.js`

Coverage is low and focused on settings/text helpers only. Bot, API, DB, auth, and task execution need tests before deeper refactors.

## 13. Consolidated Audit Summary

The 2026-04-30 system audit found:

- Legacy monolith and modular runtime were previously running side by side.
- Source-of-truth docs were stale and did not match the modular architecture.
- Admin UI was previously split between two dashboard implementations.
- Test coverage was very low.
- CORS was previously open to all origins.
- Session secret previously had a hardcoded fallback.
- API lacked OpenAPI, validation, and global error handling.
- Sessions/tasks were not fully persisted to SQLite.
- No Docker, PM2/systemd, health check, metrics, or CI/CD existed.

This consolidation removed the root monolith entry point, made `src/` the runtime entry, fixed the dashboard proxy, restricted CORS, required `SESSION_SECRET`, added API rate limiting, added global error handling, removed the old dashboard, and consolidated documentation.

## 14. Absolute Rules

- Do not reintroduce a root `index.js` runtime monolith.
- Do not store new runtime state only in process memory if it must survive restart.
- Do not hardcode secrets, tokens, or local private paths.
- Do not expose raw logs or secrets in UI/API responses.
- Do not add another dashboard documentation file at repo root; update `wiki/` instead.
