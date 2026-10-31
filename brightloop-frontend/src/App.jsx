import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetail from './pages/SubscriptionDetail';
import SubscriptionForm from './pages/SubscriptionForm';
import Catalog from './pages/Catalog';
import ProductForm from './pages/ProductForm';
import Billing from './pages/Billing';
import Discounts from './pages/Discounts';
import Portal from './pages/Portal';
import Auth from './pages/Auth';
import Products from "./pages/Product";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/new" element={<SubscriptionForm />} /> 
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        
        <Route path="/products" element={<Catalog />} />
        <Route path="/products/new" element={<ProductForm />} />
        
        <Route path="/invoices" element={<Billing />} />
        <Route path="/discounts" element={<Discounts />} />
        
        <Route path="/portal/*" element={<Portal />} />
        
        <Route path="*" element={
          <div className="panel" style={{ textAlign: 'center', padding: '48px' }}>
            <h2>Page not found</h2>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
