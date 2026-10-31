import { useStore, FLOW } from '../store'
import { money } from '../data'
import { Badge, Head, Stepper, Empty } from '../ui'
export default function Portal() {
  const { subs, invoices, isOverdue } = useStore()
  const me = 'Aarav Traders' // backend me logged-in customer ki id se aayega
  const mine = subs.filter(s => s.customer === me); const inv = invoices.filter(i => i.customer === me)
  return (<>
    <Head title={'Welcome, ' + me} />
    <section className="panel"><h3>Your subscriptions</h3>{mine.length ? mine.map(s => <div className="item" key={s.id}><b>{s.id}</b> · {s.plan} <Badge s={s.status} /><Stepper steps={FLOW} at={s.status} /><p>Renews until {s.expiry}</p></div>) : <Empty text="Abhi koi subscription nahi hai." />}</section>
    <section className="panel"><h3>Your invoices</h3><table><tbody>{inv.map(i => <tr key={i.id}><td>{i.id}</td><td>{i.period}</td><td className="num">{money(i.total)}</td><td>due {i.due}</td><td><Badge s={isOverdue(i) ? 'Overdue' : i.status} /></td></tr>)}</tbody></table></section></>)
}
