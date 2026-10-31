import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from './error.js'
export const signToken = u => jwt.sign({ sub: u.id, role: u.role, email: u.email }, config.jwtSecret, { expiresIn: config.jwtExpires })
// Login zaroori: req.user = { sub, role, email }
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return next(new HttpError(401, 'unauthorized', 'Log in to continue.'))
  try { req.user = jwt.verify(h.slice(7), config.jwtSecret); next() }
  catch { next(new HttpError(401, 'invalid_token', 'Your session expired. Log in again.')) }
}
// Role check: router.post('/', requireAuth, requireRole('admin'), handler)
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'forbidden', 'You do not have access to this.'))
