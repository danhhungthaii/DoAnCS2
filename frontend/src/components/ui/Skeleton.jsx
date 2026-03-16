import React from 'react';
import './Skeleton.css';

/**
 * Skeleton Component - Loading placeholder
 * 
 * @param {Object} props
 * @param {'text'|'title'|'avatar'|'thumbnail'|'rectangle'} props.variant - Skeleton shape
 * @param {string} props.width - Custom width
 * @param {string} props.height - Custom height
 * @param {number} props.count - Number of skeleton lines (for text variant)
 * @param {boolean} props.animate - Enable shimmer animation
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animate = true,
  className = '',
  style = {},
  ...rest
}) => {
  const customStyle = {
    width,
    height,
    ...style,
  };

  if (variant === 'text' && count > 1) {
    return (
      <div className={`skeleton-group ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`skeleton skeleton-text ${animate ? 'skeleton-animate' : ''}`}
            style={{
              ...customStyle,
              width: index === count - 1 ? '70%' : '100%',
            }}
            {...rest}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        skeleton 
        skeleton-${variant} 
        ${animate ? 'skeleton-animate' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={customStyle}
      {...rest}
    />
  );
};

export default Skeleton;
