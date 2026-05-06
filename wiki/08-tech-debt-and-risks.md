# Tech Debt and Risks

> Last updated: 2026-05-06

## Risk Matrix

| ID | Area | Severity | Status | Notes |
|---|---|---:|---|---|
| TD-001 | Telegram bot parity | High | Partial | Modular bot handles provider/project/model flow, and prompt execution now supports `codex`, `opencode`, `claude`, `gemini`, `kiro`, `kilocode`, and `command-code`. Remaining providers are still detect/config only. |
| TD-002 | Test coverage | High | Open | Tests now cover detector registry plus settings/update/utils helpers. Bot/API/DB/auth/task paths are still mostly untested. |
| TD-003 | UI split | Low | Closed | The old dashboard was removed; React SPA is the only admin UI path. |
| TD-004 | Session/task persistence | High | Open | SQLite stores config, but runtime session/task state is not fully persisted. |
| TD-005 | API validation | High | Open | Routes accept request bodies with minimal validation. |
| TD-006 | Production runtime | High | Open | No Docker, PM2/systemd, health check, metrics, or CI/CD. |
| TD-007 | Security hardening | Medium | Partial | CORS/session secret/rate limiting improved; Helmet, CSRF, centralized redaction still missing. |
| TD-008 | Background jobs | Medium | Open | CLI tasks run directly without durable queue, retry, or persisted state. |
| TD-009 | Database scalability | Medium | Open | SQLite WAL is fine for local single-instance, not for multi-instance scaling. |
| TD-010 | API contract | Medium | Open | No OpenAPI spec or `/api/v1` versioning. |
| TD-011 | CLI scan event loop blocking | Medium | Closed | Provider scan now uses async child processes and parallel provider detection. |
| TD-012 | Public docs organization | Low | Closed | README is concise and public docs live under `docs/`; internal notes remain in `wiki/`. |

## Detailed Notes

### TD-001 - Telegram bot parity

The active modular bot supports provider selection, project selection, model selection, status, cancel, logs, settings link, and task execution for `codex`, `opencode`, `claude`, `gemini`, `kiro`, `kilocode`, and `command-code`.

OpenCode and Kilo Code execution are hardened for Windows npm wrappers: child stdin is closed for non-interactive JSON providers, npm `.cmd` wrappers are resolved to their Node entrypoints when possible, JSON stream output is parsed so completed runs clear the Telegram `Running` state, long-running tasks send heartbeat/progress messages instead of staying silent, and tool-call events are summarized as short progress logs while the final reply stays answer-only. Codex, Claude, and Gemini execution parse JSONL events. Kiro and Command Code execution use headless plain text output with stdin kept open only for confirmation prompts and the same heartbeat/final-summary flow.

Remaining gap: providers other than `codex`, `opencode`, `claude`, `gemini`, `kiro`, `kilocode`, and `command-code` can be detected and configured but cannot execute prompts through Telegram until `buildRunCommand()` supports them.

Risk: users may see a provider as configured in the dashboard but still receive "task not implemented" in Telegram.

Next action: define run-command patterns per provider and add tests around command construction.

### TD-002 - Test coverage

Current tests cover:

- CLI provider registry basics
- settings config and redaction
- update check helpers
- text utility helpers

There are no focused tests for:

- Telegram auth and handlers
- Express API routes
- SQLite store migrations
- Admin auth/password change flow
- CLI provider detection error paths and timeouts
- CLI task timeout/cancel behavior

Risk: refactors can break runtime behavior without detection.

### TD-003 - UI split

Closed. The old server-rendered dashboard and routes were removed. The only admin UI is the React SPA under `dashboard/`, backed by `/api` JSON routes.

### TD-004 - Session/task persistence

SQLite stores configuration entities, but task/session state is not durable. Restarting the process still loses active task references.

Risk: status/cancel/resume behavior cannot be reliable after process restart.

### TD-005 - API validation

Several routes directly trust request body/query values. Some route-local checks exist, but there is no shared schema validation layer.

Risk: malformed input can create inconsistent DB records or unexpected command/provider state.

### TD-006 - Production runtime

The app currently runs as a local Node process. There is no container image, compose stack, service manager config, health endpoint, metrics endpoint, or CI/CD workflow.

Risk: deployment and recovery are manual.

### TD-007 - Security hardening

Improved:

- CORS restricted to configured origins.
- `SESSION_SECRET` is required.
- `/api` has an in-memory rate limiter.
- UI log rendering and Telegram task summaries redact secret-looking values.

Still needed:

- Helmet.js
- CSRF protection for form routes
- Central log writer with redaction before disk write
- Persistent rate limiter if deployed beyond localhost
- Stronger default admin password lifecycle

### TD-008 - Background jobs

CLI execution still needs a real job abstraction with retry, timeout, concurrency, cancellation, and persisted state.

Recommended later target: a SQLite-backed local queue if single-instance remains the product target; Redis/BullMQ only if multi-instance or distributed jobs become a product goal.

### TD-009 - Database scalability

SQLite with WAL is acceptable for local single-user/single-instance use. It is not enough for multi-instance web/API workers.

Recommended later target: PostgreSQL with Prisma or a migration tool only if multi-instance deployment is required.

### TD-010 - API contract

The internal API exists but is not documented as a contract.

Risk: React dashboard and server routes can drift.

Next action: write `openapi.yaml` before broader frontend/API consolidation.

### TD-011 - CLI scan event loop blocking

Closed. `src/cli/detector.js` no longer uses `spawnSync`; scan, test command, and model detection are async. `detectAllClis()` runs providers in parallel.

Residual risk: directory scans still use synchronous filesystem checks, but they are local and cheap compared with CLI process startup.

### TD-012 - Public docs organization

Closed. README is a concise landing page, public docs live in `docs/`, and internal source-of-truth remains in `wiki/`.
