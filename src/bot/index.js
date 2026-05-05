const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Markup, Telegraf } = require('telegraf');
const store = require('../config/store');
const { prepareSpawnCommand, splitCommand } = require('../cli/detector');
const { logDir } = require('../runtimePaths');
const { compactText, escapeHTML, splitPlainText, summarizeOutput } = require('../utils');
const { redactSecrets } = require('../settingsConfig');
const { text: botText, button: botButton, matchesButton } = require('./messages');

let bot = null;
let isRunning = false;
let lastError = '';
const sessions = new Map();

const STATE = {
    MAIN: 'main',
    SELECT_PROVIDER: 'select_provider',
    SELECT_PROJECT: 'select_project',
    SELECT_MODEL: 'select_model',
    CHAT: 'chat'
};

function getConfig() {
    const token = store.getSetting('telegram_bot_token', '');
    const enabled = store.getSetting('telegram_enabled', 'false') === 'true';
    const allowedUsers = getAllowedTelegramUserIds();
    return { token, enabled, allowedUsers };
}

function getAllowedTelegramUserIds() {
    return store.getTelegramUsers()
        .filter(user => user.enabled)
        .map(user => Number(user.user_id));
}

function isTelegramUserAllowed(userId) {
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId)) return false;
    return getAllowedTelegramUserIds().includes(numericUserId);
}

function getEnabledProviders() {
    return store.getEnabledProviders();
}

function getProviderModels(providerKey) {
    return store.getEnabledModels(providerKey);
}

function getProviderByKey(key) {
    return store.getCliProviderByKey(key);
}

function getDefaultModel(providerKey) {
    return store.getDefaultModel(providerKey);
}

function keyboard(rows) {
    return Markup.keyboard(rows).resize();
}

function getSession(userId) {
    if (!sessions.has(userId)) {
        const defaultProject = store.getProjects().find(project => project.is_default && project.enabled !== 0)
            || store.getProjects().find(project => project.enabled !== 0)
            || null;
        sessions.set(userId, {
            state: STATE.MAIN,
            projectPath: defaultProject?.path || '',
            providerKey: '',
            modelName: '',
            running: false,
            currentTask: null
        });
    }
    return sessions.get(userId);
}

function providerLabel(provider) {
    return provider.display_name || provider.key;
}

function mainKeyboard() {
    return keyboard([
        [botButton('projects'), botButton('providers'), botButton('models')],
        [botButton('status'), botButton('cancel')],
        [botButton('logs'), botButton('settings'), botButton('main')]
    ]);
}

function providerKeyboard() {
    const rows = getEnabledProviders().map(provider => [providerLabel(provider)]);
    rows.push([botButton('back'), botButton('main')]);
    return keyboard(rows);
}

function projectKeyboard() {
    const projects = store.getProjects().filter(project => project.enabled !== 0);
    const rows = projects.map(project => [project.name]);
    rows.push([botButton('back'), botButton('main')]);
    return keyboard(rows);
}

function modelKeyboard(providerKey) {
    const rows = getProviderModels(providerKey).map(model => [model.display_name || model.model_name]);
    rows.push([botButton('back'), botButton('main')]);
    return keyboard(rows);
}

async function replyHtml(ctx, html, extra = {}) {
    for (const chunk of splitPlainText(html, 3500)) {
        await ctx.replyWithHTML(chunk, extra).catch(() => ctx.reply(compactText(chunk), extra).catch(() => {}));
    }
}

async function showMainMenu(ctx) {
    const providers = getEnabledProviders();
    const providerText = providers.length
        ? providers.map(provider => `- ${escapeHTML(providerLabel(provider))}`).join('\n')
        : botText('bot.noProviders');
    await replyHtml(ctx, botText('bot.main', { providers: providerText }), mainKeyboard());
}

async function showProviders(ctx, session) {
    const providers = getEnabledProviders();
    if (providers.length === 0) {
        await replyHtml(ctx, botText('bot.noProviders'), mainKeyboard());
        return;
    }
    session.state = STATE.SELECT_PROVIDER;
    const current = session.providerKey ? `\nCurrent: <code>${escapeHTML(session.providerKey)}</code>` : '';
    await replyHtml(ctx, `<b>${escapeHTML(botButton('providers'))}</b>${current}`, providerKeyboard());
}

