const db = require('./connection');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
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
      interpretation TEXT,
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

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, dream_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL REFERENCES users(id),
      following_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      actor_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      dream_id INTEGER REFERENCES dreams(id),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 幂等迁移：为已存在的旧库补上后加的列（CREATE TABLE IF NOT EXISTS 不会改已有表）
  migrate();

  console.log('Database schema initialized.');
}

// 缺列则补列，已存在则跳过
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Migrated: added ${table}.${column}`);
  }
}

function migrate() {
  ensureColumn('dreams', 'interpretation', 'TEXT');
  migrateSceneIdsToNames();
}

// 历史数据：早期 scene_ids 存的是场景 id（数字），统一改存名字（与 emotion_tags 一致），
// 否则按场景名筛选与卡片显示都会失效。幂等：已是名字则跳过。
function migrateSceneIdsToNames() {
  const dreams = db.prepare('SELECT id, scene_ids FROM dreams').all();
  if (!dreams.length) return;

  const nameById = {};
  for (const t of db.prepare('SELECT id, name FROM scene_tags').all()) {
    nameById[t.id] = t.name;
  }
  const update = db.prepare('UPDATE dreams SET scene_ids = ? WHERE id = ?');

  for (const row of dreams) {
    let arr;
    try {
      arr = JSON.parse(row.scene_ids || '[]');
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;

    let changed = false;
    const mapped = arr.map((s) => {
      if (typeof s === 'number') {
        changed = true;
        return nameById[s] || String(s);
      }
      if (s && typeof s === 'object' && s.name) {
        changed = true;
        return s.name;
      }
      return s;
    });
    if (changed) update.run(JSON.stringify(mapped), row.id);
  }
}

module.exports = { initSchema };
