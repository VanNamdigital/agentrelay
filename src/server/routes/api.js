const { Router } = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const store = require('../../config/store');
const {
    BOT_CHANNELS,
    LANGUAGE_OPTIONS,
    ALLOWED_LANGUAGES,
    ALLOWED_CHANNEL_KEYS,
    getChannel
} = require('../../config/botChannels');
const botManager = require('../../bot');
const detector = require('../../cli/detector');
const authMiddleware = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../../auth/password');
const { redactPublicOutput } = require('../../settingsConfig');
const { logDir } = require('../../runtimePaths');
const { getUpdateInfo } = require('../../updateCheck');

const router = Router();
const LOG_PATH = path.join(logDir, 'app.log');
const PICKER_TIMEOUT_MS = 120000;
let activeDirectoryPicker = null;

function bool(value) {
    return value === true || value === 1 || value === '1' || value === 'true' || value === 'on';
}

function asPositiveInt(value, fallback = null) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getAllowedProjectRoots() {
    return String(process.env.PROJECTS_BASE_DIR || '')
        .split(',')
        .map(root => root.trim())
        .filter(Boolean)
        .map(root => path.resolve(root));
}

function isPathInside(root, target) {
    const relative = path.relative(root, target);
    return relative === '' || Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function validateProjectPath(projectPath) {
    const text = String(projectPath || '').trim();
    if (!text || text.includes('\0')) return { error: 'Project path is invalid' };
    const resolved = path.resolve(text);
    const roots = getAllowedProjectRoots();
    if (roots.length > 0 && !roots.some(root => isPathInside(root, resolved))) {
        return { error: 'Project path is outside PROJECTS_BASE_DIR' };
    }
    return { resolved };
}

function runPicker(command, args, options = {}) {
    return new Promise(resolve => {
        let stdout = '';
        let didTimeout = false;
        let settled = false;
        let child;
        let timeout;

        function settle(result) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(result);
        }

        try {
            child = spawn(command, args, {
                ...options,
                stdio: ['ignore', 'pipe', 'pipe']
            });
        } catch {
            settle({ status: -1, stdout: '', timedOut: false });
            return;
        }

        timeout = setTimeout(() => {
            didTimeout = true;
            if (!settled) child.kill();
        }, options.timeout || PICKER_TIMEOUT_MS);
        if (timeout.unref) timeout.unref();

        child.stdout.on('data', chunk => {
            stdout += chunk.toString();
        });
        child.stderr.resume();
        child.on('error', () => {
            settle({ status: -1, stdout, timedOut: didTimeout });
        });
        child.on('close', status => {
            settle({ status, stdout, timedOut: didTimeout });
        });
    });
}

async function pickDirectory() {
    if (process.platform === 'win32') {
        const script = [
            'Add-Type -AssemblyName System.Windows.Forms',
            'Add-Type -AssemblyName System.Drawing',
            '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
            "$dialog.Description = 'Select project folder'",
            '$dialog.ShowNewFolderButton = $true',
            '$owner = New-Object System.Windows.Forms.Form',
            '$owner.TopMost = $true',
            '$owner.ShowInTaskbar = $false',
            "$owner.StartPosition = 'CenterScreen'",
            '$owner.Size = New-Object System.Drawing.Size -ArgumentList 1, 1',
            '$owner.Opacity = 0',
            '$owner.Show()',
            '$owner.Activate()',
            '$result = $dialog.ShowDialog($owner)',
            'if ($result -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $dialog.SelectedPath }',
            '$owner.Close()',
            '$owner.Dispose()',
            '$dialog.Dispose()'
        ].join('; ');
        const result = await runPicker('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-Command', script], { timeout: PICKER_TIMEOUT_MS, windowsHide: true });
        if (result.timedOut) throw new Error('Folder picker timed out');
        const pickedPath = result.status === 0 ? String(result.stdout || '').trim() : '';
        return pickedPath || '';
    }
    if (process.platform === 'darwin') {
        const result = await runPicker('osascript', ['-e', 'POSIX path of (choose folder with prompt "Select project folder")'], { timeout: PICKER_TIMEOUT_MS });
        if (result.timedOut) throw new Error('Folder picker timed out');
        return result.status === 0 ? String(result.stdout || '').trim() : '';
    }
    const result = await runPicker('zenity', ['--file-selection', '--directory', '--title=Select project folder'], { timeout: PICKER_TIMEOUT_MS });
    if (result.timedOut) throw new Error('Folder picker timed out');
    return result.status === 0 ? String(result.stdout || '').trim() : '';
}

