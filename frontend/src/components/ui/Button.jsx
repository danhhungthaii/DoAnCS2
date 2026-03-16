import React from 'react';
import './Button.css';

/**
 * Button Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button style variant
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} props.size - Button size
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.fullWidth - Full width button
 * @param {React.ReactNode} props.icon - Icon element (before text)
 * @param {React.ReactNode} props.iconRight - Icon element (after text)
 * @param {Function} props.onClick - Click handler
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconRight = null,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) => {
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={`
        btn 
        btn-${variant} 
        btn-${size} 
        ${loading ? 'btn-loading' : ''} 
        ${fullWidth ? 'btn-full-width' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true"></span>
      )}
      
      {!loading && icon && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      
      <span className="btn-text">{children}</span>
      
      {!loading && iconRight && (
        <span className="btn-icon-right" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
};

export default Button;
