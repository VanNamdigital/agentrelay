const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const store = require('../config/store');

const ALL_PROVIDERS = [
    { key: 'codex', displayName: 'Codex CLI', command: 'codex', aliases: ['codex', 'codex.cmd', 'codex.ps1', 'codex.exe'], versionFlag: '--version' },
    { key: 'opencode', displayName: 'OpenCode CLI', command: 'opencode', aliases: ['opencode', 'opencode-ai', 'opencode.cmd', 'opencode.ps1'], versionFlag: '--version' },
    { key: 'claude', displayName: 'Claude Code CLI', command: 'claude', aliases: ['claude', 'claude.cmd', 'claude.ps1', 'claude.exe'], versionFlag: '--version' },
    { key: 'gemini', displayName: 'Gemini CLI', command: 'gemini', aliases: ['gemini', 'gemini.cmd', 'gemini.ps1', 'gemini.exe'], versionFlag: '--version' },
    { key: 'kiro', displayName: 'Kiro CLI', command: 'kiro', aliases: ['kiro', 'kiro.cmd', 'kiro.ps1', 'kiro.exe'], versionFlag: '--version' },
    { key: 'kilocode', displayName: 'Kilo Code CLI', command: 'kilocode', aliases: ['kilocode', 'kilo', 'kilocode.cmd', 'kilocode.ps1', 'kilocode.exe'], versionFlag: '--version' },
    { key: 'aider', displayName: 'Aider CLI', command: 'aider', aliases: ['aider', 'aider.cmd', 'aider.ps1', 'aider.exe'], versionFlag: '--version' },
    { key: 'goose', displayName: 'Goose CLI', command: 'goose', aliases: ['goose', 'goose.cmd', 'goose.ps1', 'goose.exe'], versionFlag: '--version' },
    { key: 'github-copilot', displayName: 'GitHub Copilot CLI', command: 'gh', aliases: ['gh', 'gh.cmd', 'gh.exe'], versionFlag: '--version' },
    { key: 'crush', displayName: 'Crush CLI', command: 'crush', aliases: ['crush', 'crush.cmd', 'crush.ps1', 'crush.exe'], versionFlag: '--version' },
];

const ALLOWED_PROVIDER_KEYS = new Set(ALL_PROVIDERS.map(provider => provider.key));

function splitCommand(command) {
    const text = String(command || '').trim();
    if (!text) return null;

    const parts = [];
    let current = '';
    let quote = null;
    let escaping = false;

    for (const char of text) {
        if (escaping) {
            current += char;
            escaping = false;
            continue;
        }
        if (char === '\\') {
            escaping = true;
            continue;
        }
        if (quote) {
            if (char === quote) quote = null;
            else current += char;
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (/\s/.test(char)) {
            if (current) {
                parts.push(current);
                current = '';
            }
            continue;
        }
        current += char;
    }

    if (current) parts.push(current);
    if (quote || parts.length === 0) return null;
    return { file: parts[0], args: parts.slice(1) };
}

function getPathDirs() {
    return String(process.env.PATH || '')
        .split(path.delimiter)
        .map(dir => dir.trim())
        .filter(Boolean);
}

function uniqueExistingDirs(dirs) {
    return [...new Set(dirs.filter(Boolean).map(dir => path.resolve(dir)))]
        .filter(dir => {
            try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
            } catch {
                return false;
            }
        });
}

function getExtraSearchDirs() {
    if (process.platform !== 'win32') {
        return uniqueExistingDirs([
            path.join(process.env.HOME || '', '.local', 'bin'),
            path.join(process.env.HOME || '', '.cargo', 'bin'),
            '/usr/local/bin',
            '/opt/homebrew/bin'
        ]);
    }

    const userProfile = process.env.USERPROFILE || '';
    const appData = process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    return uniqueExistingDirs([
        path.join(appData, 'npm'),
        path.join(localAppData, 'npm'),
        path.join(userProfile, '.claude', 'local'),
        path.join(userProfile, '.claude', 'bin'),
        path.join(userProfile, '.anthropic', 'bin'),
        path.join(userProfile, '.local', 'bin'),
        path.join(userProfile, '.cargo', 'bin'),
        path.join(userProfile, 'go', 'bin'),
        path.join(localAppData, 'Claude', 'bin'),
        path.join(localAppData, 'Programs', 'Claude', 'bin'),
        path.join(localAppData, 'Programs', 'Kiro', 'bin'),
        path.join(localAppData, 'Programs', 'GitHub CLI'),
        path.join(programFiles, 'GitHub CLI'),
        path.join(programFilesX86, 'GitHub CLI'),
        path.join(localAppData, 'Microsoft', 'WinGet', 'Links'),
        path.join(programFiles, 'WindowsApps')
    ]);
}

