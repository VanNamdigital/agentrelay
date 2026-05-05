# AgentRelay React Dashboard

This folder contains the React/Vite SPA source. This is now the primary product admin UI served at `/dashboard/`.

## Development

```bash
cd dashboard
npm install
npm run dev
```

The dev server runs on:

```text
http://127.0.0.1:3000
```

API requests are proxied to:

```text
http://127.0.0.1:3456
```

## Build

From the repo root:

```bash
npm run build:dashboard
```

The generated files go to `public/dashboard/`, which is ignored by git.

## Structure

```text
dashboard/
  src/
    components/
    pages/
    styles/
  index.html
  vite.config.js
```

## Current Status

- React 18, React Router v6, Vite.
- UI screens are present for login, forced password change, dashboard, bot configuration, CLI providers, projects, access control, logs, and settings.
- Bot Configuration includes Telegram plus planned bot app modules for WhatsApp, Zalo, Discord, Slack, Messenger, LINE, WeChat Work, and Web Chat.
- System language can be set to English, Vietnamese, Russian, or Chinese.
- API integration uses the Express `/api` JSON routes.

Use `wiki/00-source-of-truth.md` and `wiki/09-upgrade-roadmap.md` for the current architecture and migration plan.
