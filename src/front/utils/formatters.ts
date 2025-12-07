/**
 * Formatea un array de preferencias en un string legible
 * @param prefs - Array de preferencias
 * @returns String formateado (ej: "Action, Adventure and RPG.")
 */
export const formatPreferences = (prefs: string[]): string => {
  if (!prefs || prefs.length === 0) return '';
  if (prefs.length === 1) return prefs[0] + '.';
  return prefs.slice(0, -1).join(', ') + ' and ' + prefs[prefs.length - 1] + '.';
};

/**
 * Parsea un string de preferencias en un array
 * @param str - String de preferencias (ej: "Action, Adventure and RPG.")
 * @returns Array de preferencias
 */
export const parsePreferences = (str: string | null | undefined): string[] => {
  if (!str) return [];
  return str
    .replace(/\.$/, '') // quitar punto final
    .split(/, | and /) // dividir por ", " y " and "
    .map(p => p.trim()) // quitar espacios
    .filter(Boolean); // quitar vacíos
};

/**
 * Formatea un número con separadores de miles
 * @param num - Número a formatear
 * @returns String formateado (ej: "1,234")
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Formatea una fecha en formato legible
 * @param date - Fecha (Date, string o timestamp)
 * @returns String formateado (ej: "15 de enero, 2024")
 */
export const formatDate = (date: Date | string | number): string => {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a agregar (default: "...")
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

