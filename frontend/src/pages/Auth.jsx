import { useState } from 'react'
import { useAuth, checkPassword } from '../auth'
export default function Auth() {
  const { signup, demoLogin } = useAuth()
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('')
  const missing = checkPassword(pw)
  const submit = e => {
    e.preventDefault()
    if (mode === 'forgot') return setMsg(`Reset link ${email} par bhej diya gaya hai (demo).`)
    if (mode === 'signup') return setMsg(signup(email, pw))
    setMsg('Demo mode: neeche se role chuno. Real login backend ke saath judega.')
  }
  return (
    <div className="auth">
      <section className="auth-art"><h1>Har mahine ka hisaab,<br />apne aap.</h1><p>Plans, subscriptions, invoices aur payments — ek jagah.</p></section>
      <section className="auth-card">
        <h2>{mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Log in'}</h2>
        <form onSubmit={submit}>
          <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          {mode !== 'forgot' && <label>Password<input type="password" required value={pw} onChange={e => setPw(e.target.value)} /></label>}
          {mode === 'signup' && pw && <ul className="rules">{missing.length ? missing.map(m => <li key={m}>{m}</li>) : <li className="ok">Password strong hai</li>}</ul>}
          {msg && <p className="note">{msg}</p>}
          <button className="btn">{mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Log in'}</button>
        </form>
        <div className="links">
          {mode !== 'login' && <button onClick={() => setMode('login')}>Log in</button>}
          {mode !== 'signup' && <button onClick={() => setMode('signup')}>Create account</button>}
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Forgot password?</button>}
        </div>
        <div className="demo"><span>Demo ke liye seedha jao:</span>
          {['admin', 'staff', 'customer'].map(r => <button key={r} onClick={() => demoLogin(r)}>{r}</button>)}</div>
      </section>
    </div>
  )
}
