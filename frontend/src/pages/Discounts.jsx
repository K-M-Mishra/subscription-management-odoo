import { useState } from 'react'
import { useStore } from '../store'
import { Head } from '../ui'
export default function Discounts() {
  const { discounts, addDiscount } = useStore()
  const [d, setD] = useState({ name: '', type: '%', value: 5, minQty: 1, start: '', end: '', limit: 10 })
  const set = k => e => setD({ ...d, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })
  return (<>
    <Head title="Discount rules" />
    <div className="grid2">
      <section className="panel"><h3>Active rules</h3><table><thead><tr><th>Name</th><th>Value</th><th>Min qty</th><th>Valid</th><th>Used</th></tr></thead>
        <tbody>{discounts.map(x => <tr key={x.id}><td>{x.name}</td><td>{x.type === '%' ? x.value + '%' : '₹' + x.value}</td><td>{x.minQty}</td><td>{x.start} → {x.end}</td><td>{x.used}/{x.limit}{x.used >= x.limit && <span className="chip">Used up</span>}</td></tr>)}</tbody></table></section>
      <form className="panel" onSubmit={e => { e.preventDefault(); addDiscount(d) }}><h3>New rule</h3>
        <label>Name<input required value={d.name} onChange={set('name')} /></label>
        <div className="two"><label>Type<select value={d.type} onChange={set('type')}><option>%</option><option>₹</option></select></label><label>Value<input type="number" min="1" value={d.value} onChange={set('value')} /></label></div>
        <div className="two"><label>Minimum quantity<input type="number" min="1" value={d.minQty} onChange={set('minQty')} /></label><label>Usage limit<input type="number" min="1" value={d.limit} onChange={set('limit')} /></label></div>
        <div className="two"><label>Starts<input type="date" required value={d.start} onChange={set('start')} /></label><label>Ends<input type="date" required value={d.end} onChange={set('end')} /></label></div>
        <button className="btn">Create rule</button><p className="hint">Rule agle invoice par apne aap lagega aur expire hote hi ruk jayega.</p></form>
    </div></>)
}
