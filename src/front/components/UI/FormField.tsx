import React from 'react';
import { Input, InputProps } from './Input';
import './FormField.css';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  id,
  ...inputProps
}) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="ui-form-field">
      <Input
        {...inputProps}
        id={fieldId}
        label={
          <>
            {label}
            {required && <span className="ui-form-field-required"> *</span>}
          </>
        }
        error={error}
        helperText={helperText}
      />
    </div>
  );
};

