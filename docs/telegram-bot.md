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

The bot starts one local child process for the task, streams output internally, summarizes the final output, and redacts secrets before sending text back.

## Timeouts

Set the task timeout in `.env` or dashboard settings:

```env
TASK_TIMEOUT_MINUTES=120
```

Users can request cancellation from the Telegram keyboard.
