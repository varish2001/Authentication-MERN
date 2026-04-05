const jwt = require('jsonwebtoken');

const ensureAunthenticated = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403).json({ message: 'Unauthorized, JWT token is required' });
    }

    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized, invalid or expired JWT token' });
    }
};

module.exports = ensureAunthenticated;
