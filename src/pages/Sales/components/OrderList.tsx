// OrderList - Display scrollable list of orders

import { IonSpinner } from '@ionic/react';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails } from '@/types';
import { OrderCard } from './OrderCard';

interface OrderListProps {
	orders: OrderWithDetails[];
	selectedOrderId?: string;
	onSelect: (order: OrderWithDetails) => void;
	isLoading: boolean;
	shopPrefix?: string | null;
}

// Styled components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
	overflow-y: auto;
	padding: ${designSystem.spacing.sm};
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${designSystem.spacing.xl};
	gap: ${designSystem.spacing.md};
`;

const LoadingText = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

const EmptyContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${designSystem.spacing.xl};
	text-align: center;
`;

const EmptyText = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

export const OrderList: React.FC<OrderListProps> = ({
	orders,
	selectedOrderId,
	onSelect,
	isLoading,
	shopPrefix,
}) => {
	if (isLoading) {
		return (
			<LoadingContainer>
				<IonSpinner name="crescent" />
				<LoadingText>Loading orders...</LoadingText>
			</LoadingContainer>
		);
	}

	if (orders.length === 0) {
		return (
			<EmptyContainer>
				<EmptyText>No orders found</EmptyText>
			</EmptyContainer>
		);
	}

	return (
		<Container>
			{orders.map((order) => (
				<OrderCard
					key={order.id}
					order={order}
					isSelected={order.id === selectedOrderId}
					onClick={() => onSelect(order)}
					shopPrefix={shopPrefix ?? null}
				/>
			))}
		</Container>
	);
};

export default OrderList;
