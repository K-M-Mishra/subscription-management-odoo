import { z } from 'zod';
import { db, all, get, put, tx, number } from './db.js';
import { HttpError } from './middleware/error.js';
export const fail = (message, status = 422) => {
  throw new HttpError(status, 'invalid_request', message);
};
export const today = () => new Date().toISOString().slice(0, 10);
export const cents = (value) => Math.round(Number(value) * 100);
export const money = (value) => Math.round(value) / 100;
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    'Enter a valid date',
  );
const optionalDate = z
  .union([date, z.literal('')])
  .optional()
  .default('');
const text = z.string().trim().min(1).max(200);
const amount = z.coerce.number().finite().min(0).max(10000000);
export const schemas = {
  products: z.object({
    name: text,
    type: z.enum(['Service', 'Goods', 'Software']).default('Software'),
    salesPrice: amount,
    costPrice: amount.default(0),
    notes: z.string().max(2000).default(''),
    variants: z
      .array(z.object({ name: text, extraPrice: amount }))
      .max(30)
      .default([]),
  }),
  plans: z.object({
    name: text,
    price: amount.default(0),
    interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    minQuantity: z.coerce.number().int().min(1).max(100000).default(1),
    startDate: optionalDate,
    endDate: optionalDate,
    autoClose: z.boolean().default(true),
    allowClose: z.boolean().default(true),
    allowPause: z.boolean().default(true),
    allowRenew: z.boolean().default(true),
  }),
  taxes: z.object({
    name: text,
    rate: z.coerce.number().finite().min(0).max(100),
  }),
  discounts: z.object({
    name: text,
    type: z.enum(['fixed', 'percentage']),
    value: amount,
    minPurchase: amount.default(0),
    minQuantity: z.coerce.number().int().min(0).default(0),
    startDate: optionalDate,
    endDate: optionalDate,
    maxUses: z.coerce.number().int().min(0).default(0),
    scope: z.enum(['subscription', 'product']),
    productId: z.string().default(''),
    subscriptionId: z.string().default(''),
  }),
  templates: z.object({
    name: text,
    planId: text,
    validDays: z.coerce.number().int().min(1).max(365).default(30),
    lines: z
      .array(
        z.object({
          productId: text,
          variantId: z.string().default(''),
          quantity: z.coerce.number().int().min(1).max(100000),
          taxId: z.string().default(''),
        }),
      )
      .min(1)
      .max(100),
  }),
  customers: z.object({
    name: text,
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    phone: z.string().max(40).default(''),
    address: z.string().max(500).default(''),
  }),
};
export function needed(kind, id) {
  return get(kind, id) || fail(`${kind} record not found`, 404);
}
export function validateResource(kind, input) {
  const value = schemas[kind].parse(input);
  if (value.startDate && value.endDate && value.endDate < value.startDate)
    fail('End date must be on or after start date.');
  if (kind === 'discounts') {
    if (value.type === 'percentage' && value.value > 100)
      fail('Percentage cannot exceed 100.');
    if (value.scope === 'product') needed('products', value.productId);
    if (value.subscriptionId) needed('subscriptions', value.subscriptionId);
  }
  if (kind === 'templates') {
    needed('plans', value.planId);
    buildLines(value.lines, 0);
  }
  return value;
}
export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function nextDate(iso, interval, anchor = iso) {
  if (interval === 'daily') return addDays(iso, 1);
  if (interval === 'weekly') return addDays(iso, 7);
  const d = new Date(`${iso}T00:00:00Z`),
    a = new Date(`${anchor}T00:00:00Z`);
  const year = d.getUTCFullYear() + (interval === 'yearly' ? 1 : 0),
    month = interval === 'yearly' ? a.getUTCMonth() : d.getUTCMonth() + 1;
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(
        a.getUTCDate(),
        new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
      ),
    ),
  )
    .toISOString()
    .slice(0, 10);
}
export function buildLines(lines, planPrice) {
  const input = schemas.templates.shape.lines.parse(lines);
  const result = input.map((line) => {
    const product = needed('products', line.productId),
      variant = line.variantId
        ? product.variants.find((v) => v.id === line.variantId)
        : null;
    if (line.variantId && !variant)
      fail('Selected variant does not belong to this product.');
    const tax = line.taxId ? needed('taxes', line.taxId) : null;
    return {
      productId: product.id,
      productName: product.name,
      variantId: variant?.id || '',
      variantName: variant?.name || '',
      quantity: line.quantity,
      unitPrice: money(
        cents(product.salesPrice) + cents(variant?.extraPrice || 0),
      ),
      taxId: tax?.id || '',
      taxRate: tax?.rate || 0,
    };
  });
  if (planPrice > 0)
    result.unshift({
      productId: '',
      productName: 'Plan fee',
      quantity: 1,
      unitPrice: planPrice,
      taxId: '',
      taxRate: 0,
    });
  return totals(result);
}
export function totals(lines, rule = null) {
  const base = lines.map((l) => ({
    ...l,
    baseCents: cents(l.unitPrice) * l.quantity,
  }));
  if (!Number.isSafeInteger(base.reduce((n, l) => n + l.baseCents, 0)))
    fail('Order amount exceeds the supported limit.');
  const eligible = base.filter(
    (l) =>
      !rule || rule.scope === 'subscription' || l.productId === rule.productId,
  );
  const eligibleTotal = eligible.reduce((s, l) => s + l.baseCents, 0);
  let remaining = rule
    ? Math.min(
        eligibleTotal,
        rule.type === 'percentage'
          ? Math.round((eligibleTotal * rule.value) / 100)
          : cents(rule.value),
      )
    : 0;
  const discountCents = remaining;
  let remainingBase = eligibleTotal;
  const output = base.map((l) => {
    let cut = 0;
    if (eligible.includes(l) && remainingBase) {
      cut = Math.min(
        l.baseCents,
        Math.round((remaining * l.baseCents) / remainingBase),
      );
      remaining -= cut;
      remainingBase -= l.baseCents;
    }
    const taxCents = Math.round(((l.baseCents - cut) * l.taxRate) / 100);
    const { baseCents, ...line } = l;
    return {
      ...line,
      subtotal: money(baseCents),
      discount: money(cut),
      taxAmount: money(taxCents),
      totalAmount: money(baseCents - cut + taxCents),
    };
  });
  return {
    lines: output,
    subtotal: money(base.reduce((s, l) => s + l.baseCents, 0)),
    discountAmount: money(discountCents),
    taxTotal: money(output.reduce((s, l) => s + cents(l.taxAmount), 0)),
    amount: money(output.reduce((s, l) => s + cents(l.totalAmount), 0)),
    discountName: rule?.name || '',
  };
}
export function createSubscription(input) {
  const data = z
    .object({
      customerId: text,
      planId: text,
      startDate: date,
      expiryDate: optionalDate,
      paymentTerms: z.enum(['Immediate', 'Net 15', 'Net 30']).default('Net 30'),
      templateId: z.string().default(''),
      lines: schemas.templates.shape.lines,
    })
    .parse(input);
  const customer = needed('customers', data.customerId),
    plan = needed('plans', data.planId);
  if (data.expiryDate && data.expiryDate <= data.startDate)
    fail('Expiry date must be after start date.');
  if (
    (plan.startDate && data.startDate < plan.startDate) ||
    (plan.endDate && data.startDate > plan.endDate)
  )
    fail('Plan is unavailable on this start date.');
  if (data.lines.reduce((n, l) => n + l.quantity, 0) < plan.minQuantity)
    fail(`Plan requires at least ${plan.minQuantity} product units.`);
  const template = data.templateId
    ? needed('templates', data.templateId)
    : null;
  const pricing = buildLines(data.lines, plan.price);
  return tx(() =>
    put('subscriptions', {
      ...data,
      ...pricing,
      id: undefined,
      number: number('SUB'),
      status: 'Draft',
      customerName: customer.name,
      customerEmail: customer.email,
      customerAddress: customer.address,
      planName: plan.name,
      plan: { ...plan },
      nextBillingDate: data.startDate,
      anchorDate: data.startDate,
      quoteValidUntil: template ? addDays(today(), template.validDays) : '',
      createdAt: today(),
    }),
  );
}
export function changeStatus(id, status, user) {
  return tx(() => {
    const sub = needed('subscriptions', id),
      plan = sub.plan;
    if (user?.role === 'customer' && sub.customerId !== user.id)
      fail('Subscription not found', 404);
    if (
      user?.role === 'customer' &&
      !['Paused', 'Active', 'Closed'].includes(status)
    )
      fail('Action not allowed', 403);
    const transitions = {
      Draft: ['Quotation'],
      Quotation: ['Confirmed'],
      Confirmed: ['Active'],
      Active: ['Paused', 'Closed'],
      Paused: ['Active', 'Closed'],
      Closed: [],
    };
    if (!transitions[sub.status]?.includes(status))
      fail(`Cannot move from ${sub.status} to ${status}.`);
    if (
      status === 'Confirmed' &&
      sub.quoteValidUntil &&
      sub.quoteValidUntil < today()
    )
      fail('This quotation has expired. Create a new quotation.');
    if (status === 'Paused' && !plan.allowPause)
      fail('This plan cannot be paused.');
    if (
      status === 'Closed' &&
      !plan.allowClose &&
      (!sub.expiryDate || sub.expiryDate > today())
    )
      fail('This plan does not allow early closure.');
    if (sub.status === 'Paused' && status === 'Active') {
      if (sub.expiryDate && sub.expiryDate <= today())
        fail('Renew this subscription before resuming.');
      while (sub.nextBillingDate < today())
        sub.nextBillingDate = nextDate(
          sub.nextBillingDate,
          plan.interval,
          sub.anchorDate,
        );
    }
    return put('subscriptions', { ...sub, status });
  });
}
export function renew(id, expiryDate, user) {
  date.parse(expiryDate);
  return tx(() => {
    const sub = needed('subscriptions', id);
    if (user?.role === 'customer' && sub.customerId !== user.id)
      fail('Subscription not found', 404);
    if (!sub.plan.allowRenew) fail('Renewal is disabled for this plan.');
    if (!['Active', 'Paused', 'Closed'].includes(sub.status))
      fail('Only an activated subscription can be renewed.');
    if (
      expiryDate <= today() ||
      (sub.expiryDate && expiryDate <= sub.expiryDate)
    )
      fail('Choose a later expiry date.');
    if (sub.status === 'Closed') {
      while (sub.nextBillingDate < today())
        sub.nextBillingDate = nextDate(
          sub.nextBillingDate,
          sub.plan.interval,
          sub.anchorDate,
        );
    }
    return put('subscriptions', {
      ...sub,
      expiryDate,
      status: sub.status === 'Paused' ? 'Paused' : 'Active',
    });
  });
}
export function runBilling(cutoff = today()) {
  date.parse(cutoff);
  if (cutoff > today()) fail('Future billing is not allowed.');
  return tx(() => {
    let created = 0;
    const rules = all('discounts');
    for (const sub of all('subscriptions').filter((s) =>
      ['Active', 'Paused'].includes(s.status),
    )) {
      if (sub.status === 'Paused') {
        if (sub.expiryDate && sub.expiryDate <= cutoff && sub.plan.autoClose)
          put('subscriptions', { ...sub, status: 'Closed' });
        continue;
      }
      while (
        sub.nextBillingDate <= cutoff &&
        (!sub.expiryDate || sub.nextBillingDate < sub.expiryDate) &&
        created < 500
      ) {
        const period = sub.nextBillingDate;
        const existing = db
          .prepare(
            "SELECT 1 FROM records WHERE kind='invoices' AND json_extract(body,'$.subscriptionId')=? AND json_extract(body,'$.period')=?",
          )
          .get(sub.id, period);
        if (!existing) {
          // Choose the single best eligible rule; rules do not stack. Usage counts are transactional.
          const eligible = rules
            .filter(
              (r) =>
                (!r.startDate || r.startDate <= period) &&
                (!r.endDate || r.endDate >= period) &&
                (!r.maxUses || r.usedCount < r.maxUses) &&
                (!r.subscriptionId || r.subscriptionId === sub.id),
            )
            .filter((r) => {
              const ls = sub.lines.filter(
                (l) =>
                  r.scope === 'subscription' || l.productId === r.productId,
              );
              return (
                ls.length &&
                ls.reduce((n, l) => n + cents(l.unitPrice) * l.quantity, 0) >=
                  cents(r.minPurchase) &&
                ls
                  .filter((l) => l.productId)
                  .reduce((n, l) => n + l.quantity, 0) >= r.minQuantity
              );
            });
          eligible.sort(
            (a, b) =>
              totals(sub.lines, b).discountAmount -
              totals(sub.lines, a).discountAmount,
          );
          const rule = eligible[0],
            pricing = totals(sub.lines, rule);
          const dueDate = addDays(
            period,
            sub.paymentTerms === 'Net 30'
              ? 30
              : sub.paymentTerms === 'Net 15'
                ? 15
                : 0,
          );
          put('invoices', {
            id: undefined,
            invoiceNumber: number('INV'),
            subscriptionId: sub.id,
            subscriptionNumber: sub.number,
            customerId: sub.customerId,
            customerName: sub.customerName,
            customerEmail: sub.customerEmail,
            customerAddress: sub.customerAddress,
            period,
            issueDate: period,
            date: period,
            dueDate,
            status: 'Draft',
            paidAmount: 0,
            balance: pricing.amount,
            ...pricing,
          });
          if (rule) {
            rule.usedCount = (rule.usedCount || 0) + 1;
            put('discounts', rule);
          }
          created++;
        }
        sub.nextBillingDate = nextDate(
          period,
          sub.plan.interval,
          sub.anchorDate,
        );
      }
      if (
        sub.expiryDate &&
        sub.expiryDate <= cutoff &&
        sub.nextBillingDate >= sub.expiryDate &&
        sub.plan.autoClose
      )
        sub.status = 'Closed';
      put('subscriptions', sub);
    }
    return {
      created,
      message: `${created} invoice(s) generated. Existing periods were not billed again.`,
    };
  });
}
export function recordPayment(input) {
  const data = z
    .object({
      invoiceId: text,
      amount: z.coerce.number().positive().max(1e12),
      method: z.enum(['Bank Transfer', 'UPI', 'Cash', 'Card', 'Cheque']),
      date,
      note: z.string().max(500).default(''),
      requestId: z.string().uuid(),
    })
    .parse(input);
  if (data.date > today()) fail('Payment date cannot be in the future.');
  return tx(() => {
    const old = db
      .prepare(
        "SELECT body FROM records WHERE kind='payments' AND json_extract(body,'$.requestId')=?",
      )
      .get(data.requestId);
    if (old) {
      const p = JSON.parse(old.body);
      if (
        p.invoiceId !== data.invoiceId ||
        cents(p.amount) !== cents(data.amount)
      )
        fail('Request ID was already used for a different payment.');
      return p;
    }
    const inv = needed('invoices', data.invoiceId),
      paid = cents(data.amount);
    if (inv.status !== 'Confirmed')
      fail('Payments require a confirmed, outstanding invoice.');
    if (paid <= 0 || paid > cents(inv.balance))
      fail('Payment exceeds the remaining balance or rounds to zero.');
    const payment = put('payments', {
      ...data,
      amount: money(paid),
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
    });
    inv.paidAmount = money(cents(inv.paidAmount) + paid);
    inv.balance = money(cents(inv.amount) - cents(inv.paidAmount));
    if (inv.balance === 0) inv.status = 'Paid';
    put('invoices', inv);
    return payment;
  });
}
