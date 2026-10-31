import { useState } from 'react'
import { useStore } from '../store'
import { money } from '../data'
import { Badge, Head, Stat, Empty } from '../ui'
export default function Dashboard() {
  const { subs, invoices, payments, revenue, isOverdue, paidOf } = useStore()
  const [q, setQ] = useState('')
  const active = subs.filter(s => s.status === 'Active')
  const mrr = active.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.qty * l.price, 0) / (s.cycle === 'Yearly' ? 12 : 1), 0)
  const collected = payments.reduce((a, p) => a + p.amount, 0)
  const owed = invoices.filter(i => i.status !== 'Paid').reduce((a, i) => a + i.total - paidOf(i.id), 0)
  const overdue = invoices.filter(isOverdue).filter(i => (i.customer + i.id).toLowerCase().includes(q.toLowerCase()))
  const max = Math.max(...revenue.map(r => r[1]))
  return (<>
    <Head title="Finance overview" />
    <div className="stats">
      <Stat label="Active subscriptions" value={active.length} />
      <Stat label="Monthly recurring revenue" value={money(Math.round(mrr))} />
      <Stat label="Collected" value={money(collected)} />
      <Stat label="Still owed" value={money(owed)} tone="warn" />
    </div>
    <div className="grid2">
      <section className="panel"><h3>Revenue, last 6 months (₹ thousand)</h3>
        <div className="bars">{revenue.map(([m, v]) => <div key={m}><i style={{ height: (v / max) * 100 + '%' }}><b>{v}</b></i><span>{m}</span></div>)}</div></section>
      <section className="panel"><div className="row"><h3>Overdue invoices</h3><input placeholder="Search customer or invoice" value={q} onChange={e => setQ(e.target.value)} /></div>
        {overdue.length ? <table><tbody>{overdue.map(i => <tr key={i.id}><td>{i.id}</td><td>{i.customer}</td><td>due {i.due}</td><td className="num">{money(i.total - paidOf(i.id))}</td><td><Badge s="Overdue" /></td></tr>)}</tbody></table> : <Empty text="Koi overdue invoice nahi. Badhiya." />}
      </section>
    </div></>)
}
