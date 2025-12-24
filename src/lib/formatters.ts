export function formatCurrency(value: number, currency: 'USD' | 'ARS' = 'USD'): string {
  const prefix = currency === 'USD' ? 'USD ' : 'ARS ';
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  
  if (value < 0) {
    return `-${prefix}${formatted}`;
  }
  return `${prefix}${formatted}`;
}

export function formatDate(date: Date | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
