// OrderTotals - Subtotal, tax, discounts, total display

import type React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';

interface OrderTotalsProps {
	subtotal: number;
	tax?: number;
	taxRate?: number;
	discount?: number;
	tip?: number;
	total: number;
	currency?: string;
	className?: string;
}

const TotalsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
	padding: ${designSystem.spacing.lg};
`;

const TotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.primary};
`;

const DiscountRow = styled(TotalRow)`
	color: ${designSystem.colors.success};
`;

const MutedRow = styled(TotalRow)`
	color: ${designSystem.colors.text.secondary};
`;

const GrandTotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: ${designSystem.spacing.md};
	margin-top: ${designSystem.spacing.sm};
	border-top: 1px solid ${designSystem.colors.gray[200]};
`;

const TotalLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

const TotalAmount = styled.span`
	font-size: ${designSystem.typography.fontSize['2xl']};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.brand.primary};
`;

export const OrderTotals: React.FC<OrderTotalsProps> = ({
	subtotal,
	tax = 0,
	taxRate,
	discount = 0,
	tip = 0,
	total,
	currency = 'USD',
	className = '',
}) => {
	return (
		<TotalsContainer className={className}>
			{/* Subtotal */}
			<TotalRow>
				<span>Subtotal</span>
				<PriceDisplay amount={subtotal} currency={currency} />
			</TotalRow>

			{/* Discount */}
			{discount > 0 && (
				<DiscountRow>
					<span>Discount</span>
					<span>
						-<PriceDisplay amount={discount} currency={currency} />
					</span>
				</DiscountRow>
			)}

			{/* Tax */}
			{tax > 0 && (
				<MutedRow>
					<span>Tax{taxRate ? ` (${taxRate}%)` : ''}</span>
					<PriceDisplay amount={tax} currency={currency} />
				</MutedRow>
			)}

			{/* Tip */}
			{tip > 0 && (
				<TotalRow>
					<span>Tip</span>
					<PriceDisplay amount={tip} currency={currency} />
				</TotalRow>
			)}

			{/* Total */}
			<GrandTotalRow>
				<TotalLabel>Total</TotalLabel>
				<TotalAmount>
					<PriceDisplay amount={total} currency={currency} />
				</TotalAmount>
			</GrandTotalRow>
		</TotalsContainer>
	);
};

export default OrderTotals;
