# Tech Debt and Risks

> Last updated: 2026-04-30

## Risk Matrix

| ID | Area | Severity | Status | Notes |
|---|---|---:|---|---|
| TD-001 | Telegram bot parity | High | Open | Root monolith was removed; full command/session/task flow must be completed in `src/bot/`. |
| TD-002 | Test coverage | High | Open | Only settings and utility tests exist. Bot/API/DB/auth/task paths are untested. |
| TD-003 | UI split | Low | Closed | The old dashboard was removed; React SPA is the only admin UI path. |
| TD-004 | Session/task persistence | High | Open | SQLite stores config, but runtime session/task state is not fully persisted. |
| TD-005 | API validation | High | Open | Routes accept request bodies with minimal validation. |
| TD-006 | Production runtime | High | Open | No Docker, PM2/systemd, health check, metrics, or CI/CD. |
| TD-007 | Security hardening | Medium | Partial | CORS/session secret/rate limiting improved; Helmet, CSRF, centralized redaction still missing. |
| TD-008 | Background jobs | Medium | Open | CLI processes run directly without durable queue, retry, or concurrency control. |
| TD-009 | Database scalability | Medium | Open | SQLite WAL is fine for local single-instance, not for multi-instance scaling. |
| TD-010 | API contract | Medium | Open | No OpenAPI spec or `/api/v1` versioning. |

## Detailed Notes

### TD-001 - Telegram bot parity

The legacy root `index.js` monolith used to contain the full Telegram command flow, in-memory session handling, CLI execution, streaming, timeout, cancel, logs, and menus. The active runtime is now `src/index.js`; therefore all missing behavior must be rebuilt or completed in `src/bot/` and supporting modules.

Risk: users can lose Telegram workflow parity until the modular bot is completed.

Next action: write focused tests around expected Telegram states and implement CLI execution/session handling in modules.

### TD-002 - Test coverage

Current tests cover only `settingsConfig` and `utils`. There are no tests for:

- Telegram auth and handlers
- Express API routes
- SQLite store migrations
- Admin auth/password change flow
- CLI provider detection error paths
- CLI task timeout/cancel behavior

Risk: refactors can break runtime behavior without detection.

### TD-003 - UI split

Closed. The old server-rendered dashboard and routes were removed. The only admin UI is the React SPA under `dashboard/`, backed by `/api` JSON routes.

### TD-004 - Session/task persistence

SQLite stores configuration entities, but task/session state is not fully durable. Restarting the process still loses active task references.

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
- UI log rendering redacts secret-looking values.

Still needed:

- Helmet.js
- CSRF protection for form routes
- Central log writer with redaction before disk write
- Persistent rate limiter if deployed beyond localhost
- Removal or forced rotation of default admin password after first login

### TD-008 - Background jobs

CLI execution still needs a real job abstraction with retry, timeout, concurrency, cancellation, and persisted state.

Recommended later target: Bull/BullMQ with Redis, or a simpler SQLite-backed local queue if single-instance remains the product target.

### TD-009 - Database scalability

SQLite with WAL is acceptable for local single-user/single-instance use. It is not enough for multi-instance web/API workers.

Recommended later target: PostgreSQL with Prisma or a migration tool.

### TD-010 - API contract

The internal API exists but is not documented as a contract.

Risk: React dashboard and server routes can drift.

Next action: write `openapi.yaml` before broader frontend consolidation.
