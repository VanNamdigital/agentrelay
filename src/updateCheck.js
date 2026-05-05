const packageJson = require('../package.json');

const DEFAULT_REGISTRY_URL = 'https://registry.npmjs.org';
const CHECK_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 15 * 60 * 1000;

let cachedInfo = null;
let cachedAt = 0;
let pendingCheck = null;

function parseVersion(version) {
    const core = String(version || '')
        .trim()
        .replace(/^v/i, '')
        .split(/[+-]/)[0];

    return core.split('.').map(part => {
        const value = Number.parseInt(part, 10);
        return Number.isFinite(value) ? value : 0;
    });
}

function compareVersions(a, b) {
    const left = parseVersion(a);
    const right = parseVersion(b);
    const length = Math.max(left.length, right.length, 3);

    for (let index = 0; index < length; index += 1) {
        const diff = (left[index] || 0) - (right[index] || 0);
        if (diff > 0) return 1;
        if (diff < 0) return -1;
    }
    return 0;
}

function isNewerVersion(latestVersion, currentVersion) {
    return compareVersions(latestVersion, currentVersion) > 0;
}

function getPackageUrl(packageName = packageJson.name) {
    const registry = String(process.env.AGENTRELAY_NPM_REGISTRY || DEFAULT_REGISTRY_URL).replace(/\/+$/, '');
    const encodedName = encodeURIComponent(packageName).replace(/^%40/, '@');
    return `${registry}/${encodedName}`;
}

function getUpdateCommand() {
    if (process.env.AGENTRELAY_GLOBAL === 'true') {
        return `npm install -g ${packageJson.name}@latest && agentrelay`;
    }
    return 'git pull && npm install && npm run build:dashboard && npm start';
}

function isUpdateCheckEnabled() {
    return String(process.env.UPDATE_CHECK_ENABLED || 'true').toLowerCase() !== 'false';
}

async function fetchLatestVersion(fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('Fetch API is not available');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    try {
        const response = await fetchImpl(getPackageUrl(), {
            signal: controller.signal,
            headers: {
                accept: 'application/vnd.npm.install-v1+json'
            }
        });
        if (!response.ok) {
            throw new Error(`npm registry returned ${response.status}`);
        }
        const metadata = await response.json();
        const latest = metadata?.['dist-tags']?.latest;
        if (!latest) {
            throw new Error('npm registry response did not include dist-tags.latest');
        }
        return latest;
    } finally {
        clearTimeout(timeout);
    }
}

function buildBaseInfo() {
    return {
        enabled: isUpdateCheckEnabled(),
        packageName: packageJson.name,
        currentVersion: packageJson.version,
        latestVersion: '',
        updateAvailable: false,
        checkedAt: '',
        command: getUpdateCommand(),
        source: 'npm'
    };
}

async function loadUpdateInfo(options = {}) {
    const info = buildBaseInfo();
    if (!info.enabled) return info;

    try {
        const latestVersion = await fetchLatestVersion(options.fetchImpl);
        return {
            ...info,
            latestVersion,
            updateAvailable: isNewerVersion(latestVersion, info.currentVersion),
            checkedAt: new Date().toISOString()
        };
    } catch (error) {
        return {
            ...info,
            error: error.message || 'Update check failed',
            checkedAt: new Date().toISOString()
        };
    }
}

async function getUpdateInfo(options = {}) {
    const now = Date.now();
    const force = Boolean(options.force);
    const cacheTtl = cachedInfo?.error ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;

    if (!force && cachedInfo && now - cachedAt < cacheTtl) {
        return cachedInfo;
    }

    if (!force && pendingCheck) return pendingCheck;

    pendingCheck = loadUpdateInfo(options).then(info => {
        cachedInfo = info;
        cachedAt = Date.now();
        return info;
    }).finally(() => {
        pendingCheck = null;
    });

    return pendingCheck;
}

function clearUpdateCheckCache() {
    cachedInfo = null;
    cachedAt = 0;
    pendingCheck = null;
}

module.exports = {
    clearUpdateCheckCache,
    compareVersions,
    getUpdateCommand,
    getUpdateInfo,
    isNewerVersion,
    parseVersion
};
