import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { getProfile, updateProfile, changePassword } from '../services/profile.service';

const updateSchema = z.object({
  name: z.string().check(z.minLength(1)).optional(),
  email: z.email().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().check(z.minLength(1)),
  newPassword: z.string().check(z.minLength(8)),
});

function handleServiceError(err: unknown, res: Response, next: NextFunction) {
  const e = err as Error & { status?: number };
  if (e.status) { res.status(e.status).json({ error: e.message }); return; }
  next(err);
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ data: await getProfile(req.user!.userId) });
  } catch (err) { handleServiceError(err, res, next); }
}

export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    res.json({ data: await updateProfile(req.user!.userId, parsed.data) });
  } catch (err) { handleServiceError(err, res, next); }
}

export async function changeMyPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    await changePassword(req.user!.userId, parsed.data.currentPassword, parsed.data.newPassword);
    res.json({ data: { message: 'Password updated' } });
  } catch (err) { handleServiceError(err, res, next); }
}
