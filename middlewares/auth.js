const jwt = require('jsonwebtoken');

// Parse a single cookie value from the raw Cookie header (no cookie-parser needed)
function parseCookie(cookieHeader, name) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

const authenticateToken = (req, res, next) => {
    // 1. Try Authorization: Bearer <token> header (API calls)
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // 2. Fall back to cookie (browser page loads)
    if (!token) {
        token = parseCookie(req.headers['cookie'], 'token');
    }

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;