import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma, seedTestUser } from './helpers/db';

const app = createTestApp();
let accessToken: string;

beforeAll(async () => {
  await cleanDb();
  const user = await seedTestUser({ email: 'profile@test.com' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123!' });
  accessToken = res.body.data.accessToken;
});

afterAll(async () => { await prisma.$disconnect(); });

describe('GET /api/profile', () => {
  it('returns user profile', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('profile@test.com');
    expect(res.body.data.password).toBeUndefined();
  });
});

describe('PUT /api/profile', () => {
  it('updates name', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });
});

describe('PUT /api/profile/password', () => {
  it('changes password successfully', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBeDefined();
  });

  it('returns 401 for wrong current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'WrongPassword!', newPassword: 'AnotherNew123!' });
    expect(res.status).toBe(401);
  });
});
