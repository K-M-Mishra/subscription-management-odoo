import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Head, Field, Alert, Loading, useLoad, today } from '../ui';
import { fetchAll } from './Catalog';
import LineEditor from '../LineEditor';
export default function SubscriptionForm() {
  const navigate = useNavigate(),
    load = useLoad(
      () =>
        Promise.all(
          ['customers', 'plans', 'products', 'taxes', 'templates'].map(
            fetchAll,
          ),
        ),
      [],
    );
  const [form, setForm] = useState({
      customerId: '',
      planId: '',
      startDate: today(),
      expiryDate: '',
      paymentTerms: 'Net 30',
      templateId: '',
    }),
    [lines, setLines] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [customers, plans, products, taxes, templates] = load.data || [
    [],
    [],
    [],
    [],
    [],
  ];
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const sub = await api('/subscriptions', {
        method: 'POST',
        body: { ...form, lines },
      });
      navigate('/subscriptions/' + sub.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Head
        title="New subscription"
        subtitle="Start with a quote template or build a subscription from your catalog."
      />
      <Loading load={load}>
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <section className="panel">
            <div className="form-grid">
              <Field label="Quotation template">
                <select
                  value={form.templateId}
                  onChange={(e) => {
                    const t = templates.find((t) => t.id === e.target.value);
                    setForm({
                      ...form,
                      templateId: e.target.value,
                      ...(t ? { planId: t.planId } : {}),
                    });
                    if (t) setLines(t.lines.map((l) => ({ ...l })));
                  }}
                >
                  <option value="">Start from scratch</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · valid {t.validDays} days
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Customer">
                <select
                  required
                  value={form.customerId}
                  onChange={(e) => set('customerId', e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Plan">
                <select
                  required
                  value={form.planId}
                  onChange={(e) => set('planId', e.target.value)}
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.interval} · minimum {p.minQuantity} units
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Start date"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
              <Field
                label="Expiry date (exclusive, optional)"
                type="date"
                value={form.expiryDate}
                onChange={(e) => set('expiryDate', e.target.value)}
              />
              <Field label="Payment terms">
                <select
                  value={form.paymentTerms}
                  onChange={(e) => set('paymentTerms', e.target.value)}
                >
                  {['Immediate', 'Net 15', 'Net 30'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="muted small">
              Missing a customer?{' '}
              <Link to="/customers">Add a customer account</Link>. Plan settings
              and current prices are saved with this subscription.
            </p>
          </section>
          <LineEditor {...{ lines, setLines, products, taxes }} />
          <div className="actions">
            <button className="btn" disabled={busy || !lines.length}>
              {busy ? 'Creating…' : 'Create draft subscription'}
            </button>
            <Link className="btn secondary" to="/subscriptions">
              Cancel
            </Link>
          </div>
        </form>
      </Loading>
    </>
  );
}
