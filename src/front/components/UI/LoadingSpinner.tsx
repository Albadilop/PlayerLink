import React from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const spinnerClasses = `
    ui-spinner
    ui-spinner--${size}
    ${fullScreen ? 'ui-spinner--fullscreen' : ''}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <div className="ui-spinner-container">
      <div className={spinnerClasses} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
      {message && <p className="ui-spinner-message">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="ui-spinner-overlay">
        {content}
      </div>
    );
  }

  return content;
};

