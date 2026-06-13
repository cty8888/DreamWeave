const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/stats — 当前用户的梦境数据图谱
router.get('/', authRequired, (req, res) => {
  const dreams = db.prepare(
    'SELECT scene_ids, emotion_tags, visibility, ai_story, interpretation, created_at FROM dreams WHERE user_id = ?'
  ).all(req.userId);

  const total = dreams.length;
  let aiCount = 0;
  let publicCount = 0;
  let privateCount = 0;
  const sceneFreq = {}; // name -> count
  const emotionAgg = {}; // name -> { count, sum }
  const byDay = {}; // 'YYYY-MM-DD' -> count

  for (const d of dreams) {
    if (d.ai_story || d.interpretation) aiCount++;
    if (d.visibility === 'public') publicCount++;
    else privateCount++;

    const day = (d.created_at || '').slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;

    let scenes = [];
    try { scenes = JSON.parse(d.scene_ids || '[]'); } catch {}
    for (const s of scenes) {
      const name = typeof s === 'object' ? s.name : s;
      if (typeof name === 'string') sceneFreq[name] = (sceneFreq[name] || 0) + 1;
    }

    let emotions = [];
    try { emotions = JSON.parse(d.emotion_tags || '[]'); } catch {}
    for (const e of emotions) {
      const name = typeof e === 'object' ? e.name : e;
      if (typeof name !== 'string') continue;
      if (!emotionAgg[name]) emotionAgg[name] = { count: 0, sum: 0 };
      emotionAgg[name].count++;
      emotionAgg[name].sum += typeof e === 'object' && e.intensity ? Number(e.intensity) : 3;
    }
  }

  const scenes = Object.entries(sceneFreq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const emotions = Object.entries(emotionAgg)
    .map(([name, v]) => ({ name, count: v.count, avgIntensity: +(v.sum / v.count).toFixed(2) }))
    .sort((a, b) => b.count - a.count);

  const calendar = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    total,
    aiCount,
    publicCount,
    privateCount,
    scenes,
    emotions,
    calendar,
  });
});

module.exports = router;
