import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import { Head, Table, Badge, Pager, Loading, useLoad } from '../ui';
import { money } from '../data';
export default function Portal() {
  const [sp, setSP] = useState(1),
    [ip, setIP] = useState(1);
  const load = useLoad(
    () =>
      Promise.all([
        api('/portal/subscriptions' + queryString({ page: sp, limit: 12 })),
        api('/portal/invoices' + queryString({ page: ip, limit: 20 })),
      ]),
    [sp, ip],
  );
  const [subs, invs] = load.data || [];
  return (
    <>
      <Head
        title="My account"
        subtitle="Your subscriptions and invoices, together in one place."
      />
      <Loading load={load}>
        {subs && (
          <>
            <div className="grid2">
              {subs.data.map((s) => (
                <section className="panel subscription-card" key={s.id}>
                  <div className="section-head">
                    <h2>{s.planName}</h2>
                    <Badge>{s.status}</Badge>
                  </div>
                  <p className="muted">{s.number}</p>
                  <strong className="price">
                    {money(s.amount)}
                    <small> / {s.plan.interval}</small>
                  </strong>
                  <p>
                    Next billing:{' '}
                    {s.status === 'Active' ? s.nextBillingDate : '—'}
                  </p>
                  <Link
                    className="btn secondary"
                    to={'/portal/subscriptions/' + s.id}
                  >
                    Manage subscription →
                  </Link>
                </section>
              ))}
            </div>
            {!subs.total && (
              <section className="panel empty">
                No subscriptions yet. Your team can add one to this account.
              </section>
            )}
            <Pager data={subs} page={sp} setPage={setSP} />
            <section className="panel">
              <h2>Billing history</h2>
              <Table
                rows={invs.data}
                columns={[
                  {
                    key: 'invoiceNumber',
                    label: 'Invoice',
                    render: (i) => (
                      <Link to={'/portal/invoices/' + i.id}>
                        {i.invoiceNumber}
                      </Link>
                    ),
                  },
                  { key: 'issueDate', label: 'Issued' },
                  { key: 'dueDate', label: 'Due' },
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
              <Pager data={invs} page={ip} setPage={setIP} />
            </section>
          </>
        )}
      </Loading>
    </>
  );
}
