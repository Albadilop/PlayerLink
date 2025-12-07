import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const buttonClasses = `
    ui-button
    ui-button--${variant}
    ui-button--${size}
    ${fullWidth ? 'ui-button--full-width' : ''}
    ${isLoading ? 'ui-button--loading' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      {...props}
      className={buttonClasses}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="ui-button-spinner" />
          <span className="ui-button-loading-text">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

