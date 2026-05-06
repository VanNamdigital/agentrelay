function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function stripAnsi(value) {
    return String(value || '').replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function compactText(value) {
    return stripAnsi(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
}

function splitPlainText(text, limit = 2600) {
    const value = String(text || '');
    if (value.length <= limit) return value ? [value] : [];

    const chunks = [];
    let remaining = value;

    while (remaining.length > limit) {
        let splitAt = remaining.lastIndexOf('\n', limit);
        if (splitAt < Math.floor(limit * 0.45)) {
            splitAt = remaining.lastIndexOf(' ', limit);
        }
        if (splitAt < Math.floor(limit * 0.45)) {
            splitAt = limit;
        }

        chunks.push(remaining.slice(0, splitAt).trimEnd());
        remaining = remaining.slice(splitAt).trimStart();
    }

    if (remaining) chunks.push(remaining);
    return chunks.filter(Boolean);
}

function renderInlineMarkdown(text) {
    return String(text || '')
        .split(/(`[^`\n]+`)/g)
        .map(part => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return `<code>${escapeHTML(part.slice(1, -1))}</code>`;
            }

            return escapeHTML(part)
                .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
                .replace(/__([^_\n]+)__/g, '<b>$1</b>');
        })
        .join('');
}

function renderMarkdownishToHtml(text) {
    const lines = compactText(text).split('\n');
    const htmlLines = [];
    let codeLines = null;

    function flushCode() {
        if (!codeLines) return;
        htmlLines.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
        codeLines = null;
    }

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
            if (codeLines) flushCode();
            else codeLines = [];
            continue;
        }

        if (codeLines) {
            codeLines.push(line);
            continue;
        }

        if (!trimmed) {
            htmlLines.push('');
            continue;
        }

        const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
            htmlLines.push(`<b>${renderInlineMarkdown(heading[1])}</b>`);
            continue;
        }

        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        if (bullet) {
            htmlLines.push(`• ${renderInlineMarkdown(bullet[1])}`);
            continue;
        }

        htmlLines.push(renderInlineMarkdown(line));
    }

    flushCode();
    return htmlLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function isProviderModel(value) {
    return /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.:+-]*$/.test(value);
}

function parseOpenCodeModels(output) {
    const matches = output.match(/[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.:+-]*/g) || [];
    return [...new Set(matches)].filter(isProviderModel).sort((a, b) => a.localeCompare(b));
}

function shortOpenCodePreview(value, maxLength = 180) {
    const lines = compactText(value)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .filter(line => !line.startsWith('task_id:'))
        .filter(line => !['<task_result>', '</task_result>', '---'].includes(line));
    const text = (lines[0] || compactText(value)).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength - 3).trimEnd()}...` : text;
}

function parseOpenCodeRunOutput(output) {
    const lines = compactText(output).split('\n').map(line => line.trim()).filter(Boolean);
    const textParts = [];
    const errors = [];
    const toolEvents = [];
    let completed = false;
    let finishReason = '';
    let sessionID = '';
    let stepStarted = false;
    let textStarted = false;
    let toolUsed = false;

    for (const line of lines) {
        if (!line.startsWith('{')) continue;

        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }

        const part = event.part || {};
        const type = event.type || part.type || '';
        if (!sessionID && (event.sessionID || part.sessionID)) {
            sessionID = event.sessionID || part.sessionID;
        }

        if (type === 'step_start' || part.type === 'step-start') {
            stepStarted = true;
            continue;
        }

        if ((type === 'text' || part.type === 'text') && typeof part.text === 'string') {
            textStarted = true;
            textParts.push(part.text);
            continue;
        }

        if (type === 'tool_use' || type === 'tool' || part.type === 'tool') {
            toolUsed = true;
            const state = part.state || event.state || {};
            const input = state.input || {};
            const title = state.title || input.description || input.command || input.prompt || part.tool || 'tool';
            const preview = shortOpenCodePreview(state.output || state.error || part.text || '');
            toolEvents.push({
                callID: part.callID || event.callID || '',
                preview,
                status: state.status || event.status || '',
                title: shortOpenCodePreview(title, 96) || 'tool',
                tool: part.tool || event.tool || 'tool'
            });
            continue;
        }

        if (type === 'step_finish' || part.type === 'step-finish') {
            finishReason = part.reason || event.reason || finishReason;
            completed = Boolean(finishReason && finishReason !== 'tool-calls');
            continue;
        }

        if (type === 'error' || part.type === 'error') {
            const message = part.message || event.message || event.error?.message || '';
            if (message) errors.push(message);
        }
    }

    return {
        completed,
        errors,
        finishReason,
        sessionID,
        stepStarted,
        textStarted,
        toolEvents,
        toolCount: toolEvents.length,
        toolUsed,
        text: compactText(textParts.join(''))
    };
}

function extractTextValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return compactText(value.map(extractTextValue).filter(Boolean).join(''));
    if (typeof value !== 'object') return '';

    if (typeof value.text === 'string') return value.text;
    if (typeof value.message === 'string') return value.message;
    if (typeof value.content === 'string') return value.content;
    if (Array.isArray(value.content)) return extractTextValue(value.content);
    if (Array.isArray(value.parts)) return extractTextValue(value.parts);
    if (Array.isArray(value.items)) return extractTextValue(value.items);

    return '';
}

function parseCodexRunOutput(output) {
    const lines = compactText(output).split('\n').map(line => line.trim()).filter(Boolean);
    const deltas = [];
    const messages = [];
    const errors = [];
    const toolEvents = [];
    let completed = false;
    let sessionID = '';
    let stepStarted = false;
    let textStarted = false;
    let toolUsed = false;
    let finishReason = '';

    for (const line of lines) {
        if (!line.startsWith('{')) continue;

        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }

        const type = event.type || event.msg?.type || '';
        const item = event.item || event.msg?.item || {};
        if (!sessionID && (event.thread_id || event.session_id || event.conversation_id)) {
            sessionID = event.thread_id || event.session_id || event.conversation_id;
        }

        if (type === 'thread.started' || type === 'turn.started') {
            stepStarted = true;
            continue;
        }

        if (type === 'agent_message_delta') {
            const delta = extractTextValue(event.delta || event.text || event.message || event.content);
            if (delta) {
                textStarted = true;
                deltas.push(delta);
            }
            continue;
        }

        if (type === 'agent_message' || type === 'assistant_message') {
            const message = extractTextValue(event.message || event.text || event.content);
            if (message) {
                textStarted = true;
                messages.push(message);
            }
            continue;
        }

        if (type === 'item.completed') {
            const itemType = item.type || item.item_type || '';
            if (['agent_message', 'assistant_message', 'message'].includes(itemType)) {
                const message = extractTextValue(item);
                if (message) {
                    textStarted = true;
                    messages.push(message);
                }
                continue;
            }

            if (/tool|call|command|exec|patch/i.test(itemType)) {
                toolUsed = true;
                const title = item.name || item.command || item.title || itemType || 'tool';
                const preview = shortOpenCodePreview(item.output || item.result || item.error || item.arguments || '');
                toolEvents.push({
                    callID: item.call_id || item.id || '',
                    preview,
                    status: item.status || 'completed',
                    title: shortOpenCodePreview(title, 96) || 'tool',
                    tool: itemType || 'tool'
                });
                continue;
            }
        }

        if (type === 'turn.completed' || type === 'task_complete' || type === 'thread.completed') {
            completed = true;
            finishReason = event.reason || event.finish_reason || type;
            continue;
        }

        if (type === 'turn.failed' || type === 'error' || type === 'task_failed') {
            const message = extractTextValue(event.error || event.message || event);
            if (message) errors.push(message);
            finishReason = type;
        }
    }

    const text = compactText(messages.length ? messages.at(-1) : deltas.join(''));
    return {
        completed,
        errors,
        finishReason,
        sessionID,
        stepStarted,
        textStarted,
        toolEvents,
        toolCount: toolEvents.length,
        toolUsed,
        text
    };
}

