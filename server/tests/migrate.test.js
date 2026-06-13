const request = require('supertest');

let app, db, initSchema;

beforeAll(() => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index'); // 触发首次 initSchema + seed
  db = require('../src/db/connection');
  ({ initSchema } = require('../src/db/schema'));
});

describe('scene_ids 历史数据迁移', () => {
  it('把数字 id 转换成场景名', () => {
    const tag = db.prepare("SELECT id, name FROM scene_tags WHERE is_preset = 1 LIMIT 1").get();
    const u = db.prepare("INSERT INTO users (username, password_hash) VALUES ('migu', 'x')").run();
    const dr = db
      .prepare('INSERT INTO dreams (user_id, content, scene_ids) VALUES (?, ?, ?)')
      .run(u.lastInsertRowid, '梦', JSON.stringify([tag.id]));

    initSchema(); // 重新触发迁移

    const after = db.prepare('SELECT scene_ids FROM dreams WHERE id = ?').get(dr.lastInsertRowid);
    expect(JSON.parse(after.scene_ids)).toEqual([tag.name]);
  });

  it('已是名字的不受影响（幂等）', () => {
    const u = db.prepare("INSERT INTO users (username, password_hash) VALUES ('migu2', 'x')").run();
    const dr = db
      .prepare('INSERT INTO dreams (user_id, content, scene_ids) VALUES (?, ?, ?)')
      .run(u.lastInsertRowid, '梦', JSON.stringify(['飞行']));

    initSchema();

    const after = db.prepare('SELECT scene_ids FROM dreams WHERE id = ?').get(dr.lastInsertRowid);
    expect(JSON.parse(after.scene_ids)).toEqual(['飞行']);
  });
});