function maskSecret(value) {
    const secret = String(value || '');
    if (!secret) return '';
    if (secret.length <= 8) return '***';
    return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function getSystemLanguage() {
    const language = store.getSetting('system_language', 'en');
    return ALLOWED_LANGUAGES.has(language) ? language : 'en';
}

function getStoredChannelConfig(key) {
    return store.getJsonSetting(`bot_channel_${key}`, { enabled: false, fields: {} });
}

function getRawChannelFields(channel) {
    const stored = getStoredChannelConfig(channel.key);
    const fields = { ...(stored.fields || {}) };
    if (channel.key === 'telegram') {
        fields.token = store.getSetting('telegram_bot_token', '') || fields.token || '';
    }
    return fields;
}

function serializeChannel(channel) {
    const stored = getStoredChannelConfig(channel.key);
    const rawFields = getRawChannelFields(channel);
    const enabled = channel.key === 'telegram'
        ? store.getSetting('telegram_enabled', 'false') === 'true'
        : Boolean(stored.enabled);
    const completeFieldCount = channel.fields.filter(field => Boolean(rawFields[field.key])).length;
    const requiredFieldCount = channel.fields.length;
    const runtimeStatus = channel.key === 'telegram'
        ? botManager.getStatus().status
        : enabled && completeFieldCount > 0
            ? 'configured'
            : 'setup_ready';

    return {
        key: channel.key,
        displayName: channel.displayName,
        category: channel.category,
        runtime: channel.runtime,
        runtimeStatus,
        enabled,
        setupUrl: channel.setupUrl,
        description: channel.description,
        setupSteps: channel.setupSteps,
        completeFieldCount,
        requiredFieldCount,
        updatedAt: stored.updated_at || '',
        fields: channel.fields.map(field => {
            const rawValue = rawFields[field.key] || '';
            return {
                ...field,
                value: field.secret ? '' : rawValue,
                hasValue: Boolean(rawValue),
                maskedValue: field.secret ? maskSecret(rawValue) : ''
            };
        })
    };
}

function getBotConfigPayload() {
    const token = store.getSetting('telegram_bot_token', '');
    return {
        systemLanguage: getSystemLanguage(),
        languages: LANGUAGE_OPTIONS,
        channels: BOT_CHANNELS.map(serializeChannel),
        telegram: {
            enabled: store.getSetting('telegram_enabled', 'false') === 'true',
            tokenExists: Boolean(token),
            tokenMasked: token ? botManager.maskToken(token) : '',
            status: botManager.getStatus()
        },
        users: store.getTelegramUsers()
    };
}

function getTelegramRuntimeSnapshot() {
    return {
        enabled: store.getSetting('telegram_enabled', 'false') === 'true',
        token: store.getSetting('telegram_bot_token', '')
    };
}

function syncTelegramRuntime(previous = {}) {
    const current = getTelegramRuntimeSnapshot();
    const status = botManager.getStatus();

    if (!current.enabled) {
        if (status.running) {
            return { action: 'stopped', result: botManager.stopBot() };
        }
        return { action: 'disabled', result: { success: true } };
    }

    if (!current.token) {
        return { action: 'not_configured', result: { success: false, error: 'Telegram bot token is required' } };
    }

    const tokenChanged = previous.token !== undefined && previous.token !== current.token;
    if (status.running && !tokenChanged) {
        return { action: 'already_running', result: { success: true } };
    }

    return {
        action: status.running ? 'restarted' : 'started',
        result: status.running ? botManager.restartBot() : botManager.startBot()
    };
}

function saveChannelConfig(channel, body) {
    const current = getStoredChannelConfig(channel.key);
    const currentFields = getRawChannelFields(channel);
    const nextFields = { ...(current.fields || {}) };
    const inputFields = body.fields && typeof body.fields === 'object' ? body.fields : {};

    for (const field of channel.fields) {
        if (inputFields[field.key] === undefined) continue;
        const value = String(inputFields[field.key] || '').trim();
        if (field.secret && !value) {
            nextFields[field.key] = currentFields[field.key] || '';
        } else {
            nextFields[field.key] = value;
        }
    }

    const enabled = body.enabled !== undefined ? bool(body.enabled) : Boolean(current.enabled);
    const payload = {
        enabled,
        fields: nextFields,
        updated_at: new Date().toISOString()
    };

    if (channel.key === 'telegram') {
        if (nextFields.token) store.setSetting('telegram_bot_token', nextFields.token);
        store.setSetting('telegram_enabled', enabled ? 'true' : 'false');
        delete payload.fields.token;
    }

    store.setJsonSetting(`bot_channel_${channel.key}`, payload);
    return serializeChannel(channel);
}

function providerStatus(provider) {
    if (!provider.enabled) return 'disabled';
    if (!provider.command) return 'needs_setup';
    if (provider.status === 'detected' || provider.status === 'manual_valid') return provider.status;
    return provider.status || 'not_detected';
}

function serializeProvider(provider) {
    const models = store.getModels(provider.key);
    return {
        ...provider,
        enabled: provider.enabled === 1,
        detected: provider.detected === 1,
        status: providerStatus(provider),
        models,
        enabledModelCount: models.filter(model => model.enabled === 1).length,
        defaultModel: models.find(model => model.is_default === 1) || null
    };
}

function validateProviderCanEnable(key, command) {
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return 'Unknown provider key';
    if (!String(command || '').trim()) return 'Command is required before enabling this provider';
    const provider = store.getCliProviderByKey(key);
    if (String(command || '').trim() !== String(provider?.command || '').trim()) return 'Test this command before enabling the provider';
    const status = provider?.status;
    if (!['detected', 'manual_valid'].includes(status)) return 'Test or scan this command before enabling the provider';
    if (store.getEnabledModels(key).length === 0) return 'Enable at least one model before enabling this provider';
    return null;
}

async function detectProviderModels(key, command) {
    if (key === 'opencode') return detector.fetchOpenCodeModels(command || 'opencode');
    if (key === 'codex') return detector.fetchCodexModels();
    if (key === 'claude') return detector.fetchClaudeModelSuggestions();
    if (key === 'gemini') return detector.fetchGeminiModelSuggestions();
    if (key === 'kiro') return detector.fetchKiroModels(command || 'kiro-cli');
    if (key === 'kilocode') return detector.fetchKiloCodeModels(command || 'kilo');
    if (key === 'command-code') return detector.fetchCommandCodeModels();
    return [];
}

function fallbackModelsForProvider(key) {
    if (key === 'claude' || key === 'gemini') return ['default'];
    if (key === 'kilocode') return ['kilo/kilo-auto/free'];
    if (key === 'kiro') return ['auto'];
    if (key === 'command-code') return ['default'];
    return [];
}

function preferredDefaultModel(key, models) {
    const preferred = {
        codex: 'gpt-5.5',
        opencode: 'opencode/big-pickle',
        claude: 'default',
        gemini: 'default',
        kiro: 'auto',
        kilocode: 'kilo/kilo-auto/free',
        'command-code': 'default'
    }[key];
    if (preferred && models.includes(preferred)) return preferred;
    return models[0] || '';
}

function shouldReplaceDefaultModel(key, currentDefault) {
    if (!currentDefault) return true;
    const current = String(currentDefault.model_name || '').trim();
    if (!current) return true;
    if (key === 'kiro' && /\s/.test(current)) return true;
    if (key === 'kilocode' && ['balanced', 'anthropic/claude-sonnet-latest'].includes(current)) return true;
    return false;
}

async function seedProviderModels(key, command) {
    let detected = await detectProviderModels(key, command);
    if (detected.length === 0) detected = fallbackModelsForProvider(key);
    const uniqueModels = [...new Set(detected.map(model => String(model || '').trim()).filter(Boolean))];
    const added = [];
    for (const model of uniqueModels) {
        const id = store.addModel(key, model, model, ['claude', 'gemini', 'command-code'].includes(key) ? 'default' : 'detected');
        store.updateModelByKey(key, id, { enabled: 1 });
        added.push({ model_name: model, id });
    }

    const defaultName = preferredDefaultModel(key, uniqueModels);
    const currentDefault = store.getDefaultModel(key);
    if (defaultName && shouldReplaceDefaultModel(key, currentDefault)) {
        const model = store.getModels(key).find(item => item.model_name === defaultName);
        if (model) store.setDefaultModel(key, model.id);
    }

    return added;
}

function readLogLines({ filter = 'all', search = '', limit = 500 } = {}) {
    let lines = [];
    if (fs.existsSync(LOG_PATH)) {
        lines = fs.readFileSync(LOG_PATH, 'utf8').trimEnd().split(/\r?\n/).filter(Boolean);
    }

    let filtered = lines.slice(-limit);
    if (filter === 'error') filtered = filtered.filter(line => /error|failed|exception/i.test(line));
    else if (filter === 'cli') filtered = filtered.filter(line => /cli/i.test(line));
    else if (filter === 'telegram') filtered = filtered.filter(line => /telegram|bot/i.test(line));
    else if (filter === 'info') filtered = filtered.filter(line => !/error|failed|exception/i.test(line));

    if (search) {
        const needle = String(search).toLowerCase();
        filtered = filtered.filter(line => line.toLowerCase().includes(needle));
    }

    return filtered.map(line => redactPublicOutput(line));
}

router.get('/auth/session', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.json({ authenticated: false });
    }
    return res.json({
        authenticated: true,
        user: { id: req.session.userId, username: req.session.username },
        mustChangePassword: Boolean(req.session.mustChangePassword)
    });
});

