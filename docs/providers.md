# CLI Providers

AgentRelay stores providers in SQLite and exposes valid, enabled providers to Telegram users. A provider is usable when:

- The command is configured.
- The command is detected or manually tested successfully.
- At least one model is enabled for that provider.
- The provider itself is enabled.

> Runtime support note: Telegram prompt execution is currently wired for OpenCode CLI, Codex CLI, Claude Code CLI, Gemini CLI, Command Code CLI, Kiro CLI, and Kilo Code CLI. Other providers may be detected and configured, but their Telegram runners are still being updated.

## Supported Providers

| Provider | Default command | Notes |
| --- | --- | --- |
| Codex CLI | `codex` | Bot uses `codex exec --json` and parses JSONL events |
| OpenCode CLI | `opencode` | Bot uses `opencode run --format json` |
| Command Code CLI | `command-code` | Bot uses `--print`, `--trust`, and `--skip-onboarding` |
| Claude Code CLI | `claude` | Bot uses `claude -p --output-format stream-json` and parses JSONL events |
| Gemini CLI | `gemini` | Bot uses `gemini -p --output-format stream-json` and parses JSONL events |
| Kiro CLI | `kiro-cli` | Bot uses `kiro-cli chat --no-interactive`; approved runs add `--trust-all-tools` |
| Kilo Code CLI | `kilo` | Bot uses `kilo run --format json` and parses OpenCode-compatible events |
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

The official CLI reference documents non-interactive mode with `--print`; it does not currently document a `--model` flag. AgentRelay therefore treats the Command Code model row as `default` and lets the CLI/account choose the active model. Command Code currently returns plain non-interactive output, so AgentRelay uses the same heartbeat and final-summary path as Kiro.

## Kiro

Kiro's headless mode requires `KIRO_API_KEY` in the environment and uses `kiro-cli chat --no-interactive`. Telegram asks for approval before starting the task. When the user chooses `Approve run` or has enabled `Always approve` for Kiro, AgentRelay adds `--trust-all-tools` so Kiro can continue without pausing for terminal tool confirmation. When a non-default model is selected, AgentRelay passes it with `--model`. The `kiro` command may route to the IDE depending on local integration settings, so `kiro-cli` is the preferred configured command. Legacy Kiro 0.x IDE commands are detected but blocked for Telegram prompt execution because they do not support headless `--no-interactive`.

## Kilo Code

Kilo Code's headless mode uses `kilo run`. AgentRelay requests raw JSON events with `--format json`, starts the task in the selected project with `--dir`, uses `--auto` for non-interactive pipeline execution, passes non-default models with `-m`, and reuses the OpenCode stream parser for progress and final-answer extraction. Kilo model detection keeps full CLI model IDs such as `kilo/kilo-auto/free`; short aliases such as `balanced` are not passed as provider model IDs.

## Codex

Codex non-interactive mode uses `codex exec --json`. AgentRelay parses JSONL events such as thread start, agent message deltas, final agent messages, tool items, and turn completion so Telegram receives a clean final answer instead of raw JSON.

## Claude Code

Claude Code non-interactive mode uses `claude -p --output-format stream-json --verbose --include-partial-messages`. AgentRelay disables session persistence for one-shot Telegram tasks, passes non-default models with `--model`, and parses JSONL events for progress and final-result extraction. Claude Code requires `--verbose` with stream JSON output. Claude Code does not currently expose a stable model-list command in CLI help; if detection returns no models, AgentRelay creates a single `default` model only when no model is configured yet. Add aliases such as `sonnet`, `opus`, or `haiku` manually if you want explicit model choices.

## Gemini CLI

Gemini CLI headless mode uses `gemini -p`. AgentRelay requests `--output-format stream-json`, passes non-default models with `-m`, and parses JSONL events for session, message, error, and result updates. Gemini CLI tool events are kept out of Telegram progress messages to avoid noisy repeated updates. Gemini CLI does not currently expose a stable model-list command in CLI help; if detection returns no models, AgentRelay creates a single `default` model only when no model is configured yet. Add concrete Gemini model names manually when needed.

## Adding a Provider in Code

Provider support usually touches:

- `src/cli/detector.js` for detection aliases and model helpers
- `src/config/store.js` for default provider rows and `.env` command keys
- `src/bot/index.js` for Telegram task execution arguments
- `dashboard/src/pages/CLIProviders.jsx` for the dashboard visual
- `images/provider-icons/` for README/docs assets
- `.env.example` and docs

Add focused tests when provider parsing or command construction has logic beyond simple constants.
