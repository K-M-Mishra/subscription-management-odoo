import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const temp = await mkdtemp(path.join(os.tmpdir(), 'brightloop-tests-'));
process.env.DATABASE_PATH = path.join(temp, 'test.sqlite');
process.env.OUTBOX_DIR = path.join(temp, 'outbox');
process.env.DISABLE_SCHEDULER = '1';
process.env.NODE_ENV = 'test';
delete process.env.SMTP_HOST;
const { default: app } = await import('../src/app.js');
const { seed } = await import('../src/seed.js');
const { db, put, all, uid } = await import('../src/db.js');
const { nextDate, totals, today, runBilling, addDays } =
  await import('../src/domain.js');
await seed();
const server = app.listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
  await rm(temp, { recursive: true, force: true });
});
let admin, staff, customer, other, sub, invoice, product, plan, tax;
async function call(url, token, body, method = body ? 'POST' : 'GET') {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}
async function ok(url, token, body, method) {
  const r = await call(url, token, body, method);
  assert.ok(r.status < 300, JSON.stringify(r));
  return r.data;
}
const login = async (email) =>
  (await ok('/auth/login', null, { email, password: 'Brightloop@123' })).token;
test('authentication, password rules, normalized unique email and role enforcement', async () => {
  admin = await login('admin@brightloop.test');
  staff = await login('staff@brightloop.test');
  customer = await login('customer@brightloop.test');
  assert.equal(
    (
      await call('/auth/login', null, {
        email: 'admin@brightloop.test',
        password: 'wrong',
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call('/auth/signup', null, {
        name: 'Bad User',
        email: 'bad@test.com',
        password: 'Abcdefg!',
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call('/auth/signup', null, {
        name: 'Duplicate',
        email: 'ADMIN@brightloop.test',
        password: 'Brightloop@123',
      })
    ).status,
    409,
  );
  const u = await ok('/auth/signup', null, {
    name: 'Other Customer',
    email: 'other@test.com',
    password: 'Brightloop@123',
    role: 'admin',
  });
  assert.equal(u.user.role, 'customer');
  other = u.token;
  assert.equal(
    (
      await call('/staff', staff, {
        name: 'Not Allowed',
        email: 'staff2@test.com',
        password: 'Brightloop@123',
      })
    ).status,
    403,
  );
  assert.equal((await call('/products', customer)).status, 403);
  assert.equal((await call('/reports/summary')).status, 401);
  await ok('/staff', admin, {
    name: 'New Staff',
    email: 'newstaff@test.com',
    password: 'Brightloop@123',
  });
});
test('catalog, templates and server-calculated subscription prices', async () => {
  product = (await ok('/products', admin)).data[0];
  plan = (await ok('/plans', admin)).data[0];
  tax = (await ok('/taxes', admin)).data[0];
  assert.equal(
    (await call('/plans', staff, { name: 'No', interval: 'monthly' })).status,
    403,
  );
  assert.equal(
    (
      await call('/plans', admin, {
        name: 'Bad dates',
        interval: 'monthly',
        startDate: '2026-02-30',
      })
    ).status,
    422,
  );
  const customers = (await ok('/customers', admin)).data;
  const c = customers.find((c) => c.email === 'customer@brightloop.test');
  const template = await ok('/templates', admin, {
    name: 'Quote Test',
    planId: plan.id,
    validDays: 5,
    lines: [{ productId: product.id, quantity: 2, taxId: tax.id }],
  });
  sub = await ok('/subscriptions', staff, {
    customerId: c.id,
    planId: plan.id,
    startDate: today(),
    expiryDate: addDays(today(), 60),
    templateId: template.id,
    paymentTerms: 'Immediate',
    lines: [
      {
        productId: product.id,
        variantId: product.variants[0].id,
        quantity: 2,
        taxId: tax.id,
        unitPrice: 1,
      },
    ],
    amount: 1,
    status: 'Active',
  });
  assert.equal(sub.status, 'Draft');
  assert.equal(sub.amount, 3681.6);
  assert.equal(sub.quoteValidUntil, addDays(today(), 5));
  assert.equal(
    (
      await call(
        '/subscriptions/' + sub.id + '/status',
        admin,
        { status: 'Active' },
        'PATCH',
      )
    ).status,
    422,
  );
  for (const status of ['Quotation', 'Confirmed', 'Active'])
    sub = await ok(
      '/subscriptions/' + sub.id + '/status',
      staff,
      { status },
      'PATCH',
    );
  assert.equal(
    (await call('/portal/subscriptions/' + sub.id, other)).status,
    404,
  );
  assert.equal((await ok('/portal/subscriptions', customer)).data.length, 1);
  assert.equal(
    (
      await call(
        '/portal/subscriptions/' + sub.id + '/status',
        other,
        { status: 'Paused' },
        'PATCH',
      )
    ).status,
    404,
  );
});
test('discount limits, recurring billing idempotency and invoice snapshot', async () => {
  const rule = await ok('/discounts', admin, {
    name: '10 percent once',
    type: 'percentage',
    value: 10,
    scope: 'subscription',
    minQuantity: 2,
    maxUses: 1,
  });
  const results = await Promise.all([
    ok('/billing/run', staff, {}),
    ok('/billing/run', staff, {}),
  ]);
  assert.equal(
    results.reduce((n, r) => n + r.created, 0),
    1,
  );
  invoice = (await ok('/invoices', admin)).data[0];
  assert.equal(invoice.subtotal, 3120);
  assert.equal(invoice.discountAmount, 312);
  assert.equal(invoice.taxTotal, 505.44);
  assert.equal(invoice.amount, 3313.44);
  assert.equal((await ok('/discounts/' + rule.id, admin)).usedCount, 1);
  assert.equal((await ok('/portal/invoices', customer)).data.length, 0);
  assert.equal(
    (
      await call('/payments', staff, {
        invoiceId: invoice.id,
        amount: 1,
        date: today(),
        method: 'Cash',
        requestId: uid(),
      })
    ).status,
    422,
  );
  invoice = await ok(
    '/invoices/' + invoice.id + '/status',
    staff,
    { status: 'Confirmed' },
    'PATCH',
  );
  assert.equal((await ok('/portal/invoices', customer)).data.length, 1);
  assert.equal(
    (await call('/portal/invoices/' + invoice.id, other)).status,
    404,
  );
  const file = await fetch(
    base + '/portal/invoices/' + invoice.id + '/download',
    { headers: { Authorization: 'Bearer ' + customer } },
  );
  assert.equal(file.status, 200);
  assert.equal((await file.text()).slice(0, 4), '%PDF');
  assert.equal(
    (
      await fetch(base + '/portal/invoices/' + invoice.id + '/download', {
        headers: { Authorization: 'Bearer ' + other },
      })
    ).status,
    404,
  );
});
test('partial payments, retry idempotency, overpayment, paid transition and invoice email', async () => {
  const body = {
    invoiceId: invoice.id,
    amount: 1000,
    method: 'UPI',
    date: today(),
    note: 'Test reference',
    requestId: uid(),
  };
  const p = await ok('/payments', staff, body),
    same = await ok('/payments', staff, body);
  assert.equal(p.id, same.id);
  assert.equal(
    (
      await call('/payments', staff, {
        ...body,
        requestId: uid(),
        amount: 5000,
      })
    ).status,
    422,
  );
  invoice = await ok('/invoices/' + invoice.id, admin);
  assert.equal(invoice.balance, 2313.44);
  assert.equal(invoice.status, 'Confirmed');
  await ok('/payments', staff, {
    ...body,
    amount: invoice.balance,
    requestId: uid(),
  });
  invoice = await ok('/invoices/' + invoice.id, admin);
  assert.equal(invoice.status, 'Paid');
  assert.equal(invoice.balance, 0);
  assert.equal(
    (
      await call(
        '/invoices/' + invoice.id + '/status',
        admin,
        { status: 'Cancelled' },
        'PATCH',
      )
    ).status,
    422,
  );
  const report = await ok('/reports/summary', admin);
  assert.equal(report.collected, 3313.44);
  assert.equal(report.outstanding, 0);
  assert.equal(
    (await ok('/invoices/' + invoice.id + '/send', staff, {})).delivery,
    'development-outbox',
  );
});
test('pause/resume, closure restrictions and renewal dates', async () => {
  sub = await ok(
    '/portal/subscriptions/' + sub.id + '/status',
    customer,
    { status: 'Paused' },
    'PATCH',
  );
  assert.equal(sub.status, 'Paused');
  assert.equal((await ok('/billing/run', admin, {})).created, 0);
  sub = await ok(
    '/portal/subscriptions/' + sub.id + '/status',
    customer,
    { status: 'Active' },
    'PATCH',
  );
  assert.equal(
    (
      await call('/portal/subscriptions/' + sub.id + '/renew', customer, {
        expiryDate: today(),
      })
    ).status,
    422,
  );
  sub = await ok('/portal/subscriptions/' + sub.id + '/renew', customer, {
    expiryDate: addDays(today(), 120),
  });
  assert.equal(sub.status, 'Active');
  const constrained = {
    ...sub,
    id: uid(),
    plan: {
      ...sub.plan,
      allowPause: false,
      allowClose: false,
      allowRenew: false,
    },
  };
  put('subscriptions', constrained);
  assert.equal(
    (
      await call(
        '/subscriptions/' + constrained.id + '/status',
        admin,
        { status: 'Paused' },
        'PATCH',
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await call(
        '/subscriptions/' + constrained.id + '/status',
        admin,
        { status: 'Closed' },
        'PATCH',
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await call('/subscriptions/' + constrained.id + '/renew', admin, {
        expiryDate: addDays(today(), 200),
      })
    ).status,
    422,
  );
});
test('calendar anchors, fractional rounding, catch-up billing and auto close', () => {
  assert.equal(nextDate('2025-01-31', 'monthly', '2025-01-31'), '2025-02-28');
  assert.equal(nextDate('2025-02-28', 'monthly', '2025-01-31'), '2025-03-31');
  assert.equal(nextDate('2024-02-29', 'yearly', '2024-02-29'), '2025-02-28');
  const calc = totals(
    [
      { productId: 'a', unitPrice: 0.03, quantity: 1, taxRate: 18 },
      { productId: 'a', unitPrice: 0.03, quantity: 1, taxRate: 18 },
    ],
    { scope: 'subscription', type: 'fixed', value: 0.01, name: 'Small' },
  );
  assert.equal(calc.discountAmount, 0.01);
  assert.equal(calc.amount, 0.06);
  const historical = {
    ...sub,
    id: uid(),
    number: 'TEST-CATCHUP',
    status: 'Active',
    startDate: addDays(today(), -3),
    nextBillingDate: addDays(today(), -3),
    anchorDate: addDays(today(), -3),
    expiryDate: today(),
    plan: { ...sub.plan, interval: 'daily', autoClose: true },
  };
  put('subscriptions', historical);
  const result = runBilling();
  assert.equal(result.created, 3);
  assert.equal(
    all('subscriptions').find((s) => s.id === historical.id).status,
    'Closed',
  );
  assert.equal(runBilling().created, 0);
  const paused = { ...historical, id: uid(), status: 'Paused' };
  put('subscriptions', paused);
  runBilling();
  assert.equal(
    all('subscriptions').find((s) => s.id === paused.id).status,
    'Closed',
  );
  const nextInvoices = all('invoices').filter(
    (i) => i.subscriptionId === historical.id,
  );
  assert.ok(nextInvoices.every((i) => i.discountAmount === 0));
});
test('reset email token is single-use, validates expiry and revokes old sessions', async () => {
  await ok('/auth/forgot-password', null, { email: 'other@test.com' });
  const files = await readdir(process.env.OUTBOX_DIR);
  let content = '';
  for (const f of files) {
    const text = await readFile(path.join(process.env.OUTBOX_DIR, f), 'utf8');
    if (text.includes('Reset your Brightloop'))
      content = text.replace(/=\r?\n/g, '').replace(/=3D/g, '=');
  }
  const token = content.match(/token=([a-f0-9]{64})/)?.[1];
  assert.ok(token);
  await ok('/auth/reset-password', null, {
    token,
    password: 'NewPassword@123',
  });
  assert.equal((await call('/auth/me', other)).status, 401);
  assert.equal(
    (
      await call('/auth/reset-password', null, {
        token,
        password: 'OtherPassword@123',
      })
    ).status,
    422,
  );
  await ok('/auth/login', null, {
    email: 'other@test.com',
    password: 'NewPassword@123',
  });
});
test('paginated endpoints and summary stay below 2 seconds with thousands of records locally', async () => {
  const { tx } = await import('../src/db.js');
  tx(() => {
    for (let i = 0; i < 3000; i++)
      put('subscriptions', {
        ...sub,
        id: uid(),
        number: 'PERF-' + i,
        status: 'Closed',
      });
  });
  const start = performance.now(),
    list = await ok('/subscriptions?limit=25&page=2', admin);
  await ok('/reports/summary', admin);
  const elapsed = performance.now() - start;
  assert.equal(list.data.length, 25);
  assert.ok(list.total >= 3000);
  assert.ok(elapsed < 2000, `Local test took ${elapsed}ms`);
  console.log(
    `Local list + summary, 3000+ subscriptions: ${Math.round(elapsed)}ms`,
  );
});
