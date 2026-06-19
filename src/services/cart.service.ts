import { prisma } from '../prisma/client';

export async function getCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
  });
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null, isActive: true } });
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  if (product.stock < quantity) throw Object.assign(new Error('Insufficient stock'), { status: 400 });

  const existing = await prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    return prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  }
  return prisma.cartItem.create({ data: { userId, productId, quantity } });
}

export async function updateCartItem(userId: string, cartItemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!item) throw Object.assign(new Error('Cart item not found'), { status: 404 });
  if (quantity < 1) throw Object.assign(new Error('Quantity must be at least 1'), { status: 400 });
  return prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
}

export async function removeFromCart(userId: string, cartItemId: string) {
  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!item) throw Object.assign(new Error('Cart item not found'), { status: 404 });
  await prisma.cartItem.delete({ where: { id: cartItemId } });
}
