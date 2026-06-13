const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const config = require('../config');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// 防暴力破解：注册/登录每 IP 每分钟最多 10 次
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

router.post('/register', authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).json({ error: 'username and password are required' });
  }
  if (password.length < 6) {
    return res.status(422).json({ error: 'password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'user already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  ).run(username, password_hash);

  const user = { id: result.lastInsertRowid, username };
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  res.status(201).json({ token, user });
});

router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid username or password' });
  }

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

module.exports = router;
