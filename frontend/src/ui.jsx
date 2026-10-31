const STATUS_LABELS = {
  draft: 'Draft',
  quotation: 'Quotation',
  confirmed: 'Confirmed',
  active: 'Active',
  closed: 'Closed',
  paid: 'Paid',
  cancelled: 'Cancelled',
  outstanding: 'Outstanding',
  overdue: 'Overdue',
  paused: 'Paused',
};

const STATUS_STYLES = {
  draft: 'muted',
  quotation: 'primary',
  confirmed: 'primary',
  active: 'ok',
  closed: 'muted',
  paid: 'ok',
  cancelled: 'muted',
  outstanding: 'warn',
  overdue: 'warn',
  paused: 'warn',
};

const SUBSCRIPTION_STEPS = [
  { value: 'draft', label: 'Draft' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

function normalizeStatus(status) {
  return String(status ?? '').trim().toLowerCase();
}

/* Status label: Active, Paid, Draft, etc. */
export function Badge({ status, children }) {
  const key = normalizeStatus(status);
  const style = STATUS_STYLES[key] ?? 'muted';

  const label =
    children ??
    STATUS_LABELS[key] ??
    (key ? String(status) : 'Unknown');

  return (
    <span className={`badge ${style}`}>
      {label}
    </span>
  );
}

/* Dashboard number card */
export function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>

      <p className="stat-value">
        {value ?? '—'}
      </p>

      {hint != null && (
        <p className="stat-hint">{hint}</p>
      )}
    </div>
  );
}

/* Page title, description and optional actions */
export function Head({ title, subtitle, actions }) {
  return (
    <header className="head">
      <div>
        <h1>{title}</h1>

        {subtitle && (
          <p>{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="head-actions">
          {actions}
        </div>
      )}
    </header>
  );
}

/* Message shown when a list has no records */
export function Empty({
  title = 'Nothing here yet',
  description = 'Add your first record to get started.',
  action,
}) {
  return (
    <div className="empty">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        className="muted"
        aria-hidden="true"
      >
        <rect
          x="8"
          y="10"
          width="32"
          height="30"
          rx="6"
          stroke="currentColor"
          strokeWidth="2"
        />

        <path
          d="M16 10V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"
          stroke="currentColor"
          strokeWidth="2"
        />

        <path
          d="M17 22h14M17 29h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <h2>{title}</h2>

      <p>{description}</p>

      {action && (
        <div className="actions">
          {action}
        </div>
      )}
    </div>
  );
}

/* Subscription lifecycle progress */
export function Stepper({ status }) {
  const currentStatus = normalizeStatus(status);

  const currentIndex = SUBSCRIPTION_STEPS.findIndex(
    (step) => step.value === currentStatus
  );

  if (currentIndex === -1) {
    return (
      <p className="field-error" role="status">
        Subscription status is unavailable. Refresh the page to try again.
      </p>
    );
  }

  return (
    <ol
      className="stepper"
      aria-label="Subscription progress"
    >
      {SUBSCRIPTION_STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        const className = isCurrent
          ? 'is-current'
          : isComplete
            ? 'is-complete'
            : '';

        const accessibleState = isCurrent
          ? 'Current step'
          : isComplete
            ? 'Completed'
            : 'Upcoming';

        return (
          <li
            key={step.value}
            className={className}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span
              className="stepper-number"
              aria-hidden="true"
            >
              {isComplete ? '✓' : index + 1}
            </span>

            <span>{step.label}</span>

            <span className="sr-only">
              {`: ${accessibleState}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}