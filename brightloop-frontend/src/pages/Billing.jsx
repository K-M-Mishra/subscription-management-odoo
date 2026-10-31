import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Head, Badge, Empty } from '../ui';
import { money, formatDate } from '../data';
import { invoices } from '../api';

export default function Billing() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoices.list({
        page,
        limit,
        status: statusFilter,
        q: searchQuery
      });
      setData(res?.data || res || []);
      setTotal(res?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid': return <Badge type="ok">Paid</Badge>;
      case 'draft': return <Badge type="mute">Draft</Badge>;
      case 'confirmed': return <Badge type="default">Confirmed</Badge>;
      case 'cancelled': return <Badge type="warn">Cancelled</Badge>;
      default: return <Badge type="default">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div>
      <Head 
        title="Invoices & Billing" 
        subtitle="Track payments, outstanding balances, and billing history."
        actions={<button className="btn">Create Invoice</button>}
      />

      <div className="panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'none' }}>Search</label>
            <input 
              type="text" 
              placeholder="Search by invoice # or customer..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <label style={{ display: 'none' }}>Status Filter</label>
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading invoices...</div>
        ) : error ? (
          <Empty title="Error" description={error} actionText="Retry" onAction={fetchInvoices} />
        ) : data.length === 0 ? (
          <Empty 
            title="No invoices found" 
            description="Adjust your search filters or generate a new invoice."
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 500 }}>{inv.invoiceNumber || inv.id}</td>
                      <td>{inv.customerName || '-'}</td>
                      <td>{formatDate(inv.issueDate)}</td>
                      <td style={{ color: 'var(--mute)' }}>{formatDate(inv.dueDate)}</td>
                      <td style={{ fontWeight: 600 }}>{money(inv.amount)}</td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        <Link to={`/invoices/${inv.id}`} className="btn mini" style={{ background: 'var(--line)', color: 'var(--ink)', textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--mute)' }}>
                Showing page {page} {total > 0 ? `of ${Math.ceil(total / limit)}` : ''}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn mini" 
                  style={{ background: 'var(--line)', color: 'var(--ink)' }}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn mini" 
                  style={{ background: 'var(--line)', color: 'var(--ink)' }}
                  disabled={data.length < limit}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
