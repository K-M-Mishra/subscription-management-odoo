import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import {
  Head,
  Stat,
  Table,
  Badge,
  Field,
  Loading,
  useLoad,
  today,
} from '../ui';
import { money } from '../data';
export default function Dashboard() {
  const [startDate, setStart] = useState(today().slice(0, 7) + '-01'),
    [endDate, setEnd] = useState(today());
  const load = useLoad(
    () =>
      Promise.all(
        ['/reports/summary', '/reports/revenue', '/reports/overdue'].map((p) =>
          api(p + queryString({ startDate, endDate, limit: 100 })),
        ),
      ),
    [startDate, endDate],
  );
  const [summary, revenue, overdue] = load.data || [];
  return (
    <>
      <Head
        title="Business overview"
        subtitle="A clear view of every subscription, payment and upcoming decision."
        actions={
          <Link className="btn" to="/subscriptions/new">
            + New subscription
          </Link>
        }
      />
      <div className="hero-strip">
        <div>
          <span className="eyebrow">YOUR BUSINESS, IN SYNC</span>
          <h2>Make every billing cycle count.</h2>
          <p>Follow the money. Keep customers moving forward.</p>
        </div>
        <div className="hero-loop">∞</div>
      </div>
      <div className="filters">
        <Field
          label="From"
          type="date"
          value={startDate}
          onChange={(e) => setStart(e.target.value)}
        />
        <Field
          label="To"
          type="date"
          value={endDate}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button className="btn secondary" onClick={load.reload}>
          Refresh
        </button>
      </div>
      <Loading load={load}>
        {summary && (
          <>
            <div className="stats">
              <Stat
                title="Active subscriptions"
                value={summary.activeSubscriptions}
                hint="Current, across all dates"
              />
              <Stat
                title="Monthly recurring value"
                value={money(summary.mrr)}
                hint="Before tax and discounts"
              />
              <Stat
                title="Payments collected"
                value={money(summary.collected)}
                hint={`${summary.paymentCount} payments in period`}
              />
              <Stat
                title="Outstanding balance"
                value={money(summary.outstanding)}
                hint="Confirmed invoices in period"
              />
            </div>
            <div className="grid2">
              <section className="panel">
                <h2>Payment collections</h2>
                <p className="muted small">Money received, grouped by month</p>
                <div className="chart">
                  {revenue.data.length ? (
                    revenue.data.map((r) => (
                      <div className="bar-row" key={r.month}>
                        <span>{r.month}</span>
                        <div>
                          <i
                            style={{
                              width:
                                Math.max(
                                  2,
                                  (r.amount /
                                    Math.max(
                                      ...revenue.data.map((v) => v.amount),
                                    )) *
                                    100,
                                ) + '%',
                            }}
                          />
                        </div>
                        <strong>{money(r.amount)}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="empty">
                      Record a payment to see your collections here.
                    </p>
                  )}
                </div>
              </section>
              <section className="panel">
                <h2>Needs attention</h2>
                <strong className="attention-value">
                  {money(summary.overdue)}
                </strong>
                <p className="muted">
                  Overdue balance from invoices issued in this period.
                </p>
                <Link className="btn secondary" to="/invoices">
                  Review invoices →
                </Link>
              </section>
            </div>
            <section className="panel">
              <div className="section-head">
                <h2>Overdue invoices</h2>
                <Badge>{overdue.total + ' outstanding'}</Badge>
              </div>
              <Table
                rows={overdue.data}
                empty="All caught up. No overdue invoices in this period."
                columns={[
                  {
                    key: 'invoiceNumber',
                    label: 'Invoice',
                    render: (r) => (
                      <Link to={'/invoices/' + r.id}>{r.invoiceNumber}</Link>
                    ),
                  },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'dueDate', label: 'Due date' },
                  {
                    key: 'balance',
                    label: 'Balance',
                    render: (r) => money(r.balance),
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
