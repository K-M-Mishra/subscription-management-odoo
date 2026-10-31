import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import { useSession } from '../session';
import { Head, Field, Table, Pager, Alert, Loading, useLoad } from '../ui';
import { money } from '../data';
const config = {
  products: {
    title: 'Products',
    fields: [
      ['name', 'Product name'],
      ['type', 'Type', 'select', ['Software', 'Service', 'Goods']],
      ['salesPrice', 'Sales price (INR)', 'number'],
      ['costPrice', 'Cost price (INR)', 'number'],
      ['notes', 'Notes', 'textarea'],
    ],
    defaults: {
      type: 'Software',
      salesPrice: 0,
      costPrice: 0,
      notes: '',
      variants: [],
    },
  },
  plans: {
    title: 'Plans & billing cycles',
    fields: [
      ['name', 'Plan name'],
      ['price', 'Plan fee per cycle (INR)', 'number'],
      [
        'interval',
        'Billing cycle',
        'select',
        ['daily', 'weekly', 'monthly', 'yearly'],
      ],
      ['minQuantity', 'Minimum product quantity', 'number'],
      ['startDate', 'Available from', 'date'],
      ['endDate', 'Available until', 'date'],
      ['autoClose', 'Close automatically at expiry', 'checkbox'],
      ['allowClose', 'Allow early closure', 'checkbox'],
      ['allowPause', 'Allow pause', 'checkbox'],
      ['allowRenew', 'Allow renewal', 'checkbox'],
    ],
    defaults: {
      price: 0,
      interval: 'monthly',
      minQuantity: 1,
      startDate: '',
      endDate: '',
      autoClose: true,
      allowClose: true,
      allowPause: true,
      allowRenew: true,
    },
  },
  taxes: {
    title: 'Tax rules',
    fields: [
      ['name', 'Tax name'],
      ['rate', 'Rate (%)', 'number'],
    ],
    defaults: { rate: 0 },
  },
  discounts: {
    title: 'Discount rules',
    fields: [
      ['name', 'Rule name'],
      ['type', 'Discount type', 'select', ['percentage', 'fixed']],
      ['value', 'Value (% or INR)', 'number'],
      ['scope', 'Applies to', 'select', ['subscription', 'product']],
      ['productId', 'Product (required for product scope)', 'products'],
      ['subscriptionId', 'Specific subscription (optional)', 'subscriptions'],
      ['minPurchase', 'Minimum purchase (INR)', 'number'],
      ['minQuantity', 'Minimum product quantity', 'number'],
      ['startDate', 'Starts on', 'date'],
      ['endDate', 'Ends on', 'date'],
      ['maxUses', 'Usage limit (0 = unlimited)', 'number'],
    ],
    defaults: {
      type: 'percentage',
      value: 10,
      scope: 'subscription',
      productId: '',
      subscriptionId: '',
      minPurchase: 0,
      minQuantity: 0,
      startDate: '',
      endDate: '',
      maxUses: 0,
    },
  },
  customers: {
    title: 'Customers',
    fields: [
      ['name', 'Customer name'],
      ['email', 'Email', 'email'],
      ['password', 'Initial portal password', 'password'],
      ['phone', 'Phone'],
      ['address', 'Billing address', 'textarea'],
    ],
    defaults: { phone: '', address: '' },
  },
  staff: {
    title: 'Team & access',
    fields: [
      ['name', 'Staff name'],
      ['email', 'Email', 'email'],
      ['password', 'Initial password', 'password'],
    ],
    defaults: {},
  },
};
export async function fetchAll(kind) {
  let rows = [],
    page = 1;
  for (;;) {
    const r = await api('/' + kind + queryString({ limit: 100, page }));
    rows = rows.concat(r.data);
    if (rows.length >= r.total) return rows;
    page++;
  }
}
export function ResourceForm({ kind, onSaved, initial }) {
  const cfg = config[kind],
    [form, setForm] = useState({ ...cfg.defaults, name: '', ...initial }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const options = useLoad(
    () =>
      kind === 'discounts'
        ? Promise.all([fetchAll('products'), fetchAll('subscriptions')])
        : Promise.resolve([[], []]),
    [kind],
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/' + kind + (initial ? '/' + initial.id : ''), {
        method: initial ? 'PUT' : 'POST',
        body: form,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel resource-form" onSubmit={submit}>
      <h2>
        {initial ? 'Edit' : 'New'}{' '}
        {kind === 'staff' ? 'staff member' : kind.slice(0, -1)}
      </h2>
      <Alert>{error}</Alert>
      <div className="form-grid">
        {cfg.fields.map(([key, label, type = 'text', values]) => (
          <Field key={key} label={label}>
            {type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
            ) : type === 'select' ||
              ['products', 'subscriptions'].includes(type) ? (
              <select
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              >
                {type !== 'select' && (
                  <option value="">All / none selected</option>
                )}
                {(
                  values ||
                  options.data?.[type === 'products' ? 0 : 1] ||
                  []
                ).map((v) => (
                  <option
                    value={typeof v === 'string' ? v : v.id}
                    key={typeof v === 'string' ? v : v.id}
                  >
                    {typeof v === 'string' ? v : v.name || v.number}
                  </option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ) : (
              <input
                type={type}
                min={type === 'number' ? 0 : undefined}
                step={type === 'number' ? 'any' : undefined}
                value={form[key] ?? ''}
                required={[
                  'name',
                  'email',
                  'password',
                  'salesPrice',
                  'interval',
                ].includes(key)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]:
                      type === 'number'
                        ? e.target.value === ''
                          ? ''
                          : Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}
          </Field>
        ))}
      </div>
      {kind === 'products' && (
        <div className="variants">
          <h3>Variants</h3>
          {form.variants.map((v, i) => (
            <div className="line-fields" key={i}>
              <Field
                label="Variant name"
                required
                value={v.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    variants: form.variants.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  })
                }
              />
              <Field
                label="Extra price (INR)"
                type="number"
                min="0"
                step="0.01"
                required
                value={v.extraPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    variants: form.variants.map((x, j) =>
                      j === i
                        ? { ...x, extraPrice: Number(e.target.value) }
                        : x,
                    ),
                  })
                }
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    variants: form.variants.filter((_, j) => i !== j),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setForm({
                ...form,
                variants: [...form.variants, { name: '', extraPrice: 0 }],
              })
            }
          >
            + Add variant
          </button>
        </div>
      )}
      {kind === 'plans' && (
        <p className="muted small">
          Plan fee is an extra recurring line, in addition to product prices.
          Leave it 0 for product-only billing.
        </p>
      )}
      {kind === 'discounts' && (
        <p className="muted small">
          The best eligible discount applies automatically on the next invoice.
          Rules do not stack.
        </p>
      )}
      {['customers', 'staff'].includes(kind) && (
        <p className="muted small">
          Password: 9+ characters, uppercase, lowercase and a special character.
          Share the initial credentials privately.
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy
          ? 'Saving…'
          : 'Save ' + (kind === 'staff' ? 'staff member' : kind.slice(0, -1))}
      </button>
    </form>
  );
}
export default function Catalog({ kind }) {
  const { user } = useSession(),
    cfg = config[kind],
    [page, setPage] = useState(1),
    [q, setQ] = useState(''),
    [editing, setEditing] = useState(null),
    [open, setOpen] = useState(false);
  const load = useLoad(
    () => api('/' + kind + queryString({ page, q })),
    [kind, page, q],
  );
  const canWrite = user.role === 'admin' || kind === 'customers';
  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'details',
      label: 'Details',
      render: (r) =>
        kind === 'products'
          ? `${money(r.salesPrice)} · ${r.type} · ${r.variants.length} variants`
          : kind === 'plans'
            ? `${r.interval} · ${money(r.price)} plan fee · minimum ${r.minQuantity}`
            : kind === 'taxes'
              ? r.rate + '%'
              : kind === 'discounts'
                ? `${r.type === 'percentage' ? r.value + '%' : money(r.value)} · used ${r.usedCount || 0}${r.maxUses ? '/' + r.maxUses : ''}`
                : r.email,
    },
    ...(kind === 'staff' ? [{ key: 'role', label: 'Role' }] : []),
  ];
  if (canWrite && !['customers', 'staff'].includes(kind))
    columns.push({
      key: 'edit',
      label: '',
      render: (r) => (
        <button
          className="text-btn"
          onClick={() => {
            setEditing(r);
            setOpen(true);
          }}
        >
          Edit
        </button>
      ),
    });
  return (
    <>
      <Head
        title={cfg.title}
        subtitle="Configure the building blocks of your subscription business."
        actions={
          canWrite && (
            <button
              className="btn"
              onClick={() => {
                setEditing(null);
                setOpen(!open);
              }}
            >
              {open
                ? 'Close form'
                : '+ Add ' + (kind === 'staff' ? 'staff' : kind.slice(0, -1))}
            </button>
          )
        }
      />
      {open && (
        <ResourceForm
          key={editing?.id || 'new'}
          kind={kind}
          initial={editing}
          onSaved={() => {
            setOpen(false);
            setEditing(null);
            load.reload();
          }}
        />
      )}
      <div className="filters">
        <Field
          label="Search"
          placeholder={'Search ' + kind}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Loading load={load}>
        <section className="panel">
          <Table columns={columns} rows={load.data?.data} />
          <Pager data={load.data} page={page} setPage={setPage} />
        </section>
      </Loading>
    </>
  );
}
