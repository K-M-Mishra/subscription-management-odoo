import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Head, Stat, Badge, Empty } from '../ui';
import { money, formatDate } from '../data';
import { getSummary, getRevenue, getOverdue } from '../api';

export default function Dashboard() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');

  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [overdue, setOverdue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const globalParams = { startDate, endDate };
      
      const [summaryData, revenueData, overdueData] = await Promise.all([
        getSummary(globalParams),
        getRevenue(globalParams),
        getOverdue({ ...globalParams, q: search, customerId })
      ]);

      setSummary(summaryData?.data || summaryData);
      setRevenue(revenueData?.data || revenueData || []);
      setOverdue(overdueData?.data || overdueData || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDashboardData();
    }, 300);
    return () => clearTimeout(handler);
  }, [startDate, endDate, search, customerId]);

  if (loading && !summary) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <Empty 
        title="Failed to load dashboard" 
        description={error} 
        actionText="Try Again" 
        onAction={fetchDashboardData} 
      />
    );
  }

  return (
    <div>
      <Head 
        title="Finance Dashboard" 
        subtitle="Overview of your subscriptions and revenue."
      >
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
      </Head>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '24px', 
        marginBottom: '24px' 
      }}>
        <div className="panel">
          <Stat title="Active Subscriptions" value={summary?.activeSubscriptions || 0} />
        </div>
        <div className="panel">
          <Stat title="Monthly Recurring Revenue" value={money(summary?.mrr || 0)} />
        </div>
        <div className="panel">
          <Stat title="Collected This Month" value={money(summary?.collected || 0)} />
        </div>
        <div className="panel">
          <Stat title="Still Owed (Outstanding)" value={money(summary?.outstanding || 0)} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Bricolage Grotesque', fontSize: '18px', marginBottom: '24px' }}>
          Revenue (Last 6 Months)
        </h3>
        {revenue.length === 0 ? (
          <Empty title="No revenue data" description="There is no recorded revenue in this period." />
        ) : (
          <RevenueChart data={revenue} />
        )}
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Bricolage Grotesque', fontSize: '18px', margin: 0 }}>
            Overdue Invoices
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Search invoice..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '200px' }}
            />
            <input 
              type="text" 
              placeholder="Filter by Customer ID" 
              value={customerId} 
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {overdue.length === 0 ? (
            <Empty title="All clear!" description="No overdue invoices found for the selected criteria." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={{ fontWeight: '500' }}>{invoice.invoiceNumber}</td>
                    <td>{invoice.customerName}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td style={{ fontWeight: '600' }}>{money(invoice.amount)}</td>
                    <td>
                      <Badge type="warn">Overdue</Badge>
                    </td>
                    <td>
                      <Link to={`/invoices/${invoice.id}`} className="btn mini">
                        View Invoice
                      </Link>
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

function RevenueChart({ data }) {
  const safeData = Array.isArray(data) ? data : [];
  const maxAmount = Math.max(...safeData.map(d => Number(d.amount) || 0), 1);
  const chartHeight = 220; 

  if (safeData.length === 0) return null;

  return (
    <div>
      <div style={{ position: 'relative', height: `${chartHeight}px`, width: '100%', borderBottom: '1px solid var(--line)' }}>
        <svg width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {safeData.map((d, i) => {
            const barWidthPercentage = 80 / safeData.length; 
            const xPosPercentage = (i * (100 / safeData.length)) + ((100 / safeData.length) / 2);
            const amt = Number(d.amount) || 0;
            const height = (amt / maxAmount) * chartHeight;
            const yPos = chartHeight - height;

            return (
              <g key={i}>
                <rect 
                  x={`calc(${xPosPercentage}% - ${barWidthPercentage / 2}%)`} 
                  y={yPos} 
                  width={`${barWidthPercentage}%`} 
                  height={height} 
                  fill="var(--loop)" 
                  rx="4"
                  style={{ transition: 'all 0.3s ease' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        {safeData.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--mute)' }}>{d.label || d.month}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)' }}>{money(d.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
