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
});