async function showProjects(ctx, session) {
    const projects = store.getProjects().filter(project => project.enabled !== 0);
    if (projects.length === 0) {
        await replyHtml(ctx, botText('bot.noProjects'), mainKeyboard());
        return;
    }
    session.state = STATE.SELECT_PROJECT;
    const current = session.projectPath ? botText('bot.currentProject', { project: escapeHTML(session.projectPath) }) : '';
    await replyHtml(ctx, botText('bot.selectProject', { current }), projectKeyboard());
}

async function showModels(ctx, session, provider) {
    const models = getProviderModels(provider.key);
    if (models.length === 0) {
        await replyHtml(ctx, botText('bot.noModels'), mainKeyboard());
        return;
    }
    session.providerKey = provider.key;
    session.state = STATE.SELECT_MODEL;
    const defaultModel = getDefaultModel(provider.key);
    if (defaultModel) session.modelName = defaultModel.model_name;
    await replyHtml(ctx, botText('bot.selectModel', { provider: escapeHTML(providerLabel(provider)) }), modelKeyboard(provider.key));
}

async function showStatus(ctx, session) {
    const provider = session.providerKey ? getProviderByKey(session.providerKey) : null;
    const task = session.currentTask;
    const status = [
        botText('bot.statusTitle'),
        `${botText('bot.provider')}: ${provider ? escapeHTML(providerLabel(provider)) : botText('bot.notSelected')}`,
        `${botText('bot.model')}: ${session.modelName ? escapeHTML(session.modelName) : botText('bot.notSelected')}`,
        `${botText('bot.project')}: ${session.projectPath ? `<code>${escapeHTML(session.projectPath)}</code>` : botText('bot.notSelected')}`,
        `${botText('bot.running')}: ${session.running ? botText('bot.yes') : botText('bot.no')}`
    ];
    if (task) status.push(`PID: <code>${escapeHTML(task.pid || '')}</code>`);
    await replyHtml(ctx, status.join('\n'), mainKeyboard());
}

async function showLogs(ctx) {
    const logPath = path.join(logDir, 'app.log');
    if (!fs.existsSync(logPath)) {
        await replyHtml(ctx, botText('bot.noLogs'), mainKeyboard());
        return;
    }
    const lines = fs.readFileSync(logPath, 'utf8').trimEnd().split(/\r?\n/).filter(Boolean).slice(-50);
    await replyHtml(ctx, `<pre><code>${escapeHTML(lines.map(line => redactSecrets(line)).join('\n'))}</code></pre>`, mainKeyboard());
}

function buildRunCommand(provider, modelName, projectPath, prompt) {
    const parsed = splitCommand(provider.command);
    if (!parsed) return null;

    if (provider.key === 'codex') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                'exec',
                '-m', modelName,
                '-C', projectPath,
                '--skip-git-repo-check',
                '--sandbox', 'workspace-write',
                '--ephemeral',
                '--json',
                prompt
            ]
        };
    }

    if (provider.key === 'opencode') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                'run',
                '--format', 'json',
                '--dir', projectPath,
                '-m', modelName,
                prompt
            ]
        };
    }

    return null;
}

