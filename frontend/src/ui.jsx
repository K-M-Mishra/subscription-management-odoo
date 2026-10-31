export const Badge = ({ s }) => <span className={'badge b-' + s.toLowerCase().replace(/\s/g, '')}>{s}</span>
export const Stat = ({ label, value, tone }) => <div className={'stat ' + (tone || '')}><div className="stat-v">{value}</div><div className="stat-l">{label}</div></div>
export const Head = ({ title, children }) => <div className="head"><h1>{title}</h1><div className="head-actions">{children}</div></div>
export const Empty = ({ text }) => <div className="empty">{text}</div>
// Lifecycle stepper: subscription kahan khadi hai, ek nazar me
export const Stepper = ({ steps, at }) => <div className="stepper">{steps.map((s, i) => <span key={s} className={i < steps.indexOf(at) ? 'done' : i === steps.indexOf(at) ? 'now' : ''}>{s}</span>)}</div>
