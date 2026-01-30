// OrderCard - Display single order in sales list

import { IonBadge } from '@ionic/react';
import type React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails } from '@/types';

interface OrderCardProps {
	order: OrderWithDetails;
	isSelected: boolean;
	onClick: () => void;
	shopPrefix: string | null;
}

// Styled components
const Card = styled.div<{ isSelected: boolean }>`
	background: ${props =>
		props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
	border-radius: ${designSystem.borderRadius.md};
	padding: ${designSystem.spacing.md};
	cursor: pointer;
	transition: all ${designSystem.transitions.base};
	user-select: none;
	-webkit-tap-highlight-color: transparent;
	border: 1px solid ${props =>
		props.isSelected ? designSystem.colors.brand.primary : designSystem.colors.gray[200]};

	&:hover {
		background: ${designSystem.colors.surface.variant};
		box-shadow: ${designSystem.shadows.sm};
	}

	&:active {
		transform: scale(0.99);
	}
`;

const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${designSystem.spacing.xs};
`;

const OrderNumber = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

const OrderTotal = styled.div`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.brand.primary};
`;

const CardMeta = styled.div`
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.sm};
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-bottom: ${designSystem.spacing.xs};
`;

const MetaDivider = styled.span`
	color: ${designSystem.colors.gray[300]};
`;

const StatusBadgeStyled = styled(IonBadge)<{ statusType: 'completed' | 'voided' | 'refunded' }>`
	--background: ${props => {
		switch (props.statusType) {
			case 'completed':
				return designSystem.colors.status.paid;
			case 'voided':
				return designSystem.colors.danger;
			case 'refunded':
				return designSystem.colors.warning;
			default:
				return designSystem.colors.gray[400];
		}
	}};
	--color: white;
	font-size: ${designSystem.typography.fontSize.xs};
	font-weight: ${designSystem.typography.fontWeight.medium};
	padding: 2px 8px;
`;

// Helper functions
const formatOrderNumber = (orderNumber: number | null, prefix: string | null): string => {
	if (!orderNumber) return 'N/A';
	const paddedNumber = orderNumber.toString().padStart(4, '0');
	return prefix ? `#${prefix}-${paddedNumber}` : `#${paddedNumber}`;
};

const formatTime = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
};

const getStatusLabel = (status: string): string => {
	switch (status) {
		case 'completed':
			return 'Paid';
		case 'voided':
			return 'Cancelled';
		case 'refunded':
			return 'Refunded';
		default:
			return status;
	}
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, isSelected, onClick, shopPrefix }) => {
	const orderNumber = formatOrderNumber(order.order_number, shopPrefix);
	const time = formatTime(order.order_date);
	const customerName = order.customer_name || 'Walk-in';
	const itemCount = order.order_items.length;
	const statusType = order.status as 'completed' | 'voided' | 'refunded';
	const statusLabel = getStatusLabel(order.status);

	return (
		<Card isSelected={isSelected} onClick={onClick} role="button" tabIndex={0}>
			<CardHeader>
				<OrderNumber>{orderNumber}</OrderNumber>
				<OrderTotal>
					<PriceDisplay amount={order.total_sale} currency="USD" />
				</OrderTotal>
			</CardHeader>

			<CardMeta>
				<span>{time}</span>
				<MetaDivider>·</MetaDivider>
				<span>{customerName}</span>
				<MetaDivider>·</MetaDivider>
				<span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
			</CardMeta>

			<StatusBadgeStyled statusType={statusType}>{statusLabel}</StatusBadgeStyled>
		</Card>
	);
};

export default OrderCard;
