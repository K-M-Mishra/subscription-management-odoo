import React, { useState, useEffect } from 'react';
import { Head, Badge, Empty } from '../ui';
import { money } from '../data';
import { products } from '../api';

export default function Catalog() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await products.list({
        page,
        limit,
        q: searchQuery
      });
      setData(res?.data || res || []);
      setTotal(res?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchQuery]);

  return (
    <div>
      <Head 
        title="Products & Plans" 
        subtitle="Manage your software catalog, variants, and pricing plans."
        actions={<button className="btn">Add Product</button>}
      />

      <div className="panel">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: '1', maxWidth: '300px' }}>
            <label style={{ display: 'none' }}>Search</label>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Data States */}
        {loading && data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading catalog...</div>
        ) : error ? (
          <Empty title="Error" description={error} actionText="Retry" onAction={fetchProducts} />
        ) : data.length === 0 ? (
          <Empty 
            title="No products found" 
            description="Start building your catalog by adding your first software product."
            actionText="Add Product"
            onAction={() => alert('Open create modal')}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Code / SKU</th>
                    <th>Variants</th>
                    <th>Base Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ color: 'var(--mute)' }}>{item.code || '-'}</td>
                      <td>{item.variantCount || 0}</td>
                      <td style={{ fontWeight: 600 }}>{money(item.basePrice)}</td>
                      <td>
                        {item.active !== false ? (
                          <Badge type="ok">Active</Badge>
                        ) : (
                          <Badge type="mute">Inactive</Badge>
                        )}
                      </td>
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
            
            {/* Pagination Controls */}
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