import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
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

  app.use(errorHandler);
  return app;
}
