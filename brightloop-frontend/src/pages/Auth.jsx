import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // Client-side validation
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required to log in.';
    if (!password) errors.password = 'Password is required to log in.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await auth.login({ email, password });
      
      // Save token and redirect
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        // Save role if backend sends it (for layout filtering)
        if (res.user?.role) {
          localStorage.setItem('role', res.user.role);
        }
        navigate('/');
      } else {
        setGlobalError('Login successful, but no token received. Please contact support.');
      }
    } catch (err) {
      setGlobalError(err.message || 'Invalid credentials. Please check your email and password.');
      if (err.fields) {
        setFieldErrors(err.fields);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="head" style={{ marginBottom: '8px' }}>Brightloop</h1>
          <p style={{ color: 'var(--mute)' }}>Sign in to manage your workspace</p>
        </div>

        {globalError && (
          <div style={{ backgroundColor: '#fbe8ec', color: 'var(--warn)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 500 }}>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderColor: fieldErrors.email ? 'var(--warn)' : 'var(--line)' }}
            />
            {fieldErrors.email && (
              <div style={{ color: 'var(--warn)', fontSize: '0.8rem', marginTop: '6px' }}>{fieldErrors.email}</div>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderColor: fieldErrors.password ? 'var(--warn)' : 'var(--line)' }}
            />
            {fieldErrors.password && (
              <div style={{ color: 'var(--warn)', fontSize: '0.8rem', marginTop: '6px' }}>{fieldErrors.password}</div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
      </div>
    </div>
  );
}