// Sales List Page - Main sales history page with responsive layout

import {
	IonChip,
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonSearchbar,
	IonSpinner,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '@/components/shared/PageHeader';
import { useOrders } from '@/hooks/useOrder';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import type { Order } from '@/types';

// Styled components for split-pane layout
const SplitPaneContainer = styled.div`
	display: flex;
	height: 100%;
	width: 100%;
`;

const LeftPanel = styled.div`
	flex: 0 0 400px;
	border-right: 1px solid var(--ion-color-light-shade);
	overflow-y: auto;
	display: flex;
	flex-direction: column;
`;

const RightPanel = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	background: var(--ion-color-light);
`;

const FilterTabsContainer = styled.div`
	display: flex;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--ion-color-light-shade);
	overflow-x: auto;
`;

const FilterTab = styled(IonChip)<{ isActive: boolean }>`
	--background: ${props => props.isActive ? 'var(--ion-color-primary)' : 'var(--ion-color-light)'};
	--color: ${props => props.isActive ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-dark)'};
	cursor: pointer;
`;

const MobileContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const PlaceholderContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 48px;
	text-align: center;
	color: var(--ion-color-medium);
	gap: 8px;
`;

// Filter type definition
type FilterType = 'all' | 'completed' | 'voided' | 'refunded';

// Component interfaces
interface OrderListProps {
	orders: Order[] | undefined;
	onSelect: (orderId: string) => void;
	selectedOrderId: string | null;
	isDesktop: boolean;
	isLoading: boolean;
}

interface OrderDetailProps {
	order: Order | null;
}

// Placeholder OrderList component - simple list of order numbers
const OrderList: React.FC<OrderListProps> = ({
	orders,
	onSelect,
	selectedOrderId,
	isDesktop,
	isLoading
}) => {
	if (isLoading) {
		return (
			<PlaceholderContainer>
				<IonSpinner />
				<p>Loading orders...</p>
			</PlaceholderContainer>
		);
	}

	if (!orders || orders.length === 0) {
		return (
			<PlaceholderContainer>
				<p>No orders found</p>
			</PlaceholderContainer>
		);
	}

	return (
		<IonList>
			{orders.map((order) => (
				<IonItem
					key={order.id}
					button
					onClick={() => onSelect(order.id)}
					detail={!isDesktop}
					color={isDesktop && selectedOrderId === order.id ? 'light' : undefined}
				>
					<IonLabel>
						<h2>Order #{order.order_number || 'N/A'}</h2>
						<p>{order.status}</p>
					</IonLabel>
				</IonItem>
			))}
		</IonList>
	);
};

// Placeholder OrderDetail component - simple detail view
const OrderDetail: React.FC<OrderDetailProps> = ({ order }) => {
	if (!order) {
		return (
			<PlaceholderContainer>
				<h2>Select an Order</h2>
				<p>Choose an order from the list to view details</p>
			</PlaceholderContainer>
		);
	}

	return (
		<div style={{ padding: '16px' }}>
			<h2>Order #{order.order_number || 'N/A'}</h2>
			<p>Status: {order.status}</p>
			<p>Total: ${order.total_sale}</p>
			<p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>
				This is a placeholder. Tasks 23-28 will create the full OrderDetail component.
			</p>
		</div>
	);
};

const SalesListPage: React.FC = () => {
	const history = useHistory();
	const isDesktop = useIsTabletOrLarger();

	// Local state
	const [searchText, setSearchText] = useState('');
	const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

	// Determine status filter for API
	const statusFilter = useMemo(() => {
		if (selectedFilter === 'all') return undefined;
		return selectedFilter;
	}, [selectedFilter]);

	// Fetch orders with filters
	const { data: orders, error, isLoading } = useOrders({
		status: statusFilter,
		search: searchText || undefined,
	});

	// Handle order selection (desktop: set selected, mobile: navigate)
	const handleOrderSelect = (orderId: string) => {
		if (isDesktop) {
			setSelectedOrderId(orderId);
		} else {
			// Mobile: navigate to detail page (will be implemented in later tasks)
			history.push(`/sales/${orderId}`);
		}
	};

	// Get selected order
	const selectedOrder = useMemo(() => {
		if (!selectedOrderId || !orders) return null;
		return orders.find(order => order.id === selectedOrderId) || null;
	}, [selectedOrderId, orders]);

	// Render filter tabs
	const renderFilterTabs = () => (
		<FilterTabsContainer>
			<FilterTab
				isActive={selectedFilter === 'all'}
				onClick={() => setSelectedFilter('all')}
			>
				All
			</FilterTab>
			<FilterTab
				isActive={selectedFilter === 'completed'}
				onClick={() => setSelectedFilter('completed')}
			>
				Paid
			</FilterTab>
			<FilterTab
				isActive={selectedFilter === 'voided'}
				onClick={() => setSelectedFilter('voided')}
			>
				Cancelled
			</FilterTab>
			<FilterTab
				isActive={selectedFilter === 'refunded'}
				onClick={() => setSelectedFilter('refunded')}
			>
				Refunded
			</FilterTab>
		</FilterTabsContainer>
	);

	// Render search bar
	const renderSearchBar = () => (
		<IonSearchbar
			value={searchText}
			onIonInput={(e) => setSearchText(e.detail.value ?? '')}
			placeholder="Search by order number..."
			debounce={300}
		/>
	);

	// Error state
	if (error) {
		return (
			<IonPage>
				<PageHeader title="Sales" />
				<IonContent>
					<PlaceholderContainer>
						<h2>Error Loading Orders</h2>
						<p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
					</PlaceholderContainer>
				</IonContent>
			</IonPage>
		);
	}

	// Desktop layout with split pane
	if (isDesktop) {
		return (
			<IonPage>
				<PageHeader title="Sales" />
				<IonContent>
					<SplitPaneContainer>
						<LeftPanel>
							{renderSearchBar()}
							{renderFilterTabs()}
							<OrderList
								orders={orders}
								onSelect={handleOrderSelect}
								selectedOrderId={selectedOrderId}
								isDesktop={isDesktop}
								isLoading={isLoading}
							/>
						</LeftPanel>
						<RightPanel>
							<OrderDetail order={selectedOrder} />
						</RightPanel>
					</SplitPaneContainer>
				</IonContent>
			</IonPage>
		);
	}

	// Mobile layout with full-width list
	return (
		<IonPage>
			<PageHeader title="Sales" />
			<IonContent>
				<MobileContainer>
					{renderSearchBar()}
					{renderFilterTabs()}
					<OrderList
						orders={orders}
						onSelect={handleOrderSelect}
						selectedOrderId={selectedOrderId}
						isDesktop={isDesktop}
						isLoading={isLoading}
					/>
				</MobileContainer>
			</IonContent>
		</IonPage>
	);
};

export default SalesListPage;
