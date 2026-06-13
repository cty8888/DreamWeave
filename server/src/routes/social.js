const express = require('express');
const db = require('../db/connection');
const { authRequired, authOptional } = require('../middleware/auth');
const { notify } = require('../services/notify');

const router = express.Router({ mergeParams: true });

// 点赞/评论仅对公开梦境开放：不存在→404，非公开→403（与续写接力一致，防止越权操作私有梦境）
function loadPublicDream(req, res) {
  const dream = db.prepare('SELECT id, visibility, user_id FROM dreams WHERE id = ?').get(Number(req.params.id));
  if (!dream) {
    res.status(404).json({ error: 'dream not found' });
    return null;
  }
  if (dream.visibility !== 'public') {
    res.status(403).json({ error: 'dream is not public' });
    return null;
  }
  return dream;
}

// ---- 点赞 ----

// GET /likes — 点赞数 + 当前用户是否已赞
router.get('/likes', authOptional, (req, res) => {
  if (!loadPublicDream(req, res)) return;
  const dreamId = Number(req.params.id);
  const { count } = db.prepare('SELECT COUNT(*) as count FROM likes WHERE dream_id = ?').get(dreamId);
  let liked = false;
  if (req.userId) {
    liked = !!db.prepare('SELECT id FROM likes WHERE dream_id = ? AND user_id = ?').get(dreamId, req.userId);
  }
  res.json({ count, liked });
});

// POST /likes — 点赞（幂等）
router.post('/likes', authRequired, (req, res) => {
  const dream = loadPublicDream(req, res);
  if (!dream) return;
  const dreamId = Number(req.params.id);
  const info = db.prepare('INSERT OR IGNORE INTO likes (user_id, dream_id) VALUES (?, ?)').run(req.userId, dreamId);
  if (info.changes > 0) {
    notify({ recipientId: dream.user_id, actorId: req.userId, type: 'like', dreamId });
  }
  const { count } = db.prepare('SELECT COUNT(*) as count FROM likes WHERE dream_id = ?').get(dreamId);
  res.json({ count, liked: true });
});

// DELETE /likes — 取消点赞（幂等）
router.delete('/likes', authRequired, (req, res) => {
  if (!loadPublicDream(req, res)) return;
  const dreamId = Number(req.params.id);
  db.prepare('DELETE FROM likes WHERE user_id = ? AND dream_id = ?').run(req.userId, dreamId);
  const { count } = db.prepare('SELECT COUNT(*) as count FROM likes WHERE dream_id = ?').get(dreamId);
  res.json({ count, liked: false });
});

// ---- 评论 ----

// GET /comments — 评论列表
router.get('/comments', (req, res) => {
  if (!loadPublicDream(req, res)) return;
  const dreamId = Number(req.params.id);
  const rows = db.prepare(`
    SELECT c.*, u.username FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.dream_id = ? ORDER BY c.created_at ASC
  `).all(dreamId);
  res.json(rows);
});

// POST /comments — 发表评论
router.post('/comments', authRequired, (req, res) => {
  const dream = loadPublicDream(req, res);
  if (!dream) return;
  const dreamId = Number(req.params.id);
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }
  if (content.trim().length > 1000) {
    return res.status(400).json({ error: 'comment too long (max 1000 chars)' });
  }
  const result = db.prepare('INSERT INTO comments (dream_id, user_id, content) VALUES (?, ?, ?)')
    .run(dreamId, req.userId, content.trim());
  const comment = db.prepare(`
    SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  notify({ recipientId: dream.user_id, actorId: req.userId, type: 'comment', dreamId });

  res.status(201).json(comment);
});

module.exports = router;
