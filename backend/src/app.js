import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { config, backendDir } from './config.js';
import { db } from './db.js';
import routes from './routes/index.js';
import { errorHandler, HttpError } from './middleware/error.js';
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/v1/health', (req, res) =>
  res.json({
    ok: true,
    db: Boolean(db.prepare('SELECT 1 AS ok').get().ok),
    emailMode: process.env.SMTP_HOST ? 'smtp' : 'development-outbox',
  }),
);
app.use('/api/v1', routes);
app.use('/api', (req, res, next) =>
  next(new HttpError(404, 'not_found', 'API endpoint not found.')),
);
const dist = path.resolve(backendDir, '../brightloop-frontend/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use((req, res, next) =>
  next(new HttpError(404, 'not_found', 'Page not found.')),
);
app.use(errorHandler);
export default app;
