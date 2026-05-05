const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { BOT_CHANNELS } = require('./botChannels');
const { dataDir } = require('../runtimePaths');

const DB_PATH = path.join(dataDir, 'config.db');
const SCHEMA_VERSION = 2;

let _db;

function sql() {
    if (!_db || !_db.open) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        _db = new Database(DB_PATH);
        _db.pragma('journal_mode = WAL');
        _db.pragma('foreign_keys = ON');
        migrate();
    }
    return _db;
}

function migrate() {
    const cv = Number(getRaw('schema_version') || 0);
    if (cv >= SCHEMA_VERSION) return;
    if (cv < 1) {
        sql().exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, must_change_password INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
            CREATE TABLE IF NOT EXISTS telegram_users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL, display_name TEXT DEFAULT '', role TEXT DEFAULT 'user' CHECK(role IN ('admin','user','viewer')), enabled INTEGER DEFAULT 1);
            CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, path TEXT UNIQUE NOT NULL, is_default INTEGER DEFAULT 0, enabled INTEGER DEFAULT 1);`);
    }
    if (cv < 2) {
        sql().exec(`DROP TABLE IF EXISTS cli_providers`);
        sql().exec(`DROP TABLE IF EXISTS cli_models`);
        sql().exec(`CREATE TABLE cli_providers (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, command TEXT DEFAULT '', detected INTEGER DEFAULT 0, detected_path TEXT DEFAULT '', version TEXT DEFAULT '', enabled INTEGER DEFAULT 1, status TEXT DEFAULT 'unknown' CHECK(status IN ('detected','not_detected','manual_valid','error','disabled')), last_checked_at TEXT DEFAULT '', error_message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
            CREATE TABLE cli_models (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_key TEXT NOT NULL, model_name TEXT NOT NULL, display_name TEXT DEFAULT '', source TEXT DEFAULT 'manual' CHECK(source IN ('detected','manual','env','default')), enabled INTEGER DEFAULT 1, is_default INTEGER DEFAULT 0, detected_at TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (provider_key) REFERENCES cli_providers(key) ON DELETE CASCADE);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_model_provider_name ON cli_models(provider_key, model_name);`);
    }
    setRaw('schema_version', String(SCHEMA_VERSION));
}

function getRaw(key) {
    try { const r = sql().prepare('SELECT value FROM settings WHERE key = ?').get(key); return r ? r.value : null; } catch { return null; }
}
function setRaw(key, val) { sql().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(val)); }
function all(table, order = 'id') { return sql().prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all(); }
function get(table, key, val) { return sql().prepare(`SELECT * FROM ${table} WHERE ${key} = ?`).get(val); }
function del(table, key, val) { sql().prepare(`DELETE FROM ${table} WHERE ${key} = ?`).run(val); }
function ins(table, data) {
    const cols = Object.keys(data).join(', ');
    const ph = Object.keys(data).map(() => '?').join(', ');
    const vals = Object.values(data);
    const r = sql().prepare(`INSERT INTO ${table} (${cols}) VALUES (${ph})`).run(...vals);
    return r.lastInsertRowid;
}
function upd(table, idField, idVal, data) {
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const vals = Object.values(data);
    sql().prepare(`UPDATE ${table} SET ${sets} WHERE ${idField} = ?`).run(...vals, idVal);
}

const DEFAULT_PROVIDERS = [
    { key: 'codex', displayName: 'Codex CLI', cmd: 'codex' },
    { key: 'opencode', displayName: 'OpenCode CLI', cmd: 'opencode' },
    { key: 'claude', displayName: 'Claude Code CLI', cmd: 'claude' },
    { key: 'gemini', displayName: 'Gemini CLI', cmd: 'gemini' },
    { key: 'kiro', displayName: 'Kiro CLI', cmd: 'kiro' },
    { key: 'kilocode', displayName: 'Kilo Code CLI', cmd: 'kilocode' },
    { key: 'aider', displayName: 'Aider CLI', cmd: 'aider' },
    { key: 'goose', displayName: 'Goose CLI', cmd: 'goose' },
    { key: 'github-copilot', displayName: 'GitHub Copilot CLI', cmd: 'gh', status: 'disabled' },
    { key: 'crush', displayName: 'Crush CLI', cmd: 'crush' },
];

const PROVIDER_ENV_KEYS = {
    codex: ['CODEX_COMMAND'],
    opencode: ['OPENCODE_COMMAND', 'OPENCODE_AI_COMMAND'],
    claude: ['CLAUDE_COMMAND', 'CLAUDE_CODE_COMMAND'],
    gemini: ['GEMINI_COMMAND'],
    kiro: ['KIRO_COMMAND'],
    kilocode: ['KILOCODE_COMMAND', 'KILO_CODE_COMMAND'],
    aider: ['AIDER_COMMAND'],
    goose: ['GOOSE_COMMAND'],
    'github-copilot': ['GITHUB_COPILOT_COMMAND', 'GH_COMMAND'],
    crush: ['CRUSH_COMMAND']
};

function envKeyFor(channelKey, fieldKey) {
    return `${channelKey}_${fieldKey}`.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase();
}

function parseEnvFile(envPath) {
    if (!fs.existsSync(envPath)) return [];
    const content = fs.readFileSync(envPath, 'utf8');
    const entries = [];
    for (const line of content.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        let value = t.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key) entries.push([key, value]);
    }
    return entries;
}

function importChannelEnv(env) {
    let count = 0;
    for (const channel of BOT_CHANNELS) {
        const current = store.getJsonSetting(`bot_channel_${channel.key}`, { enabled: false, fields: {} });
        const fields = { ...(current.fields || {}) };
        let changed = false;

        const enabledKey = `${channel.key}_enabled`.toUpperCase();
        let enabled = Boolean(current.enabled);
        if (env.has(enabledKey)) {
            enabled = ['1', 'true', 'yes', 'on'].includes(String(env.get(enabledKey) || '').trim().toLowerCase());
            changed = true;
            count++;
        }

        for (const field of channel.fields) {
            const envKey = field.env || envKeyFor(channel.key, field.key);
            const value = env.get(envKey);
            if (!value) continue;
            if (channel.key === 'telegram' && field.key === 'token') {
                if (!store.getSetting('telegram_bot_token')) store.setSetting('telegram_bot_token', value);
                if (!env.has(enabledKey)) enabled = true;
            } else {
                fields[field.key] = value;
            }
            changed = true;
            count++;
        }

        if (changed) {
            if (channel.key === 'telegram') store.setSetting('telegram_enabled', enabled ? 'true' : 'false');
            store.setJsonSetting(`bot_channel_${channel.key}`, {
                enabled,
                fields,
                updated_at: new Date().toISOString()
            });
        }
    }
    return count;
}

const store = {
    ensureDefaults() {
        for (const p of DEFAULT_PROVIDERS) {
            const existing = sql().prepare('SELECT id FROM cli_providers WHERE key = ?').get(p.key);
            if (!existing) {
                sql().prepare('INSERT INTO cli_providers (key, display_name, command, status) VALUES (?, ?, ?, ?)').run(p.key, p.displayName, p.cmd, p.status || 'not_detected');
            }
        }
    },

    getSetting(key, def = null) { const r = sql().prepare('SELECT value FROM settings WHERE key = ?').get(key); return r ? r.value : def; },
    setSetting(key, val) { sql().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(val)); },
    getJsonSetting(key, def = {}) {
        const raw = this.getSetting(key, '');
        if (!raw) return def;
        try { return JSON.parse(raw); } catch { return def; }
    },
    setJsonSetting(key, val) { this.setSetting(key, JSON.stringify(val || {})); },

    getAdmin(username) { return get('admin_users', 'username', username); },
    createAdmin(username, pw) { sql().prepare('INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, pw); },
    updateAdminPw(id, pw) { sql().prepare('UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(pw, id); },
    hasAdmin() { return sql().prepare('SELECT COUNT(*) as c FROM admin_users').get().c > 0; },

    getTelegramUsers() { return all('telegram_users', 'user_id'); },
    addTelegramUser(uid, name = '', role = 'user') {
        const result = sql().prepare('INSERT OR IGNORE INTO telegram_users (user_id, display_name, role) VALUES (?, ?, ?)').run(uid, name, role);
        if (result.changes === 0) {
            sql().prepare('UPDATE telegram_users SET display_name = ?, role = ?, enabled = 1 WHERE user_id = ?').run(name, role, uid);
        }
    },
    updateTelegramUser(id, f) { upd('telegram_users', 'id', id, f); },
    deleteTelegramUser(id) { del('telegram_users', 'id', id); },

    getProjects() { return all('projects', 'name'); },
    addProject(name, p) { return sql().prepare('INSERT OR IGNORE INTO projects (name, path) VALUES (?, ?)').run(name, p).lastInsertRowid; },
    updateProject(id, f) { upd('projects', 'id', id, f); },
    deleteProject(id) { del('projects', 'id', id); },
    setDefaultProject(id) { sql().prepare('UPDATE projects SET is_default = 0').run(); sql().prepare('UPDATE projects SET is_default = 1 WHERE id = ?').run(id); },

    // CLI Providers
    getCliProviders() { this.ensureDefaults(); return all('cli_providers', 'key'); },
    getCliProviderByKey(key) { return get('cli_providers', 'key', key); },
    getEnabledProviders() {
        return sql().prepare(`SELECT p.* FROM cli_providers p
            WHERE p.enabled = 1
              AND p.status IN ('detected','manual_valid')
              AND p.command != ''
              AND EXISTS (
                  SELECT 1 FROM cli_models m
                  WHERE m.provider_key = p.key AND m.enabled = 1
              )
            ORDER BY p.key`).all();
    },
    getEnabledProviderKeys() { return sql().prepare("SELECT key FROM cli_providers WHERE enabled = 1 AND status IN ('detected','manual_valid') AND command != '' ORDER BY key").all().map(r => r.key); },
    upsertCliProvider(key, f) { f.updated_at = new Date().toISOString(); const e = sql().prepare('SELECT id FROM cli_providers WHERE key = ?').get(key); if (e) { upd('cli_providers', 'key', key, f); return e.id; } f.key = key; return ins('cli_providers', f); },
    updateCliProviderByKey(key, f) { f.updated_at = new Date().toISOString(); upd('cli_providers', 'key', key, f); },

    // Models
    getModels(key) { return sql().prepare('SELECT * FROM cli_models WHERE provider_key = ? ORDER BY model_name').all(key); },
    getEnabledModels(key) { return sql().prepare('SELECT * FROM cli_models WHERE provider_key = ? AND enabled = 1 ORDER BY model_name').all(key); },
    addModel(pk, name, display = '', source = 'manual') {
        const e = sql().prepare('SELECT id FROM cli_models WHERE provider_key = ? AND model_name = ?').get(pk, name);
        if (e) return e.id;
        const hasDef = sql().prepare('SELECT id FROM cli_models WHERE provider_key = ? AND is_default = 1').get(pk);
        return sql().prepare('INSERT INTO cli_models (provider_key, model_name, display_name, source, is_default, detected_at) VALUES (?, ?, ?, ?, ?, ?)').run(pk, name, display || name, source, hasDef ? 0 : 1, new Date().toISOString()).lastInsertRowid;
    },
    updateModelByKey(pk, id, f) { f.updated_at = new Date().toISOString(); upd('cli_models', 'id', id, f); },
    deleteModelById(pk, id) { sql().prepare('DELETE FROM cli_models WHERE id = ? AND provider_key = ?').run(id, pk); },
    setDefaultModel(pk, id) { sql().prepare('UPDATE cli_models SET is_default = 0 WHERE provider_key = ?').run(pk); sql().prepare('UPDATE cli_models SET is_default = 1 WHERE id = ? AND provider_key = ?').run(id, pk); },
    getDefaultModel(pk) { return sql().prepare('SELECT * FROM cli_models WHERE provider_key = ? AND is_default = 1 AND enabled = 1 LIMIT 1').get(pk); },

    // Import from .env
    importFromEnv(envPath) {
        const entries = parseEnvFile(envPath);
        if (entries.length === 0) return 0;
        const env = new Map(entries);
        let count = 0;

        count += importChannelEnv(env);

        for (const [k, v] of entries) {
            if (!k || !v) continue;
            if (k === 'ALLOWED_TELEGRAM_USER_IDS') { for (const u of v.split(',').map(s => s.trim()).filter(Boolean)) { const n = Number.parseInt(u, 10); if (Number.isFinite(n)) try { this.addTelegramUser(n, '', 'user'); count++; } catch {} } }
            else if (k === 'PROJECTS' || k === 'PROJECT_DIR') { for (const p of v.split(',').map(s => s.trim()).filter(Boolean)) { const nm = path.basename(p.replace(/\\/g, '/').replace(/\/$/, '')); try { this.addProject(nm || p, p); count++; } catch {} } }
            else if (k === 'CODEX_MODELS') { for (const m of v.split(',').map(s => s.trim()).filter(Boolean)) { this.addModel('codex', m, m, 'env'); count++; } }
            else if (k.endsWith('_MODELS')) {
                const provider = Object.entries(PROVIDER_ENV_KEYS).find(([, keys]) => keys.some(commandKey => commandKey.replace(/_COMMAND$/, '_MODELS') === k))?.[0];
                if (provider) {
                    for (const m of v.split(',').map(s => s.trim()).filter(Boolean)) {
                        this.addModel(provider, m, m, 'env');
                        count++;
                    }
                }
            }
            else if (k === 'TASK_TIMEOUT_MINUTES') { if (!this.getSetting('task_timeout_minutes')) this.setSetting('task_timeout_minutes', v); count++; }
            else if (k === 'SYSTEM_LANGUAGE') { if (!this.getSetting('system_language')) this.setSetting('system_language', v); count++; }
        }

        for (const [providerKey, keys] of Object.entries(PROVIDER_ENV_KEYS)) {
            const command = keys.map(key => env.get(key)).find(Boolean);
            if (command) {
                this.upsertCliProvider(providerKey, { command, detected: 1, status: 'manual_valid' });
                count++;
            }
        }

        return count;
    },

    close() { if (_db) { try { _db.close(); } catch {} _db = null; } }
};

sql(); // Init on load
module.exports = store;
