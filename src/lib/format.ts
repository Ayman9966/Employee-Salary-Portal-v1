
export function formatAmount(
  amount: number | null | undefined, 
  options: Intl.NumberFormatOptions = {},
  currencySymbol: string = '$',
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined) {
    return `${currencySymbol}0.00`;
  }
  
  // Set default decimal places depending on fraction requirements (net pay vs exact line items)
  const defaultMinFraction = options.minimumFractionDigits ?? (options.maximumFractionDigits === 0 ? 0 : 2);
  const defaultMaxFraction = options.maximumFractionDigits ?? (options.maximumFractionDigits === 0 ? 0 : 2);

  const formattedValue = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: defaultMinFraction,
    maximumFractionDigits: defaultMaxFraction,
    ...options
  });

  if (amount < 0) {
    return `-${currencySymbol}${formattedValue}`;
  }
  return `${currencySymbol}${formattedValue}`;
}
