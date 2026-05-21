const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Markup, Telegraf } = require('telegraf');
const store = require('../config/store');
const { prepareSpawnCommand, splitCommand } = require('../cli/detector');
const { logDir } = require('../runtimePaths');
const { compactText, escapeHTML, formatDuration, parseCliRunOutput, renderMarkdownishToHtml, splitPlainText, summarizeOutput } = require('../utils');
const { redactPublicOutput } = require('../settingsConfig');
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
    CHAT: 'chat',
    CONFIRM_RUN: 'confirm_run'
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
            currentTask: null,
            pendingApproval: null,
            autoApproveProviderKeys: new Set()
        });
    }
    return sessions.get(userId);
}

function clearSessionAutoApprovals(session) {
    session.autoApproveProviderKeys = new Set();
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

function runApprovalKeyboard() {
    return keyboard([
        [botButton('approveRun'), botButton('denyRun')],
        [botButton('autoApprove')],
        [botButton('back'), botButton('main')]
    ]);
}

async function replyHtml(ctx, html, extra = {}) {
    for (const chunk of splitPlainText(html, 3500)) {
        await ctx.replyWithHTML(chunk, extra).catch(() => ctx.reply(compactText(chunk), extra).catch(() => {}));
    }
}

function sanitizeBotOutput(value) {
    return redactPublicOutput(value);
}

function safeCode(value) {
    return escapeHTML(sanitizeBotOutput(value));
}

function safeProjectLabel(projectPath) {
    const normalized = String(projectPath || '').replace(/[\\/]+$/, '');
    return normalized ? path.basename(normalized) || 'selected project' : '';
}

function safeToolLabel(value) {
    return String(value || 'tool')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 64) || 'tool';
}

function safeToolStatus(value) {
    const status = String(value || 'updated').toLowerCase();
    if (/fail|error/.test(status)) return 'failed';
    if (/complete|success|done/.test(status)) return 'completed';
    if (/progress|running|start/.test(status)) return 'running';
    return status.slice(0, 32) || 'updated';
}

function safeToolDetail(value) {
    const safe = compactText(sanitizeBotOutput(value));
    if (!safe) return '';
    if (/\[(?:local command hidden|local-path|redacted|runtime-id)\]/i.test(safe)) {
        return 'Local command details hidden.';
    }
    return safe.length > 180 ? `${safe.slice(0, 177).trimEnd()}...` : safe;
}

function appendRuntimeLog(level, message) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(
            path.join(logDir, 'app.log'),
            `${new Date().toISOString()} ${level} ${sanitizeBotOutput(message)}\n`,
            'utf8'
        );
    } catch {}
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
        `${botText('bot.project')}: ${session.projectPath ? `<code>${escapeHTML(safeProjectLabel(session.projectPath))}</code>` : botText('bot.notSelected')}`,
        `${botText('bot.running')}: ${session.running ? botText('bot.yes') : botText('bot.no')}`
    ];
    if (task) {
        const elapsed = formatDuration((Date.now() - task.startedAt) / 1000);
        const lastOutputAt = Math.max(task.lastOutputAt || 0, task.lastErrorAt || 0);
        const outputStatus = lastOutputAt
            ? `${formatDuration((Date.now() - lastOutputAt) / 1000)} ago`
            : 'waiting for CLI output';
        status.push(`Elapsed: ${escapeHTML(elapsed)}`);
        status.push(`CLI output: ${escapeHTML(outputStatus)}`);
        if (task.progressNote) status.push(`Progress: ${safeCode(task.progressNote)}`);
    }
    await replyHtml(ctx, status.join('\n'), mainKeyboard());
}

async function showLogs(ctx) {
    const logPath = path.join(logDir, 'app.log');
    if (!fs.existsSync(logPath)) {
        await replyHtml(ctx, botText('bot.noLogs'), mainKeyboard());
        return;
    }
    const lines = fs.readFileSync(logPath, 'utf8').trimEnd().split(/\r?\n/).filter(Boolean).slice(-50);
    await replyHtml(ctx, `<pre><code>${safeCode(lines.join('\n'))}</code></pre>`, mainKeyboard());
}

