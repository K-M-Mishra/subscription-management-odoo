import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, publicUser } from '../middleware/auth.js';
import { createUser } from './auth.js';
import { sendList } from './resources.js';
import { wrap } from '../utils/http.js';
const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', (req, res) =>
  sendList(
    req,
    res,
    db
      .prepare(
        "SELECT id,name,email,role FROM users WHERE role IN ('admin','staff')",
      )
      .all(),
  ),
);
router.post(
  '/',
  wrap(async (req, res) =>
    res.status(201).json(publicUser(await createUser(req.body, 'staff'))),
  ),
);
export default router;