router.post('/auth/login', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const admin = store.getAdmin(username);
    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    req.session.regenerate(error => {
        if (error) return res.status(500).json({ success: false, error: 'Login failed' });
        req.session.userId = admin.id;
        req.session.username = admin.username;
        req.session.mustChangePassword = admin.must_change_password === 1;
        req.session.save(saveError => {
            if (saveError) return res.status(500).json({ success: false, error: 'Login failed' });
            return res.json({
                success: true,
                mustChangePassword: req.session.mustChangePassword,
                user: { id: admin.id, username: admin.username }
            });
        });
    });
});

router.post('/auth/change-password', authMiddleware.requireAuth, async (req, res) => {
    const currentPassword = String(req.body.currentPassword || req.body.current_password || '');
    const newPassword = String(req.body.newPassword || req.body.new_password || '');
    const confirmPassword = String(req.body.confirmPassword || req.body.confirm_password || '');
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, error: 'All password fields are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Password confirmation does not match' });
    }

    const admin = store.getAdmin(req.session.username);
    if (!admin || !(await verifyPassword(currentPassword, admin.password_hash))) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    store.updateAdminPw(admin.id, await hashPassword(newPassword));
    req.session.mustChangePassword = false;
    req.session.save();
    return res.json({ success: true });
});

router.post('/auth/logout', (req, res) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy(() => res.json({ success: true }));
});

