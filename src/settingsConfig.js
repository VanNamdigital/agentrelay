const SECRET_ENV_KEYS = new Set([
    'TELEGRAM_BOT_TOKEN',
    'SESSION_SECRET',
    'OPENAI_API_KEY',
    'OPENROUTER_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'OPENCODE_API_KEY',
    'KIRO_API_KEY',
    'KILO_API_KEY'
]);

const SECRET_KEY_PATTERN = /(token|secret|password|passwd|pwd|api[_-]?key|access[_-]?token|refresh[_-]?token|bot[_-]?token|authorization|credential|private[_-]?key|client[_-]?secret|signing[_-]?secret|aes[_-]?key)/i;

function isSecretKey(key) {
    const text = String(key || '');
    return SECRET_ENV_KEYS.has(text.toUpperCase()) || SECRET_KEY_PATTERN.test(text);
}

function redactString(value) {
    return String(value)
        .replace(/(Authorization\s*:\s*(?:Bearer|Basic)\s+)[^\s,"'`<>]+/gi, '$1[redacted]')
        .replace(/((?:token|secret|password|passwd|pwd|api[_-]?key|access[_-]?token|refresh[_-]?token|bot[_-]?token|credential|private[_-]?key|client[_-]?secret|signing[_-]?secret|aes[_-]?key)\s*[:=]\s*)(["'`]?)[^\s,"'`&<>]+/gi, '$1$2[redacted]')
        .replace(/("(?:token|secret|password|passwd|pwd|apiKey|api_key|accessToken|access_token|refreshToken|refresh_token|botToken|bot_token|authorization|credential|privateKey|private_key|clientSecret|client_secret)"\s*:\s*")[^"]+/gi, '$1[redacted]')
        .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[redacted-api-key]')
        .replace(/\b(?:xox[baprs]-|gh[pousr]_|github_pat_)[A-Za-z0-9_-]{16,}\b/g, '[redacted-token]')
        .replace(/\b[A-Za-z0-9_-]{6,}:[A-Za-z0-9_-]{20,}\b/g, '[redacted-token]')
        .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[redacted-private-key]');
}

function redactSecrets(value, key = '') {
    if (isSecretKey(key)) return '[redacted]';
    if (Array.isArray(value)) return value.map(item => redactSecrets(item));
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactSecrets(entryValue, entryKey)])
        );
    }
    if (typeof value !== 'string') return value;
    return redactString(value);
}

module.exports = {
    SECRET_ENV_KEYS,
    isSecretKey,
    redactSecrets
};
