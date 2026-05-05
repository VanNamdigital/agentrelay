import { describe, it, expect } from 'vitest';
import { isSecretKey, redactSecrets } from '../src/settingsConfig.js';

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
});
