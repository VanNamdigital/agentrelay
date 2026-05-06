# Security

AgentRelay is designed for personal local use.

## Defaults

- The admin server binds to `127.0.0.1` by default.
- `ALLOW_LAN=false` by default.
- `.env`, `data/`, `logs/`, SQLite files, `node_modules/`, and built dashboard artifacts are git-ignored.
- Session cookies use `httpOnly` and `sameSite=lax`.
- `/api` routes have a lightweight in-memory rate limiter.
- Log views and Telegram task summaries redact token/key/secret/password/private-key-looking values before rendering.

## Hardening

- Use a long random `SESSION_SECRET`.
- Change the default admin password immediately after first login.
- Keep `ALLOW_LAN=false` unless you intentionally need LAN access.
- Set `PROJECTS_BASE_DIR` to restrict project paths.
- Do not expose AgentRelay directly to the internet.
- If remote access is required, put it behind a reviewed reverse proxy with HTTPS and strong authentication.

## Secret Handling

Do not commit:

- `.env`
- `data/`
- `logs/`
- SQLite files
- local project paths
- provider tokens or API keys

Rotate any token that was accidentally committed or shared.
