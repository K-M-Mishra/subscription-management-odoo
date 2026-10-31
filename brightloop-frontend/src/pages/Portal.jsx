import React, { useState, useEffect } from 'react';
import { Head, Empty, Badge } from '../ui';
import { money, formatDate } from '../data';
import { getPlans, createPlan } from '../api';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPlans({ page, limit });
      setPlans(response?.data || response || []);
      setTotalPages(response?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page]);

  return (
    <div>
      <Head 
        title="Subscription Plans" 
        description="Manage billing cycles, pricing, and behaviors for your software plans."
      >
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          Create plan
        </button>
      </Head>

      {error && !plans.length ? (
        <Empty 
          title="Could not load plans" 
          description={error} 
          actionText="Try Again" 
          onAction={fetchPlans} 
        />
      ) : loading && plans.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading plans...</div>
      ) : plans.length === 0 ? (
        <Empty 
          title="No plans found" 
          description="Create your first subscription plan to start selling." 
          actionText="Create plan"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <>
          <div className="grid2">
            {plans.map((plan) => (
              <div className="panel" key={plan.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Bricolage Grotesque' }}>{plan.name}</h3>
                    <div style={{ color: 'var(--mute)', fontSize: '14px', marginTop: '4px' }}>
                      Min qty: {plan.minQuantity || 1}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)' }}>
                      {money(plan.price)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                      {plan.billingCycle}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--mute)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <strong>Available:</strong> {plan.availableFrom ? formatDate(plan.availableFrom) : 'Always'} 
                    {' - '} 
                    {plan.availableTo ? formatDate(plan.availableTo) : 'Forever'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                  {plan.autoClose && <span className="chip">Auto-closes</span>}
                  {plan.canCloseEarly && <span className="chip">Closes early</span>}
                  {plan.canPause && <span className="chip">Pausable</span>}
                  {plan.canRenew && <span className="chip">Renewable</span>}
                  {!plan.autoClose && !plan.canCloseEarly && !plan.canPause && !plan.canRenew && (
                    <span className="chip" style={{ opacity: 0.5 }}>Standard behavior</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button 
              className="btn mini" 
              style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', alignSelf: 'center', color: 'var(--mute)' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn mini" 
              style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
              disabled={page === totalPages || plans.length < limit} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <PlanForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPlans();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

export function PlanForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    minQuantity: 1,
    availableFrom: '',
    availableTo: '',
    autoClose: false,
    canCloseEarly: false,
    canPause: false,
    canRenew: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError('Plan name is required.');
    if (Number(formData.price) < 0 || formData.price === '') return setError('Valid price is required.');
    if (Number(formData.minQuantity) < 1) return setError('Minimum quantity must be at least 1.');
    
    if (formData.availableFrom && formData.availableTo) {
      if (new Date(formData.availableFrom) > new Date(formData.availableTo)) {
        return setError('Available To date must be after Available From date.');
      }
    }

    setIsSubmitting(true);
    try {
      await createPlan({
        ...formData,
        price: Number(formData.price),
        minQuantity: Number(formData.minQuantity)
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create plan. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16, 28, 51, 0.4)', zIndex: 99 }} 
        onClick={onCancel}
      />
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'Bricolage Grotesque' }}>Create plan</h2>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--mute)', lineHeight: 1 }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="planName">Plan name</label>
              <input id="planName" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., Enterprise Annual, Standard Monthly" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="planPrice">Price (INR)</label>
                <input id="planPrice" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="billingCycle">Billing cycle</label>
                <select id="billingCycle" name="billingCycle" value={formData.billingCycle} onChange={handleChange}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="minQuantity">Minimum quantity</label>
              <input id="minQuantity" name="minQuantity" type="number" min="1" step="1" value={formData.minQuantity} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="availableFrom">Available from (optional)</label>
                <input id="availableFrom" name="availableFrom" type="date" value={formData.availableFrom} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="availableTo">Available to (optional)</label>
                <input id="availableTo" name="availableTo" type="date" value={formData.availableTo} onChange={handleChange} />
              </div>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'var(--paper)', borderRadius: '6px' }}>
              <strong style={{ fontSize: '14px' }}>Behaviors</strong>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                <input type="checkbox" name="autoClose" checked={formData.autoClose} onChange={handleChange} style={{ width: 'auto' }} />
                Closes automatically at end date
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                <input type="checkbox" name="canCloseEarly" checked={formData.canCloseEarly} onChange={handleChange} style={{ width: 'auto' }} />
                Can be closed early
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                <input type="checkbox" name="canPause" checked={formData.canPause} onChange={handleChange} style={{ width: 'auto' }} />
                Can be paused
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                <input type="checkbox" name="canRenew" checked={formData.canRenew} onChange={handleChange} style={{ width: 'auto' }} />
                Can be renewed
              </label>
            </div>

            {error && <span className="form-error">{error}</span>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn" style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }} onClick={onCancel} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create plan'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
