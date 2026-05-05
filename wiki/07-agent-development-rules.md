# Agent Development Rules

> Last updated: 2026-04-30

## 1. Context Loading Order

For a new task, read:

1. `wiki/00-source-of-truth.md`
2. `wiki/07-agent-development-rules.md`
3. `wiki/08-tech-debt-and-risks.md` for refactor/hardening work
4. `wiki/09-upgrade-roadmap.md` for sequencing
5. Relevant source files under `src/`
6. `README.md` and `.env.example` when setup/config changes

Do not use the removed root `index.js` as a source of truth.

## 2. Active Code Boundaries

- Runtime entry: `src/index.js`
- Telegram bot: `src/bot/`
- Express admin/API: `src/server/`
- SQLite store: `src/config/store.js`
- CLI detection: `src/cli/detector.js`
- Shared helpers: `src/utils.js`, `src/settingsConfig.js`
- React SPA source: `dashboard/`

New runtime work should land in `src/`, not in repo-root scripts unless it is a developer utility.

## 3. Before Editing Code

- Identify the layer: bot, CLI, API, DB, auth, UI, docs, or runtime.
- Check `.env.example` when adding/changing environment variables.
- Update `README.md` and `wiki/00-source-of-truth.md` when architecture/setup changes.
- Do not read, print, copy, or document real secrets from `.env`.
- Preserve the SQLite-backed configuration model unless the roadmap explicitly changes it.

## 4. Code Style

- JavaScript runtime code uses CommonJS: `require(...)` and `module.exports`.
- Prefer `async/await` for async control flow.
- Use 4-space indentation in backend code.
- Use single quotes for static strings.
- Keep route validation explicit and close to the route until a shared schema layer exists.
- Escape dynamic HTML before sending Telegram or rendering unsafe user-controlled content.
- Avoid adding dependencies when native Node.js or existing packages are enough.

## 5. Required Checks

Run at minimum:

```bash
npm test
npm run check
```

For frontend changes, also run:

```bash
npm run build:dashboard
```

If startup behavior changed, smoke test with a real `SESSION_SECRET` in the environment.

## 6. Forbidden Actions

- Do not reintroduce a root `index.js` monolith.
- Do not commit `.env`, `logs/`, `data/`, `node_modules/`, or generated SQLite/session files.
- Do not hardcode Telegram IDs, tokens, API keys, or private project paths.
- Do not expose raw long CLI output directly to Telegram without chunking/summarizing.
- Do not add unauthenticated admin/API routes.
- Do not use `origin: true` CORS.
- Do not add a hardcoded fallback for `SESSION_SECRET`.
- Do not create new root dashboard docs; consolidate docs in `wiki/`.

## 7. Required Security Behavior

- All admin routes must use the auth middleware unless intentionally public.
- API responses and log views must redact secret-looking values.
- New form/API routes must validate input before writing to SQLite or launching commands.
- New CLI execution code must have timeout and cancellation paths.
- New Telegram handlers must check allowlisted users.

## 8. Feature Guidance

### Telegram Bot Features

Add feature work under `src/bot/` and supporting modules. If implementing CLI execution, keep process spawning, output parsing, timeout, cancellation, and session persistence separated enough to test.

### CLI Providers

Update provider metadata in:

- `src/config/store.js`
- `src/cli/detector.js`
- admin/API routes if a new provider needs custom behavior

### API Routes

Add new routes under `src/server/routes/`, keep auth explicit, and add validation. If a route is consumed by React, document it in the source-of-truth or future OpenAPI spec.

### UI Changes

All admin UI work targets the React SPA under `dashboard/`. Do not add a second server-rendered dashboard path.

## 9. Review Checklist

- `src/` is still the active runtime.
- Tests/checks pass or failures are documented.
- Secrets are not printed in output, docs, or logs.
- `.env.example` matches new env requirements.
- Docs are updated when architecture/setup changes.
- Deleted old docs are not replaced with new conflicting root docs.
