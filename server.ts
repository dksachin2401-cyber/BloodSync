import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3001;

  const distPath = path.resolve(__dirname, 'dist');
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath, { index: 'index.html' }));
    app.get('/', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BloodSync] Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BloodSync] Failed to start server:', err);
});

export default app;
