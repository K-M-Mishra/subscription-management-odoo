import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useSession } from '../session';
import { Alert, Field } from '../ui';
export default function Auth({ mode }) {
  const { setUser } = useSession(),
    navigate = useNavigate(),
    [search] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' }),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setError('');
    setMessage('');
    setForm({ name: '', email: '', password: '' });
  }, [mode]);
  const title = {
    login: 'Welcome back.',
    signup: 'Create your account.',
    'forgot-password': 'Forgot your password?',
    'reset-password': 'Set a new password.',
  }[mode];
  const input = (key, props = {}) => (
    <Field
      label={key[0].toUpperCase() + key.slice(1)}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      required
      {...props}
    />
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api('/auth/' + mode, {
        method: 'POST',
        body: { ...form, token: search.get('token') },
      });
      if (result.token) {
        localStorage.setItem('token', result.token);
        setUser(result.user);
        navigate(result.user.role === 'customer' ? '/portal' : '/dashboard');
      } else setMessage(result.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">b</span>brightloop.
        </div>
        <span className="eyebrow">ONE WORKSPACE. EVERY BILLING CYCLE.</span>
        <h1>
          Great relationships.
          <br />
          Recurring growth.
        </h1>
        <p>Keep your subscriptions, invoices and payments moving together.</p>
        <div className="orbit">
          <div className="orbit-core">b</div>
          <span>Subscriptions</span>
          <span>Invoices</span>
          <span>Payments</span>
        </div>
        <small>Built for a clearer view of your business.</small>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <p className="eyebrow">YOUR WORKSPACE AWAITS</p>
          <h1>{title}</h1>
          <p className="muted">
            {mode === 'login'
              ? 'Sign in to your Brightloop account.'
              : 'Secure access to your subscriptions and billing.'}
          </p>
          <Alert>{error}</Alert>
          <Alert success>{message}</Alert>
          <form onSubmit={submit}>
            {mode === 'signup' && input('name', { autoComplete: 'name' })}
            {mode !== 'reset-password' &&
              input('email', { type: 'email', autoComplete: 'email' })}
            {mode !== 'forgot-password' &&
              input('password', {
                type: 'password',
                minLength: mode === 'login' ? 1 : 9,
                autoComplete:
                  mode === 'login' ? 'current-password' : 'new-password',
              })}
            {['signup', 'reset-password'].includes(mode) && (
              <p className="muted small">
                Use 9+ characters, uppercase, lowercase and a special character.
              </p>
            )}
            <button className="btn" disabled={busy}>
              {busy
                ? 'Please wait…'
                : {
                    login: 'Sign in →',
                    signup: 'Create account',
                    'forgot-password': 'Send reset link',
                    'reset-password': 'Update password',
                  }[mode]}
            </button>
          </form>
          <div className="auth-links">
            {mode === 'login' ? (
              <>
                <Link to="/forgot-password">Forgot password?</Link>
                <Link to="/signup">Create an account</Link>
              </>
            ) : (
              <Link to="/login">Back to sign in</Link>
            )}
          </div>
          {import.meta.env.DEV && mode === 'login' && (
            <div className="demo">
              <strong>Local demo access</strong>
              <span>admin@brightloop.test</span>
              <span>Password: Brightloop@123</span>
              <small>
                Staff/customer: change “admin” to “staff” or “customer”.
              </small>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
