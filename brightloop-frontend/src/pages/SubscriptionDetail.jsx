import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Head, Field, Table, Badge, Loading, Alert, useLoad } from '../ui';
import { money } from '../data';
export default function SubscriptionDetail({ portal = false }) {
  const { id } = useParams(),
    base = portal ? '/portal' : '',
    load = useLoad(() => api(base + '/subscriptions/' + id), [id, portal]);
  const s = load.data;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [expiry, setExpiry] = useState('');
  async function action(path, method, body) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api(path, { method, body });
      if (r.message) setMessage(r.message);
      load.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const next = {
    Draft: 'Quotation',
    Quotation: 'Confirmed',
    Confirmed: 'Active',
  }[s?.status];
  return (
    <>
      <Head
        title={s?.number || 'Subscription details'}
        subtitle={s ? `${s.customerName} · ${s.planName}` : ''}
      />
      <Alert>{error}</Alert>
      <Alert success>{message}</Alert>
      <Loading load={load}>
        {s && (
          <>
            <div className="workflow">
              {['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'].map(
                (v) => (
                  <span key={v} className={s.status === v ? 'current' : ''}>
                    {v}
                  </span>
                ),
              )}
              {s.status === 'Paused' && <Badge>Paused</Badge>}
            </div>
            <section className="panel">
              <div className="section-head">
                <h2>{s.customerName}</h2>
                <Badge>{s.status}</Badge>
              </div>
              <div className="detail-grid">
                <div>
                  <small>Start date</small>
                  <strong>{s.startDate}</strong>
                </div>
                <div>
                  <small>Expiry date</small>
                  <strong>{s.expiryDate || 'Open-ended'}</strong>
                </div>
                <div>
                  <small>Billing cycle</small>
                  <strong>{s.plan.interval}</strong>
                </div>
                <div>
                  <small>Next billing</small>
                  <strong>
                    {s.status === 'Active' ? s.nextBillingDate : '—'}
                  </strong>
                </div>
                <div>
                  <small>Payment terms</small>
                  <strong>{s.paymentTerms}</strong>
                </div>
                <div>
                  <small>Per cycle before discounts</small>
                  <strong>{money(s.amount)}</strong>
                </div>
              </div>
              {s.quoteValidUntil && (
                <p className="muted">
                  Quotation valid through {s.quoteValidUntil}
                </p>
              )}
              <div className="actions">
                {!portal && next && (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      action(
                        base + '/subscriptions/' + id + '/status',
                        'PATCH',
                        { status: next },
                      )
                    }
                  >
                    Move to {next}
                  </button>
                )}
                {s.status === 'Active' && s.plan.allowPause && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      action(
                        base + '/subscriptions/' + id + '/status',
                        'PATCH',
                        { status: 'Paused' },
                      )
                    }
                  >
                    Pause
                  </button>
                )}
                {s.status === 'Paused' && (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      action(
                        base + '/subscriptions/' + id + '/status',
                        'PATCH',
                        { status: 'Active' },
                      )
                    }
                  >
                    Resume
                  </button>
                )}
                {['Active', 'Paused'].includes(s.status) &&
                  s.plan.allowClose && (
                    <button
                      className="btn secondary danger"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            'Close this subscription? New billing will stop.',
                          )
                        )
                          action(
                            base + '/subscriptions/' + id + '/status',
                            'PATCH',
                            { status: 'Closed' },
                          );
                      }}
                    >
                      Close subscription
                    </button>
                  )}
                {!portal && s.status === 'Active' && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => action('/billing/run', 'POST', {})}
                  >
                    Run due billing
                  </button>
                )}
              </div>
            </section>
            <section className="panel">
              <h2>Order lines</h2>
              <Table
                rows={s.lines.map((l, i) => ({ ...l, id: i }))}
                columns={[
                  {
                    key: 'productName',
                    label: 'Product',
                    render: (l) =>
                      l.productName +
                      (l.variantName ? ' / ' + l.variantName : ''),
                  },
                  { key: 'quantity', label: 'Quantity' },
                  {
                    key: 'unitPrice',
                    label: 'Unit price',
                    render: (l) => money(l.unitPrice),
                  },
                  {
                    key: 'taxRate',
                    label: 'Tax',
                    render: (l) => l.taxRate + '%',
                  },
                  {
                    key: 'totalAmount',
                    label: 'Line total',
                    render: (l) => money(l.totalAmount),
                  },
                ]}
              />
            </section>
            {s.plan.allowRenew &&
              ['Active', 'Paused', 'Closed'].includes(s.status) && (
                <section className="panel">
                  <h2>Renew subscription</h2>
                  <div className="filters">
                    <Field
                      label="New expiry date"
                      type="date"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                    <button
                      className="btn secondary"
                      disabled={busy || !expiry}
                      onClick={() =>
                        action(
                          base + '/subscriptions/' + id + '/renew',
                          'POST',
                          { expiryDate: expiry },
                        )
                      }
                    >
                      Renew
                    </button>
                  </div>
                </section>
              )}
            <section className="panel">
              <h2>Linked invoices</h2>
              <Table
                rows={s.invoices}
                columns={[
                  {
                    key: 'invoiceNumber',
                    label: 'Invoice',
                    render: (i) => (
                      <Link to={base + '/invoices/' + i.id}>
                        {i.invoiceNumber}
                      </Link>
                    ),
                  },
                  { key: 'issueDate', label: 'Issued' },
                  {
                    key: 'amount',
                    label: 'Total',
                    render: (i) => money(i.amount),
                  },
                  {
                    key: 'balance',
                    label: 'Balance',
                    render: (i) => money(i.balance),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (i) => <Badge>{i.status}</Badge>,
                  },
                ]}
              />
            </section>
          </>
        )}
      </Loading>
    </>
  );
}
