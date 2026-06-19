import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../services/cart.service';

const addSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) });
const updateSchema = z.object({ quantity: z.number().int().min(1) });

function handleServiceError(err: unknown, res: Response, next: NextFunction) {
  const e = err as Error & { status?: number };
  if (e.status) { res.status(e.status).json({ error: e.message }); return; }
  next(err);
}

export async function listCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ data: await getCart(req.user!.userId) });
  } catch (err) { next(err); }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    const item = await addToCart(req.user!.userId, parsed.data.productId, parsed.data.quantity);
    res.status(201).json({ data: item });
  } catch (err) { handleServiceError(err, res, next); }
}

export async function updateItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    const item = await updateCartItem(req.user!.userId, req.params.id as string, parsed.data.quantity);
    res.json({ data: item });
  } catch (err) { handleServiceError(err, res, next); }
}

export async function deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await removeFromCart(req.user!.userId, req.params.id as string);
    res.json({ data: { message: 'Item removed' } });
  } catch (err) { handleServiceError(err, res, next); }
}
