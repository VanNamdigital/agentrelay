function createRateLimit(options = {}) {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 120;
    const hits = new Map();

    return function rateLimit(req, res, next) {
        const now = Date.now();
        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        const current = hits.get(key);

        if (!current || current.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        current.count += 1;
        if (current.count > max) {
            res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
            return res.status(429).json({ success: false, error: 'Too many requests' });
        }

        return next();
    };
}

module.exports = { createRateLimit };