async function runPrompt(ctx, session, prompt) {
    if (session.running) {
        await replyHtml(ctx, botText('bot.taskAlreadyRunning'), mainKeyboard());
        return;
    }

    const provider = getProviderByKey(session.providerKey);
    if (!provider || !provider.enabled || !['detected', 'manual_valid'].includes(provider.status)) {
        await replyHtml(ctx, botText('bot.providerDisabled'), mainKeyboard());
        return;
    }

    const model = getProviderModels(provider.key).find(item => item.model_name === session.modelName || item.display_name === session.modelName);
    if (!model) {
        await replyHtml(ctx, botText('bot.modelDisabled'), modelKeyboard(provider.key));
        return;
    }

    if (!session.projectPath) {
        await replyHtml(ctx, botText('bot.chooseProject'), projectKeyboard());
        return;
    }

    const command = buildRunCommand(provider, model.model_name, session.projectPath, prompt);
    if (!command) {
        await replyHtml(ctx, botText('bot.taskNotImplemented'), mainKeyboard());
        return;
    }

    const timeoutMinutes = Number.parseInt(store.getSetting('task_timeout_minutes', '120'), 10) || 120;
    const preparedCommand = prepareSpawnCommand(command.file, command.args);
    if (!preparedCommand) {
        await replyHtml(ctx, botText('bot.failedStart', { error: 'Invalid command' }), mainKeyboard());
        return;
    }

    const child = spawn(preparedCommand.file, preparedCommand.args, {
        cwd: session.projectPath,
        windowsHide: true,
        shell: false,
        env: process.env
    });

    let output = '';
    let errorOutput = '';
    session.running = true;
    session.currentTask = { child, pid: child.pid, startedAt: Date.now(), providerKey: provider.key, modelName: model.model_name };

    const timeout = setTimeout(() => {
        session.currentTask.timedOut = true;
        child.kill('SIGTERM');
    }, timeoutMinutes * 60 * 1000);

    child.stdout.on('data', chunk => {
        output += chunk.toString();
    });

    child.stderr.on('data', chunk => {
        errorOutput += chunk.toString();
    });

    child.on('error', async error => {
        clearTimeout(timeout);
        session.running = false;
        session.currentTask = null;
        await replyHtml(ctx, botText('bot.failedStart', { error: escapeHTML(error.message) }), mainKeyboard());
    });

    child.on('close', async code => {
        clearTimeout(timeout);
        const timedOut = session.currentTask?.timedOut;
        session.running = false;
        session.currentTask = null;

        const summary = summarizeOutput(`${output}\n${errorOutput}`.trim(), redactSecrets);
        const header = timedOut
            ? botText('bot.taskCancelled', { minutes: timeoutMinutes })
            : botText('bot.taskFinished', { code });
        const body = summary.preview ? `\n\n<pre><code>${escapeHTML(summary.preview)}</code></pre>` : '';
        await replyHtml(ctx, `<b>${escapeHTML(header)}</b>${body}`, mainKeyboard());
    });

    await replyHtml(ctx, botText('bot.started', {
        provider: escapeHTML(providerLabel(provider)),
        model: escapeHTML(model.model_name),
        pid: escapeHTML(child.pid || '')
    }), mainKeyboard());
}

function findProviderByText(text) {
    return getEnabledProviders().find(provider => providerLabel(provider) === text || provider.key === text);
}

function findProjectByText(text) {
    return store.getProjects().filter(project => project.enabled !== 0).find(project => project.name === text || project.path === text);
}

function findModelByText(providerKey, text) {
    return getProviderModels(providerKey).find(model => model.model_name === text || model.display_name === text);
}

