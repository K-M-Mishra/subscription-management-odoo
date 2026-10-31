import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '12px 16px',
    textDecoration: 'none',
    color: isActive ? 'var(--loop)' : 'var(--mute)',
    backgroundColor: isActive ? 'var(--loop-soft)' : 'transparent',
    borderRadius: '6px',
    marginBottom: '4px',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--paper)' }}>
      
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: 'white', 
        borderRight: '1px solid var(--line)', 
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Bricolage Grotesque', color: 'var(--ink)' }}>Brightloop</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/" style={navLinkStyle}>Dashboard</NavLink>
          <NavLink to="/subscriptions" style={navLinkStyle}>Subscriptions</NavLink>
          <NavLink to="/invoices" style={navLinkStyle}>Billing & Invoices</NavLink>
          <NavLink to="/products" style={navLinkStyle}>Products</NavLink>
          <NavLink to="/catalog" style={navLinkStyle}>Plans & Catalog</NavLink>
          <NavLink to="/discounts" style={navLinkStyle}>Discounts</NavLink>
          
          <div style={{ margin: '24px 0', height: '1px', backgroundColor: 'var(--line)' }} />
          
          <NavLink to="/portal" style={navLinkStyle}>Customer Portal View</NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'none', 
              border: '1px solid var(--line)', 
              borderRadius: '6px', 
              color: 'var(--warn)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}
