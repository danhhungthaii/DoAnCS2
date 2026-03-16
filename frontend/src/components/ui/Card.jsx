import React from 'react';
import './Card.css';

/**
 * Card Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {'glass'|'elevated'|'bordered'|'flat'} props.variant - Card style variant
 * @param {boolean} props.hover - Enable hover effect
 * @param {boolean} props.clickable - Make card clickable
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.header - Card header content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({
  children,
  variant = 'glass',
  hover = false,
  clickable = false,
  onClick,
  header = null,
  footer = null,
  className = '',
  ...rest
}) => {
  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={`
        card 
        card-${variant} 
        ${hover || clickable ? 'card-hover' : ''} 
        ${clickable ? 'card-clickable' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...rest}
    >
      {header && (
        <div className="card-header">
          {header}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
