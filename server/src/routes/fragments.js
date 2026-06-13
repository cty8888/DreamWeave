const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');
const { weaveFragments } = require('../services/llm');

const router = express.Router();

router.post('/weave', authRequired, async (req, res) => {
  const { fragments } = req.body;
  if (!fragments || fragments.length < 2) return res.status(400).json({ error: 'at least 2 fragments required' });
  if (fragments.length > 10) return res.status(400).json({ error: 'max 10 fragments allowed' });

  const sessionId = uuidv4();
  const insert = db.prepare('INSERT INTO fragments (user_id, content, sort_order, session_id) VALUES (?, ?, ?, ?)');
  for (let i = 0; i < fragments.length; i++) {
    insert.run(req.userId, fragments[i].content, fragments[i].sort_order ?? i, sessionId);
  }

  try {
    const contents = fragments.map(f => f.content);
    const story = await weaveFragments(contents);
    res.json({ story, session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: 'AI weaving failed' });
  }
});

router.get('/sessions', authRequired, (req, res) => {
  const sessions = db.prepare(`
    SELECT session_id, COUNT(*) as fragment_count, MIN(created_at) as created_at
    FROM fragments WHERE user_id = ? GROUP BY session_id ORDER BY created_at DESC
  `).all(req.userId);
  res.json(sessions);
});

module.exports = router;
