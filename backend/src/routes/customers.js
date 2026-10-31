import { Router } from 'express';
import { all, put } from '../db.js';
import { requireAuth, requireRole, publicUser } from '../middleware/auth.js';
import { createUser } from './auth.js';
import { sendList } from './resources.js';
import { wrap } from '../utils/http.js';
import { schemas } from '../domain.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));
router.get('/', (req, res) => sendList(req, res, all('customers')));
router.post(
  '/',
  wrap(async (req, res) => {
    const data = schemas.customers.parse(req.body);
    const u = await createUser(req.body);
    res.status(201).json(put('customers', { ...data, id: u.id }));
  }),
);
export default router;
