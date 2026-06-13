const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');
const { notify } = require('../services/notify');

const router = express.Router({ mergeParams: true });

router.post('/', authRequired, (req, res) => {
  const dreamId = Number(req.params.id);
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);

  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.visibility !== 'public') return res.status(403).json({ error: 'dream is not public' });

  const { content, parent_id, is_independent } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  const result = db.prepare(`
    INSERT INTO continuations (dream_id, user_id, parent_id, content, is_independent)
    VALUES (?, ?, ?, ?, ?)
  `).run(dreamId, req.userId, parent_id || null, content, is_independent ? 1 : 0);

  const continuation = db.prepare('SELECT * FROM continuations WHERE id = ?').get(result.lastInsertRowid);

  notify({ recipientId: dream.user_id, actorId: req.userId, type: 'continue', dreamId });

  res.status(201).json(continuation);
});

router.get('/', (req, res) => {
  const dreamId = Number(req.params.id);
  const continuations = db.prepare(`
    SELECT c.*, u.username FROM continuations c
    JOIN users u ON c.user_id = u.id
    WHERE c.dream_id = ? ORDER BY c.created_at ASC
  `).all(dreamId);
  res.json(continuations);
});

module.exports = router;
