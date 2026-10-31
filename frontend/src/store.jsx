import { createContext, useContext, useState } from 'react'
import { seed, today, TAX_RATE } from './data'
const Ctx = createContext(); export const useStore = () => useContext(Ctx)
export const FLOW = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed']
export const INV_FLOW = ['Draft', 'Confirmed', 'Paid']
const qtyOf = s => s.lines.reduce((a, l) => a + l.qty, 0)
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5).toISOString().slice(0, 10)

export function StoreProvider({ children }) {
  const [subs, setSubs] = useState(seed.subs)
  const [invoices, setInvoices] = useState(seed.invoices)
  const [payments, setPayments] = useState(seed.payments)
  const [discounts, setDiscounts] = useState(seed.discounts)
  const [toast, setToast] = useState('')
  const say = m => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const advanceSub = id => setSubs(s => s.map(x => x.id === id && x.status !== 'Closed' ? { ...x, status: FLOW[FLOW.indexOf(x.status) + 1] } : x))
  const setInvoice = (id, status) => setInvoices(v => v.map(i => i.id === id ? { ...i, status } : i))
  const paidOf = id => payments.filter(p => p.invoiceId === id).reduce((a, p) => a + p.amount, 0)
  const isOverdue = i => i.status !== 'Paid' && i.due < today()

  // Billing day: har Active subscription ka ek hi invoice per period. Duplicate = skip.
  const runBilling = () => {
    const period = today().slice(0, 7); let made = 0, skipped = 0
    const next = [...invoices]; const used = {}
    subs.filter(s => s.status === 'Active').forEach(s => {
      if (next.some(i => i.subId === s.id && i.period === period)) { skipped++; return }
      const subtotal = s.lines.reduce((a, l) => a + l.qty * l.price, 0)
      const d = discounts.find(d => d.active && d.used + (used[d.id] || 0) < d.limit && qtyOf(s) >= d.minQty && d.start <= today() && d.end >= today())
      const disc = d ? (d.type === '%' ? Math.round(subtotal * d.value / 100) : d.value) : 0
      const tax = Math.round((subtotal - disc) * TAX_RATE / 100)
      if (d) used[d.id] = (used[d.id] || 0) + 1
      next.push({ id: 'INV-' + String(next.length + 1).padStart(4, '0'), subId: s.id, customer: s.customer, period, subtotal, disc, tax, total: subtotal - disc + tax, status: 'Draft', due: addDays(today(), s.terms === 'Net 30' ? 30 : s.terms === 'Net 15' ? 15 : 0) })
      made++
    })
    setInvoices(next); setDiscounts(ds => ds.map(d => ({ ...d, used: d.used + (used[d.id] || 0) })))
    say(`${made} invoice bane, ${skipped} skip (pehle se bane the).`)
  }
  const recordPayment = p => {
    const inv = invoices.find(i => i.id === p.invoiceId)
    setPayments(x => [...x, { ...p, id: 'PAY-' + (x.length + 1), amount: Number(p.amount) }])
    if (inv && paidOf(inv.id) + Number(p.amount) >= inv.total) setInvoice(inv.id, 'Paid')
    say('Payment record ho gaya.')
  }
  const addDiscount = d => { setDiscounts(x => [...x, { ...d, id: 'DSC-' + (x.length + 1), used: 0, active: true }]); say('Discount rule ban gaya.') }

  return <Ctx.Provider value={{ subs, invoices, payments, discounts, products: seed.products, plans: seed.plans, revenue: seed.revenue, advanceSub, setInvoice, runBilling, recordPayment, addDiscount, paidOf, isOverdue, toast }}>{children}</Ctx.Provider>
}
