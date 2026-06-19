import { prisma } from '../prisma/client';
import { comparePassword, hashPassword } from '../lib/password';

const userSelect = { id: true, name: true, email: true, role: true, createdAt: true };

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

export async function updateProfile(userId: string, data: { name?: string; email?: string }) {
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } });
    if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });
  }
  return prisma.user.update({ where: { id: userId }, data, select: userSelect });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 401 });
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
