# Contributing

AgentRelay is a local-first tool. Keep changes scoped, testable, and safe for personal machines.

## Local Setup

```bash
npm install
npm run install:dashboard
npm run build:dashboard
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env`.

## Checks

Run these before opening a pull request:

```bash
npm run check
npm test
npm run build:dashboard
npm audit --omit=dev --audit-level=moderate
```

## Rules

- Do not commit `.env`, tokens, logs, SQLite data, or local project paths.
- Do not weaken localhost-only defaults.
- Do not add internet-facing deployment defaults without security review.
- Add focused tests for auth, settings, CLI execution, path handling, and secret redaction changes.
