import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head } from '../ui';

export default function ProductForm() {
  const navigate = useNavigate();
  
  // Basic Info State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Variants State
  const [variants, setVariants] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), name: '', extraPrice: 0 }]);
  };

  const updateVariant = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) return setError('Product name is required.');
    if (!basePrice || isNaN(basePrice)) return setError('Valid base price is required.');

    setLoading(true);
    try {
      const payload = {
        name,
        code,
        description,
        basePrice: Number(basePrice),
        active: isActive,
        variants: variants.map(({ id, ...rest }) => ({
          name: rest.name,
          price: Number(rest.extraPrice)
        }))
      };
      
      // API call aayegi yahan baad mein
      console.log("Mock Submit Product:", payload);
      
      // Save ke baad catalog page par wapas bhej do
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head 
        title="Add New Product" 
        subtitle="Create a software product or plan with pricing variants."
      />

      {error && (
        <div style={{ backgroundColor: '#fbe8ec', color: 'var(--warn)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel">
        {/* Basic Info */}
        <div className="grid2" style={{ marginBottom: '32px' }}>
          <div>
            <label>Product Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cloud Storage Pro" />
          </div>
          <div>
            <label>Code / SKU</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CS-PRO-01" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="Brief details..."></textarea>
          </div>
          <div>
            <label>Base Price (₹) *</label>
            <input type="number" min="0" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 'auto', accentColor: 'var(--loop)' }} />
              Product is Active
            </label>
          </div>
        </div>

        {/* Variants Section */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Variants (Add-ons or Tiers)</h3>
            <button type="button" className="btn mini" onClick={addVariant}>+ Add Variant</button>
          </div>
          
          {variants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--mute)', background: 'var(--page)', borderRadius: '6px' }}>
              No variants added. Base price will be used.
            </div>
          ) : (
            variants.map((v) => (
              <div key={v.id} style={{ display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label>Variant Name</label>
                  <input type="text" value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="e.g. +100GB Space" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Additional Price (+₹)</label>
                  <input type="number" min="0" value={v.extraPrice} onChange={e => updateVariant(v.id, 'extraPrice', e.target.value)} placeholder="0" />
                </div>
                <button type="button" onClick={() => removeVariant(v.id)} className="btn mini" style={{ marginBottom: '4px', background: '#fbe8ec', color: 'var(--warn)' }}>✕</button>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
          <button type="button" className="btn" style={{ background: 'var(--line)', color: 'var(--ink)' }} onClick={() => navigate('/products')}>Cancel</button>
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}