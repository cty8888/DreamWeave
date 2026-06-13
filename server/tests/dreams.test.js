const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'u', email: 'u@t.com', password: '123456' });
  const loginRes = await request(app).post('/api/v1/auth/login')
    .send({ email: 'u@t.com', password: '123456' });
  token = loginRes.body.token;
});

describe('POST /api/v1/dreams', () => {
  it('should create a dream when authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '坠落之梦',
        content: '我从高楼上坠落...',
        scene_ids: [1],
        emotion_tags: [{ name: '恐惧', intensity: 5 }],
        visibility: 'private',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should reject unauthenticated with 401', async () => {
    const res = await request(app).post('/api/v1/dreams').send({ title: 'x', content: 'y' });
    expect(res.status).toBe(401);
  });

  it('should reject empty content with 400', async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', content: '' });
    expect(res.status).toBe(400);
  });
});
