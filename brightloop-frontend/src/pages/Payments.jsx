import React, { useState, useEffect } from 'react';
import { Head, Stat, Empty, Badge } from '../ui';
import { money } from '../data';
import { getPayments, recordPayment } from '../api';

export default function Payments() {
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('');

  // Data states
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayments({ startDate, endDate, method });
      // Depending on API response shape, use response.data or response
      const fetchedPayments = response.data || response || [];
      setPayments(fetchedPayments);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [startDate, endDate, method]);

  // Calculate total of the filtered (visible) rows
  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div>
      <Head 
        title="Payments" 
        description="View all received payments across your subscriptions."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ width: 'auto' }}
            />
            <span style={{ color: 'var(--mute)', fontSize: '14px' }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={{ width: 'auto' }}
            />
          </div>
        </div>
      </Head>

      {error ? (
        <Empty 
          title="Could not load payments" 
          description={error} 
          actionText="Try Again" 
          onAction={fetchPayments} 
        />
      ) : (
        <>
          <div className="panel" style={{ marginBottom: '24px', display: 'inline-block', padding: '16px 24px' }}>
            <Stat label="Total for selected period" value={money(totalAmount)} />
          </div>

          <div className="panel">
            <div className="table-wrapper">
              {loading && payments.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading payments...</div>
              ) : payments.length === 0 ? (
                <Empty 
                  title="No payments found" 
                  description="There are no payments matching your selected filters." 
                />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '500' }}>{payment.invoiceNumber || '-'}</td>
                        <td>{payment.customerName || '-'}</td>
                        <td>
                          <Badge variant="neutral">{payment.method}</Badge>
                        </td>
                        <td style={{ fontWeight: '600' }}>{money(payment.amount)}</td>
                        <td style={{ color: 'var(--mute)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {payment.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reusable RecordPaymentModal
// -----------------------------------------------------------------------------

export function RecordPaymentModal({ invoiceId, amountDue, onSuccess, onCancel }) {
  const [method, setMethod] = useState('Bank Transfer');
  const [amount, setAmount] = useState(amountDue);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const paymentAmount = Number(amount);

    // Client-side validation rules
    if (paymentAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (paymentAmount > amountDue) {
      setError('Amount cannot exceed the balance due.');
      return;
    }
    if (!method) {
      setError('Please select a payment method.');
      return;
    }
    if (!date) {
      setError('Please select a payment date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        invoiceId,
        method,
        amount: paymentAmount,
        date,
        note
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to record payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Dimmed Background Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(16, 28, 51, 0.4)',
          zIndex: 99
        }} 
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>Record payment</h2>
          <button 
            onClick={onCancel}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--mute)' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label>Amount due</label>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px' }}>
                {money(amountDue)}
              </div>
            </div>

            <div>
              <label htmlFor="paymentAmount">Amount received</label>
              <input 
                id="paymentAmount"
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                required
              />
            </div>

            <div>
              <label htmlFor="paymentMethod">Payment method</label>
              <select 
                id="paymentMethod"
                value={method} 
                onChange={(e) => setMethod(e.target.value)}
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentDate">Date</label>
              <input 
                id="paymentDate"
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                required 
              />
            </div>

            <div>
              <label htmlFor="paymentNote">Note (optional)</label>
              <textarea 
                id="paymentNote"
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Transaction ID or internal notes"
              />
            </div>

            {error && <span className="form-error">{error}</span>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record payment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}