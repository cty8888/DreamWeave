const express = require('express');
const db = require('../db/connection');
const { authRequired, authOptional } = require('../middleware/auth');
const { notify } = require('../services/notify');

const router = express.Router();

function findUser(username) {
  return db.prepare('SELECT id, username, avatar_url, created_at FROM users WHERE username = ?').get(username);
}

// GET /api/v1/users/:username — 个人主页：资料 + 公开梦境 + 关注关系
router.get('/:username', authOptional, (req, res) => {
  const user = findUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const dreams = db.prepare(`
    SELECT d.*, u.username,
      (SELECT COUNT(*) FROM likes l WHERE l.dream_id = d.id) AS like_count,
      (SELECT COUNT(*) FROM comments c WHERE c.dream_id = d.id) AS comment_count
    FROM dreams d JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ? AND d.visibility = 'public'
    ORDER BY d.created_at DESC
  `).all(user.id);

  const followerCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id).c;
  const followingCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id).c;
  const dreamCount = db.prepare("SELECT COUNT(*) as c FROM dreams WHERE user_id = ? AND visibility = 'public'").get(user.id).c;

  let isFollowing = false;
  let isSelf = false;
  if (req.userId) {
    isSelf = req.userId === user.id;
    isFollowing = !!db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.userId, user.id);
  }

  res.json({ user, dreams, followerCount, followingCount, dreamCount, isFollowing, isSelf });
});

// POST /api/v1/users/:username/follow — 关注
router.post('/:username/follow', authRequired, (req, res) => {
  const target = findUser(req.params.username);
  if (!target) return res.status(404).json({ error: 'user not found' });
  if (target.id === req.userId) return res.status(400).json({ error: 'cannot follow yourself' });

  const info = db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)')
    .run(req.userId, target.id);
  if (info.changes > 0) {
    notify({ recipientId: target.id, actorId: req.userId, type: 'follow' });
  }
  const followerCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(target.id).c;
  res.json({ following: true, followerCount });
});

// DELETE /api/v1/users/:username/follow — 取消关注
router.delete('/:username/follow', authRequired, (req, res) => {
  const target = findUser(req.params.username);
  if (!target) return res.status(404).json({ error: 'user not found' });
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.userId, target.id);
  const followerCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(target.id).c;
  res.json({ following: false, followerCount });
});

module.exports = router;
