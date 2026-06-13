const db = require('./connection');

const PRESET_SCENES = ['坠落', '追逐', '飞行', '迷宫', '溺水', '战斗', '考试', '迷路', '重逢', '变形', '末日', '日常'];
const PRESET_EMOTIONS = ['恐惧', '焦虑', '悲伤', '迷茫', '喜悦', '惊奇', '愤怒', '平静'];

function seed() {
  const insertTag = db.prepare('INSERT OR IGNORE INTO scene_tags (name, is_preset) VALUES (?, 1)');
  const insertEmotion = db.prepare('INSERT OR IGNORE INTO emotion_tags (name, is_preset) VALUES (?, 1)');

  for (const scene of PRESET_SCENES) {
    insertTag.run(scene);
  }
  for (const emotion of PRESET_EMOTIONS) {
    insertEmotion.run(emotion);
  }

  console.log('Seed data inserted.');
}

module.exports = { seed };
