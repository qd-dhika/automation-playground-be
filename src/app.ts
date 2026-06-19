import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import profileRoutes from './routes/profile.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? [env.FRONTEND_URL]
      : [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(errorHandler);
  return app;
}
