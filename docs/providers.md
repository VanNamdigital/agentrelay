# CLI Providers

AgentRelay stores providers in SQLite and exposes valid, enabled providers to Telegram users. A provider is usable when:

- The command is configured.
- The command is detected or manually tested successfully.
- At least one model is enabled for that provider.
- The provider itself is enabled.

> Runtime support note: Telegram prompt execution is currently verified for OpenCode CLI. Other providers may be detected and configured, but their Telegram runners are still being updated.

## Supported Providers

| Provider | Default command | Notes |
| --- | --- | --- |
| Codex CLI | `codex` | Bot uses `codex exec` with JSON output |
| OpenCode CLI | `opencode` | Bot uses `opencode run --format json` |
| Command Code CLI | `command-code` | Bot uses `--print`, `--trust`, `--skip-onboarding`, and `--auto-accept` |
| Claude Code CLI | `claude` | Detection and model suggestions are supported |
| Gemini CLI | `gemini` | Detection supported |
| Kiro CLI | `kiro` | Detection supported |
| Kilo Code CLI | `kilocode` | Detection supported |
| Aider CLI | `aider` | Detection supported |
| Goose CLI | `goose` | Detection supported |
| GitHub Copilot CLI | `gh` | Disabled by default until configured |
| Crush CLI | `crush` | Detection supported |

## Scanning

The dashboard `Scan local CLI` action detects all providers in parallel. Version checks are async so the Express event loop stays responsive while slow CLIs start up.

## Command Code

Install Command Code globally:

```bash
npm i -g command-code
```

Then log in with the CLI:

```bash
command-code login
```

Command Code also publishes the short `cmd` binary, but AgentRelay defaults to `command-code` to avoid collision with Windows `cmd.exe`.

The official CLI reference documents non-interactive mode with `--print`; it does not currently document a `--model` flag. AgentRelay therefore treats the Command Code model row as `default` and lets the CLI/account choose the active model.

## Adding a Provider in Code

Provider support usually touches:

- `src/cli/detector.js` for detection aliases and model helpers
- `src/config/store.js` for default provider rows and `.env` command keys
- `src/bot/index.js` for Telegram task execution arguments
- `dashboard/src/pages/CLIProviders.jsx` for the dashboard visual
- `images/provider-icons/` for README/docs assets
- `.env.example` and docs

Add focused tests when provider parsing or command construction has logic beyond simple constants.
