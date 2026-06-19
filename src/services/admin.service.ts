import type { Role } from '@prisma/client';
import { prisma } from '../prisma/client';
import { parsePaginationQuery, buildPaginationMeta } from '../lib/pagination';

export async function getStats() {
  const [totalUsers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
  ]);
  return { totalUsers, totalProducts, totalOrders, totalRevenue: revenueAgg._sum.total || 0 };
}

// Products
export async function adminListProducts(query: Record<string, string | string[] | undefined>) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const search = String(query.search || '');
  const categoryId = String(query.categoryId || '');
  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, include: { category: true }, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);
  return { products, meta: buildPaginationMeta(total, page, limit) };
}

export async function adminCreateProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
}) {
  return prisma.product.create({ data, include: { category: true } });
}

export async function adminUpdateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    imageUrl: string;
    isActive: boolean;
  }>
) {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Product not found'), { status: 404 });
  return prisma.product.update({ where: { id }, data, include: { category: true } });
}

export async function adminDeleteProduct(id: string) {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Product not found'), { status: 404 });
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
}

// Users
export async function adminListUsers(query: Record<string, string | string[] | undefined>) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const search = String(query.search || '');
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, name: true, email: true, role: true, isActive: true, deletedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: buildPaginationMeta(total, page, limit) };
}

export async function adminUpdateUser(id: string, data: Partial<{ isActive: boolean; role: Role }>) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}

export async function adminDeleteUser(id: string) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('User not found'), { status: 404 });
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}

// Orders
export async function adminListOrders(query: Record<string, string | string[] | undefined>) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const status = String(query.status || '');
  const where = status ? { status: status as import('@prisma/client').OrderStatus } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

export async function adminUpdateOrder(id: string, status: string) {
  const exists = await prisma.order.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Order not found'), { status: 404 });
  return prisma.order.update({
    where: { id },
    data: { status: status as import('@prisma/client').OrderStatus },
    include: { items: true },
  });
}
