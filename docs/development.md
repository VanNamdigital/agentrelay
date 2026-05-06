# Development

## Backend

```bash
npm install
npm run check
npm test
```

## Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Build dashboard artifacts:

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
docs/                      # public user and contributor documentation
wiki/                      # internal design docs and agent development rules
scripts/                   # local setup/runtime helper scripts
```

## Checks Before PRs

```bash
npm run check
npm test
npm run build:dashboard
npm audit --omit=dev --audit-level=moderate
```

Keep changes scoped, testable, and safe for personal machines.
