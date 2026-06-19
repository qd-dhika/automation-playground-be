import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  name: z.string().check(z.minLength(1)),
  email: z.email(),
  password: z.string().check(z.minLength(8)),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().check(z.minLength(1)),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { name, email, password } = parsed.data;
    const user = await registerUser(name, email, password);
    res.status(201).json({ data: user });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    if (e.status) { res.status(e.status).json({ error: e.message }); return; }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { email, password } = parsed.data;
    const result = await loginUser(email, password);
    res.json({ data: result });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    if (e.status) { res.status(e.status).json({ error: e.message }); return; }
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'refreshToken required' }); return; }
    const result = await refreshAccessToken(refreshToken);
    res.json({ data: result });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    if (e.status) { res.status(e.status).json({ error: e.message }); return; }
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    await logoutUser(req.user!.userId, refreshToken || '');
    res.json({ data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}
