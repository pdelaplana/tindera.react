// PriceDisplay - Formatted currency display

import type React from 'react';

interface PriceDisplayProps {
	amount: number;
	currency?: string;
	locale?: string;
	size?: 'normal' | 'large' | 'total';
	className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
	amount,
	currency = 'USD',
	locale = 'en-US',
	size = 'normal',
	className = '',
}) => {
	const formatted = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);

	const sizeClass = size === 'large' ? 'text-price' : size === 'total' ? 'text-total' : '';

	return <span className={`${sizeClass} ${className}`.trim()}>{formatted}</span>;
};

export default PriceDisplay;
