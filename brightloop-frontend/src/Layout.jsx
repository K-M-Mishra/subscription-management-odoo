import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from './session';
export default function Layout() {
  const { user, setUser } = useSession(),
    navigate = useNavigate();
  const nav =
    user.role === 'customer'
      ? [['/portal', 'My account']]
      : [
          ['/dashboard', 'Overview'],
          ['/subscriptions', 'Subscriptions'],
          ['/invoices', 'Invoices'],
          ['/payments', 'Payments'],
          ['/customers', 'Customers'],
          ['/products', 'Products'],
          ['/catalog', 'Plans'],
          ['/templates', 'Quote templates'],
          ['/discounts', 'Discounts'],
          ['/taxes', 'Taxes'],
          ...(user.role === 'admin' ? [['/staff', 'Team & access']] : []),
        ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/">
          <span className="brand-mark">b</span>brightloop
          <span className="brand-dot">.</span>
        </NavLink>
        <p className="nav-caption">
          {user.role === 'customer'
            ? 'CUSTOMER PORTAL'
            : 'SUBSCRIPTION OPERATIONS'}
        </p>
        <nav>
          {nav.map(([url, label]) => (
            <NavLink
              key={url}
              to={url}
              className={({ isActive }) =>
                'nav-item' + (isActive ? ' active' : '')
              }
            >
              <span className="nav-bullet" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="profile">
          <div className="avatar">{user.name[0]}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
        </div>
        <button
          className="btn secondary"
          onClick={() => {
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
