import React, { useState, useEffect } from 'react';
import { Head, Badge, Empty } from '../ui';
import { fetchProducts, saveProduct } from '../api';
import { money } from '../data';

// --- PRODUCT FORM MODAL (With Variants) ---
function ProductForm({ initialData, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || '',
    type: initialData?.type || 'Software',
    salesPrice: initialData?.salesPrice || 0,
    costPrice: initialData?.costPrice || 0,
    tax: initialData?.tax || 0,
    notes: initialData?.notes || '',
    variants: initialData?.variants || []
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const sPrice = parseFloat(formData.salesPrice) || 0;
  const cPrice = parseFloat(formData.costPrice) || 0;
  const margin = sPrice > 0 ? (((sPrice - cPrice) / sPrice) * 100).toFixed(1) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), attribute: '', value: '', extraPrice: 0 }]
    }));
  };

  const handleVariantChange = (index, field, val) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = val;
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required.';
    if (sPrice < 0) errors.salesPrice = 'Cannot be negative.';
    if (cPrice < 0) errors.costPrice = 'Cannot be negative.';
    
    // Validate variants
    formData.variants.forEach((v) => {
      if (!v.attribute.trim() || !v.value.trim()) {
        errors.variants = 'All variants must have an attribute and a value. Remove empty ones.';
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await saveProduct({
        ...formData,
        salesPrice: sPrice,
        costPrice: cPrice,
        tax: parseFloat(formData.tax) || 0,
        variants: formData.variants.map(v => ({
          ...v,
          extraPrice: parseFloat(v.extraPrice) || 0
        }))
      });
      onSave(); 
    } catch (err) {
      setServerError(err.message || 'Failed to save product. Localhost might be down.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(16, 28, 51, 0.4)',
          zIndex: 99
        }} 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="modal" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', zIndex: 100 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 4px 0', fontFamily: 'Bricolage Grotesque' }}>
              {formData.id ? "Edit product" : "Add product"}
            </h2>
            <p style={{ margin: 0, color: 'var(--mute)', fontSize: '14px' }}>Configure product details, pricing, and variants.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--mute)', lineHeight: 1 }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {serverError && (
          <div style={{ backgroundColor: '#fbe8ec', color: 'var(--warn)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 500 }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid2" style={{ gap: '16px', marginBottom: '24px' }}>
            <div>
              <label>Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Brightloop Pro" />
              {fieldErrors.name && <div className="mini" style={{ color: 'var(--warn)', marginTop: '4px' }}>{fieldErrors.name}</div>}
            </div>
            <div>
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Software">Software</option>
                <option value="Add-on">Add-on</option>
                <option value="Service">Service</option>
                <option value="Physical">Physical</option>
              </select>
            </div>
          </div>

          <div className="grid2" style={{ gap: '16px', marginBottom: '24px' }}>
            <div>
              <label>Sales Price (INR)</label>
              <input type="number" name="salesPrice" value={formData.salesPrice} onChange={handleChange} min="0" step="0.01" />
              {fieldErrors.salesPrice && <div className="mini" style={{ color: 'var(--warn)', marginTop: '4px' }}>{fieldErrors.salesPrice}</div>}
            </div>
            <div>
              <label>Cost Price (INR)</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" step="0.01" style={{ flex: 1 }} />
                <Badge type={margin > 0 ? "ok" : "warn"}>Margin: {margin}%</Badge>
              </div>
              {fieldErrors.costPrice && <div className="mini" style={{ color: 'var(--warn)', marginTop: '4px' }}>{fieldErrors.costPrice}</div>}
            </div>
          </div>

          <div className="grid2" style={{ gap: '16px', marginBottom: '32px' }}>
            <div>
              <label>Tax (%)</label>
              <input type="number" name="tax" value={formData.tax} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <label>Notes (Internal)</label>
              <input name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional notes" />
            </div>
          </div>

          {/* VARIANTS SECTION */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Bricolage Grotesque' }}>Product Variants</h3>
              <button type="button" className="btn mini" onClick={handleAddVariant}>Add variant row</button>
            </div>
            
            {fieldErrors.variants && <div className="mini" style={{ color: 'var(--warn)', marginBottom: '16px' }}>{fieldErrors.variants}</div>}

            {formData.variants.length === 0 ? (
              <div style={{ color: 'var(--mute)', padding: '16px', background: 'var(--paper)', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
                No variants added. Base price will apply.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.variants.map((variant, index) => {
                  const extra = parseFloat(variant.extraPrice) || 0;
                  const finalPrice = sPrice + extra;

                  return (
                    <div key={variant.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        placeholder="Attribute (e.g. Brand)" 
                        value={variant.attribute} 
                        onChange={(e) => handleVariantChange(index, 'attribute', e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <input 
                        placeholder="Value (e.g. Starter)" 
                        value={variant.value} 
                        onChange={(e) => handleVariantChange(index, 'value', e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <div style={{ position: 'relative', width: '120px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', fontSize: '14px' }}>+</span>
                        <input 
                          type="number"
                          placeholder="Extra" 
                          value={variant.extraPrice} 
                          onChange={(e) => handleVariantChange(index, 'extraPrice', e.target.value)} 
                          style={{ width: '100%', paddingLeft: '28px' }}
                        />
                      </div>
                      <div style={{ width: '120px', fontSize: '14px', color: 'var(--mute)', textAlign: 'right', fontWeight: '500' }}>
                        = {money(finalPrice)}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariant(index)}
                        style={{ background: 'none', border: 'none', color: 'var(--warn)', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}
                        aria-label="Remove variant"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }} 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// --- PRODUCTS PAGE ---
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const limit = 20;
  const [hasMore, setHasMore] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchProducts({ page: currentPage, limit });
      setProducts(response?.data || response || []);
      setHasMore(response?.hasMore || false);
    } catch (err) {
      setError('Could not load products. Localhost might be down.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(page);
  }, [page]);

  const openAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    loadProducts(page); 
  };

  return (
    <div>
      <Head 
        title="Products" 
        subtitle="Manage your software products, add-ons, and pricing variants."
        actions={<button className="btn" onClick={openAdd}>Add product</button>}
      />

      {error ? (
        <Empty 
          title="Connection Error" 
          description={error} 
          actionText="Try again" 
          onAction={() => loadProducts(page)} 
        />
      ) : loading && products.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <Empty 
          title="No products yet" 
          description="Create your first product to start building plans." 
          actionText="Add product" 
          onAction={openAdd} 
        />
      ) : (
        <div className="panel">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Sales Price</th>
                  <th style={{ textAlign: 'center' }}>Variants</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{prod.name}</td>
                    <td>
                      <Badge type="default">{prod.type}</Badge>
                    </td>
                    <td style={{ fontWeight: 600 }}>{money(prod.salesPrice)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="chip">{prod.variants?.length || 0}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn mini" 
                        onClick={() => openEdit(prod)} 
                        style={{ background: 'var(--line)', color: 'var(--ink)' }}
                      >
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
              Showing page {page}
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
                disabled={!hasMore && products.length < limit}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductForm 
          initialData={editingProduct} 
          onClose={() => setModalOpen(false)} 
          onSave={handleModalSave} 
        />
      )}
    </div>
  );
}
