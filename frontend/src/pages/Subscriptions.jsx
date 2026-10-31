import { useState } from 'react'
import { useStore, FLOW } from '../store'
import { money } from '../data'
import { Badge, Head, Stepper, Empty } from '../ui'
export default function Subscriptions() {
  const { subs, advanceSub } = useStore(); const [f, setF] = useState('All'); const [open, setOpen] = useState(null)
  const list = subs.filter(s => f === 'All' || s.status === f)
  const total = s => s.lines.reduce((a, l) => a + l.qty * l.price, 0)
  return (<>
    <Head title="Subscriptions"><select value={f} onChange={e => setF(e.target.value)}>{['All', ...FLOW].map(x => <option key={x}>{x}</option>)}</select></Head>
    <section className="panel">
      {list.length ? <table>
        <thead><tr><th>Number</th><th>Customer</th><th>Plan</th><th>Expiry</th><th className="num">Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(s => [
          <tr key={s.id} onClick={() => setOpen(open === s.id ? null : s.id)} className="click"><td>{s.id}</td><td>{s.customer}</td><td>{s.plan}</td><td>{s.expiry}</td><td className="num">{money(total(s))}</td><td><Badge s={s.status} /></td>
            <td>{s.status !== 'Closed' && <button className="mini" onClick={e => { e.stopPropagation(); advanceSub(s.id) }}>Move to {FLOW[FLOW.indexOf(s.status) + 1]}</button>}</td></tr>,
          open === s.id && <tr key={s.id + 'd'}><td colSpan="7" className="detail"><Stepper steps={FLOW} at={s.status} />
            <p>Starts {s.start} · Payment terms: {s.terms} · Billed {s.cycle.toLowerCase()}</p>
            <table><thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr></thead>
              <tbody>{s.lines.map(l => <tr key={l.product}><td>{l.product}</td><td className="num">{l.qty}</td><td className="num">{money(l.price)}</td><td className="num">{money(l.qty * l.price)}</td></tr>)}</tbody></table></td></tr>])}</tbody>
      </table> : <Empty text="Is status me koi subscription nahi hai." />}
    </section></>)
}
