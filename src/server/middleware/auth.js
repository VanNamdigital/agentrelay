function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    res.redirect('/login');
}

function redirectIfAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
}

function requireChangePassword(req, res, next) {
    if (req.session && req.session.mustChangePassword) {
        if (req.originalUrl && req.originalUrl.startsWith('/api')) {
            return res.status(403).json({ success: false, error: 'Password change required', mustChangePassword: true });
        }
        return res.redirect('/change-password');
    }
    next();
}

module.exports = { requireAuth, redirectIfAuth, requireChangePassword };
