import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Session, useSession } from './session';
import { api } from './api';
import Layout from './Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetail from './pages/SubscriptionDetail';
import SubscriptionForm from './pages/SubscriptionForm';
import Catalog from './pages/Catalog';
import ProductForm from './pages/ProductForm';
import Billing from './pages/Billing';
import InvoiceDetail from './pages/InvoiceDetail';
import Payments from './pages/Payments';
import Portal from './pages/Portal';
import Templates from './pages/Templates';
function Guard({ roles }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return roles && !roles.includes(user.role) ? (
    <Navigate
      to={user.role === 'customer' ? '/portal' : '/dashboard'}
      replace
    />
  ) : (
    <Outlet />
  );
}
export default function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const logout = () => setUser(null);
    window.addEventListener('brightloop:logout', logout);
    if (localStorage.getItem('token'))
      api('/auth/me')
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setReady(true));
    else setReady(true);
    return () => window.removeEventListener('brightloop:logout', logout);
  }, []);
  if (!ready) return <p className="panel">Opening Brightloop…</p>;
  return (
    <Session.Provider value={{ user, setUser }}>
      <Routes>
        {['login', 'signup', 'forgot-password', 'reset-password'].map((p) => (
          <Route key={p} path={'/' + p} element={<Auth mode={p} />} />
        ))}
        <Route element={<Guard />}>
          <Route element={<Layout />}>
            <Route
              index
              element={
                <Navigate
                  to={user?.role === 'customer' ? '/portal' : '/dashboard'}
                  replace
                />
              }
            />
            <Route element={<Guard roles={['admin', 'staff']} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="subscriptions/new" element={<SubscriptionForm />} />
              <Route
                path="subscriptions/:id"
                element={<SubscriptionDetail />}
              />
              <Route
                path="products"
                element={<Catalog kind="products" key="products" />}
              />
              <Route path="products/new" element={<ProductForm />} />
              <Route
                path="catalog"
                element={<Catalog kind="plans" key="plans" />}
              />
              <Route
                path="plans"
                element={<Navigate to="/catalog" replace />}
              />
              <Route
                path="taxes"
                element={<Catalog kind="taxes" key="taxes" />}
              />
              <Route
                path="discounts"
                element={<Catalog kind="discounts" key="discounts" />}
              />
              <Route path="templates" element={<Templates />} />
              <Route
                path="customers"
                element={<Catalog kind="customers" key="customers" />}
              />
              <Route path="invoices" element={<Billing />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="payments" element={<Payments />} />
            </Route>
            <Route element={<Guard roles={['admin']} />}>
              <Route
                path="staff"
                element={<Catalog kind="staff" key="staff" />}
              />
            </Route>
            <Route element={<Guard roles={['customer']} />}>
              <Route path="portal" element={<Portal />} />
              <Route
                path="portal/subscriptions/:id"
                element={<SubscriptionDetail portal />}
              />
              <Route
                path="portal/invoices/:id"
                element={<InvoiceDetail portal />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Session.Provider>
  );
}
