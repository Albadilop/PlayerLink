import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const inputClasses = `
    ui-input
    ${error ? 'ui-input--error' : ''}
    ${fullWidth ? 'ui-input--full-width' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`ui-input-wrapper ${fullWidth ? 'ui-input-wrapper--full-width' : ''}`}>
      {label && (
        <label htmlFor={props.id} className="ui-input-label">
          {label}
        </label>
      )}
      <input
        {...props}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${props.id}-help` : undefined}
      />
      {error && (
        <span id={`${props.id}-help`} className="ui-input-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${props.id}-help`} className="ui-input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
};

