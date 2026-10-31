import { Field } from './ui';
import { money } from './data';
export default function LineEditor({
  lines,
  setLines,
  products = [],
  taxes = [],
}) {
  const change = (index, key, value) =>
    setLines(
      lines.map((l, i) =>
        i === index
          ? {
              ...l,
              [key]: value,
              ...(key === 'productId' ? { variantId: '' } : {}),
            }
          : l,
      ),
    );
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Product lines</h2>
          <p className="muted small">
            Prices come from the catalog. Taxes apply automatically from the
            selected rule.
          </p>
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={() =>
            setLines([
              ...lines,
              { productId: '', variantId: '', quantity: 1, taxId: '' },
            ])
          }
        >
          + Add line
        </button>
      </div>
      {!lines.length && <p className="empty">Add at least one product line.</p>}
      {lines.map((l, i) => {
        const p = products.find((p) => p.id === l.productId),
          v = p?.variants.find((v) => v.id === l.variantId),
          tax = taxes.find((t) => t.id === l.taxId),
          unit = (p?.salesPrice || 0) + (v?.extraPrice || 0);
        return (
          <div className="order-line" key={i}>
            <Field label="Product">
              <select
                required
                value={l.productId}
                onChange={(e) => change(i, 'productId', e.target.value)}
              >
                <option value="">Choose product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Variant">
              <select
                value={l.variantId}
                onChange={(e) => change(i, 'variantId', e.target.value)}
              >
                <option value="">Base version</option>
                {p?.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (+{money(v.extraPrice)})
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Quantity"
              type="number"
              min="1"
              max="100000"
              required
              value={l.quantity}
              onChange={(e) => change(i, 'quantity', Number(e.target.value))}
            />
            <Field label="Tax">
              <select
                value={l.taxId}
                onChange={(e) => change(i, 'taxId', e.target.value)}
              >
                <option value="">No tax</option>
                {taxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <small className="muted">Line estimate</small>
              <strong>
                {money(
                  (Math.round(unit * l.quantity * 100) / 100) *
                    (1 + (tax?.rate || 0) / 100),
                )}
              </strong>
            </div>
            <button
              type="button"
              className="text-btn danger"
              aria-label={'Remove line ' + (i + 1)}
              onClick={() => setLines(lines.filter((_, j) => i !== j))}
            >
              Remove
            </button>
          </div>
        );
      })}
    </section>
  );
}
