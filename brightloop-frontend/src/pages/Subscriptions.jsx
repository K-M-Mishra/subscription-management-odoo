import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Head, Badge, Empty } from '../ui';
import { money, formatDate } from '../data';
import { subscriptions } from '../api';

export default function Subscriptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState(''); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptions.list({
        page,
        limit,
        status: statusFilter,
        plan: planFilter,
        q: searchQuery
      });
      setData(res?.data || res || []);
      setTotal(res?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSubscriptions();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, statusFilter, planFilter, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'active': return <Badge type="ok">Active</Badge>;
      case 'draft': return <Badge type="mute">Draft</Badge>;
      case 'quotation': return <Badge type="warn">Quotation</Badge>;
      case 'confirmed': return <Badge type="default">Confirmed</Badge>;
      case 'closed': return <Badge type="mute">Closed</Badge>;
      default: return <Badge>{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div>
      <Head 
        title="Subscriptions" 
        subtitle="Manage customer plans and billing cycles."
        actions={
          <Link to="/subscriptions/new" className="btn" style={{ textDecoration: 'none' }}>
            Create subscription
          </Link>
        }
      />

      <div className="panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'none' }}>Search</label>
            <input 
              type="text" 
              placeholder="Search by customer or ID..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          
          <div style={{ width: '180px' }}>
            <label style={{ display: 'none' }}>Plan Filter</label>
            <select 
              value={planFilter} 
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Plans</option>
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ display: 'none' }}>Status Filter</label>
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="quotation">Quotation</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading subscriptions...</div>
        ) : error ? (
          <Empty title="Error" description={error} actionText="Retry" onAction={fetchSubscriptions} />
        ) : data.length === 0 ? (
          <Empty 
            title="No subscriptions found" 
            description="Try adjusting your filters or create a new subscription."
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 500 }}>{sub.subscriptionNumber || sub.id}</td>
                      <td>{sub.customerName || '-'}</td>
                      <td>{sub.planName || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{money(sub.amount)}</td>
                      <td>{getStatusBadge(sub.status)}</td>
                      <td style={{ color: 'var(--mute)' }}>{formatDate(sub.createdAt)}</td>
                      <td>
                        <Link to={`/subscriptions/${sub.id}`} className="btn mini" style={{ background: 'var(--line)', color: 'var(--ink)', textDecoration: 'none' }}>
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