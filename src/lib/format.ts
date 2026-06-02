
export function formatAmount(amount: number | null | undefined, options: Intl.NumberFormatOptions = {}): string {
  if (amount === null || amount === undefined) return '0';
  return amount.toLocaleString('en-US', options);
}