router.use(authMiddleware.requireAuth);

router.get('/app/update', async (req, res) => {
    res.json(await getUpdateInfo());
});

router.get('/dashboard', (req, res) => {
    const providers = store.getCliProviders().map(serializeProvider);
    const projects = store.getProjects();
    const users = store.getTelegramUsers();
    const enabledProviders = providers.filter(provider => (
        provider.enabled &&
        ['detected', 'manual_valid'].includes(provider.status) &&
        provider.command &&
        provider.enabledModelCount > 0
    ));

    res.json({
        botStatus: botManager.getStatus(),
        systemLanguage: getSystemLanguage(),
        providers,
        enabledProviders,
        projectCount: projects.filter(project => project.enabled !== 0).length,
        userCount: users.filter(user => user.enabled !== 0).length,
        runningTaskCount: 0,
        recentLogs: readLogLines({ limit: 12 })
    });
});

router.get('/bot/config', (req, res) => {
    res.json(getBotConfigPayload());
});

router.patch('/bot/config', authMiddleware.requireChangePassword, (req, res) => {
    const previousTelegram = getTelegramRuntimeSnapshot();
    if (req.body.token && String(req.body.token).trim()) {
        store.setSetting('telegram_bot_token', String(req.body.token).trim());
    }
    if (req.body.enabled !== undefined) {
        store.setSetting('telegram_enabled', bool(req.body.enabled) ? 'true' : 'false');
    }
    const runtime = syncTelegramRuntime(previousTelegram);
    res.json({ success: true, runtime, config: getBotConfigPayload() });
});

