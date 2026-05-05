# Security Policy

AgentRelay is designed for personal local use.

## Supported Use

- Run the admin server on `127.0.0.1`.
- Keep `ALLOW_LAN=false` unless you intentionally need LAN access.
- Do not expose the app directly to the internet.
- Keep `.env`, `data/`, `logs/`, and SQLite files out of git.
- Rotate any token that was accidentally committed or shared.

## Reporting Security Issues

If you find a security issue, open a private report if the repository host supports it. Otherwise, contact the repository owner directly before publishing details.

Please include:

- Affected version or commit
- Steps to reproduce
- Expected and actual behavior
- Whether secrets, project files, or command execution are exposed