function getDirectoryCommandCandidates(command, dirs) {
    const exts = process.platform === 'win32'
        ? String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.PS1')
            .split(';')
            .map(ext => ext.trim().toLowerCase())
            .filter(Boolean)
        : [''];
    const names = path.extname(command) ? [command] : [command, ...exts.map(ext => `${command}${ext}`)];
    const candidates = [];

    for (const dir of dirs) {
        for (const name of names) {
            const candidate = path.join(dir, name);
            if (fs.existsSync(candidate)) candidates.push(candidate);
        }
    }

    return candidates;
}

function getWindowsPathCandidates(command) {
    const exts = String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.PS1')
        .split(';')
        .map(ext => ext.trim().toLowerCase())
        .filter(Boolean);
    const names = path.extname(command) ? [command] : [command, ...exts.map(ext => `${command}${ext}`)];
    const candidates = [];
    for (const dir of getPathDirs()) {
        for (const name of names) {
            const candidate = path.join(dir, name);
            if (fs.existsSync(candidate)) candidates.push(candidate);
        }
    }
    return candidates;
}

function getCommandCandidates(command) {
    const text = String(command || '').trim();
    if (!text) return [];

    if (process.platform === 'win32' && (path.isAbsolute(text) || /[\\/]/.test(text))) {
        const candidates = [text];
        if (!path.extname(text)) {
            candidates.push(`${text}.exe`, `${text}.cmd`, `${text}.bat`, `${text}.ps1`);
        }
        return candidates.filter(candidate => fs.existsSync(candidate));
    }

    if (path.isAbsolute(text) || /[\\/]/.test(text)) {
        return fs.existsSync(text) ? [text] : [];
    }

    const locator = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(locator, [text], {
        timeout: 5000,
        encoding: 'utf8',
        windowsHide: true,
        shell: false
    });
    const located = result.error || result.status !== 0
        ? []
        : `${result.stdout || ''}${result.stderr || ''}`
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
    const extra = getDirectoryCommandCandidates(text, getExtraSearchDirs());
    if (process.platform !== 'win32') return [...new Set([...located, ...extra])];
    return [...new Set([...located, ...getWindowsPathCandidates(text), ...extra])];
}

function pickCommandCandidate(candidates) {
    if (!candidates.length) return '';
    if (process.platform !== 'win32') return candidates[0];

    const priority = ['.exe', '.cmd', '.bat', '.ps1'];
    for (const ext of priority) {
        const match = candidates.find(candidate => path.extname(candidate).toLowerCase() === ext);
        if (match) return match;
    }
    return candidates[0];
}

function resolveCommand(command) {
    const candidates = getCommandCandidates(command);
    const selected = pickCommandCandidate(candidates);
    return selected || String(command || '').trim();
}

function quoteCmdArg(value) {
    const text = String(value || '');
    if (/^[A-Za-z0-9_./\\:=+\-@]+$/.test(text)) return text;
    return `"${text.replace(/(["^&|<>%])/g, '^$1')}"`;
}

function prepareSpawnCommand(file, args = []) {
    const resolvedFile = resolveCommand(file);
    if (!resolvedFile) return null;

    if (process.platform === 'win32') {
        const ext = path.extname(resolvedFile).toLowerCase();
        if (ext === '.ps1') {
            return {
                file: 'powershell.exe',
                args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolvedFile, ...args],
                resolvedPath: resolvedFile
            };
        }
        if (ext === '.cmd' || ext === '.bat') {
            const psScript = resolvedFile.replace(/\.(cmd|bat)$/i, '.ps1');
            if (fs.existsSync(psScript)) {
                return {
                    file: 'powershell.exe',
                    args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript, ...args],
                    resolvedPath: resolvedFile
                };
            }
            return {
                file: process.env.ComSpec || 'cmd.exe',
                args: ['/d', '/s', '/c', [resolvedFile, ...args].map(quoteCmdArg).join(' ')],
                resolvedPath: resolvedFile
            };
        }
    }

    return { file: resolvedFile, args, resolvedPath: resolvedFile };
}

