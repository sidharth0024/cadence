// server.ts - Cadence Full-Stack Entry Point
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db_conn.js';
import { initializeSupabasePersistence } from './server/config/supabaseClient';
import { store } from './server/store/cadenceStore';
import apiRouter from './server/routes/apiRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize CadenceDB & 24/7 Supabase Cloud Persistence
  await connectDB();
  const supabaseReady = await initializeSupabasePersistence();
  if (supabaseReady) {
    await store.loadFromSupabase();
  }

  // Core Middlewares
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Cadence Engine',
      timestamp: new Date().toISOString(),
      mode: 'production-ready',
    });
  });

  // Mount Cadence API Router FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cadence Server] Online and running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Cadence Server] Startup error:', err);
});
