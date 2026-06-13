const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  // Mock the LLM service by overwriting its exports directly.
  // vitest vi.mock is unreliable with CJS globals mode, so we use manual mocking.
  const llm = require('../src/services/llm');
  llm.continueDream = () => Promise.resolve('AI续写的故事内容...');
  llm.weaveFragments = () => Promise.resolve('编织故事...');

  await request(app).post('/api/v1/auth/register').send({ username: 'u', email: 'u@t.com', password: '123456' });
  const r = await request(app).post('/api/v1/auth/login').send({ email: 'u@t.com', password: '123456' });
  token = r.body.token;
});

describe('POST /api/v1/dreams/:id/generate', () => {
  it('should generate AI story for own dream', async () => {
    const d = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'test', content: 'a dream', visibility: 'private' });

    const res = await request(app)
      .post(`/api/v1/dreams/${d.body.id}/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ai_story).toBe('AI续写的故事内容...');
  });

  it('should reject non-owner', async () => {
    const d = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'test2', content: 'secret', visibility: 'private' });

    await request(app).post('/api/v1/auth/register').send({ username: 'o', email: 'o@t.com', password: '123456' });
    const otherRes = await request(app).post('/api/v1/auth/login').send({ email: 'o@t.com', password: '123456' });

    const res = await request(app)
      .post(`/api/v1/dreams/${d.body.id}/generate`)
      .set('Authorization', `Bearer ${otherRes.body.token}`);

    expect(res.status).toBe(403);
  });
});
