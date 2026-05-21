import React from 'react';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  type = 'button',
  ...props
}) {
  const classes = [
    'button',
    variant !== 'default' && variant,
    size !== 'default' && size,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} type={type} {...props}>
      {loading ? (
        <Spinner size={14} />
      ) : Icon ? (
        <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

export function Spinner({ size = 16, className = '' }) {
  return (
    <svg
      className={`spinner ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`badge ${tone} ${className}`}>{children}</span>;
}

export function Metric({ label, value, note, className = '' }) {
  return (
    <div className={`card metric ${className}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}

export function Card({ children, className = '', ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function Alert({ tone = 'info', children, className = '', style }) {
  return <div className={`alert ${tone} ${className}`} style={style}>{children}</div>;
}

export function Empty({ children, className = '' }) {
  return <div className={`empty ${className}`}>{children}</div>;
}

export function Skeleton({ variant = 'text', width, height, className = '' }) {
  const classes = {
    text: 'skeleton skeleton-text',
    title: 'skeleton skeleton-title',
    card: 'skeleton skeleton-card',
    circle: 'skeleton skeleton-circle'
  }[variant] || 'skeleton skeleton-text';

  return (
    <div
      className={`${classes} ${className}`}
      style={{
        ...(width && { width }),
        ...(height && { height })
      }}
    />
  );
}

export function Tooltip({ children, text }) {
  return (
    <div className="tooltip-wrapper">
      {children}
      <span className="tooltip">{text}</span>
    </div>
  );
}

export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segment ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ label, checked, onChange, className = '', ...props }) {
  return (
    <label className={`switch ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} {...props} />
      {label}
    </label>
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="screen-center">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Spinner size={28} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </div>
  );
}