function buildRunCommand(provider, modelName, projectPath, prompt, options = {}) {
    const parsed = splitCommand(provider.command);
    if (!parsed) return null;
    const normalizedModelName = String(modelName || '').toLowerCase();
    const useModel = modelName
        && !['default', 'auto'].includes(normalizedModelName)
        && !(provider.key === 'kilocode' && normalizedModelName === 'balanced');

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
                '--color', 'never',
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

    if (provider.key === 'claude') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                '-p',
                '--output-format', 'stream-json',
                '--verbose',
                '--include-partial-messages',
                '--no-session-persistence',
                ...(useModel ? ['--model', modelName] : []),
                prompt
            ]
        };
    }

    if (provider.key === 'gemini') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                '-p', prompt,
                '--output-format', 'stream-json',
                ...(useModel ? ['-m', modelName] : [])
            ]
        };
    }

    if (provider.key === 'kiro') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                'chat',
                '--no-interactive',
                ...(options.trustAllTools ? ['--trust-all-tools'] : []),
                '--wrap', 'never',
                ...(useModel ? ['--model', modelName] : []),
                prompt
            ]
        };
    }

    if (provider.key === 'kilocode') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                'run',
                '--format', 'json',
                '--dir', projectPath,
                '--auto',
                ...(useModel ? ['-m', modelName] : []),
                prompt
            ]
        };
    }

    if (provider.key === 'command-code') {
        return {
            file: parsed.file,
            args: [
                ...parsed.args,
                '--print',
                prompt,
                '--trust',
                '--skip-onboarding'
            ]
        };
    }

    return null;
}

function getUnsupportedRunReason(provider) {
    if (provider.key === 'kiro' && /^0\./.test(String(provider.version || '').trim())) {
        return `installed Kiro ${provider.version} is the legacy IDE command and does not support headless --no-interactive. Install/update Kiro CLI and configure KIRO_COMMAND=kiro-cli.`;
    }
    return '';
}

function providerAutoApproveEnabled(session, providerKey) {
    return Boolean(session.autoApproveProviderKeys?.has(providerKey));
}

function runTrustOptions(providerKey, approved) {
    return {
        trustAllTools: providerKey === 'kiro' && approved
    };
}

function detectCliApprovalRequest(text) {
    const value = String(text || '');
    if (!value.trim()) return false;
    if (/All tools are now trusted/i.test(value)) return false;
    return [
        /(?:\by\/n\b|\byes\/no\b|\[[yY]\/[nN]\]|\([yY]\/[nN]\))/i,
        /\b(approve|allow|permit|confirm|continue|proceed)\b[^\r\n?]{0,160}\?/i,
        /\brequires? (your )?(approval|permission|confirmation)\b/i,
        /\bneeds? (your )?(approval|permission|confirmation)\b/i,
        /\bwaiting for (approval|permission|confirmation)\b/i
    ].some(pattern => pattern.test(value));
}

function shouldScanStdoutForApproval(providerKey) {
    return ['kiro', 'command-code'].includes(providerKey);
}

function providerNeedsInteractiveStdin(providerKey) {
    return ['kiro', 'command-code'].includes(providerKey);
}

async function requestRunApproval(ctx, session, provider, model, prompt, preview = '') {
    session.pendingApproval = {
        kind: 'cli_confirmation',
        providerKey: provider.key,
        modelName: model.model_name,
        projectPath: session.projectPath,
        prompt,
        preview,
        requestedAt: Date.now()
    };
    session.state = STATE.CONFIRM_RUN;

    await replyHtml(ctx, botText('bot.runApprovalRequired', {
        provider: escapeHTML(providerLabel(provider)),
        model: escapeHTML(model.model_name),
        project: escapeHTML(safeProjectLabel(session.projectPath)),
        prompt: safeCode(compactText(preview || prompt).slice(0, 600))
    }), runApprovalKeyboard());
}

function writeCliApproval(task) {
    if (!task?.child?.stdin || task.child.stdin.destroyed) return false;
    try {
        task.child.stdin.write('y\n');
        task.progressNote = 'approval sent';
        task.awaitingApproval = false;
        return true;
    } catch {
        return false;
    }
}

