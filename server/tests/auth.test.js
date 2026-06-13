const request = require('supertest');

let app;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123456' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
  });

  it('should reject duplicate email with 409', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'u2', email: 'dup@example.com', password: '123456' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'u3', email: 'dup@example.com', password: '123456' });

    expect(res.status).toBe(409);
  });

  it('should reject missing fields with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'x' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'logintest', email: 'login@test.com', password: 'testpass' });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'testpass' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});