function parseClaudeRunOutput(output) {
    const lines = compactText(output).split('\n').map(line => line.trim()).filter(Boolean);
    const textParts = [];
    const finalMessages = [];
    const errors = [];
    const toolEvents = [];
    let completed = false;
    let finishReason = '';
    let sessionID = '';
    let stepStarted = false;
    let textStarted = false;
    let toolUsed = false;

    for (const line of lines) {
        if (!line.startsWith('{')) continue;

        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }

        const type = event.type || event.subtype || '';
        if (!sessionID && (event.session_id || event.sessionId || event.id)) {
            sessionID = event.session_id || event.sessionId || event.id;
        }

        if (type === 'system' || type === 'init' || event.subtype === 'init') {
            stepStarted = true;
            continue;
        }

        if (type === 'assistant') {
            const text = extractTextValue(event.message || event.content || event);
            if (text) {
                textStarted = true;
                finalMessages.push(text);
            }
            continue;
        }

        if (type === 'content_block_delta' || type === 'message_delta') {
            const text = extractTextValue(event.delta || event.message || event.content || event);
            if (text) {
                textStarted = true;
                textParts.push(text);
            }
            continue;
        }

        if (type === 'tool_use' || type === 'tool_result') {
            toolUsed = true;
            const title = event.name || event.tool_name || event.tool || type;
            const preview = shortOpenCodePreview(event.content || event.result || event.output || event.error || '');
            toolEvents.push({
                callID: event.id || event.tool_use_id || '',
                preview,
                status: type === 'tool_result' ? 'completed' : 'started',
                title: shortOpenCodePreview(title, 96) || 'tool',
                tool: title || 'tool'
            });
            continue;
        }

        if (type === 'result') {
            completed = event.is_error !== true;
            finishReason = event.subtype || event.result || type;
            const text = extractTextValue(event.result || event.response || event.message || event.content);
            if (text) finalMessages.push(text);
            if (event.is_error && event.error) errors.push(extractTextValue(event.error) || String(event.error));
            continue;
        }

        if (type === 'error') {
            const message = extractTextValue(event.error || event.message || event);
            if (message) errors.push(message);
            finishReason = type;
        }
    }

    return {
        completed,
        errors,
        finishReason,
        sessionID,
        stepStarted,
        textStarted,
        toolEvents,
        toolCount: toolEvents.length,
        toolUsed,
        text: compactText(finalMessages.length ? finalMessages.at(-1) : textParts.join(''))
    };
}

