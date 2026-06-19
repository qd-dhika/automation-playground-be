import { Request, Response, NextFunction } from 'express';
import { getCategories, getProducts, getProductById } from '../services/product.service';

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getCategories();
    res.json({ data });
  } catch (err) { next(err); }
}

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { products, meta } = await getProducts(req.query as Record<string, string>);
    res.json({ data: products, meta });
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getProductById(String(req.params.id));
    res.json({ data });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    if (e.status) { res.status(e.status).json({ error: e.message }); return; }
    next(err);
  }
}
