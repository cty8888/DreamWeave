const request = require('supertest');

let app;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');
});

describe('GET /api/v1/tags/scenes', () => {
  it('should return all scene tags', async () => {
    const res = await request(app).get('/api/v1/tags/scenes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(12);
    expect(res.body[0]).toHaveProperty('name');
  });
});

describe('GET /api/v1/tags/emotions', () => {
  it('should return all emotion tags', async () => {
    const res = await request(app).get('/api/v1/tags/emotions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(8);
  });
});
