import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import {
  Head,
  Field,
  Table,
  Badge,
  Pager,
  Alert,
  Loading,
  useLoad,
  today,
} from '../ui';
import { money } from '../data';
export default function Billing() {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = useLoad(
    () => api('/invoices' + queryString({ page, q, status })),
    [page, q, status],
  );
  async function run() {
    setBusy(true);
    setError('');
    try {
      const r = await api('/billing/run', { method: 'POST', body: {} });
      setMessage(r.message);
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
        title="Billing & invoices"
        subtitle="Recurring billing runs every minute while the server is running. You can also run it now."
        actions={
          <button className="btn" disabled={busy} onClick={run}>
            {busy ? 'Generating…' : 'Run due billing'}
          </button>
        }
      />
      <Alert>{error}</Alert>
      <Alert success>{message}</Alert>
      <div className="filters">
        <Field
          label="Search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {['Draft', 'Confirmed', 'Paid', 'Cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Loading load={load}>
        <section className="panel">
          <Table
            rows={load.data?.data}
            columns={[
              {
                key: 'invoiceNumber',
                label: 'Invoice',
                render: (i) => (
                  <Link to={'/invoices/' + i.id}>{i.invoiceNumber}</Link>
                ),
              },
              { key: 'customerName', label: 'Customer' },
              {
                key: 'dueDate',
                label: 'Due date',
                render: (i) => (
                  <span
                    className={
                      i.status === 'Confirmed' && i.dueDate < today()
                        ? 'danger'
                        : ''
                    }
                  >
                    {i.dueDate}
                  </span>
                ),
              },
              { key: 'amount', label: 'Total', render: (i) => money(i.amount) },
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
          <Pager data={load.data} page={page} setPage={setPage} />
        </section>
      </Loading>
    </>
  );
}
