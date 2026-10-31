import { useStore } from '../store'
import { money } from '../data'
import { Head } from '../ui'
export default function Catalog() {
  const { products, plans } = useStore()
  return (<>
    <Head title="Products & plans" />
    <div className="grid2">
      <section className="panel"><h3>Products</h3>{products.map(p => <div className="item" key={p.id}><b>{p.name}</b> <small>{p.type}</small>
        <p>Sale {money(p.sales)} · Cost {money(p.cost)} · {p.notes}</p>
        {p.variants.map(v => <span className="chip" key={v.value}>{v.attr}: {v.value} {v.extra ? '+' + money(v.extra) : ''}</span>)}</div>)}</section>
      <section className="panel"><h3>Plans</h3>{plans.map(p => <div className="item" key={p.id}><b>{p.name}</b> <small>{p.cycle}</small>
        <p>{money(p.price)} per {p.cycle === 'Yearly' ? 'year' : 'month'} · min qty {p.minQty} · available {p.from} to {p.to}</p>
        {p.autoClose && <span className="chip">Closes on its own</span>}{p.closable && <span className="chip">Can close early</span>}{p.pausable && <span className="chip">Pausable</span>}{p.renewable && <span className="chip">Renewable</span>}</div>)}</section>
    </div></>)
}
