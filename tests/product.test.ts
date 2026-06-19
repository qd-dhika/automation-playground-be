import request from 'supertest';
import { createTestApp } from './helpers/app';
import { cleanDb, prisma, seedTestCategory, seedTestProduct } from './helpers/db';

const app = createTestApp();

beforeAll(async () => {
  await cleanDb();
  const cat1 = await seedTestCategory('Electronics');
  const cat2 = await seedTestCategory('Books');
  await seedTestProduct(cat1.id, { name: 'Laptop', price: 999.99 });
  await seedTestProduct(cat1.id, { name: 'Phone', price: 499.99 });
  await seedTestProduct(cat2.id, { name: 'TypeScript Book', price: 39.99 });
});

afterAll(async () => { await prisma.$disconnect(); });

describe('GET /api/categories', () => {
  it('returns all categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });
});

describe('GET /api/products', () => {
  it('returns paginated product list', async () => {
    const res = await request(app).get('/api/products?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3 });
  });

  it('filters by search term', async () => {
    const res = await request(app).get('/api/products?search=laptop');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Laptop');
  });

  it('sorts by price ascending', async () => {
    const res = await request(app).get('/api/products?sort=price_asc');
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p: { price: string }) => parseFloat(p.price));
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
  });
});

describe('GET /api/products/:id', () => {
  let productId: string;

  beforeAll(async () => {
    const products = await request(app).get('/api/products');
    productId = products.body.data[0].id;
  });

  it('returns product with category', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(productId);
    expect(res.body.data.category).toBeDefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
