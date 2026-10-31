import { useEffect, useState } from 'react';
export function useLoad(loader, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.resolve()
      .then(loader)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [...deps, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
export function Head({ title, subtitle, actions }) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">BRIGHTLOOP WORKSPACE</p>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="actions">{actions}</div>
    </header>
  );
}
export function Alert({ children, success = false }) {
  return children ? (
    <div
      role={success ? 'status' : 'alert'}
      className={`alert ${success ? 'success' : ''}`}
    >
      {children}
    </div>
  ) : null;
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export function Badge({ children }) {
  return (
    <span className={'badge ' + String(children).toLowerCase()}>
      {children}
    </span>
  );
}
export function Stat({ title, value, hint }) {
  return (
    <div className="panel stat">
      <p className="muted">{title}</p>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Table({ columns, rows = [], empty = 'No records yet.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id || r.month}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td className="empty" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Pager({ data, page, setPage }) {
  return (
    <div className="pager">
      <span>
        {data?.total || 0} records · Page {page}
      </span>
      <div className="actions">
        <button
          className="btn secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="btn secondary"
          disabled={!data || page * data.limit >= data.total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function Loading({ load, children }) {
  if (load.error)
    return (
      <Alert>
        {load.error}{' '}
        <button className="text-btn" onClick={load.reload}>
          Retry
        </button>
      </Alert>
    );
  if (load.loading && !load.data)
    return <p className="panel muted">Loading your workspace…</p>;
  return children;
}
export const today = () => new Date().toISOString().slice(0, 10);
