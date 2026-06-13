const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';

  // Mock LLM before requiring app so the route gets the mocked version
  const llm = require('../src/services/llm');
  llm.weaveFragments = async () => '编织后的完整故事。';
  llm.continueDream = async () => '续写故事。';

  app = require('../src/index');

  await request(app).post('/api/v1/auth/register').send({ username: 'u', email: 'u@t.com', password: '123456' });
  const r = await request(app).post('/api/v1/auth/login').send({ email: 'u@t.com', password: '123456' });
  token = r.body.token;
});

describe('POST /api/v1/fragments/weave', () => {
  it('should weave fragments into a story', async () => {
    const res = await request(app)
      .post('/api/v1/fragments/weave')
      .set('Authorization', `Bearer ${token}`)
      .send({ fragments: [{ content: '碎片1' }, { content: '碎片2' }] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('story');
  });

  it('should reject fewer than 2 fragments', async () => {
    const res = await request(app)
      .post('/api/v1/fragments/weave')
      .set('Authorization', `Bearer ${token}`)
      .send({ fragments: [{ content: '只有一个' }] });
    expect(res.status).toBe(400);
  });
});
