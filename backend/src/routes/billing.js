import { Router } from 'express';
import { runBilling } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));
router.post('/run', (req, res) => res.json(runBilling()));
export default router;
