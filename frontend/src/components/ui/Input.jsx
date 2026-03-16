import React, { useState } from 'react';
import './Input.css';

/**
 * Input Component
 * 
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {React.ReactNode} props.icon - Icon element (left side)
 * @param {React.ReactNode} props.iconRight - Icon element (right side)
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.required - Required field
 * @param {boolean} props.fullWidth - Full width input
 * @param {'sm'|'md'|'lg'} props.size - Input size
 */
const Input = ({
  label = '',
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  hint = '',
  icon = null,
  iconRight = null,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'md',
  className = '',
  id,
  name,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div 
      className={`
        input-wrapper 
        ${fullWidth ? 'input-full-width' : ''} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div 
        className={`
          input-container 
          input-${size}
          ${error ? 'input-error' : ''} 
          ${focused ? 'input-focused' : ''}
          ${disabled ? 'input-disabled' : ''}
          ${icon ? 'input-with-icon' : ''}
          ${iconRight ? 'input-with-icon-right' : ''}
        `.trim().replace(/\s+/g, ' ')}
      >
        {icon && (
          <span className="input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="input-field"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...rest}
        />
        
        {iconRight && (
          <span className="input-icon-right" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="input-error-message" role="alert">
          {error}
        </p>
      )}
      
      {!error && hint && (
        <p id={`${inputId}-hint`} className="input-hint">
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
