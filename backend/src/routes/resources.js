import { Router } from 'express';
import { all, put, uid } from '../db.js';
import { needed, validateResource, fail } from '../domain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { pageParams, listResponse, wrap } from '../utils/http.js';
export function sendList(req, res, rows) {
  const { q = '', status, customerId } = req.query;
  rows = rows.filter(
    (r) =>
      (!q ||
        JSON.stringify(r).toLowerCase().includes(String(q).toLowerCase())) &&
      (!status || r.status === status) &&
      (!customerId || r.customerId === customerId),
  );
  const page = pageParams(req.query);
  res.json(
    listResponse(
      rows.slice(page.offset, page.offset + page.limit),
      rows.length,
      page,
    ),
  );
}
export function resourceRouter(kind) {
  const router = Router();
  router.use(requireAuth, requireRole('admin', 'staff'));
  router.get('/', (req, res) => sendList(req, res, all(kind)));
  router.get('/:id', (req, res) => res.json(needed(kind, req.params.id)));
  const write = (req, res) => {
    const data = validateResource(kind, req.body),
      old = req.params.id ? needed(kind, req.params.id) : null;
    if (
      kind === 'customers' &&
      all(kind).some((c) => c.email === data.email && c.id !== old?.id)
    )
      fail('This customer email already exists.', 409);
    if (kind === 'products')
      data.variants = data.variants.map((v) => ({
        ...v,
        id: old?.variants.find((p) => p.name === v.name)?.id || uid(),
      }));
    res
      .status(old ? 200 : 201)
      .json(put(kind, { ...old, ...data, usedCount: old?.usedCount || 0 }));
  };
  router.post('/', requireRole('admin'), write);
  router.put('/:id', requireRole('admin'), write);
  return router;
}
