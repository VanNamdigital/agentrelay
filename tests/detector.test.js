import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import detector from '../src/cli/detector.js';

describe('CLI provider registry', () => {
    it('includes Command Code with non-conflicting default aliases', () => {
        const provider = detector.ALL_PROVIDERS.find(item => item.key === 'command-code');

        expect(provider).toMatchObject({
            displayName: 'Command Code CLI',
            command: 'command-code',
            versionFlag: '--version'
        });
        expect(detector.ALLOWED_PROVIDER_KEYS.has('command-code')).toBe(true);
        expect(provider.aliases).toContain('command-code');
        expect(provider.aliases).toContain('commandcode');
        expect(provider.aliases).not.toContain('cmd');
    });

    it('spawns npm cmd wrappers through their node script on Windows', () => {
        if (process.platform !== 'win32') return;

        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrelay-detector-'));
        const scriptPath = path.join(dir, 'node_modules', 'fake-cli', 'bin', 'fake');
        const cmdPath = path.join(dir, 'fake.cmd');
        fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
        fs.writeFileSync(scriptPath, '#!/usr/bin/env node\n');
        fs.writeFileSync(cmdPath, [
            '@ECHO off',
            'SETLOCAL',
            'SET dp0=%~dp0',
            'endLocal & "%_prog%"  "%dp0%\\node_modules\\fake-cli\\bin\\fake" %*'
        ].join('\r\n'));

        const prepared = detector.prepareSpawnCommand(cmdPath, ['arg with spaces']);

        expect(prepared.file).toBe(process.execPath);
        expect(prepared.args).toEqual([scriptPath, 'arg with spaces']);
        expect(prepared.resolvedPath).toBe(cmdPath);
    });

    it('prefers npm cmd shims over later Windows executable matches', () => {
        if (process.platform !== 'win32') return;

        const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrelay-shim-'));
        const exeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrelay-exe-'));
        const cmdPath = path.join(shimDir, 'fake.cmd');
        const exePath = path.join(exeDir, 'fake.exe');
        fs.writeFileSync(cmdPath, '@ECHO off\r\n');
        fs.writeFileSync(exePath, '');

        const originalPath = process.env.PATH;
        try {
            process.env.PATH = [shimDir, exeDir, originalPath].filter(Boolean).join(path.delimiter);
            const prepared = detector.prepareSpawnCommand('fake', []);
            expect(prepared.resolvedPath).toBe(cmdPath);
        } finally {
            process.env.PATH = originalPath;
        }
    });

    it('detects Kiro models without importing descriptions as model names', async () => {
        const originalPath = process.env.PATH;
        if (process.platform !== 'win32') return;

        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrelay-kiro-'));
        const scriptPath = path.join(dir, 'node_modules', 'fake-kiro', 'bin', 'kiro-cli.js');
        const cmdPath = path.join(dir, 'kiro-cli.cmd');
        fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
        fs.writeFileSync(scriptPath, [
            'if (process.argv.includes("--version")) { console.log("kiro-cli-chat 2.2.1"); process.exit(0); }',
            'console.log(JSON.stringify({models:[{model_name:"auto",model_id:"auto",description:"Models chosen by task"},{model_name:"claude-sonnet-4.5",model_id:"claude-sonnet-4.5",description:"The Claude Sonnet model"}],default_model:"auto"}));'
        ].join('\n'));
        fs.writeFileSync(cmdPath, [
            '@ECHO off',
            'SETLOCAL',
            'SET dp0=%~dp0',
            'endLocal & "%_prog%"  "%dp0%\\node_modules\\fake-kiro\\bin\\kiro-cli.js" %*'
        ].join('\r\n'));

        try {
            process.env.PATH = [dir, originalPath].filter(Boolean).join(path.delimiter);
            await expect(detector.fetchKiroModels('kiro-cli')).resolves.toEqual(['auto', 'claude-sonnet-4.5']);
        } finally {
            process.env.PATH = originalPath;
        }
    });

    it('keeps full Kilo Code model ids from kilo models output', async () => {
        const originalPath = process.env.PATH;
        if (process.platform !== 'win32') return;

        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrelay-kilo-'));
        const scriptPath = path.join(dir, 'node_modules', 'fake-kilo', 'bin', 'kilo.js');
        const cmdPath = path.join(dir, 'kilo.cmd');
        fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
        fs.writeFileSync(scriptPath, [
            'console.log("kilo/~anthropic/claude-sonnet-latest");',
            'console.log("kilo/kilo-auto/free");',
            'console.log("kilo/deepseek/deepseek-v4-flash");'
        ].join('\n'));
        fs.writeFileSync(cmdPath, [
            '@ECHO off',
            'SETLOCAL',
            'SET dp0=%~dp0',
            'endLocal & "%_prog%"  "%dp0%\\node_modules\\fake-kilo\\bin\\kilo.js" %*'
        ].join('\r\n'));

        try {
            process.env.PATH = [dir, originalPath].filter(Boolean).join(path.delimiter);
            await expect(detector.fetchKiloCodeModels('kilo')).resolves.toEqual([
                'kilo/deepseek/deepseek-v4-flash',
                'kilo/kilo-auto/free',
                'kilo/~anthropic/claude-sonnet-latest'
            ]);
        } finally {
            process.env.PATH = originalPath;
        }
    });
});
