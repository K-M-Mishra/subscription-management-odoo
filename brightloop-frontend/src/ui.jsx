import React from 'react';
import { Link } from 'react-router-dom';

// Simple Badge component (for status like Active, Draft, Paid, Cancelled)
export function Badge({ children, type = 'default' }) {
  // type can be 'default', 'ok', 'warn', etc. 
  // We'll rely on the base .badge class and inline color logic if needed, 
  // but for now, .badge class handles the default look defined in styles.css
  let bg = 'var(--loop-soft)';
  let color = 'var(--loop)';

  if (type === 'ok') {
    bg = '#d1f4ec';
    color = 'var(--ok)';
  } else if (type === 'warn') {
    bg = '#fbe8ec';
    color = 'var(--warn)';
  } else if (type === 'mute') {
    bg = 'var(--line)';
    color = 'var(--mute)';
  }

  return (
    <span className="badge" style={{ backgroundColor: bg, color: color }}>
      {children}
    </span>
  );
}

// Statistic component for Dashboards
export function Stat({ title, value }) {
  return (
    <div className="panel">
      <div style={{ color: 'var(--mute)', fontSize: '0.9rem', marginBottom: '8px' }}>
        {title}
      </div>
      <div className="stat" style={{ fontSize: '2rem' }}>
        {value}
      </div>
    </div>
  );
}

// Page Header component with optional right-side actions
export function Head({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div>
        <h1 className="head" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--mute)' }}>{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '12px' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// Empty State component
export function Empty({ title, description, actionText, onAction }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--mute)', marginBottom: '24px' }}>{description}</p>
      {actionText && onAction && (
        <button className="btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}

// Stepper component for wizards (like creating a subscription: Draft -> Quote -> Confirmed)
export function Stepper({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        return (
          <React.Fragment key={index}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: isActive || isPast ? 'var(--loop)' : 'var(--mute)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isActive || isPast ? 'var(--loop-soft)' : 'var(--line)',
                color: isActive || isPast ? 'var(--loop)' : 'var(--mute)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px',
                fontSize: '0.8rem'
              }}>
                {index + 1}
              </div>
              {step}
            </div>
            {index < steps.length - 1 && (
              <div style={{ height: '2px', flex: 1, backgroundColor: isPast ? 'var(--loop-soft)' : 'var(--line)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
