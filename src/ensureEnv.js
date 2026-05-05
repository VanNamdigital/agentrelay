const crypto = require('crypto');
const fs = require('fs');

const { envPath, runtimeRoot } = require('./runtimePaths');

function ensureEnv() {
    fs.mkdirSync(runtimeRoot, { recursive: true });
    if (fs.existsSync(envPath)) return;

    const secret = crypto.randomBytes(32).toString('hex');
    const content = [
        `SESSION_SECRET=${secret}`,
        'ADMIN_PORT=3456',
        'HOST=127.0.0.1',
        'ALLOW_LAN=false',
        'AUTH_COOKIE_SECURE=false',
        'SYSTEM_LANGUAGE=en',
        ''
    ].join('\n');

    fs.writeFileSync(envPath, content, { encoding: 'utf8', flag: 'wx' });
    console.log(`Created local config at ${envPath}`);
}

module.exports = { ensureEnv };
