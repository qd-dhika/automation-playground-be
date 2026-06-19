import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma, seedTestUser, seedTestCategory, seedTestProduct } from './helpers/db';

const app = createTestApp();
let accessToken: string;
let orderId: string;

beforeAll(async () => {
  await cleanDb();
  const user = await seedTestUser({ email: 'orderuser@test.com' });
  const cat = await seedTestCategory('Order Cat');
  const product = await seedTestProduct(cat.id, { price: 50.00 });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123!' });
  accessToken = loginRes.body.data.accessToken;

  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ productId: product.id, quantity: 2 });
});

afterAll(async () => { await prisma.$disconnect(); });

describe('POST /api/orders', () => {
  it('creates order from cart and clears cart', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ shippingAddress: '123 Test Street, City' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(parseFloat(res.body.data.total)).toBe(100);
    orderId = res.body.data.id;

    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(cartRes.body.data.length).toBe(0);
  });

  it('returns 400 if cart is empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ shippingAddress: '123 Test Street' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('returns user order history', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });
});

describe('GET /api/orders/:id', () => {
  it('returns order detail with items', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBe(1);
  });

  it('returns 404 for order of another user', async () => {
    const other = await seedTestUser({ email: 'other@test.com' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: other.email, password: 'Password123!' });
    const otherToken = loginRes.body.data.accessToken;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
