import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
export const backendDir = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(backendDir, '.env') });
const production = process.env.NODE_ENV === 'production';
if (
  production &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error(
    'Set JWT_SECRET to at least 32 random characters in production.',
  );
export const config = {
  production,
  port: Number(process.env.PORT || 4000),
  databasePath:
    process.env.DATABASE_PATH ||
    path.join(backendDir, 'data', 'brightloop.sqlite'),
  jwtSecret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
  jwtExpires: '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigin:
    process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
  outboxDir: process.env.OUTBOX_DIR || path.join(backendDir, 'outbox'),
};
