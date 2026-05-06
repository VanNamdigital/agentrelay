# Changelog

All notable changes to AgentRelay are documented here.

This project follows the spirit of Keep a Changelog and uses semantic versioning once published.

## Unreleased

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
