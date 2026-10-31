import { useState } from 'react'
import { useStore, INV_FLOW } from '../store'
import { money, today } from '../data'
import { Badge, Head, Stepper } from '../ui'
export default function Billing() {
  const { invoices, runBilling, setInvoice, recordPayment, paidOf, isOverdue, payments } = useStore()
  const [pay, setPay] = useState(null); const [form, setForm] = useState({ method: 'UPI', amount: '', date: today(), note: '' })
  const submit = e => { e.preventDefault(); recordPayment({ ...form, invoiceId: pay.id }); setPay(null) }
  return (<>
    <Head title="Billing"><button className="btn" onClick={runBilling}>Run billing for this month</button></Head>
    <section className="panel"><table>
      <thead><tr><th>Invoice</th><th>Customer</th><th>Period</th><th className="num">Discount</th><th className="num">Tax</th><th className="num">Total</th><th className="num">Paid</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{[...invoices].reverse().map(i => <tr key={i.id}>
        <td>{i.id}</td><td>{i.customer}</td><td>{i.period}</td><td className="num">{i.disc ? '−' + money(i.disc) : '—'}</td><td className="num">{money(i.tax)}</td><td className="num">{money(i.total)}</td><td className="num">{money(paidOf(i.id))}</td>
        <td><Badge s={isOverdue(i) ? 'Overdue' : i.status} /></td>
        <td className="acts">
          {i.status === 'Draft' && <button className="mini" onClick={() => setInvoice(i.id, 'Confirmed')}>Confirm</button>}
          {i.status !== 'Paid' && <button className="mini" onClick={() => { setPay(i); setForm(f => ({ ...f, amount: i.total - paidOf(i.id) })) }}>Record payment</button>}
          <button className="mini" onClick={() => window.print()}>Print</button></td></tr>)}</tbody></table></section>
    {pay && <div className="modal" onClick={() => setPay(null)}><form className="card" onClick={e => e.stopPropagation()} onSubmit={submit}>
      <h3>Payment for {pay.id}</h3><Stepper steps={INV_FLOW} at={pay.status} />
      <label>Method<select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>{['UPI', 'Card', 'Bank transfer', 'Cheque', 'Cash'].map(m => <option key={m}>{m}</option>)}</select></label>
      <label>Amount<input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
      <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
      <label>Note<input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
      <button className="btn">Save payment</button></form></div>}
    <p className="hint">{payments.length} payments recorded. Ek period ka invoice dobara nahi banta — billing button safe hai.</p></>)
}
