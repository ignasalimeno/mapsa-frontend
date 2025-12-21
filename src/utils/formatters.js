/**
 * Formatea un número como moneda argentina: $1.234,56
 * @param {number} value - El valor numérico a formatear
 * @param {boolean} includeDecimals - Si incluir decimales (default: true)
 * @returns {string} - El valor formateado
 */
export const formatCurrency = (value, includeDecimals = true) => {
  if (value === null || value === undefined || value === '') return '$0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  
  const options = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };
  
  // Usar locale es-AR para formato argentino
  return '$' + num.toLocaleString('es-AR', options);
};

/**
 * Formatea un número sin signo de moneda: 1.234,56
 * @param {number} value - El valor numérico a formatear
 * @param {boolean} includeDecimals - Si incluir decimales (default: false para cantidades)
 * @returns {string} - El valor formateado
 */
export const formatNumber = (value, includeDecimals = false) => {
  if (value === null || value === undefined || value === '') return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  const options = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };
  
  return num.toLocaleString('es-AR', options);
};

/**
 * Formatea una fecha en formato DD/MM/AAAA sin cambiar el día por huso horario.
 * Acepta strings ISO como 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'.
 * No usa new Date(dateStr) para evitar el desfase -1 día.
 */
export const formatDate = (date) => {
  if (!date) return '-';
  try {
    const str = typeof date === 'string' ? date : '';
    const datePart = str.slice(0, 10);
    const [y, m, d] = datePart.split('-');
    if (!y || !m || !d) return '-';
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  } catch {
    return '-';
  }
};

/**
 * Formatea fecha y hora en formato DD/MM/AAAA HH:mm.
 * Si solo hay fecha, retorna DD/MM/AAAA.
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  const str = typeof dateTime === 'string' ? dateTime : '';
  const date = formatDate(str);
  const timePart = str.length > 10 ? str.substring(11, 16) : '';
  return timePart ? `${date} ${timePart}` : date;
};
