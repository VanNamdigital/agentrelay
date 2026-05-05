# UI/UX Guidelines — Pro Max (Telegram Bot)

> Được sinh từ analysis của menu structure, keyboard layouts, và message rendering patterns trong codebase

## 1. DESIGN SYSTEM OVERVIEW

### 1.1 Framework & Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| telegraf | ^4.16.3 | Telegram Bot API wrapper |
| `Markup.keyboard` | telegraf built-in | Custom reply keyboards |

Bot dùng **HTML parse_mode** cho tất cả message (không dùng MarkdownV2).

### 1.2 Telegram HTML Tags Used

| Tag | Purpose | Pattern |
|-----|---------|---------|
| `<b>` | Bold text | Headers, labels, emphasis |
| `<code>` | Inline code | Paths, model names, file names |
| `<pre><code>` | Code blocks | Log output, CLI commands, code snippets |
| `<i>` | Italic | Secondary info, hints |
| `&amp;` `&lt;` `&gt;` `&quot;` `&#039;` | HTML escape | Luôn escape user/bot text trước khi render |

### 1.3 Message Constraints

| Constraint | Value | Defined At |
|------------|-------|------------|
| Max message length (HTML) | 3500 chars | `MAX_TELEGRAM_MESSAGE_LENGTH` |
| Text chunk limit | 2600 chars | `TELEGRAM_TEXT_CHUNK_LENGTH` |
| Tool output preview lines | 8 lines | `TOOL_OUTPUT_PREVIEW_LINES` |
| Tool output preview chars | 1200 chars | `TOOL_OUTPUT_PREVIEW_CHARS` |

---

## 2. MENU & KEYBOARD SYSTEM

### 2.1 Keyboard Architecture

Tất cả keyboard dùng `Markup.keyboard(rows).resize()` — custom reply keyboard, tự resize.

### 2.2 Main Menu Keyboard

```
Row 1: Codex              | OpenCode
Row 2: Projects           | Current Project
Row 3: Status             | Cancel          | Logs
Row 4: Back               | Main Menu
```

```javascript
function mainMenuKeyboard() {
    return keyboard([
        ['Codex', 'OpenCode'],
        ['Projects', 'Current Project'],
        ['Status', 'Cancel', 'Logs'],
        ['Back', 'Main Menu']
    ]);
}
```

### 2.3 Model Selection Keyboard

```
Row N:  <model_name>
...
Row N:  Back              | Main Menu
```

Mỗi model 1 row (1 column). 2 buttons cuối cùng: Back, Main Menu.

### 2.4 Project Selection Keyboard

```
Row N:  1. <project_name>   | 2. <project_name>
...
Row N:  Current Project      | Status
Row N:  Cancel               | Logs
Row N:  Back                 | Main Menu
```

Layout 2 cột cho project buttons.

### 2.5 Chat Mode Keyboard

```
Row 1: Status             | Cancel          | Logs
Row 2: Back               | Main Menu
Row 3: Current Project
```

### 2.6 Key Design Rules

- **Menu buttons luôn có trong session state tương ứng**
- **Khi đang có task chạy, chỉ control commands (Status, Cancel, Logs, Current Project) được xử lý**
- **Nút `Back`**: Trong CHAT quay về màn chọn model của CLI đang dùng. Trong chọn model/project quay về MAIN_MENU.

---

## 3. ROUTING & NAVIGATION

### 3.1 Command Mapping

| Telegram Text | Tham chiếu (cũng nhận) | Handler |
|---------------|------------------------|---------|
| `Main Menu` | `/start` | `showMainMenu()` |
| `Back` | `/back` | `handleBack()` |
| `Codex` | `/codex` | `showCodexModels()` |
| `OpenCode` | `/opencode` | `showOpenCodeModels()` |
| `Projects` | `/project` | `showProjects()` |
| `Current Project` | `/current` | `showCurrentProject()` |
| `Status` | `/status` | `showStatus()` |
| `Cancel` | `/cancel` | `cancelCurrentTask()` |
| `Logs` | `/logs` | `showLogs()` |

### 3.2 State-based Routing trong `bot.on('text')`

