import { describe, it, expect } from 'vitest';
import {
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
} from '../src/utils.js';

describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
        expect(escapeHTML('<div>Test & "quotes"</div>')).toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;/div&gt;');
        expect(escapeHTML("It's a test")).toBe('It&#039;s a test');
    });

    it('should handle empty and null values', () => {
        expect(escapeHTML('')).toBe('');
        expect(escapeHTML(null)).toBe('null');
        expect(escapeHTML(undefined)).toBe('undefined');
    });
});

describe('stripAnsi', () => {
    it('should remove ANSI escape codes', () => {
        expect(stripAnsi('\x1B[31mRed text\x1B[0m')).toBe('Red text');
        expect(stripAnsi('\x1B[1;32mBold green\x1B[0m')).toBe('Bold green');
    });

    it('should handle text without ANSI codes', () => {
        expect(stripAnsi('Plain text')).toBe('Plain text');
    });
});

describe('compactText', () => {
    it('should normalize line endings and trim', () => {
        expect(compactText('  Line1\r\nLine2\rLine3  ')).toBe('Line1\nLine2\nLine3');
    });

    it('should strip ANSI codes', () => {
        expect(compactText('\x1B[31mRed\x1B[0m\r\nText')).toBe('Red\nText');
    });
});

describe('splitPlainText', () => {
    it('should not split text shorter than limit', () => {
        expect(splitPlainText('Short text', 100)).toEqual(['Short text']);
    });

    it('should split at newline when possible', () => {
        const text = 'A'.repeat(100) + '\n' + 'B'.repeat(100);
        const chunks = splitPlainText(text, 150);
        expect(chunks.length).toBe(2);
        expect(chunks[0]).toBe('A'.repeat(100));
    });

    it('should split at space when no newline available', () => {
        const text = 'A'.repeat(100) + ' ' + 'B'.repeat(100);
        const chunks = splitPlainText(text, 150);
        expect(chunks.length).toBe(2);
    });

    it('should handle empty text', () => {
        expect(splitPlainText('')).toEqual([]);
        expect(splitPlainText(null)).toEqual([]);
    });
});

