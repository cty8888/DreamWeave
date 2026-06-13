const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'st', password: '123456' });
  token = (await request(app).post('/api/v1/auth/login').send({ username: 'st', password: '123456' })).body.token;

  await request(app).post('/api/v1/dreams').set('Authorization', `Bearer ${token}`).send({
    title: 'd1', content: '飞行的梦', visibility: 'public',
    scene_ids: ['飞行'], emotion_tags: [{ name: '喜悦', intensity: 4 }],
  });
  await request(app).post('/api/v1/dreams').set('Authorization', `Bearer ${token}`).send({
    title: 'd2', content: '坠落的梦', visibility: 'private',
    scene_ids: ['飞行', '坠落'], emotion_tags: [{ name: '恐惧', intensity: 5 }],
  });
});

describe('GET /api/v1/stats', () => {
  it('should aggregate the user dream data', async () => {
    const res = await request(app).get('/api/v1/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.publicCount).toBe(1);
    expect(res.body.privateCount).toBe(1);

    const flying = res.body.scenes.find((s) => s.name === '飞行');
    expect(flying.count).toBe(2);

    const fear = res.body.emotions.find((e) => e.name === '恐惧');
    expect(fear.avgIntensity).toBe(5);
  });

  it('should require auth', async () => {
    const res = await request(app).get('/api/v1/stats');
    expect(res.status).toBe(401);
  });
});
