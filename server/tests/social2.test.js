const request = require('supertest');

let app, tokenA, tokenB, dreamId;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'alice', password: '123456' });
  tokenA = (await request(app).post('/api/v1/auth/login').send({ username: 'alice', password: '123456' })).body.token;

  await request(app).post('/api/v1/auth/register').send({ username: 'bob', password: '123456' });
  tokenB = (await request(app).post('/api/v1/auth/login').send({ username: 'bob', password: '123456' })).body.token;

  // alice 发一个公开梦
  const d = await request(app).post('/api/v1/dreams')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: 'alice dream', content: 'hello', visibility: 'public' });
  dreamId = d.body.id;
});

describe('follow + profile', () => {
  it('bob follows alice, profile reflects it', async () => {
    const f = await request(app).post('/api/v1/users/alice/follow').set('Authorization', `Bearer ${tokenB}`);
    expect(f.status).toBe(200);
    expect(f.body).toEqual({ following: true, followerCount: 1 });

    const prof = await request(app).get('/api/v1/users/alice').set('Authorization', `Bearer ${tokenB}`);
    expect(prof.status).toBe(200);
    expect(prof.body.isFollowing).toBe(true);
    expect(prof.body.followerCount).toBe(1);
    expect(prof.body.dreams.length).toBe(1);

    const un = await request(app).delete('/api/v1/users/alice/follow').set('Authorization', `Bearer ${tokenB}`);
    expect(un.body).toEqual({ following: false, followerCount: 0 });
  });

  it('cannot follow yourself', async () => {
    const res = await request(app).post('/api/v1/users/alice/follow').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });

  it('404 for unknown user', async () => {
    const res = await request(app).get('/api/v1/users/nobody');
    expect(res.status).toBe(404);
  });
});

describe('notifications', () => {
  it('alice gets notified when bob likes/comments/follows', async () => {
    // 先清零未读基线（前面的测试可能已产生通知）
    await request(app).post('/api/v1/notifications/read').set('Authorization', `Bearer ${tokenA}`);

    await request(app).post(`/api/v1/dreams/${dreamId}/likes`).set('Authorization', `Bearer ${tokenB}`);
    await request(app).post(`/api/v1/dreams/${dreamId}/comments`).set('Authorization', `Bearer ${tokenB}`).send({ content: 'nice' });
    await request(app).post('/api/v1/users/alice/follow').set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(3);
    const unreadTypes = res.body.items.filter((n) => !n.is_read).map((n) => n.type).sort();
    expect(unreadTypes).toEqual(['comment', 'follow', 'like']);
    expect(res.body.items[0].actor_username).toBe('bob');
  });

  it('does not notify yourself for your own actions', async () => {
    // alice 评论自己的梦，不应产生通知
    await request(app).post(`/api/v1/dreams/${dreamId}/comments`).set('Authorization', `Bearer ${tokenA}`).send({ content: 'self' });
    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.unread).toBe(3); // 仍是 3，没有新增
  });

  it('marks all read', async () => {
    await request(app).post('/api/v1/notifications/read').set('Authorization', `Bearer ${tokenA}`);
    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.unread).toBe(0);
  });
});
