const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dashboardDir = path.join(rootDir, 'dashboard');
const dashboardIndex = path.join(rootDir, 'public', 'dashboard', 'index.html');
const dashboardModules = path.join(dashboardDir, 'node_modules');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

if (!existsSync(dashboardIndex)) {
    console.log('Dashboard build not found. Building React dashboard...');

    if (!existsSync(dashboardModules)) {
        run(npmCommand, ['install'], dashboardDir);
    }

    run(npmCommand, ['run', 'build'], dashboardDir);
}
