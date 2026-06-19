import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import {
  getStats,
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminListOrders,
  adminUpdateOrder,
} from '../services/admin.service';

function handleServiceError(err: unknown, res: Response, next: NextFunction) {
  const e = err as Error & { status?: number };
  if (e.status) {
    res.status(e.status).json({ error: e.message });
    return;
  }
  next(err);
}

export async function stats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ data: await getStats() });
  } catch (err) {
    next(err);
  }
}

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.uuid(),
  imageUrl: z.url().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.url().optional(),
  isActive: z.boolean().optional(),
});

export async function listProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { products, meta } = await adminListProducts(req.query as Record<string, string>);
    res.json({ data: products, meta });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const product = await adminCreateProduct(parsed.data);
    res.status(201).json({ data: product });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const product = await adminUpdateProduct(req.params.id as string, parsed.data);
    res.json({ data: product });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminDeleteProduct(req.params.id as string);
    res.json({ data: { message: 'Product deleted' } });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { users, meta } = await adminListUsers(req.query as Record<string, string>);
    res.json({ data: users, meta });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await adminUpdateUser(req.params.id as string, req.body);
    res.json({ data: user });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminDeleteUser(req.params.id as string);
    res.json({ data: { message: 'User deleted' } });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function listOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orders, meta } = await adminListOrders(req.query as Record<string, string>);
    res.json({ data: orders, meta });
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status required' });
      return;
    }
    const order = await adminUpdateOrder(req.params.id as string, status);
    res.json({ data: order });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}
