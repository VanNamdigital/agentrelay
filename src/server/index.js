const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const store = require('../config/store');
const { hashPassword } = require('../auth/password');
const { envPath, publicDir } = require('../runtimePaths');

const apiRoutes = require('./routes/api');
const { createRateLimit } = require('./middleware/rate-limit');

const app = express();
const PORT = Number.parseInt(process.env.ADMIN_PORT || '3456', 10);
const HOST = process.env.ALLOW_LAN === 'true'
    ? String(process.env.HOST || '0.0.0.0').trim()
    : '127.0.0.1';

function getSessionSecret() {
    const secret = String(process.env.SESSION_SECRET || '').trim();
    if (secret.length < 16) {
        throw new Error('SESSION_SECRET is required and must be at least 16 characters.');
    }
    return secret;
}

function getAllowedOrigins() {
    const configured = String(process.env.ADMIN_CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    if (configured.length > 0) return configured;

    return [
        `http://127.0.0.1:${PORT}`,
        `http://localhost:${PORT}`,
        'http://127.0.0.1:3000',
        'http://localhost:3000'
    ];
}

const allowedOrigins = getAllowedOrigins();
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isTrustedLocalOrigin(origin) {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    try {
        const parsed = new URL(origin);
        return parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname);
    } catch {
        return false;
    }
}

function requireTrustedOrigin(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    if (isTrustedLocalOrigin(origin)) return next();
    const referer = req.get('referer');
    if (!origin && referer) {
        try {
            if (isTrustedLocalOrigin(new URL(referer).origin)) return next();
        } catch {}
    }
    if (!origin && !referer && ['127.0.0.1', 'localhost'].includes(req.hostname)) return next();
    return res.status(403).json({ success: false, error: 'Request origin is not trusted' });
}

app.use(cors({
    credentials: true,
    origin(origin, callback) {
        if (isTrustedLocalOrigin(origin)) return callback(null, true);
        return callback(null, false);
    }
}));
app.use(express.json());
app.use(session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    name: 'agentrelay.sid',
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.AUTH_COOKIE_SECURE === 'true'
    }
}));

app.set('strict routing', false);
app.use(express.static(publicDir));

function serveReactDashboard(req, res, next) {
    const indexPath = path.join(publicDir, 'dashboard', 'index.html');
    if (!fs.existsSync(indexPath)) return next();
    return res.sendFile(indexPath);
}

async function initAdmin() {
    if (!store.hasAdmin()) {
        const h = await hashPassword('123456');
        store.createAdmin('admin', h);
    }
    store.ensureDefaults();
}

async function startServer() {
    await initAdmin();

    if (store.getSetting('imported_env') !== 'true') {
        const count = store.importFromEnv(envPath);
        if (count > 0) store.setSetting('imported_env', 'true');
    }

    app.use('/api', createRateLimit({ windowMs: 60 * 1000, max: 120 }));
    app.use('/api', requireTrustedOrigin);
    app.use('/api', apiRoutes);
    app.get(['/dashboard', '/dashboard/*'], serveReactDashboard);

    app.use((req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ success: false, error: 'API route not found' });
        }
        return res.redirect('/dashboard/');
    });

    app.use((error, req, res, next) => {
        console.error(error);
        if (res.headersSent) return next(error);
        if (req.path.startsWith('/api')) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        return res.status(500).send('Internal server error');
    });

    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, HOST, () => {
            console.log(`Admin UI running at http://${HOST}:${PORT}`);
            resolve(PORT);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const fallbackPort = PORT + 1;
                console.log(`Port ${PORT} in use, trying ${fallbackPort}...`);
                const fallback = app.listen(fallbackPort, HOST, () => {
                    console.log(`Admin UI running at http://${HOST}:${fallbackPort}`);
                    resolve(fallbackPort);
                });
                fallback.on('error', () => reject(err));
            } else {
                reject(err);
            }
        });
    });
}

module.exports = { app, startServer };
