import { prisma } from '../prisma/client';
import { parsePaginationQuery, buildPaginationMeta } from '../lib/pagination';

export async function createOrder(userId: string, shippingAddress: string) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  if (cartItems.length === 0) throw Object.assign(new Error('Cart is empty'), { status: 400 });

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity, 0
  );

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        total,
        shippingAddress,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: true },
    });
    await tx.cartItem.deleteMany({ where: { userId } });
    return newOrder;
  });

  return order;
}

export async function getUserOrders(userId: string, query: Record<string, string | string[] | undefined>) {
  const { page, limit, skip } = parsePaginationQuery(query);
  const where = { userId };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

export async function getUserOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  return order;
}
