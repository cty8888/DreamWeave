const jwt = require('jsonwebtoken');
const config = require('../config');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.userId = payload.userId;
    } catch (err) { /* invalid token, continue as guest */ }
  }
  next();
}

module.exports = { authRequired, authOptional };