```
┌─────────────────────────────────────────────────────────┐
│  1. If session.running && text ∉ taskControlCommands    │
│     └─► reject: "Đang có task chạy"                     │
│                                                         │
│  2. If text ∈ {Main Menu, /start}                       │
│     └─► showMainMenu()                                  │
│                                                         │
│  3. If text ∈ {Back, /back}                             │
│     └─► handleBack() → tùy state hiện tại                │
│                                                         │
│  4. If text ∈ {Codex, OpenCode, Projects, etc.}         │
│     └─► xử lý không phụ thuộc state                     │
│                                                         │
│  5. If session.state === SELECT_PROJECT                 │
│     └─► validate project, set currentProject            │
│                                                         │
│  6. If session.state === SELECT_CODEX_MODEL             │
│     └─► validate codex model, enterChatMode()           │
│                                                         │
│  7. If session.state === SELECT_OPENCODE_MODEL          │
│     └─► validate opencode model, enterChatMode()        │
│                                                         │
│  8. If session.state === CHAT                           │
│     └─► runCliPromptLong() — spawn CLI, stream output   │
│                                                         │
│  9. Default: showMainMenu (fallback)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. STATE MANAGEMENT

### 4.1 User Session (In-Memory)

```javascript
const sessions = new Map();

function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {
            currentProject: projects[0].dir,      // default: project đầu tiên
            selectedCli: null,                     // 'codex' hoặc 'opencode'
            selectedModel: null,                   // model name string
            state: STATE.MAIN_MENU,                // enum state
            running: false,                        // có task đang chạy?
            currentTask: null,                     // task metadata object
            availableOpenCodeModels: []            // cache từ opencode models
        });
    }
    return sessions.get(userId);
}
```

### 4.2 Session Lifecycle

- **Created**: Lần đầu user tương tác với bot
- **Mutated**: Qua mỗi action chọn menu/chọn model/chọn project/chat
- **Destroyed**: Khi bot restart (toàn bộ Map mất)
- **No TTL/Expiry**: Session tồn tại mãi cho đến khi restart

### 4.3 Concurrency Control

- Mỗi user chỉ được chạy **1 task tại một thời điểm**
- `session.running` flag ngăn user gửi prompt mới
- Control commands (Status, Cancel, Logs, Current Project) vẫn hoạt động khi running

---

## 5. MESSAGE RENDERING PIPELINE

### 5.1 Text → HTML Pipeline

```
Raw text → stripAnsi()           (loại bỏ ANSI escape codes)
         → compactText()         (normalize newlines, trim)
         → splitPlainText()      (chia thành chunks nếu dài)
         → renderMarkdownishToHtml() hoặc renderInlineMarkdown()
         → sendTelegramHtml()    (tự động split nếu >3500 chars)
```

### 5.2 Markdown-ish → HTML Conversion Rules

| Input | Output |
|-------|--------|
| `**text**` | `<b>text</b>` |
| `__text__` | `<b>text</b>` |
| `` `code` `` | `<code>code</code>` |
| `# Heading` | `<b>Heading</b>` |
| ```` ```code``` ```` | `<pre><code>code</code></pre>` |
| `- bullet` | `• bullet` |
| `* bullet` | `• bullet` |

### 5.3 Tool Event Rendering

```
🛠 Tool xong: command
📥 Đang làm: <description>
📤 Kết quả tóm tắt:
<pre><code>output preview...</code></pre>
Đã rút gọn N dòng output để Telegram dễ đọc hơn.
```

### 5.4 Status Labels (tiếng Việt)

| Status | Label |
|--------|-------|
| completed (exitCode 0) | `xong` |
| completed (exitCode ≠ 0) | `lỗi <code>` |
| in_progress | `đang chạy` |
| khác | status nguyên bản hoặc `cập nhật` |

---

## 6. CODE PATTERNS — MESSAGE SENDING

### 6.1 Sending HTML Messages

```javascript
// Có sẵn:
replyHtml(ctx, html, extra)       // Gửi HTML với auto retry
sendTelegramHtml(ctx, html, extra) // Gửi HTML + auto-split nếu >3500 chars
sendFormattedText(ctx, title, text, extra) // Gửi formatted text + auto-split
sendLongMessage(ctx, text)        // Gửi raw text trong <pre><code>
```

### 6.2 Safe Reply Pattern

```javascript
async function safeReply(ctx, message, extra) {
    try {
        return await ctx.reply(message, extra);
    } catch (error) {
        logEvent('❌ TELEGRAM REPLY ERROR', { errorMessage: error.message });
        return null;
    }
}
```

