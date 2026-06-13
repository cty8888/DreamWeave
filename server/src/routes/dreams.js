const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/', authRequired, (req, res) => {
  const { title, content, visibility } = req.body;

  if (!content) {
    return res.status(422).json({ error: 'content is required' });
  }

  const result = db.prepare(
    'INSERT INTO dreams (user_id, title, content, visibility) VALUES (?, ?, ?, ?)'
  ).run(req.userId, title || null, content, visibility || 'private');

  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(dream);
});

router.post('/:id/generate', authRequired, async (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  try {
    const { continueDream } = require('../services/llm');
    const sceneIds = JSON.parse(dream.scene_ids || '[]');
    const emotions = JSON.parse(dream.emotion_tags || '[]');
    const ai_story = await continueDream(dream.content, sceneIds, emotions);

    db.prepare('UPDATE dreams SET ai_story = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(ai_story, 'completed', req.params.id);

    res.json({ ai_story });
  } catch (err) {
    res.status(500).json({ error: 'AI generation failed' });
  }
});

module.exports = router;