function terminateProcessTree(child) {
    if (!child || !child.pid || child.killed) return;

    if (process.platform === 'win32') {
        spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
            windowsHide: true,
            stdio: 'ignore'
        }).on('error', () => {
            try { child.kill('SIGTERM'); } catch {}
        });
        return;
    }

    try { child.kill('SIGTERM'); } catch {}
}

async function runPrompt(ctx, session, prompt, options = {}) {
    if (session.running) {
        await replyHtml(ctx, botText('bot.taskAlreadyRunning'), mainKeyboard());
        return;
    }

    const provider = getProviderByKey(session.providerKey);
    if (!provider || !provider.enabled || !['detected', 'manual_valid'].includes(provider.status)) {
        await replyHtml(ctx, botText('bot.providerDisabled'), mainKeyboard());
        return;
    }

    const unsupportedReason = getUnsupportedRunReason(provider);
    if (unsupportedReason) {
        await replyHtml(ctx, botText('bot.taskProviderUnsupported', { reason: escapeHTML(unsupportedReason) }), mainKeyboard());
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

    const runApproved = Boolean(options.approvedRun || providerAutoApproveEnabled(session, provider.key));

    const command = buildRunCommand(provider, model.model_name, session.projectPath, prompt, runTrustOptions(provider.key, runApproved));
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
        stdio: [providerNeedsInteractiveStdin(provider.key) ? 'pipe' : 'ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...(command.env || {}) }
    });

    let output = '';
    let errorOutput = '';
    let finishing = false;
    let finishGraceTimer = null;
    let progressTimer = null;
    let closed = false;
    const progressState = {
        lastSentAt: Date.now(),
        lastReportedBytes: 0,
        sessionNotified: false,
        textNotified: false,
        toolCount: 0
    };
    const task = {
        child,
        pid: child.pid,
        startedAt: Date.now(),
        providerKey: provider.key,
        modelName: model.model_name,
        lastOutputAt: 0,
        lastErrorAt: 0,
        outputBytes: 0,
        errorBytes: 0,
        progressNote: 'starting'
    };
    session.running = true;
    session.currentTask = task;
    appendRuntimeLog('INFO', `task started provider=${provider.key} model=${model.model_name} pid=${child.pid} project=${session.projectPath}`);

    function elapsed() {
        return formatDuration((Date.now() - task.startedAt) / 1000);
    }

    function markProgress(note) {
        task.progressNote = compactText(note).slice(0, 180);
    }

    function sendProgress(html, logMessage) {
        if (closed) return;
        progressState.lastSentAt = Date.now();
        markProgress(logMessage || html);
        appendRuntimeLog('INFO', `task progress provider=${provider.key} pid=${child.pid} ${logMessage || compactText(html)}`);
        replyHtml(ctx, html).catch(() => {});
    }

    function currentProviderPreview() {
        if (['opencode', 'kilocode', 'codex', 'claude', 'gemini'].includes(provider.key)) {
            const parsed = parseCliRunOutput(provider.key, output);
            return parsed.text || parsed.errors.join('\n') || errorOutput || '';
        }
        return `${output}\n${errorOutput}`.trim();
    }

    function providerRuntimeLabel() {
        if (provider.key === 'opencode') return 'OpenCode';
        if (provider.key === 'kilocode') return 'Kilo Code';
        if (provider.key === 'codex') return 'Codex';
        if (provider.key === 'claude') return 'Claude Code';
        if (provider.key === 'gemini') return 'Gemini CLI';
        if (provider.key === 'kiro') return 'Kiro';
        return providerLabel(provider);
    }

    function sendToolProgress(toolEvent) {
        const detail = safeToolDetail(toolEvent.title || toolEvent.preview);
        const preview = safeToolDetail(toolEvent.preview);
        const detailLine = detail ? `\nDetail: ${escapeHTML(detail)}` : '';
        const previewLine = preview && preview !== detail
            ? `\n<code>${escapeHTML(preview)}</code>`
            : '';
        sendProgress(
            `<b>Tool update</b>\nTool: <code>${escapeHTML(safeToolLabel(toolEvent.tool))}</code>\nStatus: <b>${escapeHTML(safeToolStatus(toolEvent.status))}</b>${detailLine}${previewLine}`,
            `${provider.key} tool ${safeToolLabel(toolEvent.tool)} ${safeToolStatus(toolEvent.status)} detail=${detail || preview || 'hidden'}`
        );
    }

    function requestTerminate(reason, graceMs = 0) {
        if (finishing) return;
        finishing = true;
        task.finishReason = reason;
        markProgress(reason);
        if (graceMs > 0) {
            finishGraceTimer = setTimeout(() => terminateProcessTree(child), graceMs);
            if (finishGraceTimer.unref) finishGraceTimer.unref();
            return;
        }
        terminateProcessTree(child);
    }

    function handleProviderOutput() {
        if (!['opencode', 'kilocode', 'codex', 'claude', 'gemini'].includes(provider.key)) return;

        const parsed = parseCliRunOutput(provider.key, output);
        if (parsed.stepStarted && !progressState.sessionNotified) {
            progressState.sessionNotified = true;
            sendProgress(
                `<b>${escapeHTML(providerRuntimeLabel())} started</b>\nWaiting for model output.`,
                `${provider.key} session started`
            );
        }
        if (parsed.textStarted && !parsed.completed && !progressState.textNotified && Date.now() - task.startedAt > 20000) {
            progressState.textNotified = true;
            sendProgress(
                botText('bot.cliTextStarted', { provider: escapeHTML(providerRuntimeLabel()) }),
                `${provider.key} text stream started`
            );
        }
        if (parsed.toolCount > progressState.toolCount) {
            if (provider.key !== 'gemini') {
                for (const toolEvent of parsed.toolEvents.slice(progressState.toolCount)) {
                    sendToolProgress(toolEvent);
                }
            }
            progressState.toolCount = parsed.toolCount;
        }
        if (parsed.toolUsed && parsed.finishReason === 'tool-calls') {
            markProgress(`${provider.key} tool step finished; waiting final answer`);
        }
        if (parsed.completed) {
            task.providerCompleted = true;
            task.providerSessionID = parsed.sessionID;
            requestTerminate(`${provider.key}-complete`, 1500);
        }
    }

    function handleApprovalRequest(sourceText) {
        if (closed || task.awaitingApproval || !detectCliApprovalRequest(sourceText)) return;
        const preview = summarizeOutput(sourceText, sanitizeBotOutput).preview || sanitizeBotOutput(sourceText);
        if (providerAutoApproveEnabled(session, provider.key)) {
            if (task.lastAutoApprovalAt && Date.now() - task.lastAutoApprovalAt < 1000) return;
            task.approvalAutoApproved = true;
            task.lastAutoApprovalAt = Date.now();
            appendRuntimeLog('INFO', `task auto approval sent provider=${provider.key} pid=${child.pid || ''} preview=${preview.slice(0, 240)}`);
            writeCliApproval(task);
            return;
        }

        task.awaitingApproval = true;
        task.progressNote = 'waiting for Telegram approval';
        appendRuntimeLog('INFO', `task waiting approval provider=${provider.key} pid=${child.pid || ''} preview=${preview.slice(0, 240)}`);
        requestRunApproval(ctx, session, provider, model, prompt, preview).catch(() => {});
    }

    const timeout = setTimeout(() => {
        task.timedOut = true;
        requestTerminate('timeout');
    }, timeoutMinutes * 60 * 1000);

    progressTimer = setInterval(() => {
        if (closed) return;
        const totalBytes = output.length + errorOutput.length;
        const sinceLastProgress = Date.now() - progressState.lastSentAt;

        if (totalBytes === 0) {
            if (sinceLastProgress >= 30000) {
                sendProgress(
                    `<b>Still working</b>\nNo output after ${escapeHTML(elapsed())}.\nRuntime details are hidden.`,
                    `waiting no-output elapsed=${elapsed()}`
                );
            }
            return;
        }

        if (totalBytes !== progressState.lastReportedBytes && sinceLastProgress >= 45000) {
            progressState.lastReportedBytes = totalBytes;
            const summary = summarizeOutput(currentProviderPreview(), sanitizeBotOutput);
            if (summary.preview) {
                sendProgress(
                    botText('bot.taskProgress', {
                        elapsed: escapeHTML(elapsed()),
                        preview: safeCode(summary.preview)
                    }),
                    `output preview elapsed=${elapsed()} bytes=${totalBytes} preview=${summary.preview.slice(0, 240)}`
                );
                return;
            }
            sendProgress(
                botText('bot.taskOutputSeen', { elapsed: escapeHTML(elapsed()) }),
                `output seen elapsed=${elapsed()} bytes=${totalBytes}`
            );
        }
    }, 15000);
    if (progressTimer.unref) progressTimer.unref();

    child.stdout.on('data', chunk => {
        const text = chunk.toString();
        output += text;
        task.lastOutputAt = Date.now();
        task.outputBytes = output.length;
        markProgress(`stdout ${task.outputBytes} bytes`);
        if (shouldScanStdoutForApproval(provider.key)) handleApprovalRequest(text);
        handleProviderOutput();
    });

    child.stderr.on('data', chunk => {
        const text = chunk.toString();
        errorOutput += text;
        task.lastErrorAt = Date.now();
        task.errorBytes = errorOutput.length;
        markProgress(`stderr ${task.errorBytes} bytes`);
        if (providerNeedsInteractiveStdin(provider.key)) handleApprovalRequest(text);
    });

    child.on('error', async error => {
        closed = true;
        clearTimeout(timeout);
        if (finishGraceTimer) clearTimeout(finishGraceTimer);
        if (progressTimer) clearInterval(progressTimer);
        session.running = false;
        session.currentTask = null;
        if (session.state === STATE.CONFIRM_RUN && session.pendingApproval?.providerKey === provider.key) {
            session.state = STATE.CHAT;
            session.pendingApproval = null;
        }
        appendRuntimeLog('ERROR', `task failed to start provider=${provider.key} pid=${child.pid || ''} error=${error.message}`);
        await replyHtml(ctx, botText('bot.failedStart', { error: escapeHTML(error.message) }), mainKeyboard());
    });

    child.on('close', async code => {
        closed = true;
        clearTimeout(timeout);
        if (finishGraceTimer) clearTimeout(finishGraceTimer);
        if (progressTimer) clearInterval(progressTimer);
        const closedTask = session.currentTask || task;
        const timedOut = closedTask?.timedOut;
        session.running = false;
        session.currentTask = null;
        if (session.state === STATE.CONFIRM_RUN && session.pendingApproval?.providerKey === provider.key) {
            session.state = STATE.CHAT;
            session.pendingApproval = null;
        }

        const parsedResult = ['opencode', 'kilocode', 'codex', 'claude', 'gemini'].includes(provider.key)
            ? parseCliRunOutput(provider.key, output)
            : null;
        const completedByProvider = Boolean(parsedResult?.completed || closedTask?.providerCompleted);
        const resultText = parsedResult
            ? (parsedResult.text
                || parsedResult.errors?.join('\n')
                || errorOutput
                || botText('bot.noFinalAnswer', { code }))
            : (output || errorOutput || '').trim();
        const summary = summarizeOutput(resultText, sanitizeBotOutput);
        const displayCode = completedByProvider && (code === null || code !== 0) ? 0 : code;
        const header = timedOut
            ? botText('bot.taskCancelled', { minutes: timeoutMinutes })
            : botText('bot.taskFinished', { code: displayCode });
        const body = summary.preview
            ? `\n\n${renderMarkdownishToHtml(summary.preview)}\n\n<i>Sensitive local details were hidden.</i>`
            : '';
        appendRuntimeLog('INFO', `task finished provider=${provider.key} pid=${child.pid || ''} code=${displayCode} timedOut=${Boolean(timedOut)} preview=${summary.preview.slice(0, 500)}`);
        await replyHtml(ctx, `<b>${escapeHTML(header)}</b>${body}`, mainKeyboard());
    });

    await replyHtml(ctx, `<b>Task started</b>\nProvider: <code>${escapeHTML(providerLabel(provider))}</code>\nModel: <code>${escapeHTML(model.model_name)}</code>\nProgress updates will be filtered before sending.`, mainKeyboard());
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

async function handleRunApproval(ctx, session, text) {
    const pending = session.pendingApproval;
    if (!pending) {
        session.state = STATE.CHAT;
        await replyHtml(ctx, botText('bot.runApprovalCancelled'), mainKeyboard());
        return true;
    }

    if (matchesButton(text, 'denyRun') || matchesButton(text, 'back') || matchesButton(text, 'cancel') || matchesButton(text, 'main') || text === '/start') {
        if (session.currentTask?.child) {
            session.currentTask.cancelled = true;
            session.currentTask.progressNote = 'approval denied';
            terminateProcessTree(session.currentTask.child);
        }
        session.pendingApproval = null;
        session.state = STATE.CHAT;
        await replyHtml(ctx, botText('bot.runApprovalCancelled'), keyboard([[botButton('status'), botButton('cancel')], [botButton('back'), botButton('main')]]));
        return true;
    }

    if (!matchesButton(text, 'approveRun') && !matchesButton(text, 'autoApprove')) {
        await replyHtml(ctx, botText('bot.runApprovalRequired', {
            provider: escapeHTML(pending.providerKey),
            model: escapeHTML(pending.modelName),
            project: escapeHTML(safeProjectLabel(pending.projectPath)),
            prompt: safeCode(compactText(pending.preview || pending.prompt).slice(0, 600))
        }), runApprovalKeyboard());
        return true;
    }

    const autoApprove = matchesButton(text, 'autoApprove');
    const provider = getProviderByKey(pending.providerKey);
    session.pendingApproval = null;
    session.state = STATE.CHAT;

    if (autoApprove) {
        if (!session.autoApproveProviderKeys) session.autoApproveProviderKeys = new Set();
        session.autoApproveProviderKeys.add(pending.providerKey);
        await replyHtml(ctx, botText('bot.autoApproveEnabled', {
            provider: escapeHTML(provider ? providerLabel(provider) : pending.providerKey)
        }));
    }

    const sent = writeCliApproval(session.currentTask);
    if (!sent) {
        await replyHtml(ctx, botText('bot.failedStart', { error: 'CLI is no longer waiting for approval' }), mainKeyboard());
        return true;
    }
    await replyHtml(ctx, botText('bot.approvalSent'), keyboard([[botButton('status'), botButton('cancel')], [botButton('back'), botButton('main')]]));
    return true;
}

async function handleText(ctx) {
    const userId = ctx.from?.id;
    const text = String(ctx.message?.text || '').trim();
    const session = getSession(userId);

    if (!text) {
        await showMainMenu(ctx);
        return;
    }

    if (session.state === STATE.CONFIRM_RUN) {
        await handleRunApproval(ctx, session, text);
        return;
    }

    if (text === '/start' || matchesButton(text, 'main')) {
        session.state = STATE.MAIN;
        session.pendingApproval = null;
        clearSessionAutoApprovals(session);
        await showMainMenu(ctx);
        return;
    }

    if (matchesButton(text, 'back')) {
        clearSessionAutoApprovals(session);
        if (session.state === STATE.CHAT) {
            session.state = STATE.SELECT_MODEL;
            await showModels(ctx, session, getProviderByKey(session.providerKey));
        } else {
            session.state = STATE.MAIN;
            await showMainMenu(ctx);
        }
        return;
    }

    if (matchesButton(text, 'projects')) {
        clearSessionAutoApprovals(session);
        return showProjects(ctx, session);
    }
    if (matchesButton(text, 'providers')) {
        clearSessionAutoApprovals(session);
        return showProviders(ctx, session);
    }
    if (matchesButton(text, 'models')) {
        clearSessionAutoApprovals(session);
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
            session.currentTask.progressNote = 'cancel requested';
            appendRuntimeLog('INFO', `task cancel requested pid=${session.currentTask.pid || ''} provider=${session.currentTask.providerKey || ''}`);
            terminateProcessTree(session.currentTask.child);
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
        clearSessionAutoApprovals(session);
        await replyHtml(ctx, `${botText('bot.project')}: <code>${escapeHTML(project.name || safeProjectLabel(project.path))}</code>`);
        await showProviders(ctx, session);
        return;
    }

    const provider = findProviderByText(text);
    if (provider) {
        clearSessionAutoApprovals(session);
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
        clearSessionAutoApprovals(session);
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
    getDefaultModel,
    _buildRunCommand: buildRunCommand,
    _getUnsupportedRunReason: getUnsupportedRunReason,
    _detectCliApprovalRequest: detectCliApprovalRequest,
    _providerNeedsInteractiveStdin: providerNeedsInteractiveStdin
};
