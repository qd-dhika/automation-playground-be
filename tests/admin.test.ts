import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma, seedTestAdmin, seedTestUser, seedTestCategory, seedTestProduct } from './helpers/db';

const app = createTestApp();
let adminToken: string;
let userToken: string;
let productId: string;
let userId: string;

beforeAll(async () => {
  await cleanDb();
  const admin = await seedTestAdmin();
  const user = await seedTestUser({ email: 'victim@test.com' });
  userId = user.id;
  const cat = await seedTestCategory('Admin Cat');
  const product = await seedTestProduct(cat.id);
  productId = product.id;

  const adminRes = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Admin123!' });
  adminToken = adminRes.body.data.accessToken;

  const userRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Password123!' });
  userToken = userRes.body.data.accessToken;
});

afterAll(async () => { await prisma.$disconnect(); });

describe('GET /api/admin/stats', () => {
  it('returns stats for admin', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ totalUsers: expect.any(Number), totalProducts: expect.any(Number) });
  });
  it('returns 403 for regular user', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin Products', () => {
  it('GET /api/admin/products returns paginated list', async () => {
    const res = await request(app).get('/api/admin/products').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
  });

  it('POST /api/admin/products creates product', async () => {
    const cat = await prisma.category.findFirst();
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Product', description: 'Desc', price: 19.99, stock: 10, categoryId: cat!.id });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('New Product');
  });

  it('PUT /api/admin/products/:id updates product', async () => {
    const res = await request(app)
      .put(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Product', price: 99.99 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Product');
  });

  it('DELETE /api/admin/products/:id soft deletes', async () => {
    const res = await request(app)
      .delete(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const row = await prisma.product.findUnique({ where: { id: productId } });
    expect(row!.deletedAt).not.toBeNull();
  });
});

describe('Admin Users', () => {
  it('GET /api/admin/users returns list', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/admin/users/:id toggles isActive', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });
});

describe('Admin Orders', () => {
  it('GET /api/admin/orders returns list', async () => {
    const res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
