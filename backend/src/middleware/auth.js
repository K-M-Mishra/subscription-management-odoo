import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';
import { HttpError } from './error.js';
export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
export const signToken = (u) =>
  jwt.sign({ sub: u.id, version: u.version }, config.jwtSecret, {
    expiresIn: config.jwtExpires,
  });
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new Error();
    const token = jwt.verify(header.slice(7), config.jwtSecret, {
      algorithms: ['HS256'],
    });
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(token.sub);
    if (!user || user.version !== token.version) throw new Error();
    req.user = publicUser(user);
    next();
  } catch {
    next(new HttpError(401, 'unauthorized', 'Log in to continue.'));
  }
}
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(
          new HttpError(
            403,
            'forbidden',
            'You do not have access to this action.',
          ),
        );
