import express from 'express';
import cors from 'cors';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  // Routes will be added here in later tasks

  return app;
}
