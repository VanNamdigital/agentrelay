# Changelog

All notable changes to AgentRelay are documented here.

This project follows the spirit of Keep a Changelog and uses semantic versioning once published.

## Unreleased

## 2.0.6 - 2026-05-06

### Fixed

- Fixed global installs where supported CLI providers could scan as detected but remain unusable because the global runtime database had no enabled models.
- Made `Scan local CLI` seed supported provider models automatically, including Codex defaults, Claude/Gemini fallback `default`, Kiro `auto`, Kilo Code full model IDs, and Command Code `default`.
- Auto-enabled newly scanned runnable providers when their previous global runtime entry had no model configuration.

## 2.0.5 - 2026-05-06

### Added

- Added Telegram task runners for Codex CLI, Claude Code CLI, Gemini CLI, Kiro CLI, Kilo Code CLI, and Command Code CLI.
- Added CLI output parsers for Codex JSONL, Claude stream JSON, Gemini stream JSON, and Kilo/OpenCode JSON event streams.
- Added Telegram confirmation handling for CLI prompts with `Approve run`, `Do not run`, and session-scoped `Always approve`.
- Added a dashboard `Clear logs` action for `logs/app.log`.

### Changed

- Updated Kiro detection to prefer `kiro-cli` and detect installed Kiro CLI model names.
- Updated Kilo Code detection to keep full model IDs such as `kilo/kilo-auto/free`.
- Set OpenCode default model to `opencode/big-pickle` and Kilo Code default model to `kilo/kilo-auto/free`.
- Hardened Windows command resolution to prefer npm `.cmd` shims before Windows app executables.
- Expanded provider documentation and internal wiki notes for the new Telegram runners.

### Fixed

- Fixed Kiro final replies so stdout answers are returned instead of stderr spinner/credits output.
- Fixed Kilo Code headless execution by using `--auto` and full Kilo model IDs.
- Fixed Gemini tool-event spam in Telegram while preserving final answers.
- Fixed Claude, Codex, Gemini, Kilo Code, and OpenCode final-answer extraction so raw event JSON is not shown as the final response.
- Fixed approval state so `Always approve` resets when users go back or choose a new project, provider, or model.

## 2.0.4 - 2026-05-06

### Added

- Added Command Code CLI as a supported provider.
- Added public `docs/` documentation.
- Added this changelog and a code of conduct.

### Changed

- Slimmed down README into a concise landing page.
- Made CLI provider scanning async and parallel.
- Hardened Windows CLI spawning for npm `.cmd` wrappers and non-interactive stdin.
- Added Telegram CLI progress heartbeats and task runtime logs.
- Added short OpenCode tool-call progress summaries while keeping final replies free of JSON/tool logs.

### Fixed

- Fixed OpenCode Telegram jobs that could stay `Running` after the model response completed on Windows.

## 2.0.3

### Changed

- Preserved global runtime data across updates.
- Fixed update banner API import.
- Added update notifications.
- Updated dashboard screenshot.