router.patch('/bot/channels/:key', authMiddleware.requireChangePassword, (req, res) => {
    const key = String(req.params.key || '').trim();
    if (!ALLOWED_CHANNEL_KEYS.has(key)) {
        return res.status(404).json({ success: false, error: 'Bot channel not found' });
    }
    const channel = getChannel(key);
    const previousTelegram = key === 'telegram' ? getTelegramRuntimeSnapshot() : null;
    saveChannelConfig(channel, req.body || {});
    const runtime = key === 'telegram' ? syncTelegramRuntime(previousTelegram) : null;
    res.json({ success: true, channel: serializeChannel(channel), config: getBotConfigPayload(), runtime });
});

router.post('/bot/test-telegram', authMiddleware.requireChangePassword, async (req, res) => {
    const token = String(req.body.token || store.getSetting('telegram_bot_token', '') || '').trim();
    if (!token) return res.status(400).json({ success: false, error: 'Telegram bot token is required' });
    res.json(await botManager.testConnection(token));
});

router.post('/bot/start', authMiddleware.requireChangePassword, (req, res) => {
    res.json(botManager.startBot());
});

router.post('/bot/stop', authMiddleware.requireChangePassword, (req, res) => {
    res.json(botManager.stopBot());
});

router.post('/bot/restart', authMiddleware.requireChangePassword, (req, res) => {
    res.json(botManager.restartBot());
});

router.get('/settings/general', (req, res) => {
    res.json({
        task_timeout_minutes: store.getSetting('task_timeout_minutes', '120'),
        system_language: getSystemLanguage(),
        languages: LANGUAGE_OPTIONS
    });
});

router.patch('/settings/general', authMiddleware.requireChangePassword, (req, res) => {
    let changed = false;
    if (req.body.task_timeout_minutes !== undefined) {
        const timeout = asPositiveInt(req.body.task_timeout_minutes, null);
        if (!timeout || timeout > 1440) {
            return res.status(400).json({ success: false, error: 'Task timeout must be between 1 and 1440 minutes' });
        }
        store.setSetting('task_timeout_minutes', String(timeout));
        changed = true;
    }
    if (req.body.system_language !== undefined) {
        const language = String(req.body.system_language || '').trim();
        if (!ALLOWED_LANGUAGES.has(language)) {
            return res.status(400).json({ success: false, error: 'Unsupported system language' });
        }
        store.setSetting('system_language', language);
        changed = true;
    }
    if (!changed) {
        return res.status(400).json({ success: false, error: 'No settings were provided' });
    }
    res.json({
        success: true,
        task_timeout_minutes: store.getSetting('task_timeout_minutes', '120'),
        system_language: getSystemLanguage()
    });
});

router.get('/telegram-users', (req, res) => {
    res.json(store.getTelegramUsers());
});

router.post('/telegram-users', authMiddleware.requireChangePassword, (req, res) => {
    const userId = asPositiveInt(req.body.user_id, null);
    const role = ['admin', 'user', 'viewer'].includes(req.body.role) ? req.body.role : 'user';
    if (!userId) return res.status(400).json({ success: false, error: 'Valid Telegram user ID is required' });
    store.addTelegramUser(userId, String(req.body.display_name || '').trim(), role);
    res.json({ success: true });
});

router.patch('/telegram-users/:id', authMiddleware.requireChangePassword, (req, res) => {
    const fields = {};
    if (req.body.display_name !== undefined) fields.display_name = String(req.body.display_name || '').trim();
    if (req.body.role !== undefined && ['admin', 'user', 'viewer'].includes(req.body.role)) fields.role = req.body.role;
    if (req.body.enabled !== undefined) fields.enabled = bool(req.body.enabled) ? 1 : 0;
    if (Object.keys(fields).length > 0) store.updateTelegramUser(req.params.id, fields);
    res.json({ success: true });
});

