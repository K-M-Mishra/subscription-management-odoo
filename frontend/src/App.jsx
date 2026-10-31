import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { useStore } from './store'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Billing from './pages/Billing'
import Catalog from './pages/Catalog'
import Discounts from './pages/Discounts'
import Portal from './pages/Portal'

const NAV = [['/', 'Dashboard', ['admin', 'staff']], ['/subscriptions', 'Subscriptions', ['admin', 'staff']], ['/billing', 'Billing', ['admin', 'staff']], ['/catalog', 'Products & plans', ['admin', 'staff']], ['/discounts', 'Discounts', ['admin']], ['/portal', 'My subscriptions', ['customer']]]

export default function App() {
  const { user, logout } = useAuth(); const { toast } = useStore()
  if (!user) return <Auth />
  const home = user.role === 'customer' ? '/portal' : '/'
  const allow = roles => roles.includes(user.role)
  return (
    <div className="shell">
      <aside>
        <div className="brand"><svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="none" stroke="#7f95ff" strokeWidth="4" strokeDasharray="48 15" /></svg>brightloop</div>
        <nav>{NAV.filter(n => allow(n[2])).map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
        <div className="me"><b>{user.name}</b><span>{user.role}</span><button onClick={logout}>Log out</button></div>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={allow(['admin', 'staff']) ? <Dashboard /> : <Navigate to={home} />} />
          <Route path="/subscriptions" element={allow(['admin', 'staff']) ? <Subscriptions /> : <Navigate to={home} />} />
          <Route path="/billing" element={allow(['admin', 'staff']) ? <Billing /> : <Navigate to={home} />} />
          <Route path="/catalog" element={allow(['admin', 'staff']) ? <Catalog /> : <Navigate to={home} />} />
          <Route path="/discounts" element={allow(['admin']) ? <Discounts /> : <Navigate to={home} />} />
          <Route path="/portal" element={allow(['customer']) ? <Portal /> : <Navigate to={home} />} />
          <Route path="*" element={<Navigate to={home} />} />
        </Routes>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
