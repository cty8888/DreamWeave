const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const favs = db.prepare(`
    SELECT f.*, d.title, d.content, d.ai_story, u.username
    FROM favorites f JOIN dreams d ON f.dream_id = d.id JOIN users u ON d.user_id = u.id
    WHERE f.user_id = ? ORDER BY f.created_at DESC
  `).all(req.userId);
  res.json(favs);
});

router.post('/', authRequired, (req, res) => {
  const { dream_id } = req.body;
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dream_id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND dream_id = ?').get(req.userId, dream_id);
  if (existing) return res.status(409).json({ error: 'already favorited' });
  const result = db.prepare('INSERT INTO favorites (user_id, dream_id) VALUES (?, ?)').run(req.userId, dream_id);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.delete('/:dreamId', authRequired, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND dream_id = ?').run(req.userId, req.params.dreamId);
  res.json({ message: 'unfavorited' });
});

module.exports = router;
