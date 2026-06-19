import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use test DB
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL!;

export const prisma = new PrismaClient();

export async function cleanDb() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestCategory(name = 'Test Category') {
  return prisma.category.create({ data: { name } });
}

export async function seedTestProduct(categoryId: string, overrides: Record<string, unknown> = {}) {
  return prisma.product.create({
    data: {
      name: 'Test Product',
      description: 'A test product',
      price: 29.99,
      stock: 100,
      categoryId,
      ...overrides,
    },
  });
}

export async function seedTestUser(overrides: Record<string, unknown> = {}) {
  const password = await bcrypt.hash('Password123!', 12);
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password,
      role: Role.user,
      ...overrides,
    },
  });
}

export async function seedTestAdmin() {
  const password = await bcrypt.hash('Admin123!', 12);
  return prisma.user.create({
    data: {
      name: 'Test Admin',
      email: `admin-${Date.now()}@example.com`,
      password,
      role: Role.admin,
    },
  });
}
