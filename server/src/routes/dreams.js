const express = require('express');
const db = require('../db/connection');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/dreams — 创建梦境 (T09)
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

// GET /api/v1/dreams — 梦境列表 + 搜索/筛选 (T10)
router.get('/', (req, res) => {
  const { visibility, page = 1, limit = 20, q, scene, emotion } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  let where = 'WHERE 1=1';
  const params = [];

  if (visibility) {
    where += ' AND d.visibility = ?';
    params.push(visibility);
  }
  if (q && q.trim()) {
    where += ' AND (d.title LIKE ? OR d.content LIKE ?)';
    const kw = `%${q.trim()}%`;
    params.push(kw, kw);
  }
  if (scene) {
    where += ' AND d.scene_ids LIKE ?';
    params.push(`%${scene}%`);
  }
  if (emotion) {
    where += ' AND d.emotion_tags LIKE ?';
    params.push(`%${emotion}%`);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM dreams d ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT d.*, u.username,
      (SELECT COUNT(*) FROM likes l WHERE l.dream_id = d.id) AS like_count,
      (SELECT COUNT(*) FROM comments c WHERE c.dream_id = d.id) AS comment_count
    FROM dreams d JOIN users u ON d.user_id = u.id
    ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ data: rows, total: countRow.total, page: Number(page) });
});

// POST /api/v1/dreams/:id/generate — AI 续写 (T17)
router.post('/:id/generate', authRequired, async (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  try {
    const { continueDream } = require('../services/llm');
    const sceneIds = JSON.parse(dream.scene_ids || '[]');
    const emotions = JSON.parse(dream.emotion_tags || '[]');
    const ai_story = await continueDream(dream.content, sceneIds, emotions, req.body?.style);

    db.prepare('UPDATE dreams SET ai_story = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(ai_story, 'completed', req.params.id);

    res.json({ ai_story });
  } catch (err) {
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// POST /api/v1/dreams/:id/interpret — AI 解梦
router.post('/:id/interpret', authRequired, async (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  try {
    const { interpretDream } = require('../services/llm');
    const sceneIds = JSON.parse(dream.scene_ids || '[]');
    const emotions = JSON.parse(dream.emotion_tags || '[]');
    const interpretation = await interpretDream(dream.content, sceneIds, emotions);

    db.prepare('UPDATE dreams SET interpretation = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(interpretation, req.params.id);

    res.json({ interpretation });
  } catch (err) {
    res.status(500).json({ error: 'AI interpretation failed' });
  }
});

// GET /api/v1/dreams/random — 随机一个公开梦境（须在 /:id 之前注册）
router.get('/random', (req, res) => {
  const dream = db.prepare(`
    SELECT d.*, u.username FROM dreams d JOIN users u ON d.user_id = u.id
    WHERE d.visibility = 'public' ORDER BY RANDOM() LIMIT 1
  `).get();
  if (!dream) return res.status(404).json({ error: 'no public dreams yet' });
  res.json(dream);
});

// GET /api/v1/dreams/:id — 梦境详情 (T11)
router.get('/:id', authOptional, (req, res) => {
  const dream = db.prepare(`
    SELECT d.*, u.username FROM dreams d JOIN users u ON d.user_id = u.id WHERE d.id = ?
  `).get(req.params.id);

  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.visibility === 'private' && dream.user_id !== req.userId) {
    return res.status(404).json({ error: 'dream not found' });
  }
  res.json(dream);
});

// PUT /api/v1/dreams/:id — 更新梦境 (T12)
router.put('/:id', authRequired, (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  const { title, content, scene_ids, emotion_tags, visibility } = req.body;
  db.prepare(`UPDATE dreams SET title=?, content=?, scene_ids=?, emotion_tags=?, visibility=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(title ?? dream.title, content ?? dream.content,
      scene_ids ? JSON.stringify(scene_ids) : dream.scene_ids,
      emotion_tags ? JSON.stringify(emotion_tags) : dream.emotion_tags,
      visibility ?? dream.visibility, req.params.id);
  res.json(db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id));
});

// DELETE /api/v1/dreams/:id — 删除梦境 (T12)
router.delete('/:id', authRequired, (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  db.prepare('DELETE FROM continuations WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM favorites WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM likes WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM dreams WHERE id = ?').run(req.params.id);
  res.json({ message: 'deleted' });
});

module.exports = router;
