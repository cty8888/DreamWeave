const db = require('../db/connection');

// 创建一条通知。recipientId 为接收者，actorId 为触发者。
// 给自己触发的动作不发通知。
function notify({ recipientId, actorId, type, dreamId = null }) {
  if (!recipientId || recipientId === actorId) return;
  db.prepare(
    'INSERT INTO notifications (user_id, actor_id, type, dream_id) VALUES (?, ?, ?, ?)'
  ).run(recipientId, actorId, type, dreamId);
}

module.exports = { notify };
