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
    variants: initialData?.variants || [] // STEP 3: Variants array add kiya
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

  // STEP 3: Variants handle karne ke functions
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
      // Backend api call (Abhi fail hoga agar localhost down hai, hum baad mein fix karenge)
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
    <div className="modal">
      <div className="panel" style={{ maxWidth: '750px', margin: '2rem auto', width: '90%' }}>
        <Head 
          title={formData.id ? "Edit product" : "Add product"} 
          description="Configure product details, pricing, and variants."
        />

        {serverError && (
          <div className="badge" style={{ backgroundColor: 'var(--warn)', color: '#fff', marginBottom: '1rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label>Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Brightloop Pro" />
              {fieldErrors.name && <div className="mini" style={{ color: 'var(--warn)' }}>{fieldErrors.name}</div>}
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

          <div className="grid2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label>Sales Price (INR)</label>
              <input type="number" name="salesPrice" value={formData.salesPrice} onChange={handleChange} min="0" step="0.01" />
              {fieldErrors.salesPrice && <div className="mini" style={{ color: 'var(--warn)' }}>{fieldErrors.salesPrice}</div>}
            </div>
            <div>
              <label>Cost Price (INR)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" step="0.01" style={{ flex: 1 }} />
                <Badge label={`Margin: ${margin}%`} type={margin > 0 ? "success" : "warning"} />
              </div>
              {fieldErrors.costPrice && <div className="mini" style={{ color: 'var(--warn)' }}>{fieldErrors.costPrice}</div>}
            </div>
          </div>

          <div className="grid2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label>Tax (%)</label>
              <input type="number" name="tax" value={formData.tax} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <label>Notes</label>
              <input name="notes" value={formData.notes} onChange={handleChange} placeholder="Internal notes" />
            </div>
          </div>

          {/* STEP 3: VARIANTS SECTION */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ margin: 0 }}>Product Variants</label>
              <button type="button" className="btn mini" onClick={handleAddVariant}>Add variant row</button>
            </div>
            
            {fieldErrors.variants && <div className="mini" style={{ color: 'var(--warn)', marginBottom: '1rem' }}>{fieldErrors.variants}</div>}

            {formData.variants.length === 0 ? (
              <div className="mini" style={{ color: 'var(--mute)', padding: '1rem', background: 'var(--paper)', borderRadius: '4px' }}>
                No variants added. Base price will apply.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {formData.variants.map((variant, index) => {
                  const extra = parseFloat(variant.extraPrice) || 0;
                  const finalPrice = sPrice + extra;

                  return (
                    <div key={variant.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        placeholder="Attribute (e.g. Brand)" 
                        value={variant.attribute} 
                        onChange={(e) => handleVariantChange(index, 'attribute', e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <input 
                        placeholder="Value (e.g. Odoo)" 
                        value={variant.value} 
                        onChange={(e) => handleVariantChange(index, 'value', e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <div style={{ position: 'relative', width: '120px' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', fontSize: '0.9rem' }}>+</span>
                        <input 
                          type="number"
                          placeholder="Extra" 
                          value={variant.extraPrice} 
                          onChange={(e) => handleVariantChange(index, 'extraPrice', e.target.value)} 
                          style={{ width: '100%', paddingLeft: '20px' }}
                        />
                      </div>
                      <div style={{ width: '100px', fontSize: '0.9rem', color: 'var(--mute)', textAlign: 'right' }}>
                        = {money(finalPrice)}
                      </div>
                      <button 
                        type="button" 
                        className="btn mini" 
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--warn)', background: 'transparent', border: 'none' }}
                        onClick={() => handleRemoveVariant(index)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      setProducts(response.data || []);
      setHasMore(response.hasMore || false);
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
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Head title="Products" description="Manage your software products, add-ons, and pricing variants." />
        <button className="btn" onClick={openAdd}>Add product</button>
      </div>

      {error && (
        <div className="panel" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>
          <p>{error}</p>
          <button className="btn mini" onClick={() => loadProducts(page)}>Try again</button>
        </div>
      )}

      {!error && loading && products.length === 0 && <div className="mini" style={{ color: 'var(--mute)' }}>Loading products...</div>}

      {!error && !loading && products.length === 0 && (
        <Empty title="No products yet" description="Create your first product to start building plans." action={{ label: "Add product", onClick: openAdd }} />
      )}

      {products.length > 0 && (
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'var(--paper)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Sales Price</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Variants</th>
                <th style={{ padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--ink)' }}>{prod.name}</td>
                  <td style={{ padding: '1rem' }}><Badge label={prod.type} /></td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{money(prod.salesPrice)}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className="chip">{prod.variants?.length || 0}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn mini" onClick={() => openEdit(prod)} style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <div className="mini" style