describe('renderInlineMarkdown', () => {
    it('should convert inline code', () => {
        expect(renderInlineMarkdown('Use `code` here')).toBe('Use <code>code</code> here');
    });

    it('should convert bold with **', () => {
        expect(renderInlineMarkdown('This is **bold** text')).toBe('This is <b>bold</b> text');
    });

    it('should convert bold with __', () => {
        expect(renderInlineMarkdown('This is __bold__ text')).toBe('This is <b>bold</b> text');
    });

    it('should escape HTML in non-code parts', () => {
        expect(renderInlineMarkdown('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });

    it('should handle mixed markdown', () => {
        expect(renderInlineMarkdown('**Bold** and `code`')).toBe('<b>Bold</b> and <code>code</code>');
    });
});

describe('renderMarkdownishToHtml', () => {
    it('should convert headings', () => {
        expect(renderMarkdownishToHtml('# Heading')).toBe('<b>Heading</b>');
        expect(renderMarkdownishToHtml('## Heading 2')).toBe('<b>Heading 2</b>');
    });

    it('should convert bullets', () => {
        expect(renderMarkdownishToHtml('- Item 1\n- Item 2')).toBe('• Item 1\n• Item 2');
        expect(renderMarkdownishToHtml('* Item 1')).toBe('• Item 1');
    });

    it('should convert code blocks', () => {
        const input = '```\nconst x = 1;\n```';
        expect(renderMarkdownishToHtml(input)).toBe('<pre><code>const x = 1;</code></pre>');
    });

    it('should handle mixed content', () => {
        const input = '# Title\n\nSome text\n\n- Item 1\n- Item 2';
        const output = renderMarkdownishToHtml(input);
        expect(output).toContain('<b>Title</b>');
        expect(output).toContain('• Item 1');
    });
});

describe('formatDuration', () => {
    it('should format seconds only', () => {
        expect(formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
        expect(formatDuration(125)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
        expect(formatDuration(3665)).toBe('1h 1m 5s');
    });

    it('should handle zero', () => {
        expect(formatDuration(0)).toBe('0s');
    });

    it('should handle negative as zero', () => {
        expect(formatDuration(-10)).toBe('0s');
    });
});

describe('isProviderModel', () => {
    it('should validate correct provider/model format', () => {
        expect(isProviderModel('openai/gpt-4')).toBe(true);
        expect(isProviderModel('anthropic/claude-3.5')).toBe(true);
        expect(isProviderModel('provider_name/model-name:v1')).toBe(true);
    });

    it('should reject invalid formats', () => {
        expect(isProviderModel('just-a-model')).toBe(false);
        expect(isProviderModel('/no-provider')).toBe(false);
        expect(isProviderModel('provider/')).toBe(false);
        expect(isProviderModel('')).toBe(false);
    });
});

describe('parseOpenCodeModels', () => {
    it('should extract provider/model patterns', () => {
        const output = 'Available models: openai/gpt-4, anthropic/claude-3, openai/gpt-3.5';
        const models = parseOpenCodeModels(output);
        expect(models).toEqual(['anthropic/claude-3', 'openai/gpt-3.5', 'openai/gpt-4']);
    });

    it('should deduplicate models', () => {
        const output = 'openai/gpt-4 openai/gpt-4 anthropic/claude-3';
        const models = parseOpenCodeModels(output);
        expect(models).toEqual(['anthropic/claude-3', 'openai/gpt-4']);
    });

    it('should handle empty output', () => {
        expect(parseOpenCodeModels('')).toEqual([]);
        expect(parseOpenCodeModels('No models found')).toEqual([]);
    });
});

describe('parseOpenCodeRunOutput', () => {
    it('extracts text and completion from JSON events', () => {
        const output = [
            '{"type":"step_start","sessionID":"ses_123","part":{"type":"step-start"}}',
            '{"type":"text","sessionID":"ses_123","part":{"type":"text","text":"OK"}}',
            '{"type":"step_finish","sessionID":"ses_123","part":{"type":"step-finish","reason":"stop"}}'
        ].join('\n');

        expect(parseOpenCodeRunOutput(output)).toEqual({
            completed: true,
            errors: [],
            finishReason: 'stop',
            sessionID: 'ses_123',
            stepStarted: true,
            textStarted: true,
            toolCount: 0,
            toolEvents: [],
            toolUsed: false,
            text: 'OK'
        });
    });

    it('ignores non-json lines', () => {
        const result = parseOpenCodeRunOutput('noise\n{"type":"text","part":{"type":"text","text":"hello"}}');
        expect(result.completed).toBe(false);
        expect(result.stepStarted).toBe(false);
        expect(result.textStarted).toBe(true);
        expect(result.toolCount).toBe(0);
        expect(result.toolEvents).toEqual([]);
        expect(result.toolUsed).toBe(false);
        expect(result.text).toBe('hello');
    });

    it('does not treat tool-call step finishes as final completion', () => {
        const output = [
            '{"type":"step_start","sessionID":"ses_123","part":{"type":"step-start"}}',
            '{"type":"tool_use","sessionID":"ses_123","part":{"type":"tool","tool":"task","callID":"call_1","state":{"status":"completed","input":{"description":"Explore codebase structure"},"output":"task_id: abc\\n\\n<task_result>\\nTool output summary\\n</task_result>"}}}',
            '{"type":"step_finish","sessionID":"ses_123","part":{"type":"step-finish","reason":"tool-calls"}}'
        ].join('\n');

        const result = parseOpenCodeRunOutput(output);
        expect(result.completed).toBe(false);
        expect(result.finishReason).toBe('tool-calls');
        expect(result.toolCount).toBe(1);
        expect(result.toolEvents).toEqual([{
            callID: 'call_1',
            preview: 'Tool output summary',
            status: 'completed',
            title: 'Explore codebase structure',
            tool: 'task'
        }]);
        expect(result.toolUsed).toBe(true);
        expect(result.text).toBe('');
    });
});

describe('summarizeOutput', () => {
    it('should return full output if short', () => {
        const output = 'Line 1\nLine 2\nLine 3';
        const result = summarizeOutput(output);
        expect(result.preview).toBe(output);
        expect(result.truncated).toBe(false);
        expect(result.lineCount).toBe(3);
    });

    it('should truncate after 8 lines', () => {
        const output = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join('\n');
        const result = summarizeOutput(output);
        expect(result.lineCount).toBe(10);
        expect(result.truncated).toBe(true);
        expect(result.preview.split('\n').length).toBe(8);
    });

    it('should truncate after 1200 chars', () => {
        const output = 'A'.repeat(1500);
        const result = summarizeOutput(output);
        expect(result.truncated).toBe(true);
        expect(result.preview.length).toBeLessThanOrEqual(1200);
    });

    it('should handle empty output', () => {
        const result = summarizeOutput('');
        expect(result.preview).toBe('');
        expect(result.truncated).toBe(false);
        expect(result.lineCount).toBe(0);
    });
});

describe('toolStatusLabel', () => {
    it('should return "xong" for completed with exit code 0', () => {
        expect(toolStatusLabel('completed', 0)).toBe('xong');
        expect(toolStatusLabel('completed', null)).toBe('xong');
        expect(toolStatusLabel('completed', undefined)).toBe('xong');
    });

    it('should return "đang chạy" for in_progress', () => {
        expect(toolStatusLabel('in_progress')).toBe('đang chạy');
    });

    it('should return error label for non-zero exit code', () => {
        expect(toolStatusLabel('completed', 1)).toBe('lỗi 1');
        expect(toolStatusLabel('failed', 127)).toBe('lỗi 127');
    });

    it('should return status or default for unknown', () => {
        expect(toolStatusLabel('pending')).toBe('pending');
        expect(toolStatusLabel(null)).toBe('cập nhật');
    });
});
