import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, downloadInvoice } from '../api';
import {
  Head,
  Field,
  Table,
  Badge,
  Alert,
  Loading,
  useLoad,
  today,
} from '../ui';
import { money } from '../data';
export default function InvoiceDetail({ portal = false }) {
  const { id } = useParams(),
    base = portal ? '/portal' : '',
    load = useLoad(() => api(base + '/invoices/' + id), [id, portal]);
  const inv = load.data;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [form, setForm] = useState({
      amount: '',
      method: 'Bank Transfer',
      date: today(),
      note: '',
    });
  async function action(fn) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fn();
      if (r?.delivery)
        setMessage(
          r.delivery === 'smtp'
            ? 'Invoice sent by email.'
            : 'Development email saved in backend/outbox. SMTP is needed for real delivery.',
        );
      load.reload();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function pay(e) {
    e.preventDefault();
    if (
      await action(() =>
        api('/payments', {
          method: 'POST',
          body: {
            ...form,
            amount: Number(form.amount),
            invoiceId: id,
            requestId,
          },
        }),
      )
    ) {
      setRequestId(crypto.randomUUID());
      setForm({ ...form, amount: '', note: '' });
    }
  }
  return (
    <>
      <Head
        title={inv?.invoiceNumber || 'Invoice'}
        subtitle={inv ? `${inv.customerName} · ${inv.customerEmail}` : ''}
      />
      <Alert>{error}</Alert>
      <Alert success>{message}</Alert>
      <Loading load={load}>
        {inv && (
          <>
            <section className="panel">
              <div className="section-head">
                <h2>Invoice summary</h2>
                <Badge>{inv.status}</Badge>
              </div>
              <div className="detail-grid">
                <div>
                  <small>Issue date</small>
                  <strong>{inv.issueDate}</strong>
                </div>
                <div>
                  <small>Due date</small>
                  <strong>{inv.dueDate}</strong>
                </div>
                <div>
                  <small>Subscription</small>
                  <strong>{inv.subscriptionNumber}</strong>
                </div>
                <div>
                  <small>Paid</small>
                  <strong>{money(inv.paidAmount)}</strong>
                </div>
                <div>
                  <small>Balance</small>
                  <strong>{money(inv.balance)}</strong>
                </div>
              </div>
              <div className="actions">
                {!portal && inv.status === 'Draft' && (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api('/invoices/' + id + '/status', {
                          method: 'PATCH',
                          body: { status: 'Confirmed' },
                        }),
                      )
                    }
                  >
                    Confirm invoice
                  </button>
                )}
                {!portal && ['Confirmed', 'Paid'].includes(inv.status) && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api('/invoices/' + id + '/send', {
                          method: 'POST',
                          body: {},
                        }),
                      )
                    }
                  >
                    Send by email
                  </button>
                )}
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => action(() => downloadInvoice(id, portal))}
                >
                  Download PDF
                </button>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() =>
                    action(() => downloadInvoice(id, portal, true))
                  }
                >
                  Open / print PDF
                </button>
                {!portal &&
                  ['Draft', 'Confirmed'].includes(inv.status) &&
                  inv.paidAmount === 0 && (
                    <button
                      className="text-btn danger"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            'Cancel this invoice? This billing period will not be charged again automatically.',
                          )
                        )
                          action(() =>
                            api('/invoices/' + id + '/status', {
                              method: 'PATCH',
                              body: { status: 'Cancelled' },
                            }),
                          );
                      }}
                    >
                      Cancel invoice
                    </button>
                  )}
              </div>
            </section>
            <section className="panel">
              <Table
                rows={inv.lines.map((l, i) => ({ ...l, id: i }))}
                columns={[
                  {
                    key: 'productName',
                    label: 'Description',
                    render: (l) =>
                      l.productName +
                      (l.variantName ? ' / ' + l.variantName : ''),
                  },
                  { key: 'quantity', label: 'Qty' },
                  {
                    key: 'unitPrice',
                    label: 'Unit price',
                    render: (l) => money(l.unitPrice),
                  },
                  {
                    key: 'discount',
                    label: 'Discount',
                    render: (l) => money(l.discount),
                  },
                  {
                    key: 'taxAmount',
                    label: 'Tax',
                    render: (l) => money(l.taxAmount),
                  },
                  {
                    key: 'totalAmount',
                    label: 'Total',
                    render: (l) => money(l.totalAmount),
                  },
                ]}
              />
              <div className="totals">
                <p>
                  Subtotal <strong>{money(inv.subtotal)}</strong>
                </p>
                <p>
                  Discount {inv.discountName && `(${inv.discountName})`}{' '}
                  <strong>−{money(inv.discountAmount)}</strong>
                </p>
                <p>
                  Tax <strong>{money(inv.taxTotal)}</strong>
                </p>
                <p className="grand">
                  Invoice total <strong>{money(inv.amount)}</strong>
                </p>
              </div>
            </section>
            {!portal && inv.status === 'Confirmed' && (
              <form className="panel" onSubmit={pay}>
                <h2>Record a payment</h2>
                <p className="muted small">
                  Record money already received. This form does not charge a
                  card or bank account.
                </p>
                <div className="form-grid">
                  <Field
                    label="Amount received (INR)"
                    type="number"
                    min="0.01"
                    max={inv.balance}
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => {
                      setRequestId(crypto.randomUUID());
                      setForm({ ...form, amount: e.target.value });
                    }}
                  />
                  <Field label="Method">
                    <select
                      value={form.method}
                      onChange={(e) =>
                        setForm({ ...form, method: e.target.value })
                      }
                    >
                      {['Bank Transfer', 'UPI', 'Cash', 'Card', 'Cheque'].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field
                    label="Payment date"
                    type="date"
                    max={today()}
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                  <Field
                    label="Note / reference"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
                <button className="btn" disabled={busy}>
                  {busy ? 'Recording…' : 'Record payment'}
                </button>
              </form>
            )}
            {inv.payments?.length > 0 && (
              <section className="panel">
                <h2>Payment history</h2>
                <Table
                  rows={inv.payments}
                  columns={[
                    { key: 'date', label: 'Date' },
                    { key: 'method', label: 'Method' },
                    {
                      key: 'amount',
                      label: 'Amount',
                      render: (p) => money(p.amount),
                    },
                    { key: 'note', label: 'Note' },
                  ]}
                />
              </section>
            )}
          </>
        )}
      </Loading>
    </>
  );
}
