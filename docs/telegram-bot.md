# Telegram Bot

AgentRelay can expose selected providers and projects through a private Telegram bot.

## Setup

1. Create a bot with BotFather.
2. Put the token in `.env` as `TELEGRAM_BOT_TOKEN`.
3. Add allowed user IDs to `ALLOWED_TELEGRAM_USER_IDS`.
4. Start AgentRelay and open the dashboard.
5. Enable Telegram in the bot configuration page.

You can find your Telegram numeric user ID with a helper such as `@userinfobot`.

## Access Control

Only enabled Telegram users in the dashboard can interact with the bot. Unknown users receive a rejection message.

## Provider Flow

Telegram users pick:

1. Project
2. Provider
3. Model
4. Prompt

The bot starts one local child process for the task, streams output internally, sends heartbeat/progress updates for long-running work, summarizes the final output, and redacts secrets before sending text back. Providers that do not ask for confirmation run immediately.

When CLI output asks for confirmation, Telegram shows a generic approval keyboard while the process waits:

- `Approve run` sends approval to the waiting CLI once.
- `Do not run` cancels the pending task.
- `Always approve` stores auto-approval only for the current Telegram selection. It is cleared when the user goes back to the menu or chooses another project, provider, or model.

Provider-specific approval flags are handled internally by AgentRelay.

Provider output handling:

- OpenCode and Kilo Code use JSON event streams for session, text, tool, and completion updates.
- Codex uses `codex exec --json` JSONL events and returns the final agent message.
- Claude Code uses `claude -p --output-format stream-json --verbose` JSONL events and returns the final result.
- Gemini CLI uses `gemini -p --output-format stream-json` JSONL events and returns the final result.
- Kiro and Command Code use headless plain text output and receive the same heartbeat/final-summary handling.

## Timeouts

Set the task timeout in `.env` or dashboard settings:

```env
TASK_TIMEOUT_MINUTES=120
```

Users can request cancellation from the Telegram keyboard.
