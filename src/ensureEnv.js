const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const { dataDir, envPath, logDir, packageRoot, runtimeRoot } = require('./runtimePaths');

function copyDirectoryIfMissing(source, target) {
    if (!fs.existsSync(source) || fs.existsSync(target)) return;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true, errorOnExist: true, force: false });
}

function migrateLegacyGlobalRuntime() {
    if (process.env.AGENTRELAY_GLOBAL !== 'true' || runtimeRoot === packageRoot) return;

    const legacyEnvPath = path.join(packageRoot, '.env');
    if (!fs.existsSync(envPath) && fs.existsSync(legacyEnvPath)) {
        fs.mkdirSync(runtimeRoot, { recursive: true });
        fs.copyFileSync(legacyEnvPath, envPath, fs.constants.COPYFILE_EXCL);
        console.log(`Migrated local config to ${envPath}`);
    }

    copyDirectoryIfMissing(path.join(packageRoot, 'data'), dataDir);
    copyDirectoryIfMissing(path.join(packageRoot, 'logs'), logDir);
}

function ensureEnv() {
    fs.mkdirSync(runtimeRoot, { recursive: true });
    migrateLegacyGlobalRuntime();
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
