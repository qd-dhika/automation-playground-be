import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma, seedTestUser, seedTestCategory, seedTestProduct } from './helpers/db';

const app = createTestApp();
let accessToken: string;
let productId: string;
let cartItemId: string;

beforeAll(async () => {
  await cleanDb();
  const user = await seedTestUser({ email: 'cartuser@test.com' });
  const cat = await seedTestCategory('Cart Test Cat');
  const product = await seedTestProduct(cat.id);
  productId = product.id;

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123!' });
  accessToken = res.body.data.accessToken;
});

afterAll(async () => { await prisma.$disconnect(); });

describe('POST /api/cart', () => {
  it('adds item to cart', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(2);
    cartItemId = res.body.data.id;
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/cart').send({ productId, quantity: 1 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/cart', () => {
  it('returns user cart with product info', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].product).toBeDefined();
  });
});

describe('PUT /api/cart/:id', () => {
  it('updates cart item quantity', async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(5);
  });
});

describe('DELETE /api/cart/:id', () => {
  it('removes item from cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBeDefined();
  });
});
