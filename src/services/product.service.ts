import { prisma } from '../prisma/client';
import { parsePaginationQuery, buildPaginationMeta } from '../lib/pagination';

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getProducts(query: Record<string, string | string[] | undefined>) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const search = String(query.search || '');
  const categoryId = String(query.categoryId || '');
  const sort = String(query.sort || 'newest');

  const where = {
    deletedAt: null,
    isActive: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' as const }
    : sort === 'price_desc' ? { price: 'desc' as const }
    : { createdAt: 'desc' as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limit, include: { category: true } }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: buildPaginationMeta(total, page, limit) };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, isActive: true },
    include: { category: true },
  });
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  return product;
}
