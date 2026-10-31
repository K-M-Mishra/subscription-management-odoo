import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import { Head, Field, Table, Pager, Badge, Loading, useLoad } from '../ui';
import { money } from '../data';
export default function Subscriptions() {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(''),
    [status, setStatus] = useState('');
  const load = useLoad(
    () => api('/subscriptions' + queryString({ page, q, status })),
    [page, q, status],
  );
  return (
    <>
      <Head
        title="Subscriptions"
        subtitle="From first quotation to the next renewal."
        actions={
          <Link to="/subscriptions/new" className="btn">
            + New subscription
          </Link>
        }
      />
      <div className="filters">
        <Field
          label="Search"
          value={q}
          placeholder="Customer or subscription number"
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
            {[
              'Draft',
              'Quotation',
              'Confirmed',
              'Active',
              'Paused',
              'Closed',
            ].map((s) => (
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
                key: 'number',
                label: 'Subscription',
                render: (r) => (
                  <Link to={'/subscriptions/' + r.id}>{r.number}</Link>
                ),
              },
              { key: 'customerName', label: 'Customer' },
              { key: 'planName', label: 'Plan' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => <Badge>{r.status}</Badge>,
              },
              { key: 'nextBillingDate', label: 'Next billing' },
              {
                key: 'amount',
                label: 'Per cycle',
                render: (r) => money(r.amount),
              },
            ]}
          />
          <Pager data={load.data} page={page} setPage={setPage} />
        </section>
      </Loading>
    </>
  );
}
