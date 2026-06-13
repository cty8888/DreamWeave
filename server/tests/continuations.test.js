const request = require('supertest');

let app, token, otherToken, publicDreamId;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'a', password: '123456' });
  const r1 = await request(app).post('/api/v1/auth/login').send({ username: 'a', password: '123456' });
  token = r1.body.token;

  await request(app).post('/api/v1/auth/register').send({ username: 'b', password: '123456' });
  const r2 = await request(app).post('/api/v1/auth/login').send({ username: 'b', password: '123456' });
  otherToken = r2.body.token;

  const d = await request(app).post('/api/v1/dreams')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'public', content: 'a dream', visibility: 'public' });
  publicDreamId = d.body.id;
});

describe('POST /api/v1/dreams/:id/continuations', () => {
  it('should create continuation by another user', async () => {
    const res = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: '续写内容...' });
    expect(res.status).toBe(201);
  });

  it('should reject on private dream', async () => {
    const d = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'p', content: 'x', visibility: 'private' });
    const res = await request(app)
      .post(`/api/v1/dreams/${d.body.id}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'try' });
    expect(res.status).toBe(403);
  });

  it('should build linear chain via parent_id', async () => {
    const first = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: '第一棒' });
    const second = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '第二棒', parent_id: first.body.id });
    expect(second.body.parent_id).toBe(first.body.id);
  });
});

describe('GET /api/v1/dreams/:id/continuations', () => {
  it('should return continuations for a dream', async () => {
    const res = await request(app)
      .get(`/api/v1/dreams/${publicDreamId}/continuations`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
