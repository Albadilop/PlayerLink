import { useState, useCallback, useMemo } from 'react';
import { PASSWORD_RULES } from '../constants/index';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const usePasswordValidation = () => {
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassword = useCallback((pwd: string): PasswordValidationResult => {
    const validationErrors: string[] = [];

    if (pwd.length < PASSWORD_RULES.MIN_LENGTH) {
      validationErrors.push(`at least ${PASSWORD_RULES.MIN_LENGTH} characters`);
    }

    if (PASSWORD_RULES.REQUIRES_UPPERCASE && !PASSWORD_RULES.VALIDATION_PATTERNS.UPPERCASE.test(pwd)) {
      validationErrors.push('an uppercase letter');
    }

    if (PASSWORD_RULES.REQUIRES_NUMBER && !PASSWORD_RULES.VALIDATION_PATTERNS.NUMBER.test(pwd)) {
      validationErrors.push('a number');
    }

    if (PASSWORD_RULES.REQUIRES_SPECIAL_CHAR && !PASSWORD_RULES.VALIDATION_PATTERNS.SPECIAL.test(pwd)) {
      validationErrors.push(`a special character (${PASSWORD_RULES.SPECIAL_CHARS})`);
    }

    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (validationErrors.length === 0) {
      if (pwd.length >= 12) {
        strength = 'strong';
      } else if (pwd.length >= 8) {
        strength = 'medium';
      }
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      strength,
    };
  }, []);

  const handlePasswordChange = useCallback((newPassword: string) => {
    setPassword(newPassword);
    const validation = validatePassword(newPassword);
    setErrors(validation.errors);
    return validation;
  }, [validatePassword]);

  const validation = useMemo(() => validatePassword(password), [password, validatePassword]);

  return {
    password,
    errors,
    isValid: validation.isValid,
    strength: validation.strength,
    handlePasswordChange,
    validatePassword,
  };
};

