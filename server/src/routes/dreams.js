const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/', authRequired, (req, res) => {
  const { title, content, scene_ids, emotion_tags, visibility } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  const sceneIdsJson = JSON.stringify(scene_ids || []);
  const emotionTagsJson = JSON.stringify(emotion_tags || []);

  const result = db.prepare(`
    INSERT INTO dreams (user_id, title, content, scene_ids, emotion_tags, visibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, title || '', content, sceneIdsJson, emotionTagsJson, visibility || 'private');

  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(result.lastInsertRowid);

  // Auto-create custom tags
  if (scene_ids) {
    const insertScene = db.prepare('INSERT OR IGNORE INTO scene_tags (name, is_preset, created_by) VALUES (?, 0, ?)');
    for (const s of scene_ids) {
      if (typeof s === 'string') insertScene.run(s, req.userId);
    }
  }
  if (emotion_tags) {
    const insertEmotion = db.prepare('INSERT OR IGNORE INTO emotion_tags (name, is_preset, created_by) VALUES (?, 0, ?)');
    for (const e of emotion_tags) {
      insertEmotion.run(e.name, req.userId);
    }
  }

  res.status(201).json(dream);
});

module.exports = router;