function parseGeminiRunOutput(output) {
    const lines = compactText(output).split('\n').map(line => line.trim()).filter(Boolean);
    const textParts = [];
    const finalMessages = [];
    const errors = [];
    const toolEvents = [];
    let completed = false;
    let finishReason = '';
    let sessionID = '';
    let stepStarted = false;
    let textStarted = false;
    let toolUsed = false;

    for (const line of lines) {
        if (!line.startsWith('{')) continue;

        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }

        const type = event.type || event.event || event.kind || '';
        if (!sessionID && (event.session_id || event.sessionId || event.sessionIdHash || event.id)) {
            sessionID = event.session_id || event.sessionId || event.sessionIdHash || event.id;
        }

        if (type === 'init') {
            stepStarted = true;
            continue;
        }

        if (type === 'message') {
            const text = extractTextValue(event.message || event.content || event.text || event.response || event);
            if (text) {
                textStarted = true;
                textParts.push(text);
            }
            continue;
        }

        if (type === 'tool_use' || type === 'tool_result') {
            toolUsed = true;
            continue;
        }

        if (type === 'result') {
            completed = !event.error;
            finishReason = event.status || event.outcome || type;
            const text = extractTextValue(event.response || event.result || event.message || event.content);
            if (text) finalMessages.push(text);
            if (event.error) errors.push(extractTextValue(event.error) || String(event.error));
            continue;
        }

        if (type === 'error') {
            const message = extractTextValue(event.error || event.message || event);
            if (message) errors.push(message);
            finishReason = type;
        }
    }

    return {
        completed,
        errors,
        finishReason,
        sessionID,
        stepStarted,
        textStarted,
        toolEvents,
        toolCount: toolEvents.length,
        toolUsed,
        text: compactText(finalMessages.length ? finalMessages.at(-1) : textParts.join(''))
    };
}

function parseCliRunOutput(providerKey, output) {
    if (providerKey === 'opencode' || providerKey === 'kilocode') return parseOpenCodeRunOutput(output);
    if (providerKey === 'codex') return parseCodexRunOutput(output);
    if (providerKey === 'claude') return parseClaudeRunOutput(output);
    if (providerKey === 'gemini') return parseGeminiRunOutput(output);
    return {
        completed: false,
        errors: [],
        finishReason: '',
        sessionID: '',
        stepStarted: false,
        textStarted: Boolean(compactText(output)),
        toolEvents: [],
        toolCount: 0,
        toolUsed: false,
        text: compactText(output)
    };
}

function summarizeOutput(output, transform = value => value) {
    const value = compactText(transform(output));
    if (!value) return { preview: '', truncated: false, lineCount: 0 };

    const lines = value.split('\n');
    let preview = lines.slice(0, 8).join('\n');
    let truncated = lines.length > 8;

    if (preview.length > 1200) {
        preview = preview.slice(0, 1200).trimEnd();
        truncated = true;
    }

    return {
        preview,
        truncated,
        lineCount: lines.length
    };
}

function toolStatusLabel(status, exitCode) {
    if (status === 'completed' && (exitCode === 0 || exitCode === undefined || exitCode === null)) return 'xong';
    if (status === 'in_progress') return 'đang chạy';
    if (exitCode !== undefined && exitCode !== null && exitCode !== 0) return `lỗi ${exitCode}`;
    return status || 'cập nhật';
}

module.exports = {
    escapeHTML,
    stripAnsi,
    compactText,
    splitPlainText,
    renderInlineMarkdown,
    renderMarkdownishToHtml,
    formatDuration,
    isProviderModel,
    parseOpenCodeModels,
    parseCliRunOutput,
    parseClaudeRunOutput,
    parseCodexRunOutput,
    parseGeminiRunOutput,
    parseOpenCodeRunOutput,
    summarizeOutput,
    toolStatusLabel
};
