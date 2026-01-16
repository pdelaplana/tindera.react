// Currency Formatting Utilities

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'USD', 'EUR', 'GBP')
 * @param locale - The locale for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
	amount: number,
	currencyCode: string = 'USD',
	locale: string = 'en-US'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currencyCode,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Create a currency formatter function with preset currency code
 * Useful for creating a formatter once and reusing it
 * @param currencyCode - The currency code to use
 * @param locale - The locale for formatting (defaults to 'en-US')
 * @returns A function that formats numbers as currency
 */
export function createCurrencyFormatter(
	currencyCode: string = 'USD',
	locale: string = 'en-US'
): (amount: number) => string {
	return (amount: number) => formatCurrency(amount, currencyCode, locale);
}
