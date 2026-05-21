import { describe, it, expect } from 'vitest';
import { isSecretKey, redactPublicOutput, redactSecrets } from '../src/settingsConfig.js';

describe('settings config redaction', () => {
    it('detects configured and secret-looking keys', () => {
        expect(isSecretKey('TELEGRAM_BOT_TOKEN')).toBe(true);
        expect(isSecretKey('access_token')).toBe(true);
        expect(isSecretKey('password')).toBe(true);
        expect(isSecretKey('provider_key')).toBe(false);
    });

    it('redacts secret object fields without hiding safe fields', () => {
        expect(redactSecrets({
            token: 'abc',
            provider_key: 'opencode',
            nested: { OPENAI_API_KEY: 'sk-secret' }
        })).toEqual({
            token: '[redacted]',
            provider_key: 'opencode',
            nested: { OPENAI_API_KEY: '[redacted]' }
        });
    });

    it('redacts secret-looking log strings', () => {
        expect(redactSecrets('OPENAI_API_KEY=sk-secret')).toContain('[redacted]');
        expect(redactSecrets('Authorization: Bearer token-value')).toContain('Bearer [redacted]');
        expect(redactSecrets('token=123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toContain('[redacted]');
        expect(redactSecrets('{"apiKey":"sk-abcdefghijklmnopqrstuvwxyz"}')).toContain('[redacted]');
        expect(redactSecrets('github_pat_abcdefghijklmnopqrstuvwxyz123456')).toContain('[redacted-token]');
        expect(redactSecrets('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----')).toContain('[redacted-private-key]');
    });

    it('redacts local commands and machine paths from bot-visible output', () => {
        const output = redactPublicOutput(
            'Tool command_execution failed: "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command \'rg --files -g "README*"\'\n' +
            'Read G:\\DA\\agentrelay\\src\\server\\routes\\api.js pid=28272'
        );

        expect(output).toContain('Tool command_execution failed: [local command hidden]');
        expect(output).toContain('[local-path]');
        expect(output).toContain('pid=[process-id]');
        expect(output).not.toContain('G:\\DA');
        expect(output).not.toContain('powershell.exe');
    });
});
