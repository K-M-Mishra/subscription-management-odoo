import { createContext, useContext, useState } from 'react'
const Ctx = createContext(); export const useAuth = () => useContext(Ctx)
export const checkPassword = p => {
  const e = []
  if (p.length <= 8) e.push('9 ya usse zyada characters')
  if (!/[A-Z]/.test(p)) e.push('ek uppercase letter')
  if (!/[a-z]/.test(p)) e.push('ek lowercase letter')
  if (!/[^A-Za-z0-9]/.test(p)) e.push('ek special character')
  return e
}
const users = [{ email: 'admin@brightloop.io', role: 'admin', name: 'Admin' }, { email: 'staff@brightloop.io', role: 'staff', name: 'Riya (Staff)' }, { email: 'aarav@traders.in', role: 'customer', name: 'Aarav Traders' }]
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const signup = (email, password) => {
    if (users.some(u => u.email === email.toLowerCase())) return 'Ye email pehle se registered hai.'
    const miss = checkPassword(password); if (miss.length) return 'Password me chahiye: ' + miss.join(', ')
    const u = { email, role: 'customer', name: email.split('@')[0] }; users.push(u); setUser(u); return ''
  }
  const demoLogin = role => setUser(users.find(u => u.role === role))
  return <Ctx.Provider value={{ user, signup, demoLogin, logout: () => setUser(null) }}>{children}</Ctx.Provider>
}
