# UI/UX Guidelines - Telegram Bot

> Last updated: 2026-05-06
> Source files: `src/bot/index.js`, `src/bot/messages.js`, `src/utils.js`

## 1. Active Bot UI Model

The active Telegram UI is provider-driven. It no longer has hardcoded top-level `Codex` and `OpenCode` buttons from the removed monolith.

Current main keyboard:

```text
Row 1: Projects | Choose CLI | Choose model
Row 2: Status   | Cancel
Row 3: Logs     | Settings   | Main Menu
```

Provider, project, and model keyboards are generated from SQLite-backed configuration:

- Providers: one enabled provider per row, then `Back | Main Menu`.
- Projects: one enabled project per row, then `Back | Main Menu`.
- Models: one enabled model per row, then `Back | Main Menu`.
- Chat mode: `Status | Cancel`, then `Back | Main Menu`.

## 2. State Machine

State enum in `src/bot/index.js`:

```javascript
const STATE = {
    MAIN: 'main',
    SELECT_PROVIDER: 'select_provider',
    SELECT_PROJECT: 'select_project',
    SELECT_MODEL: 'select_model',
    CHAT: 'chat'
};
```

Session shape:

```javascript
{
    state: STATE.MAIN,
    projectPath: '',
    providerKey: '',
    modelName: '',
    running: false,
    currentTask: null
}
```

Sessions are in memory. Restarting the process loses session state and active task references.

## 3. Navigation Flow

```text
/start or Main Menu
    -> show available providers and main keyboard

Projects
    -> choose enabled project
    -> show provider picker

Choose CLI
    -> choose enabled provider with at least one enabled model
    -> show model picker

Choose model
    -> choose enabled model
    -> enter chat mode

CHAT
    -> user sends prompt
    -> run local CLI child process
    -> summarize final output
```

`Back` behavior:

- From `CHAT`: returns to model selection for the current provider.
- From other states: returns to main menu.

## 4. Provider Execution

Telegram task execution is currently implemented for:

| Provider key | Command pattern |
| --- | --- |
| `codex` | `codex exec -m <model> -C <project> --skip-git-repo-check --sandbox workspace-write --ephemeral --json <prompt>` |
| `opencode` | `opencode run --format json --dir <project> -m <model> <prompt>` |
| `command-code` | `command-code --print <prompt> --trust --skip-onboarding --auto-accept` |

Other detected providers can be configured in the dashboard, but Telegram prompt execution returns `bot.taskNotImplemented` until `buildRunCommand()` supports them.

## 5. Message Rendering

The bot uses Telegram HTML through `ctx.replyWithHTML()`.

Rules:

- Escape dynamic values with `escapeHTML()` before putting them into HTML.
- Use `<b>` for short headers.
- Use `<code>` for paths, model names, PIDs, and command values.
- Use `<pre><code>` for log/output previews.
- Split long text with `splitPlainText(html, 3500)` in `replyHtml()`.
- If HTML send fails, retry with compact plain text.

Output summaries use `summarizeOutput()`:

- 8 preview lines max.
- 1200 preview characters max.
- Secrets are transformed through `redactSecrets()` before rendering.

## 6. Access and Safety

- Only allowlisted Telegram users can use the bot.
- Allowed users come from SQLite `telegram_users`.
- A user can only run one task at a time.
- `Status`, `Cancel`, `Logs`, `Settings`, `Back`, and `Main Menu` remain available as keyboard actions.
- Cancel sends `SIGTERM` to the active child process.
- Task timeout defaults to `TASK_TIMEOUT_MINUTES` or 120 minutes.

## 7. Internationalization

Bot messages are centralized in `src/bot/messages.js`.

Supported `SYSTEM_LANGUAGE` values come from `src/config/botChannels.js`:

- `en`
- `vi`
- `ru`
- `zh`

`matchesButton()` accepts button text from all message dictionaries, so button recognition is not limited to the currently selected language.

## 8. Known UI Limitations

- No inline keyboards; only Telegram reply keyboards.
- No pagination for logs; bot shows the last 50 log lines.
- No durable task/session state after process restart.
- No streaming progress messages during a running task; final output is summarized on process close.
- Provider-specific command support is incomplete outside `codex`, `opencode`, and `command-code`.

## 9. Change Checklist

When adding or changing a Telegram flow:

- Update `src/bot/messages.js` for user-facing strings.
- Update keyboard construction in `src/bot/index.js`.
- Escape all dynamic HTML.
- Keep timeout and cancellation paths.
- Update `wiki/02-UI-UX-pro-max.md` if menu/state behavior changes.
- Add or update tests where the logic can be isolated.
