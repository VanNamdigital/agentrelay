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
    parseOpenCodeRunOutput,
    summarizeOutput,
    toolStatusLabel
};