### 6.3 Chunk-based Sending

- Plain text: split tại newline gần nhất (ưu tiên), sau đó space, cuối cùng split theo hard limit
- HTML: split tại `MAX_TELEGRAM_MESSAGE_LENGTH - 200`
- Mỗi chunk hiển thị `(1/N)` nếu có nhiều phần

---

## 7. USER FEEDBACK PATTERNS

### 7.1 Task Started
```
⏳ Task đã bắt đầu
CLI: Codex
Model: gpt-5.5
Project: /path/to/project
Bắt đầu: 30/04/2026 10:30:00
<command>
```

### 7.2 Task Running (Heartbeat — every 60s)
```
⏳ Đang xử lý
Đã chạy: 5 phút (5m 30s)
Bot sẽ tiếp tục gửi cập nhật khi có phản hồi mới.
```

### 7.3 Task Completed
```
✅ Task hoàn thành
Tổng thời gian: 3m 15s
```

### 7.4 Task Cancelled
```
🛑 Task đã dừng
Tổng thời gian: 1m 0s
```

### 7.5 Task Timeout
```
❌ Task timeout
Giới hạn: 120 phút
Tổng thời gian: 120m 0s
```

### 7.6 Task Error
```
❌ CLI kết thúc với mã lỗi 1
Tổng thời gian: 0m 5s
```

### 7.7 Rejected Input (Task Running)
```
⚠️ Đang có task chạy
Tin nhắn mới đã được nhận nhưng không gửi vào CLI để tránh trộn luồng xử lý.
Đã chạy: 15 phút (15m 30s)
Hành động: dùng /status để xem hoặc /cancel để dừng.
```

---

## 8. COMPONENT DEVELOPMENT RULES

### 8.1 Thêm Nút Menu Mới — Checklist
```
□ Thêm text vào object mapping (button text → handler)
□ Nếu có /command variant, thêm vào taskControlCommands Set (nếu là control command)
□ Thêm vào keyboard layout function tương ứng
□ Update isMenuButtonText() nếu nút xuất hiện động
□ Update README.md menu diagram
```

### 8.2 Thêm State Mới
```
□ Định nghĩa STATE.MY_NEW_STATE
□ Thêm routing logic trong bot.on('text')
□ Tạo show/handle function
□ Tạo keyboard function (hoặc reuse)
□ Đảm bảo Back button behavior đúng
```

### 8.3 Message Pattern
```javascript
// Template chuẩn cho message có header
ctx.reply(
    [
        '<b>Title</b>',
        `<code>${escapeHTML(value)}</code>`,
        '',
        'Mô tả bằng chữ thường.'
    ].join('\n'),
    {
        parse_mode: 'HTML',
        ...keyboardFunction()
    }
);
```

---

## 9. STYLING CONVENTIONS

### 9.1 Escaping Rules

- **LUÔN escape** tất cả input từ user hoặc từ CLI trước khi đưa vào HTML
- Dùng `escapeHTML()` cho text, paths, model names
- Dùng `<pre><code>` cho code blocks
- Dùng `<code>` cho inline technical values
- Dùng `<b>` cho labels/headers
- Dùng `<i>` cho secondary text/hints

### 9.2 Text Splitting Strategy

- **Plain text**: ưu tiên split tại `\n`, sau đó space, cuối cùng hard split
- **HTML**: split tại `MAX_TELEGRAM_MESSAGE_LENGTH - 200` buffer

### 9.3 Tiếng Việt Conventions

Bot dùng tiếng Việt cho tất cả user-facing text:
- "Đang lấy danh sách model..."
- "Không có task nào đang chạy."
- "Hoàn thành."
- "Task bi huy do timeout 20 phut." (chú ý: có typo trong code)

---

## 10. ACCESSIBILITY & LIMITATIONS

### 10.1 Known Limitations

- Menu không hỗ trợ inline buttons (chỉ custom reply keyboard)
- Không hỗ trợ markup trong code blocks (phải escape HTML)
- Không có pagination cho log viewing (cố định 50 dòng cuối)
- Codex model list không lấy động (hardcoded + env var + config.toml read)

### 10.2 Internationalization

- Tất cả UI strings hardcoded tiếng Việt
- Không có i18n framework
- Định dạng thời gian dùng `vi-VN` locale, `Asia/Ho_Chi_Minh` timezone
