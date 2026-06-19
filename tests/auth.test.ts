import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma } from './helpers/db';

const app = createTestApp();

beforeAll(async () => {
  await cleanDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password123!' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Alice', email: 'alice@test.com', role: 'user' });
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 409 if email already in use', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'Password123!' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob2', email: 'bob@test.com', password: 'Password123!' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'login@test.com', password: 'Password123!' });
  });

  it('returns tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('login@test.com');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  let refreshToken: string;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Refresh User', email: 'refresh@test.com', password: 'Password123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@test.com', password: 'Password123!' });
    refreshToken = res.body.data.refreshToken;
  });

  it('returns new access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Logout User', email: 'logout@test.com', password: 'Password123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@test.com', password: 'Password123!' });
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('logs out successfully', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });
});
