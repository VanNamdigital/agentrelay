const os = require('os');
const path = require('path');

const packageRoot = path.join(__dirname, '..');
const isGlobalCli = process.env.AGENTRELAY_GLOBAL === 'true';
const homeDir = process.env.AGENTRELAY_HOME
    ? path.resolve(process.env.AGENTRELAY_HOME)
    : path.join(os.homedir(), '.agentrelay');
const runtimeRoot = isGlobalCli ? homeDir : packageRoot;

module.exports = {
    dataDir: path.join(runtimeRoot, 'data'),
    envPath: path.join(runtimeRoot, '.env'),
    logDir: path.join(runtimeRoot, 'logs'),
    packageRoot,
    publicDir: path.join(packageRoot, 'public'),
    runtimeRoot
};
