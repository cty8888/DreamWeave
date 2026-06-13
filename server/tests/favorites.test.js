const request = require('supertest');

let app, token, dreamId;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'u', password: '123456' });
  const r = await request(app).post('/api/v1/auth/login').send({ username: 'u', password: '123456' });
  token = r.body.token;

  const d = await request(app).post('/api/v1/dreams')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'd', content: 'a dream', visibility: 'public' });
  dreamId = d.body.id;
});

describe('POST /api/v1/favorites', () => {
  it('should add a favorite', async () => {
    const res = await request(app).post('/api/v1/favorites')
      .set('Authorization', `Bearer ${token}`).send({ dream_id: dreamId });
    expect(res.status).toBe(201);
  });

  it('should reject duplicate with 409', async () => {
    const res = await request(app).post('/api/v1/favorites')
      .set('Authorization', `Bearer ${token}`).send({ dream_id: dreamId });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/favorites', () => {
  it('should list favorites', async () => {
    const res = await request(app).get('/api/v1/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE /api/v1/favorites/:dreamId', () => {
  it('should remove a favorite', async () => {
    const res = await request(app).delete(`/api/v1/favorites/${dreamId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
