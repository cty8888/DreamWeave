const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'u', password: '123456' });
  const loginRes = await request(app).post('/api/v1/auth/login')
    .send({ username: 'u', password: '123456' });
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

describe('GET /api/v1/dreams', () => {
  beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/v1/dreams')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `public ${i}`, content: `content ${i}`, visibility: 'public' });
    }
  });

  it('should return public dreams with pagination', async () => {
    const res = await request(app).get('/api/v1/dreams?visibility=public&page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
  });

  it('should support keyword search', async () => {
    await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '独角兽奇遇', content: '一只会说话的独角兽', visibility: 'public' });

    const res = await request(app).get('/api/v1/dreams?q=独角兽');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((d) => /独角兽/.test(d.title + d.content))).toBe(true);
  });

  it('should filter by scene tag', async () => {
    await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '海底', content: '深海漫游', visibility: 'public', scene_ids: ['深海'] });

    const res = await request(app).get('/api/v1/dreams?scene=深海');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should include like_count and comment_count in list', async () => {
    const res = await request(app).get('/api/v1/dreams?visibility=public&limit=1');
    expect(res.body.data[0]).toHaveProperty('like_count');
    expect(res.body.data[0]).toHaveProperty('comment_count');
  });

  it('should return a random public dream', async () => {
    const res = await request(app).get('/api/v1/dreams/random');
    expect(res.status).toBe(200);
    expect(res.body.visibility).toBe('public');
    expect(res.body).toHaveProperty('id');
  });
});

describe('GET /api/v1/dreams/:id', () => {
  let privateDreamId;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'private', content: 'secret', visibility: 'private' });
    privateDreamId = res.body.id;
  });

  it('should return dream for owner', async () => {
    const res = await request(app).get(`/api/v1/dreams/${privateDreamId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should return 404 for non-owner of private dream', async () => {
    const regRes = await request(app).post('/api/v1/auth/register')
      .send({ username: 'other', password: '123456' });
    const res = await request(app).get(`/api/v1/dreams/${privateDreamId}`)
      .set('Authorization', `Bearer ${regRes.body.token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/dreams/:id', () => {
  it('should update own dream', async () => {
    const createRes = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'old', content: 'old content' });
    const id = createRes.body.id;
    const res = await request(app).put(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`).send({ title: 'new title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('new title');
  });
});

describe('DELETE /api/v1/dreams/:id', () => {
  it('should delete own dream', async () => {
    const createRes = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'to delete', content: 'x' });
    const id = createRes.body.id;
    const res = await request(app).delete(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const getRes = await request(app).get(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
