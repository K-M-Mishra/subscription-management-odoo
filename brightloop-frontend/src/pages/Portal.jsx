import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Head, Empty, Badge, Stepper } from '../ui';
import { money, formatDate } from '../data';
import { getPortalSubscriptions, getPortalInvoices, downloadPortalInvoice } from '../api';

const STATUS_STEPS = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export default function Portal() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, invsRes] = await Promise.all([
        getPortalSubscriptions({ limit: 50 }),
        getPortalInvoices({ limit: 50 })
      ]);
      
      setSubscriptions(subsRes?.data || subsRes || []);
      setInvoices(invsRes?.data || invsRes || []);
    } catch (err) {
      setError('We had trouble loading your account details. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (invoiceId, invoiceNumber) => {
    try {
      const blob = await downloadPortalInvoice(invoiceId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('We could not download your invoice right now. Please try again later.');
    }
  };

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Gathering your account details...</div>;
  }

  if (error) {
    return <Empty title="Something went wrong" description={error} actionText="Refresh page" onAction={fetchData} />;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Head 
        title="My Account" 
        description="Welcome back. Here is an overview of your subscriptions and billing history."
      />

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontFamily: 'Bricolage Grotesque', marginBottom: '16px' }}>My Subscriptions</h2>
        
        {subscriptions.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--mute)', margin: 0 }}>You don't have any subscriptions with us yet.</p>
          </div>
        ) : (
          <div className="grid2">
            {subscriptions.map(sub => {
              const currentStep = STATUS_STEPS.indexOf(sub.status) >= 0 ? STATUS_STEPS.indexOf(sub.status) : 3;
              
              return (
                <div key={sub.id} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Bricolage Grotesque' }}>
                        {sub.productName || 'Subscription'}
                      </h3>
                      <div style={{ color: 'var(--mute)', fontSize: '14px', marginTop: '4px' }}>
                        {sub.planName} Plan
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600', color: 'var(--ink)' }}>
                      {money(sub.amount)}
                    </div>
                  </div>

                  <div style={{ padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
                    <Stepper steps={STATUS_STEPS} currentStep={currentStep} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontSize: '14px', color: 'var(--mute)' }}>
                      {sub.nextBillingDate ? (
                        <>Next bill on <strong>{formatDate(sub.nextBillingDate)}</strong></>
                      ) : (
                        'No upcoming bills'
                      )}
                    </div>
                    <Link to={`/portal/subscriptions/${sub.id}`} className="btn mini">
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontFamily: 'Bricolage Grotesque', marginBottom: '16px' }}>Billing History</h2>
        
        <div className="panel">
          <div className="table-wrapper">
            {invoices.length === 0 ? (
              <p style={{ color: 'var(--mute)', margin: 0, textAlign: 'center', padding: '16px' }}>
                You have no invoices at this time.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td style={{ fontWeight: '500' }}>{invoice.invoiceNumber}</td>
                      <td>{formatDate(invoice.date)}</td>
                      <td style={{ fontWeight: '600' }}>{money(invoice.amount)}</td>
                      <td>
                        <Badge type={
                          invoice.status === 'Paid' ? 'ok' :
                          invoice.status === 'Cancelled' ? 'warn' : 'default'
                        }>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                          className="btn mini" 
                          style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
