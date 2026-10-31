import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, queryString } from '../api';
import { Head, Field, Table, Pager, Loading, useLoad } from '../ui';
import { money } from '../data';
export default function Payments() {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(''),
    load = useLoad(
      () => api('/payments' + queryString({ page, q })),
      [page, q],
    );
  return (
    <>
      <Head
        title="Payments"
        subtitle="Every receipt, matched to the right invoice."
        actions={
          <Link className="btn" to="/invoices">
            Record against an invoice →
          </Link>
        }
      />
      <div className="filters">
        <Field
          label="Search payments"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Loading load={load}>
        <section className="panel">
          <Table
            rows={load.data?.data}
            columns={[
              {
                key: 'invoiceNumber',
                label: 'Invoice',
                render: (p) => (
                  <Link to={'/invoices/' + p.invoiceId}>{p.invoiceNumber}</Link>
                ),
              },
              { key: 'customerName', label: 'Customer' },
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
          <Pager data={load.data} page={page} setPage={setPage} />
        </section>
      </Loading>
    </>
  );
}
