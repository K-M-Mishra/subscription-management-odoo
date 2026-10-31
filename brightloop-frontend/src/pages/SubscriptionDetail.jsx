import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Head, Badge, Stepper, Empty } from '../ui';
import { money, formatDate } from '../data';
import { subscriptions } from '../api';

const STATUS_STEPS = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export default function SubscriptionDetail() {
  const { id } = useParams(); // URL se ID nikalne ke liye
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moving, setMoving] = useState(false);
  
  // Tabs manage karne ke liye state
  const [activeTab, setActiveTab] = useState('lines'); // 'lines' ya 'invoices'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptions.get(id);
      setData(res?.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // "Move to next status" ka logic
  const handleMoveStatus = async () => {
    if (!data || !data.status) return;
    
    const currentLower = data.status.toLowerCase();
    const currentIndex = STATUS_STEPS.findIndex(s => s.toLowerCase() === currentLower);
    
    if (currentIndex === -1 || currentIndex >= STATUS_STEPS.length - 1) return;
    const nextStatus = STATUS_STEPS[currentIndex + 1].toLowerCase();

    setMoving(true);
    try {
      await subscriptions.updateStatus(id, nextStatus);
      await fetchData(); // Status change hone par naya data fetch karo
    } catch (err) {
      alert(err.message || 'Failed to move status.');
    } finally {
      setMoving(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading details...</div>;
  }

  if (error) {
    return <Empty title="Error" description={error} actionText="Retry" onAction={fetchData} />;
  }

  if (!data) return null;

  // Stepper aur button ke liye status calculation
  const currentStatusLower = (data.status || 'draft').toLowerCase();
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.toLowerCase() === currentStatusLower);
  const isClosed = currentStatusLower === 'closed';
  const nextStatusName = !isClosed && currentStepIndex !== -1 ? STATUS_STEPS[currentStepIndex + 1] : null;

  return (
    <div>
      {/* Header with Details */}
      <Head 
        title={`Subscription #${data.subscriptionNumber || id}`}
        subtitle="View full details, billing lines, and status history."
        actions={
          nextStatusName && (
            <button className="btn" onClick={handleMoveStatus} disabled={moving}>
              {moving ? 'Moving...' : `Move to ${nextStatusName}`}
            </button>
          )
        }
      />

      <div className="panel" style={{ marginBottom: '24px' }}>
        {/* Visual Stepper */}
        <Stepper steps={STATUS_STEPS} currentStep={currentStepIndex === -1 ? 0 : currentStepIndex} />
        
        {/* Core Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}>
          <div>
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem', marginBottom: '4px' }}>Customer</p>
            <p style={{ fontWeight: 600 }}>{data.customerName || 'Unknown Customer'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem', marginBottom: '4px' }}>Plan</p>
            <p style={{ fontWeight: 500 }}>{data.planName || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem', marginBottom: '4px' }}>Start Date</p>
            <p>{formatDate(data.startDate)}</p>
          </div>
          <div>
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem', marginBottom: '4px' }}>Payment Terms</p>
            <p>{data.paymentTerms || 'Net 30'}</p>
          </div>
        </div>
      </div>

      {/* Tabs UI */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--line)' }}>
        <button 
          onClick={() => setActiveTab('lines')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', borderBottom: activeTab === 'lines' ? '2px solid var(--loop)' : '2px solid transparent', color: activeTab === 'lines' ? 'var(--loop)' : 'var(--mute)', fontWeight: 600 }}
        >
          Order Lines
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', borderBottom: activeTab === 'invoices' ? '2px solid var(--loop)' : '2px solid transparent', color: activeTab === 'invoices' ? 'var(--loop)' : 'var(--mute)', fontWeight: 600 }}
        >
          Linked Invoices
        </button>
      </div>

      {/* Tab Content */}
      <div className="panel">
        {activeTab === 'lines' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(!data.lines || data.lines.length === 0) ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--mute)' }}>No order lines found.</td>
                  </tr>
                ) : (
                  data.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>{line.productName}</td>
                      <td style={{ textAlign: 'right' }}>{line.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{money(line.unitPrice)}</td>
                      <td style={{ textAlign: 'right' }}>{money(line.taxAmount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(line.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.lines && data.lines.length > 0 && (
                <tfoot style={{ borderTop: '2px solid var(--line)' }}>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 600, padding: '16px' }}>Total Amount:</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '16px', color: 'var(--loop)' }}>{money(data.amount)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!data.invoices || data.invoices.length === 0) ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--mute)' }}>No invoices generated yet.</td>
                  </tr>
                ) : (
                  data.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 500 }}>{inv.invoiceNumber}</td>
                      <td>{formatDate(inv.issueDate)}</td>
                      <td style={{ fontWeight: 600 }}>{money(inv.amount)}</td>
                      <td><Badge>{inv.status}</Badge></td>
                      <td>
                        <Link to={`/invoices/${inv.id}`} className="btn mini">View</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}