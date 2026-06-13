const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/notifications — 当前用户的通知列表 + 未读数
router.get('/', authRequired, (req, res) => {
  const items = db.prepare(`
    SELECT n.*, a.username AS actor_username, d.title AS dream_title
    FROM notifications n
    JOIN users a ON n.actor_id = a.id
    LEFT JOIN dreams d ON n.dream_id = d.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.userId);

  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.userId).c;
  res.json({ items, unread });
});

// POST /api/v1/notifications/read — 全部标记为已读
router.post('/read', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.userId);
  res.json({ unread: 0 });
});

module.exports = router;
