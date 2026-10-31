import { Router } from 'express';
import { all, put, tx } from '../db.js';
import { needed, fail, today } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../utils/http.js';
import { sendList } from './resources.js';
import { invoicePDF, sendMail } from '../mail.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));
router.get('/', (req, res) => sendList(req, res, all('invoices')));
router.get('/:id', (req, res) =>
  res.json({
    ...needed('invoices', req.params.id),
    payments: all('payments').filter((p) => p.invoiceId === req.params.id),
  }),
);
router.patch('/:id/status', (req, res) =>
  res.json(
    tx(() => {
      const inv = needed('invoices', req.params.id),
        status = req.body.status;
      if (status === 'Confirmed' && inv.status === 'Draft') {
        inv.status = inv.amount === 0 ? 'Paid' : status;
      } else if (
        status === 'Cancelled' &&
        ['Draft', 'Confirmed'].includes(inv.status) &&
        inv.paidAmount === 0
      )
        inv.status = status;
      else
        fail('Invalid invoice transition. Paid invoices cannot be cancelled.');
      return put('invoices', inv);
    }),
  ),
);
router.get(
  '/:id/download',
  wrap(async (req, res) => {
    const inv = needed('invoices', req.params.id);
    res
      .type('pdf')
      .attachment(`${inv.invoiceNumber}.pdf`)
      .send(await invoicePDF(inv));
  }),
);
router.post(
  '/:id/send',
  wrap(async (req, res) => {
    const inv = needed('invoices', req.params.id);
    if (!['Confirmed', 'Paid'].includes(inv.status))
      fail('Confirm the invoice before sending it.');
    const delivery = await sendMail({
      to: inv.customerEmail,
      subject: `Brightloop invoice ${inv.invoiceNumber}`,
      text: `Hello ${inv.customerName},\nPlease find your invoice attached. Total INR ${inv.amount.toFixed(2)}; remaining INR ${inv.balance.toFixed(2)}; due ${inv.dueDate}.`,
      attachments: [
        {
          filename: `${inv.invoiceNumber}.pdf`,
          content: await invoicePDF(inv),
        },
      ],
    });
    // Re-read so a concurrent payment is not overwritten while SMTP is in flight.
    put('invoices', { ...needed('invoices', inv.id), sentAt: today() });
    res.json(delivery);
  }),
);
export default router;
