/**
 * DEMIPOS Central Application Server Entry Point
 * Mounts Express API routes and integrates Vite dev server middleware.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './server/routes/authRoutes';
import { terminalRouter } from './server/routes/terminalRoutes';
import { hospitalityRouter } from './server/routes/hospitalityRoutes';
import { orderRouter } from './server/routes/orderRoutes';
import { kotRouter } from './server/routes/kotRoutes';
import { paymentRouter } from './server/routes/paymentRoutes';
import { shiftRouter } from './server/routes/shiftRoutes';
import { syncRouter } from './server/routes/syncRoutes';
import { auditRouter } from './server/routes/auditRoutes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json());

  // Mount API v1 Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/terminals', terminalRouter);
  app.use('/api/v1/hospitality', hospitalityRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/kot', kotRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1/shifts', shiftRouter);
  app.use('/api/v1/sync', syncRouter);
  app.use('/api/v1/audit-logs', auditRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'DEMIPOS Commercial Server',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  if (!isProd) {
    // Mount Vite Dev Server middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build in production
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DEMIPOS] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[DEMIPOS] Fatal error starting server:', err);
  process.exit(1);
});
