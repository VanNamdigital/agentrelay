#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.join(__dirname, '..');

function hasFlag(name) {
    return process.argv.includes(name);
}

function printHelp() {
    console.log(`AgentRelay

Usage:
  agentrelay             Start the admin server and open the dashboard
  agentrelay --no-open   Start without opening the browser
  agentrelay --help      Show this help
`);
}

function ensureEnv() {
    const { envPath, runtimeRoot } = require('../src/runtimePaths');
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

function openBrowser(url) {
    let command;
    let args;

    if (process.platform === 'win32') {
        command = 'cmd';
        args = ['/c', 'start', '', url];
    } else if (process.platform === 'darwin') {
        command = 'open';
        args = [url];
    } else {
        command = 'xdg-open';
        args = [url];
    }

    const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
    });
    child.unref();
}

async function run() {
    if (hasFlag('--help') || hasFlag('-h')) {
        printHelp();
        return;
    }

    process.env.AGENTRELAY_GLOBAL = 'true';
    process.chdir(rootDir);
    ensureEnv();
    require('../scripts/ensure-dashboard');

    const { main } = require('../src/index');
    const port = await main();
    const url = `http://127.0.0.1:${port}/dashboard`;

    if (!hasFlag('--no-open')) {
        openBrowser(url);
        console.log(`Opened ${url}`);
    } else {
        console.log(`Dashboard: ${url}`);
    }
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
