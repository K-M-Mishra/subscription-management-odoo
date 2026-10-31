import { Router } from 'express';
import { all } from '../db.js';
import { today, cents, money, date, fail } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendList } from './resources.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));
function filtered(req, kind, dateKey) {
  const { startDate, endDate, customerId } = req.query;
  if (startDate) date.parse(startDate);
  if (endDate) date.parse(endDate);
  if (startDate && endDate && startDate > endDate)
    fail('Start date must precede end date.');
  return all(kind).filter(
    (r) =>
      (!customerId || r.customerId === customerId) &&
      (!startDate || r[dateKey] >= startDate) &&
      (!endDate || r[dateKey] <= endDate),
  );
}
router.get('/summary', (req, res) => {
  const subs = all('subscriptions').filter(
    (s) =>
      s.status === 'Active' &&
      (!s.expiryDate || s.expiryDate > today()) &&
      s.startDate <= today() &&
      (!req.query.customerId || s.customerId === req.query.customerId),
  );
  const invoices = filtered(req, 'invoices', 'issueDate'),
    payments = filtered(req, 'payments', 'date');
  const open = invoices.filter((i) => i.status === 'Confirmed');
  res.json({
    activeSubscriptions: subs.length,
    mrr: money(
      subs.reduce(
        (sum, s) =>
          sum +
          cents(s.subtotal) *
            { daily: 365 / 12, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }[
              s.plan.interval
            ],
        0,
      ),
    ),
    collected: money(payments.reduce((s, p) => s + cents(p.amount), 0)),
    outstanding: money(open.reduce((s, i) => s + cents(i.balance), 0)),
    overdue: money(
      open
        .filter((i) => i.dueDate < today())
        .reduce((s, i) => s + cents(i.balance), 0),
    ),
    invoiced: money(
      invoices
        .filter((i) => ['Confirmed', 'Paid'].includes(i.status))
        .reduce((s, i) => s + cents(i.amount), 0),
    ),
    paymentCount: payments.length,
  });
});
router.get('/revenue', (req, res) => {
  const groups = {};
  for (const p of filtered(req, 'payments', 'date')) {
    const key = p.date.slice(0, 7);
    groups[key] = (groups[key] || 0) + cents(p.amount);
  }
  res.json({
    data: Object.entries(groups)
      .sort()
      .map(([month, amount]) => ({ month, amount: money(amount) })),
  });
});
router.get('/overdue', (req, res) =>
  sendList(
    req,
    res,
    filtered(req, 'invoices', 'issueDate').filter(
      (i) => i.status === 'Confirmed' && i.balance > 0 && i.dueDate < today(),
    ),
  ),
);
export default router;
