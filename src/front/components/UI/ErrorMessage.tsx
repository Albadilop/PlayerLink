import React from 'react';
import './ErrorMessage.css';

export interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  variant = 'error',
}) => {
  if (!message) return null;

  const messageClasses = `
    ui-error-message
    ui-error-message--${variant}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={messageClasses} role="alert">
      <div className="ui-error-message-content">
        <span className="ui-error-message-icon">
          {variant === 'error' && '⚠️'}
          {variant === 'warning' && '⚠️'}
          {variant === 'info' && 'ℹ️'}
        </span>
        <span className="ui-error-message-text">{message}</span>
      </div>
      {onDismiss && (
        <button
          className="ui-error-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

