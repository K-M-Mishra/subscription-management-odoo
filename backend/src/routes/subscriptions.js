import { Router } from 'express';
import { all } from '../db.js';
import { createSubscription, changeStatus, renew, needed } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendList } from './resources.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));
router.get('/', (req, res) => sendList(req, res, all('subscriptions')));
router.post('/', (req, res) =>
  res.status(201).json(createSubscription(req.body)),
);
router.get('/:id', (req, res) =>
  res.json({
    ...needed('subscriptions', req.params.id),
    invoices: all('invoices').filter((i) => i.subscriptionId === req.params.id),
  }),
);
router.patch('/:id/status', (req, res) =>
  res.json(changeStatus(req.params.id, req.body.status, req.user)),
);
router.post('/:id/renew', (req, res) =>
  res.json(renew(req.params.id, req.body.expiryDate, req.user)),
);
export default router;