router.delete('/telegram-users/:id', authMiddleware.requireChangePassword, (req, res) => {
    store.deleteTelegramUser(req.params.id);
    res.json({ success: true });
});

router.get('/projects', (req, res) => {
    res.json(store.getProjects().map(project => ({ ...project, exists: fs.existsSync(project.path) })));
});

router.post('/projects/browse', authMiddleware.requireChangePassword, async (req, res) => {
    if (activeDirectoryPicker) {
        return res.status(409).json({ success: false, error: 'A folder picker is already open. Choose or cancel it first.' });
    }

    activeDirectoryPicker = pickDirectory();
    try {
        const selected = await activeDirectoryPicker;
        if (!selected) return res.json({ success: false, cancelled: true });
        const validation = validateProjectPath(selected);
        if (validation.error) return res.status(400).json({ success: false, error: validation.error });
        res.json({ success: true, path: validation.resolved, name: path.basename(validation.resolved) });
    } catch (error) {
        const message = error.message === 'Folder picker timed out'
            ? error.message
            : 'Failed to open project folder picker';
        res.status(error.message === 'Folder picker timed out' ? 408 : 500).json({ success: false, error: message });
    } finally {
        activeDirectoryPicker = null;
    }
});

router.post('/projects', authMiddleware.requireChangePassword, (req, res) => {
    const projectPath = String(req.body.path || req.body.projectPath || '').trim();
    if (!projectPath) return res.status(400).json({ success: false, error: 'Project path is required' });
    const validation = validateProjectPath(projectPath);
    if (validation.error) return res.status(400).json({ success: false, error: validation.error });
    const resolved = validation.resolved;
    const name = String(req.body.name || path.basename(resolved)).trim() || resolved;
    const id = store.addProject(name, resolved);
    if (bool(req.body.is_default)) store.setDefaultProject(id);
    res.json({ success: true, id });
});

router.patch('/projects/:id', authMiddleware.requireChangePassword, (req, res) => {
    const fields = {};
    if (req.body.name !== undefined) fields.name = String(req.body.name || '').trim();
    if (req.body.path !== undefined) {
        const validation = validateProjectPath(req.body.path);
        if (validation.error) return res.status(400).json({ success: false, error: validation.error });
        fields.path = validation.resolved;
    }
    if (req.body.enabled !== undefined) fields.enabled = bool(req.body.enabled) ? 1 : 0;
    if (Object.keys(fields).length > 0) store.updateProject(req.params.id, fields);
    if (bool(req.body.is_default)) store.setDefaultProject(req.params.id);
    res.json({ success: true });
});

router.delete('/projects/:id', authMiddleware.requireChangePassword, (req, res) => {
    store.deleteProject(req.params.id);
    res.json({ success: true });
});

router.get('/projects/test', authMiddleware.requireChangePassword, (req, res) => {
    const validation = validateProjectPath(req.query.path);
    if (validation.error) return res.status(400).json({ success: false, error: validation.error });
    res.json({ exists: fs.existsSync(validation.resolved), path: validation.resolved });
});

router.get('/logs', (req, res) => {
    res.json({ lines: readLogLines({ filter: req.query.filter, search: req.query.search, limit: 500 }) });
});

router.delete('/logs', authMiddleware.requireChangePassword, (req, res) => {
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(LOG_PATH, '', 'utf8');
    res.json({ success: true, lines: [] });
});

router.get('/cli-providers', (req, res) => {
    res.json(store.getCliProviders().map(serializeProvider));
});

router.post('/cli-providers/scan', authMiddleware.requireChangePassword, async (req, res) => {
    try {
        const results = await detector.scanAndSave();
        for (const result of results) {
            if (!result.found || !['opencode', 'codex', 'claude', 'gemini', 'kiro', 'kilocode', 'command-code'].includes(result.key)) continue;
            const hadModels = store.getModels(result.key).length > 0;
            await seedProviderModels(result.key, result.command);
            if (!hadModels && store.getEnabledModels(result.key).length > 0) {
                store.updateCliProviderByKey(result.key, { enabled: 1 });
            }
        }
        res.json({ success: true, results, providers: store.getCliProviders().map(serializeProvider) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'CLI scan failed' });
    }
});

