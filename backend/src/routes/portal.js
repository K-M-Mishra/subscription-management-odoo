import { Router } from 'express';
import { all } from '../db.js';
import { needed, fail, changeStatus, renew } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendList } from './resources.js';
import { wrap } from '../utils/http.js';
import { invoicePDF } from '../mail.js';
const router = Router();
router.use(requireAuth, requireRole('customer'));
function owned(kind, id, user) {
  const item = needed(kind, id);
  if (item.customerId !== user.id) fail('Record not found', 404);
  return item;
}
router.get('/subscriptions', (req, res) =>
  sendList(req, res, all('subscriptions', req.user.id)),
);
router.get('/subscriptions/:id', (req, res) =>
  res.json({
    ...owned('subscriptions', req.params.id, req.user),
    invoices: all('invoices', req.user.id).filter(
      (i) => i.subscriptionId === req.params.id && i.status !== 'Draft',
    ),
  }),
);
router.patch('/subscriptions/:id/status', (req, res) =>
  res.json(changeStatus(req.params.id, req.body.status, req.user)),
);
router.post('/subscriptions/:id/renew', (req, res) =>
  res.json(renew(req.params.id, req.body.expiryDate, req.user)),
);
router.get('/invoices', (req, res) =>
  sendList(
    req,
    res,
    all('invoices', req.user.id).filter((i) => i.status !== 'Draft'),
  ),
);
router.get('/invoices/:id', (req, res) => {
  const inv = owned('invoices', req.params.id, req.user);
  if (inv.status === 'Draft') fail('Invoice not published', 404);
  res.json(inv);
});
router.get(
  '/invoices/:id/download',
  wrap(async (req, res) => {
    const inv = owned('invoices', req.params.id, req.user);
    if (inv.status === 'Draft') fail('Invoice not published', 404);
    res
      .type('pdf')
      .attachment(`${inv.invoiceNumber}.pdf`)
      .send(await invoicePDF(inv));
  }),
);
export default router;