async function handleText(ctx) {
    const userId = ctx.from?.id;
    const text = String(ctx.message?.text || '').trim();
    const session = getSession(userId);

    if (!text || text === '/start' || matchesButton(text, 'main')) {
        session.state = STATE.MAIN;
        await showMainMenu(ctx);
        return;
    }

    if (matchesButton(text, 'back')) {
        if (session.state === STATE.CHAT) {
            session.state = STATE.SELECT_MODEL;
            await showModels(ctx, session, getProviderByKey(session.providerKey));
        } else {
            session.state = STATE.MAIN;
            await showMainMenu(ctx);
        }
        return;
    }

    if (matchesButton(text, 'projects')) return showProjects(ctx, session);
    if (matchesButton(text, 'providers')) return showProviders(ctx, session);
    if (matchesButton(text, 'models')) {
        const provider = session.providerKey ? getProviderByKey(session.providerKey) : null;
        if (!provider) return showProviders(ctx, session);
        return showModels(ctx, session, provider);
    }
    if (matchesButton(text, 'status')) return showStatus(ctx, session);
    if (matchesButton(text, 'logs')) return showLogs(ctx);
    if (matchesButton(text, 'settings')) {
        await replyHtml(ctx, botText('bot.adminUi'), mainKeyboard());
        return;
    }
    if (matchesButton(text, 'cancel')) {
        if (session.running && session.currentTask?.child) {
            session.currentTask.cancelled = true;
            session.currentTask.child.kill('SIGTERM');
            await replyHtml(ctx, botText('bot.cancelRequested'), mainKeyboard());
        } else {
            await replyHtml(ctx, botText('bot.noTask'), mainKeyboard());
        }
        return;
    }

    if (session.state === STATE.SELECT_PROJECT) {
        const project = findProjectByText(text);
        if (!project) {
            await replyHtml(ctx, botText('bot.projectNotFound'), projectKeyboard());
            return;
        }
        session.projectPath = project.path;
        await replyHtml(ctx, `${botText('bot.project')}: <code>${escapeHTML(project.path)}</code>`);
        await showProviders(ctx, session);
        return;
    }

    const provider = findProviderByText(text);
    if (provider) {
        await showModels(ctx, session, provider);
        return;
    }

    if (session.state === STATE.SELECT_MODEL && session.providerKey) {
        const model = findModelByText(session.providerKey, text);
        if (!model) {
            await replyHtml(ctx, botText('bot.modelNotFound'), modelKeyboard(session.providerKey));
            return;
        }
        session.modelName = model.model_name;
        session.state = STATE.CHAT;
        await replyHtml(ctx, botText('bot.modelSelected', { model: escapeHTML(model.model_name) }), keyboard([[botButton('status'), botButton('cancel')], [botButton('back'), botButton('main')]]));
        return;
    }

    if (session.state === STATE.CHAT) {
        await runPrompt(ctx, session, text);
        return;
    }

    await showMainMenu(ctx);
}

function startBot() {
    const { token, enabled } = getConfig();
    if (!enabled || !token) return { success: false, error: 'Bot not configured or disabled' };
    if (bot) return { success: false, error: 'Bot already running' };

    try {
        lastError = '';
        bot = new Telegraf(token);
        bot.use((ctx, next) => {
            const userId = ctx.from?.id;
            if (isTelegramUserAllowed(userId)) return next();
            return ctx.reply(botText('bot.notAllowed')).catch(() => {});
        });
        bot.start(showMainMenu);
        bot.on('text', handleText);
        bot.launch({ dropPendingUpdates: true }).catch(error => {
            lastError = error.message;
            console.error('Bot launch error:', error);
            try { bot?.stop(); } catch {}
            bot = null;
            isRunning = false;
        });
        isRunning = true;
        return { success: true };
    } catch (error) {
        lastError = error.message;
        bot = null;
        isRunning = false;
        return { success: false, error: error.message };
    }
}

function stopBot() {
    if (!bot) return { success: false, error: 'Bot not running' };
    try { bot.stop(); } catch {}
    for (const session of sessions.values()) {
        if (session.running && session.currentTask?.child) session.currentTask.child.kill('SIGTERM');
        session.running = false;
        session.currentTask = null;
    }
    bot = null;
    isRunning = false;
    lastError = '';
    return { success: true };
}

function restartBot() {
    stopBot();
    return startBot();
}

function getStatus() {
    const { token, enabled, allowedUsers } = getConfig();
    if (!enabled) return { status: 'disabled', running: isRunning, error: lastError };
    if (!token) return { status: 'not_configured', running: false, error: lastError };
    if (lastError) return { status: 'error', running: isRunning, tokenMasked: maskToken(token), userCount: allowedUsers.length, error: lastError };
    return { status: isRunning ? 'connected' : 'ready_to_start', running: isRunning, tokenMasked: maskToken(token), userCount: allowedUsers.length, error: '' };
}

function maskToken(token) {
    if (!token || token.length < 8) return '***';
    return token.slice(0, 6) + '...' + token.slice(-4);
}

function testConnection(token) {
    try {
        const testBot = new Telegraf(token);
        return testBot.telegram.getMe().then(me => {
            return { success: true, botName: me.username };
        }).catch(error => ({ success: false, error: error.message }));
    } catch (error) {
        return Promise.resolve({ success: false, error: error.message });
    }
}

module.exports = {
    startBot,
    stopBot,
    restartBot,
    getStatus,
    testConnection,
    maskToken,
    getConfig,
    getEnabledProviders,
    getProviderModels,
    getProviderByKey,
    getDefaultModel
};
