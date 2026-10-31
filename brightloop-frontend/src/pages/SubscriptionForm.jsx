import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head } from '../ui';
import { money } from '../data';
import { subscriptions } from '../api';

// --- MOCK DATA FOR HACKATHON UI ---
const mockCustomers = [
  { id: 'c1', name: 'Acme Corp' },
  { id: 'c2', name: 'Global Tech' },
  { id: 'c3', name: 'Stark Industries' }
];

const mockPlans = [
  { id: 'p1', name: 'Basic Plan', minQuantity: 1 },
  { id: 'p2', name: 'Pro Plan', minQuantity: 5 },
  { id: 'p3', name: 'Enterprise Plan', minQuantity: 20 }
];

const mockProducts = [
  { id: 'prod1', name: 'Cloud Storage', basePrice: 500, variants: [{ id: 'v1', name: '100GB (+$0)', price: 0 }, { id: 'v2', name: '1TB (+$200)', price: 200 }] },
  { id: 'prod2', name: 'API Analytics', basePrice: 1500, variants: [{ id: 'v3', name: 'Standard (+$0)', price: 0 }, { id: 'v4', name: 'Premium (+$500)', price: 500 }] }
];

const mockTemplates = [
  { 
    id: 't1', 
    name: 'Standard Cloud Startup', 
    planId: 'p2', 
    lines: [{ productId: 'prod1', variantId: 'v2', quantity: 5, unitPrice: 700, taxRate: 18 }] 
  }
];

export default function SubscriptionForm() {
  const navigate = useNavigate();

  // Basic Form State
  const [templateId, setTemplateId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  
  // Lines State
  const [lines, setLines] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Computed minimum quantity based on selected plan
  const activePlan = mockPlans.find(p => p.id === planId);
  const minQty = activePlan?.minQuantity || 1;

  // Handle Template Auto-fill
  const handleTemplateChange = (e) => {
    const tId = e.target.value;
    setTemplateId(tId);
    
    if (tId) {
      const template = mockTemplates.find(t => t.id === tId);
      if (template) {
        setPlanId(template.planId);
        setLines(template.lines.map(l => ({ ...l, id: Date.now() + Math.random() })));
      }
    }
  };

  // Line Management
  const addLine = () => {
    setLines([...lines, { id: Date.now(), productId: '', variantId: '', quantity: minQty, unitPrice: 0, taxRate: 0 }]);
  };

  const removeLine = (id) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLines(lines.map(line => {
      if (line.id !== id) return line;
      const updatedLine = { ...line, [field]: value };
      
      // Auto-calculate unit price when product or variant changes
      if (field === 'productId' || field === 'variantId') {
        const prod = mockProducts.find(p => p.id === updatedLine.productId);
        if (prod) {
          const variant = prod.variants.find(v => v.id === updatedLine.variantId);
          const extra = variant ? variant.price : 0;
          updatedLine.unitPrice = prod.basePrice + extra;
        } else {
          updatedLine.unitPrice = 0;
        }
      }

      // Enforce minimum quantity logic
      if (field === 'quantity') {
        let q = parseInt(value, 10) || 0;
        if (q < minQty) q = minQty;
        updatedLine.quantity = q;
      }
      
      return updatedLine;
    }));
  };

  // Live Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    
    lines.forEach(line => {
      const lineAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      subtotal += lineAmount;
      taxTotal += lineAmount * ((Number(line.taxRate) || 0) / 100);
    });

    return { subtotal, taxTotal, total: subtotal + taxTotal };
  }, [lines]);

  // Submit Handler
  const handleSubmit = async (targetStatus) => {
    setError(null);
    
    // Validations
    if (!customerId) return setError("Please select a customer.");
    if (!planId) return setError("Please select a plan.");
    if (lines.length === 0) return setError("Please add at least one order line.");
    
    setLoading(true);
    try {
      const payload = {
        customerId,
        planId,
        startDate,
        expiryDate,
        paymentTerms,
        status: targetStatus,
        lines: lines.map(({ id, ...rest }) => rest), // remove temp ids
        amount: totals.total
      };

      await subscriptions.create(payload);
      navigate('/subscriptions');
    } catch (err) {
      setError(err.message || 'Failed to create subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head 
        title="New Subscription" 
        subtitle="Create a new subscription or quotation draft."
      />

      {error && (
        <div style={{ backgroundColor: '#fbe8ec', color: 'var(--warn)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* 1. Optional Template Selection */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Start from a Template (Optional)</h3>
        <select value={templateId} onChange={handleTemplateChange} style={{ maxWidth: '400px' }}>
          <option value="">-- Blank Subscription --</option>
          {mockTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* 2. Basic Details */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Basic Details</h3>
        <div className="grid2">
          <div>
            <label>Customer *</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Search customer...</option>
              {mockCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Plan *</label>
            <select value={planId} onChange={e => {
              setPlanId(e.target.value);
              // Reset quantities if plan changes minQty
              const newPlan = mockPlans.find(p => p.id === e.target.value);
              const newMin = newPlan?.minQuantity || 1;
              setLines(lines.map(l => ({ ...l, quantity: Math.max(l.quantity, newMin) })));
            }}>
              <option value="">Select a plan</option>
              {mockPlans.map(p => <option key={p.id} value={p.id}>{p.name} (Min Qty: {p.minQuantity})</option>)}
            </select>
          </div>
          <div>
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <label>Payment Terms</label>
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
              <option value="Immediate">Immediate</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Order Lines */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Order Lines</h3>
          <button type="button" className="btn mini" onClick={addLine}>+ Add Line</button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '800px', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th style={{ width: '100px' }}>Qty (Min: {minQty})</th>
                <th style={{ width: '150px' }}>Unit Price (₹)</th>
                <th style={{ width: '100px' }}>Tax (%)</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Amount</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--mute)', padding: '24px' }}>
                    No lines added yet.
                  </td>
                </tr>
              ) : (
                lines.map(line => {
                  const selectedProd = mockProducts.find(p => p.id === line.productId);
                  const amount = (line.quantity || 0) * (line.unitPrice || 0);
                  const lineTax = amount * ((line.taxRate || 0) / 100);
                  const totalLineAmount = amount + lineTax;

                  return (
                    <tr key={line.id}>
                      <td>
                        <select value={line.productId} onChange={e => updateLine(line.id, 'productId', e.target.value)}>
                          <option value="">Select...</option>
                          {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={line.variantId} onChange={e => updateLine(line.id, 'variantId', e.target.value)} disabled={!line.productId}>
                          <option value="">Base Version</option>
                          {selectedProd?.variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" min={minQty} value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" min="0" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" min="0" max="100" value={line.taxRate} onChange={e => updateLine(line.id, 'taxRate', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {money(totalLineAmount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => removeLine(line.id)} style={{ background: 'none', border: 'none', color: 'var(--warn)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--mute)' }}>Subtotal:</span>
              <span style={{ fontWeight: 500 }}>{money(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--mute)' }}>Tax:</span>
              <span style={{ fontWeight: 500 }}>{money(totals.taxTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--loop)' }}>
              <span>Total:</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
        <button 
          className="btn" 
          style={{ background: 'var(--line)', color: 'var(--ink)' }}
          onClick={() => handleSubmit('draft')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save as draft'}
        </button>
        <button 
          className="btn" 
          onClick={() => handleSubmit('quotation')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save and send quotation'}
        </button>
      </div>

    </div>
  );
}