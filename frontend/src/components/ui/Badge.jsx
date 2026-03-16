import React from 'react';
import './Badge.css';

/**
 * Badge Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'success'|'warning'|'danger'|'info'|'default'} props.variant - Badge color variant
 * @param {'sm'|'md'|'lg'} props.size - Badge size
 * @param {boolean} props.dot - Show as dot indicator
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  ...rest
}) => {
  if (dot) {
    return (
      <span
        className={`badge-dot badge-dot-${variant} ${className}`}
        role="status"
        aria-label={`Status: ${variant}`}
        {...rest}
      />
    );
  }

  return (
    <span
      className={`
        badge 
        badge-${variant} 
        badge-${size}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...rest}
    >
      {icon && (
        <span className="badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="badge-text">{children}</span>
    </span>
  );
};

export default Badge;
