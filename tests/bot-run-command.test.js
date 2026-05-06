import { describe, expect, it } from 'vitest';
import bot from '../src/bot/index.js';

describe('bot CLI run command builder', () => {
    it('builds Kiro headless chat commands', () => {
        const command = bot._buildRunCommand(
            { key: 'kiro', command: 'kiro-cli', display_name: 'Kiro CLI' },
            'default',
            'D:\\projects\\demo',
            'review this repo'
        );

        expect(command).toEqual({
            file: 'kiro-cli',
            args: ['chat', '--no-interactive', '--wrap', 'never', 'review this repo']
        });
    });

    it('builds Claude Code stream-json print commands', () => {
        const command = bot._buildRunCommand(
            { key: 'claude', command: 'claude', display_name: 'Claude Code CLI' },
            'sonnet',
            'D:\\projects\\demo',
            'review this repo'
        );

        expect(command).toEqual({
            file: 'claude',
            args: [
                '-p',
                '--output-format', 'stream-json',
                '--verbose',
                '--include-partial-messages',
                '--no-session-persistence',
                '--model', 'sonnet',
                'review this repo'
            ]
        });
    });

    it('builds Gemini stream-json prompt commands', () => {
        const command = bot._buildRunCommand(
            { key: 'gemini', command: 'gemini', display_name: 'Gemini CLI' },
            'gemini-2.5-flash',
            'D:\\projects\\demo',
            'review this repo'
        );

        expect(command).toEqual({
            file: 'gemini',
            args: [
                '-p', 'review this repo',
                '--output-format', 'stream-json',
                '-m', 'gemini-2.5-flash'
            ]
        });
    });

    it('passes non-default Kiro models to headless chat', () => {
        const command = bot._buildRunCommand(
            { key: 'kiro', command: 'kiro-cli', display_name: 'Kiro CLI' },
            'claude-sonnet-4.5',
            'D:\\projects\\demo',
            'review this repo'
        );

        expect(command.args).toEqual([
            'chat',
            '--no-interactive',
            '--wrap', 'never',
            '--model', 'claude-sonnet-4.5',
            'review this repo'
        ]);
    });

    it('passes trusted tools to Kiro only after run approval', () => {
        const command = bot._buildRunCommand(
            { key: 'kiro', command: 'kiro-cli', display_name: 'Kiro CLI' },
            'default',
            'D:\\projects\\demo',
            'review this repo',
            { trustAllTools: true }
        );

        expect(command.args).toEqual([
            'chat',
            '--no-interactive',
            '--trust-all-tools',
            '--wrap', 'never',
            'review this repo'
        ]);
    });

    it('builds Codex JSON exec commands', () => {
        const command = bot._buildRunCommand(
            { key: 'codex', command: 'codex', display_name: 'Codex CLI' },
            'gpt-5.4',
            'D:\\projects\\demo',
            'fix lint'
        );

        expect(command).toEqual({
            file: 'codex',
            args: [
                'exec',
                '-m', 'gpt-5.4',
                '-C', 'D:\\projects\\demo',
                '--skip-git-repo-check',
                '--sandbox', 'workspace-write',
                '--ephemeral',
                '--json',
                '--color', 'never',
                'fix lint'
            ]
        });
    });

    it('builds Kilo Code autonomous run commands with model override', () => {
        const command = bot._buildRunCommand(
            { key: 'kilocode', command: 'kilo', display_name: 'Kilo Code CLI' },
            'anthropic/claude-sonnet-4-20250514',
            'D:\\projects\\demo',
            'write tests'
        );

        expect(command).toEqual({
            file: 'kilo',
            args: [
                'run',
                '--format', 'json',
                '--dir', 'D:\\projects\\demo',
                '--auto',
                '-m', 'anthropic/claude-sonnet-4-20250514',
                'write tests'
            ]
        });
    });

    it('does not pass Kilo Code balanced mode as a provider model id', () => {
        const command = bot._buildRunCommand(
            { key: 'kilocode', command: 'kilo', display_name: 'Kilo Code CLI' },
            'balanced',
            'D:\\projects\\demo',
            'write tests'
        );

        expect(command).toEqual({
            file: 'kilo',
            args: [
                'run',
                '--format', 'json',
                '--dir', 'D:\\projects\\demo',
                '--auto',
                'write tests'
            ]
        });
    });

    it('builds Command Code print commands with auto-accept permissions', () => {
        const command = bot._buildRunCommand(
            { key: 'command-code', command: 'command-code', display_name: 'Command Code CLI' },
            'default',
            'D:\\projects\\demo',
            'summarize changes'
        );

        expect(command).toEqual({
            file: 'command-code',
            args: [
                '--print',
                'summarize changes',
                '--trust',
                '--skip-onboarding'
            ]
        });
    });

    it('flags legacy Kiro IDE commands as unsupported for headless prompts', () => {
        const reason = bot._getUnsupportedRunReason({
            key: 'kiro',
            command: 'kiro',
            version: '0.11.133'
        });

        expect(reason).toContain('does not support headless');
    });

    it('detects CLI confirmation prompts without matching trust notices', () => {
        expect(bot._detectCliApprovalRequest('Proceed with this command? [y/N]')).toBe(true);
        expect(bot._detectCliApprovalRequest('This operation requires your approval')).toBe(true);
        expect(bot._detectCliApprovalRequest('All tools are now trusted (!).')).toBe(false);
        expect(bot._detectCliApprovalRequest('Task finished successfully.')).toBe(false);
    });

    it('keeps interactive stdin only for terminal confirmation providers', () => {
        expect(bot._providerNeedsInteractiveStdin('kiro')).toBe(true);
        expect(bot._providerNeedsInteractiveStdin('command-code')).toBe(true);
        expect(bot._providerNeedsInteractiveStdin('opencode')).toBe(false);
        expect(bot._providerNeedsInteractiveStdin('codex')).toBe(false);
        expect(bot._providerNeedsInteractiveStdin('gemini')).toBe(false);
        expect(bot._providerNeedsInteractiveStdin('claude')).toBe(false);
        expect(bot._providerNeedsInteractiveStdin('kilocode')).toBe(false);
    });
});
