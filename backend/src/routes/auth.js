import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { db, uid, tx, put } from '../db.js';
import { config } from '../config.js';
import { fail } from '../domain.js';
import { signToken, publicUser, requireAuth } from '../middleware/auth.js';
import { wrap } from '../utils/http.js';
import { sendMail } from '../mail.js';
export const passwordSchema = z
  .string()
  .min(9, 'Use more than 8 characters.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[^A-Za-z0-9\s]/, 'Add a special character.')
  .refine((s) => Buffer.byteLength(s) <= 72, 'Use at most 72 UTF-8 bytes.');
const account = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((s) => s.toLowerCase()),
  password: passwordSchema,
});
export async function createUser(input, role = 'customer') {
  const data = account.parse(input),
    hash = await bcrypt.hash(data.password, 10);
  return tx(() => {
    if (db.prepare('SELECT id FROM users WHERE email=?').get(data.email))
      fail('This email is already registered.', 409);
    const u = {
      id: uid(),
      name: data.name,
      email: data.email,
      password: hash,
      role,
      version: 0,
    };
    db.prepare(
      'INSERT INTO users(id,name,email,password,role) VALUES(?,?,?,?,?)',
    ).run(u.id, u.name, u.email, u.password, u.role);
    if (role === 'customer') {
      put('customers', {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: '',
        address: '',
      });
    }
    return u;
  });
}
const router = Router(),
  attempts = new Map();
router.use((req, res, next) => {
  const key = req.ip,
    now = Date.now(),
    old = attempts.get(key);
  const value = old && old.until > now ? old : { count: 0, until: now + 60000 };
  value.count++;
  attempts.set(key, value);
  if (attempts.size > 10000)
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  if (value.count > 40)
    return res
      .status(429)
      .json({
        error: { message: 'Too many attempts. Try again in a minute.' },
      });
  next();
});
router.post(
  '/signup',
  wrap(async (req, res) => {
    const u = await createUser(req.body);
    res.status(201).json({ token: signToken(u), user: publicUser(u) });
  }),
);
router.post(
  '/login',
  wrap(async (req, res) => {
    const data = z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(1).max(200),
      })
      .parse(req.body);
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(data.email);
    if (!u || !(await bcrypt.compare(data.password, u.password)))
      fail('Email or password is incorrect.', 401);
    res.json({ token: signToken(u), user: publicUser(u) });
  }),
);
router.get('/me', requireAuth, (req, res) => res.json(req.user));
router.post(
  '/forgot-password',
  wrap(async (req, res) => {
    const email = z.string().trim().email().parse(req.body.email),
      u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (u) {
      const token = randomBytes(32).toString('hex'),
        hash = createHash('sha256').update(token).digest('hex');
      db.prepare('DELETE FROM resets WHERE user_id=? OR expires<?').run(
        u.id,
        Date.now(),
      );
      db.prepare('INSERT INTO resets(hash,user_id,expires) VALUES(?,?,?)').run(
        hash,
        u.id,
        Date.now() + 30 * 60000,
      );
      try {
        await sendMail({
          to: u.email,
          subject: 'Reset your Brightloop password',
          text: `Reset your password within 30 minutes:\n${config.frontendUrl.replace(/\/$/, '')}/#/reset-password?token=${token}\nIf you did not request this, ignore this email.`,
        });
      } catch (error) {
        db.prepare('DELETE FROM resets WHERE hash=?').run(hash);
        console.error('Password reset delivery failed:', error.message);
      }
    }
    res.json({
      message:
        'If this email is registered, a reset link has been sent. In local development, check backend/outbox.',
    });
  }),
);
router.post(
  '/reset-password',
  wrap(async (req, res) => {
    const password = passwordSchema.parse(req.body.password),
      token = z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(req.body.token),
      hash = createHash('sha256').update(token).digest('hex');
    const encrypted = await bcrypt.hash(password, 10);
    tx(() => {
      const reset = db.prepare('SELECT * FROM resets WHERE hash=?').get(hash);
      if (!reset || reset.expires < Date.now())
        fail('Reset link is invalid or expired.');
      db.prepare(
        'UPDATE users SET password=?,version=version+1 WHERE id=?',
      ).run(encrypted, reset.user_id);
      db.prepare('DELETE FROM resets WHERE user_id=?').run(reset.user_id);
    });
    res.json({ message: 'Password updated. Log in with your new password.' });
  }),
);
export default router;
