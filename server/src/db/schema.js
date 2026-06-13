const db = require('./connection');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scene_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_preset INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emotion_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_preset INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT,
      content TEXT NOT NULL,
      scene_ids TEXT DEFAULT '[]',
      emotion_tags TEXT DEFAULT '[]',
      visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private','public')),
      ai_story TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS continuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      parent_id INTEGER REFERENCES continuations(id),
      content TEXT NOT NULL,
      is_independent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fragments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      sort_order INTEGER,
      session_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, dream_id)
    );
  `);

  console.log('Database schema initialized.');
}

module.exports = { initSchema };