function runCommand(file, args = [], timeout = 5000) {
    const prepared = prepareSpawnCommand(file, args);
    if (!prepared) return { success: false, output: '', error: 'Invalid command' };

    const result = spawnSync(prepared.file, prepared.args, {
        timeout,
        encoding: 'utf8',
        windowsHide: true,
        shell: false
    });

    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    if (result.error) {
        return { success: false, output, error: result.error.message, resolvedPath: prepared.resolvedPath };
    }
    if (typeof result.status === 'number' && result.status !== 0) {
        return { success: false, output, error: output || `Exited with code ${result.status}`, resolvedPath: prepared.resolvedPath };
    }
    return { success: true, output, resolvedPath: prepared.resolvedPath };
}

function findCommand(command) {
    const commandPath = pickCommandCandidate(getCommandCandidates(command));
    return {
        found: Boolean(commandPath),
        path: commandPath,
        error: commandPath ? '' : 'Command not found in PATH or common install locations'
    };
}

function detectCli(providerInfo) {
    const { command: cmdName, versionFlag } = providerInfo;
    const commands = providerInfo.aliases || [cmdName];
    const result = {
        key: providerInfo.key,
        displayName: providerInfo.displayName,
        found: false,
        path: '',
        command: cmdName,
        version: '',
        error: ''
    };

    let found = { found: false, error: 'Command not found in PATH or common install locations' };
    let selectedCommand = cmdName;
    for (const command of commands) {
        found = findCommand(command);
        if (found.found) {
            selectedCommand = command;
            break;
        }
    }
    if (!found.found) {
        result.error = found.error;
        return result;
    }

    result.found = true;
    result.path = found.path;
    result.command = selectedCommand;

    const version = runCommand(selectedCommand, [versionFlag], 3000);
    if (version.success) {
        result.version = version.output.split(/\r?\n/)[0] || '';
    }

    return result;
}

function detectAllClis() {
    return ALL_PROVIDERS.map(detectCli);
}

function scanAndSave() {
    const results = detectAllClis();
    const now = new Date().toISOString();
    for (const result of results) {
        store.updateCliProviderByKey(result.key, {
            command: result.command || '',
            detected: result.found ? 1 : 0,
            detected_path: result.path || '',
            version: result.version || '',
            status: result.found ? 'detected' : 'not_detected',
            last_checked_at: now,
            error_message: result.error || ''
        });
    }
    return results;
}

function getCachedDetection() {
    return store.getCliProviders().map(provider => ({
        key: provider.key,
        displayName: provider.display_name,
        found: provider.detected === 1 || provider.status === 'manual_valid' || provider.status === 'detected',
        path: provider.detected_path,
        command: provider.command,
        version: provider.version,
        status: provider.status,
        error: provider.error_message
    }));
}

function fetchOpenCodeModels(command = 'opencode') {
    const parsed = splitCommand(command);
    if (!parsed) return [];
    const result = runCommand(parsed.file, [...parsed.args, 'models'], 15000);
    if (!result.success) return [];
    const matches = result.output.match(/[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.:+-]*/g) || [];
    return [...new Set(matches)]
        .filter(model => /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.:+-]*$/.test(model))
        .sort();
}

function fetchCodexModels() {
    return [];
}

function fetchClaudeModelSuggestions() {
    return ['claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-sonnet-4', 'claude-opus-4'];
}

function testCommand(command, timeoutMs = 10000) {
    const parsed = splitCommand(command);
    if (!parsed) {
        return { success: false, error: 'Invalid command', command };
    }

    const result = runCommand(parsed.file, [...parsed.args, '--version'], timeoutMs);
    if (!result.success) {
        return { success: false, error: result.error || 'Command test failed', output: result.output, command };
    }

    const detected = findCommand(parsed.file);
    return {
        success: true,
        output: result.output.split(/\r?\n/)[0] || '',
        command,
        detectedPath: result.resolvedPath || detected.path || parsed.file
    };
}

module.exports = {
    ALLOWED_PROVIDER_KEYS,
    ALL_PROVIDERS,
    detectCli,
    detectAllClis,
    fetchClaudeModelSuggestions,
    fetchCodexModels,
    fetchOpenCodeModels,
    getCachedDetection,
    prepareSpawnCommand,
    scanAndSave,
    splitCommand,
    testCommand
};
