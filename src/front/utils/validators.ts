import { PASSWORD_RULES } from '../constants/index';

/**
 * Valida un email
 * @param email - Email a validar
 * @returns true si es válido, false si no
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

/**
 * Valida una contraseña según las reglas definidas
 * @param password - Contraseña a validar
 * @returns Objeto con isValid y array de errores
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    errors.push(`at least ${PASSWORD_RULES.MIN_LENGTH} characters`);
  }

  if (PASSWORD_RULES.REQUIRES_UPPERCASE && !PASSWORD_RULES.VALIDATION_PATTERNS.UPPERCASE.test(password)) {
    errors.push('an uppercase letter');
  }

  if (PASSWORD_RULES.REQUIRES_NUMBER && !PASSWORD_RULES.VALIDATION_PATTERNS.NUMBER.test(password)) {
    errors.push('a number');
  }

  if (PASSWORD_RULES.REQUIRES_SPECIAL_CHAR && !PASSWORD_RULES.VALIDATION_PATTERNS.SPECIAL.test(password)) {
    errors.push(`a special character (${PASSWORD_RULES.SPECIAL_CHARS})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida que dos contraseñas coincidan
 * @param password - Primera contraseña
 * @param confirmPassword - Segunda contraseña
 * @returns true si coinciden, false si no
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Valida que un campo no esté vacío
 * @param value - Valor a validar
 * @param fieldName - Nombre del campo (para mensaje de error)
 * @returns Objeto con isValid y mensaje de error
 */
export const validateRequired = (value: unknown, fieldName: string = 'Field'): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }
  return { isValid: true };
};

/**
 * Valida que un número esté en un rango
 * @param value - Valor numérico
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Objeto con isValid y mensaje de error
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } => {
  if (value < min || value > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { isValid: true };
};

/**
 * Valida que un string tenga una longitud mínima
 * @param value - String a validar
 * @param minLength - Longitud mínima
 * @param fieldName - Nombre del campo
 * @returns Objeto con isValid y mensaje de error
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string = 'Field'
): { isValid: boolean; error?: string } => {
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  return { isValid: true };
};

