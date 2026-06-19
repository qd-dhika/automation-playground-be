import { prisma } from '../prisma/client';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { Role } from '@prisma/client';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function registerUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: Role.user },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null, isActive: true },
  });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await comparePassword(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function refreshAccessToken(token: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired or not found'), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

  const accessToken = signAccessToken(user.id, user.role);
  return { accessToken };
}

export async function logoutUser(userId: string, refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
}
