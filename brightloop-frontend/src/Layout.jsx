import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={
        <div className="panel" style={{ maxWidth: '400px', margin: '100px auto' }}>
          <h2>Brightloop Login</h2>
          <p className="mute">Enter your credentials to continue.</p>
        </div>
      } />

      {/* Protected Routes inside Layout */}
      <Route element={<Layout />}>
        
        <Route path="/" element={
          <div>
            <h1 className="head">Dashboard</h1>
            <p className="mute">Finance overview and quick stats.</p>
          </div>
        } />

        <Route path="/subscriptions" element={<div><h1>Subscriptions</h1></div>} />
        <Route path="/invoices" element={<div><h1>Invoices</h1></div>} />
        <Route path="/products" element={<div><h1>Products</h1></div>} />
        
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