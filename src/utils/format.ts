export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTicketNumber(n: number, digits: number): string {
  return String(n).padStart(digits, '0');
}

export function formatDate(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