router.post('/cli-providers/:key/test-command', authMiddleware.requireChangePassword, async (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    const provider = store.getCliProviderByKey(key);
    const command = String(req.body.command || provider?.command || '').trim();
    if (!command) return res.status(400).json({ success: false, error: 'No command to test' });

    const result = await detector.testCommand(command);
    if (result.success) {
        store.updateCliProviderByKey(key, {
            command,
            detected: 1,
            detected_path: result.detectedPath || result.command,
            version: result.output,
            status: 'manual_valid',
            error_message: '',
            last_checked_at: new Date().toISOString()
        });
    } else {
        store.updateCliProviderByKey(key, {
            command,
            error_message: result.error || 'Test failed',
            status: 'error',
            last_checked_at: new Date().toISOString()
        });
    }
    res.json(result);
});

router.patch('/cli-providers/:key', authMiddleware.requireChangePassword, (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    const provider = store.getCliProviderByKey(key);
    const command = req.body.command !== undefined ? String(req.body.command || '').trim() : provider.command;
    if (req.body.enabled !== undefined && bool(req.body.enabled)) {
        const error = validateProviderCanEnable(key, command);
        if (error) return res.status(400).json({ success: false, error });
    }

    const fields = {};
    if (req.body.command !== undefined) fields.command = command;
    if (req.body.display_name !== undefined) fields.display_name = String(req.body.display_name || '').trim();
    if (req.body.enabled !== undefined) fields.enabled = bool(req.body.enabled) ? 1 : 0;
    if (req.body.status !== undefined) fields.status = String(req.body.status || provider.status);
    store.updateCliProviderByKey(key, fields);
    res.json({ success: true, provider: serializeProvider(store.getCliProviderByKey(key)) });
});

router.get('/cli-providers/:key/models', (req, res) => {
    if (!detector.ALLOWED_PROVIDER_KEYS.has(req.params.key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    res.json(store.getModels(req.params.key));
});

router.post('/cli-providers/:key/models/detect', authMiddleware.requireChangePassword, async (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    const provider = store.getCliProviderByKey(key);
    const added = await seedProviderModels(key, provider?.command);
    res.json({ success: true, detected: added, models: store.getModels(key), fallback: added.length > 0 && ['claude', 'gemini'].includes(key) });
});

router.post('/cli-providers/:key/models', authMiddleware.requireChangePassword, (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    const modelName = String(req.body.model_name || '').trim();
    if (!modelName) return res.status(400).json({ success: false, error: 'Model name is required' });
    const id = store.addModel(key, modelName, String(req.body.display_name || modelName).trim(), req.body.source || 'manual');
    if (bool(req.body.is_default)) store.setDefaultModel(key, id);
    if (req.body.enabled !== undefined) store.updateModelByKey(key, id, { enabled: bool(req.body.enabled) ? 1 : 0 });
    res.json({ success: true, id, models: store.getModels(key) });
});

router.patch('/cli-providers/:key/models/:id', authMiddleware.requireChangePassword, (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    const fields = {};
    if (req.body.enabled !== undefined) fields.enabled = bool(req.body.enabled) ? 1 : 0;
    if (req.body.display_name !== undefined) fields.display_name = String(req.body.display_name || '').trim();
    if (req.body.model_name !== undefined) {
        const modelName = String(req.body.model_name || '').trim();
        if (!modelName) return res.status(400).json({ success: false, error: 'Model name is required' });
        fields.model_name = modelName;
    }
    if (Object.keys(fields).length > 0) store.updateModelByKey(key, req.params.id, fields);
    if (bool(req.body.is_default)) store.setDefaultModel(key, Number(req.params.id));
    res.json({ success: true, models: store.getModels(key) });
});

router.delete('/cli-providers/:key/models/:id', authMiddleware.requireChangePassword, (req, res) => {
    const key = req.params.key;
    if (!detector.ALLOWED_PROVIDER_KEYS.has(key)) return res.status(404).json({ success: false, error: 'Provider not found' });
    store.deleteModelById(key, req.params.id);
    res.json({ success: true, models: store.getModels(key) });
});

module.exports = router;
