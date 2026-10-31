import React, { useState, useEffect } from 'react';
import { Head, Badge, Empty, Stat } from '../ui';
import { money, formatDate } from '../data';
import { portal } from '../api';

export default function Portal() {
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, invoicesRes] = await Promise.all([
        portal.mySubscriptions({ limit: 5 }),
        portal.myInvoices({ limit: 5 })
      ]);
      setSubs(subsRes?.data || subsRes || []);
      setInvoices(invoicesRes?.data || invoicesRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load your portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading your workspace...</div>;
  }

  if (error) {
    return <Empty title="Error" description={error} actionText="Retry" onAction={fetchPortalData} />;
  }

  const activeSubsCount = subs.filter(s => s.status?.toLowerCase() === 'active').length;

  return (
    <div>
      <Head 
        title="Customer Portal" 
        subtitle="Manage your subscriptions and view billing history."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="panel">
          <Stat title="Active Subscriptions" value={activeSubsCount} />
        </div>
        <div className="panel">
          <Stat title="Recent Invoices" value={invoices.length} />
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3 className="head" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>My Subscriptions</h3>
          {subs.length === 0 ? (
            <Empty title="No Subscriptions" description="You do not have any active plans." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.planName}</td>
                    <td>
                      {s.status?.toLowerCase() === 'active' ? <Badge type="ok">Active</Badge> : <Badge type="mute">{s.status}</Badge>}
                    </td>
                    <td>{money(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h3 className="head" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>My Invoices</h3>
          {invoices.length === 0 ? (
            <Empty title="No Invoices" description="You have no recent billing history." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 600 }}>{money(inv.amount)}</td>
                    <td>
                      {inv.status?.toLowerCase() === 'paid' ? <Badge type="ok">Paid</Badge> : <Badge type="warn">{inv.status}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}