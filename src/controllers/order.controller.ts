import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createOrder, getUserOrders, getUserOrderById } from '../services/order.service';

const checkoutSchema = z.object({ shippingAddress: z.string().min(5) });

function handleServiceError(err: unknown, res: Response, next: NextFunction) {
  const e = err as Error & { status?: number };
  if (e.status) { res.status(e.status).json({ error: e.message }); return; }
  next(err);
}

export async function checkout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    const order = await createOrder(req.user!.userId, parsed.data.shippingAddress);
    res.status(201).json({ data: order });
  } catch (err) { handleServiceError(err, res, next); }
}

export async function listOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orders, meta } = await getUserOrders(req.user!.userId, req.query as Record<string, string>);
    res.json({ data: orders, meta });
  } catch (err) { next(err); }
}

export async function getOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await getUserOrderById(req.user!.userId, req.params.id as string);
    res.json({ data: order });
  } catch (err) { handleServiceError(err, res, next); }
}
