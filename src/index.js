const path = require('path');
const dotenv = require('dotenv');
const { envPath } = require('./runtimePaths');

dotenv.config({ path: envPath });

const { startServer } = require('./server');
const botManager = require('./bot');
const store = require('./config/store');

let shuttingDown = false;

async function main() {
    const port = await startServer();
    const shouldStartBot = store.getSetting('telegram_enabled', 'false') === 'true';

    if (shouldStartBot) {
        const result = botManager.startBot();
        if (!result.success) {
            console.warn(`Telegram bot not started: ${result.error}`);
        }
    }

    console.log(`AgentRelay admin is ready on http://127.0.0.1:${port}`);
    return port;
}

function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
        botManager.stopBot();
    } catch {}

    try {
        store.close();
    } catch {}

    console.log(`AgentRelay stopped by ${signal}`);
    process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main, shutdown };
