import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useSession } from '../session';
import { Head, Field, Table, Alert, Loading, useLoad } from '../ui';
import { fetchAll } from './Catalog';
import LineEditor from '../LineEditor';
export default function Templates() {
  const { user } = useSession(),
    navigate = useNavigate(),
    load = useLoad(
      () =>
        Promise.all(['templates', 'plans', 'products', 'taxes'].map(fetchAll)),
      [],
    );
  const [open, setOpen] = useState(false),
    [form, setForm] = useState({ name: '', planId: '', validDays: 30 }),
    [lines, setLines] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [templates, plans, products, taxes] = load.data || [[], [], [], []];
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/templates', { method: 'POST', body: { ...form, lines } });
      setOpen(false);
      load.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Head
        title="Quotation templates"
        subtitle="Prepare repeatable offers with plans, products and a clear validity period."
        actions={
          user.role === 'admin' && (
            <button className="btn" onClick={() => setOpen(!open)}>
              {open ? 'Close form' : '+ New template'}
            </button>
          )
        }
      />
      <Loading load={load}>
        <Alert>{error}</Alert>
        {open && (
          <form onSubmit={submit}>
            <section className="panel form-grid">
              <Field
                label="Template name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Field label="Plan">
                <select
                  required
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Validity (days)"
                type="number"
                min="1"
                max="365"
                required
                value={form.validDays}
                onChange={(e) =>
                  setForm({ ...form, validDays: Number(e.target.value) })
                }
              />
            </section>
            <LineEditor {...{ lines, setLines, products, taxes }} />
            <button className="btn" disabled={busy || !lines.length}>
              {busy ? 'Saving…' : 'Save template'}
            </button>
          </form>
        )}
        <section className="panel">
          <Table
            rows={templates}
            columns={[
              { key: 'name', label: 'Name' },
              {
                key: 'plan',
                label: 'Plan',
                render: (t) => plans.find((p) => p.id === t.planId)?.name,
              },
              { key: 'validDays', label: 'Valid days' },
              {
                key: 'lines',
                label: 'Product lines',
                render: (t) => t.lines.length,
              },
              {
                key: 'use',
                label: '',
                render: () => (
                  <button
                    className="text-btn"
                    onClick={() => navigate('/subscriptions/new')}
                  >
                    Create quotation →
                  </button>
                ),
              },
            ]}
          />
        </section>
      </Loading>
    </>
  );
}
