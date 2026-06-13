const request = require('supertest');

let app, token, otherToken, dreamId;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'sa', password: '123456' });
  token = (await request(app).post('/api/v1/auth/login').send({ username: 'sa', password: '123456' })).body.token;

  await request(app).post('/api/v1/auth/register').send({ username: 'sb', password: '123456' });
  otherToken = (await request(app).post('/api/v1/auth/login').send({ username: 'sb', password: '123456' })).body.token;

  const d = await request(app).post('/api/v1/dreams')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'public dream', content: '一个公开的梦', visibility: 'public' });
  dreamId = d.body.id;
});

describe('likes', () => {
  it('should like, report count, then unlike', async () => {
    const liked = await request(app)
      .post(`/api/v1/dreams/${dreamId}/likes`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(liked.status).toBe(200);
    expect(liked.body).toEqual({ count: 1, liked: true });

    const status = await request(app)
      .get(`/api/v1/dreams/${dreamId}/likes`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(status.body).toEqual({ count: 1, liked: true });

    // 幂等：重复点赞不会变成 2
    await request(app).post(`/api/v1/dreams/${dreamId}/likes`).set('Authorization', `Bearer ${otherToken}`);
    const again = await request(app).get(`/api/v1/dreams/${dreamId}/likes`);
    expect(again.body.count).toBe(1);

    const unliked = await request(app)
      .delete(`/api/v1/dreams/${dreamId}/likes`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(unliked.body).toEqual({ count: 0, liked: false });
  });

  it('should require auth to like', async () => {
    const res = await request(app).post(`/api/v1/dreams/${dreamId}/likes`);
    expect(res.status).toBe(401);
  });
});

describe('comments', () => {
  it('should post and list comments', async () => {
    const posted = await request(app)
      .post(`/api/v1/dreams/${dreamId}/comments`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: '好梦！' });
    expect(posted.status).toBe(201);
    expect(posted.body.content).toBe('好梦！');
    expect(posted.body.username).toBe('sb');

    const list = await request(app).get(`/api/v1/dreams/${dreamId}/comments`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
  });

  it('should reject empty comment with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/dreams/${dreamId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });
});
