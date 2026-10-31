import React, { useState, useEffect } from 'react';
import { Head, Badge, Empty } from '../ui';
import { money, formatDate } from '../data';
import { discounts } from '../api';

export default function Discounts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discounts.list({
        page,
        limit,
        q: searchQuery
      });
      setData(res?.data || res || []);
      setTotal(res?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load discounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDiscounts();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchQuery]);

  const getStatusBadge = (discount) => {
    const now = new Date();
    const validUntil = discount.validUntil ? new Date(discount.validUntil) : null;
    
    if (discount.active === false) {
      return <Badge type="mute">Inactive</Badge>;
    }
    if (validUntil && validUntil < now) {
      return <Badge type="warn">Expired</Badge>;
    }
    return <Badge type="ok">Active</Badge>;
  };

  return (
    <div>
      <Head 
        title="Discounts & Coupons" 
        subtitle="Manage promotional codes, percentage limits, and fixed reductions."
        actions={<button className="btn">Create Discount</button>}
      />

      <div className="panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '300px' }}>
            <label style={{ display: 'none' }}>Search</label>
            <input 
              type="text" 
              placeholder="Search by code or name..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading discounts...</div>
        ) : error ? (
          <Empty title="Error" description={error} actionText="Retry" onAction={fetchDiscounts} />
        ) : data.length === 0 ? (
          <Empty 
            title="No discounts found" 
            description="Create your first discount code to offer promotions to customers."
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Usage</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--loop)' }}>{item.code}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                      <td style={{ fontWeight: 500 }}>
                        {item.type === 'percentage' ? `${item.value}%` : money(item.value)}
                      </td>
                      <td style={{ color: 'var(--mute)' }}>
                        {item.usageCount || 0} / {item.usageLimit || '∞'}
                      </td>
                      <td style={{ color: 'var(--mute)' }}>{formatDate(item.validUntil)}</td>
                      <td>{getStatusBadge(item)}</td>
                      <td>
                        <button className="btn mini" style={{ background: 'var(--line)', color: 'var(--ink)' }}>
                          Edit
                        </button>
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