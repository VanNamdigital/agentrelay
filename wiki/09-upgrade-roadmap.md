# Upgrade Roadmap

> Last updated: 2026-05-06

## Phase 1 - Critical Consolidation

Target: 1-2 weeks.

Status:

- Done: make `src/index.js` the main entry point.
- Done: remove the legacy root `index.js` monolith from the active tree.
- Done: update `package.json` scripts to run `src/index.js`.
- Done: restrict CORS instead of `origin: true`.
- Done: require `SESSION_SECRET` and remove hardcoded session secret fallback.
- Done: add lightweight `/api` rate limiting.
- Done: redact secret-looking values in dashboard/log views and Telegram task summaries.
- Done: fix React dev proxy from port `4878` to the active server port `3456`.
- Done: make the React SPA the primary `/dashboard/` admin UI.
- Done: add JSON API auth/session endpoints for React login and forced password change.
- Done: connect React pages to persistent backend config for bot, CLI providers, projects, users, logs, and settings.
- Done: remove the old dashboard routes/views and unused React mock pages.
- Done: make CLI provider scan async and parallel.
- Done: add Command Code CLI provider support.
- Done: split public documentation into `docs/` and keep internal source-of-truth in `wiki/`.

Remaining Phase 1 work:

- Add Telegram execution support for configured providers beyond `codex`, `opencode`, and `command-code`, or clearly mark non-executable providers in UI.
- Centralize log writes so secrets are redacted before reaching disk.
- Add input validation for high-risk API routes.
- Add a `/healthz` endpoint.

## Phase 2 - Code Quality and Stability

Target: 2-3 weeks.

Work:

- Keep the runtime on the single React SPA + API path; avoid adding parallel UI flows.
- Add ESLint and Prettier.
- Increase test coverage toward 70%.
- Add tests for:
  - bot auth and command state machine
  - provider command construction
  - API routes
  - SQLite migrations/store operations
  - admin auth/password flow
  - CLI detector timeout/error behavior
  - task timeout/cancel behavior
- Move runtime session/task storage into SQLite or a dedicated queue store.
- Add structured error handling for async route failures.
- Review localization strings and fix any encoding issues in non-English dictionaries.

## Phase 3 - Production Hardening

Target: 3-4 weeks.

Work:

- Add Dockerfile and docker-compose if local container use is desired.
- Add PM2 or systemd service configuration.
- Add health check and basic metrics endpoints.
- Add Helmet.js.
- Add CSRF protection for form routes.
- Add OpenAPI spec for internal API.
- Add centralized structured logging with redaction before disk write.
- Add backup/restore notes for SQLite data.

## Phase 4 - Scalability

Target: 4-6 weeks.

Work:

- Move from SQLite to PostgreSQL only if multi-instance deployment becomes a product target.
- Introduce Prisma or a dedicated migration layer if the database model outgrows raw SQL migrations.
- Add durable CLI jobs:
  - retry
  - timeout
  - cancellation
  - concurrency limits
  - persisted status
- Add CI/CD with GitHub Actions for test/build/check.
- Add `/api/v1` versioning.

## Current Release Gate

Do not call the modular runtime production-ready until these are complete:

- Telegram provider execution support is either complete or the UI clearly distinguishes detect-only providers from executable providers.
- Bot/API/auth/store test coverage exists for critical paths.
- Logs are redacted before disk write, not only before UI render.
- A health endpoint exists.
- Default admin password flow is hardened.
