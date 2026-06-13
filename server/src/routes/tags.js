const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/scenes', (req, res) => {
  const tags = db.prepare('SELECT id, name, is_preset FROM scene_tags ORDER BY id').all();
  res.json(tags);
});

router.get('/emotions', (req, res) => {
  const tags = db.prepare('SELECT id, name, is_preset FROM emotion_tags ORDER BY id').all();
  res.json(tags);
});

module.exports = router;
