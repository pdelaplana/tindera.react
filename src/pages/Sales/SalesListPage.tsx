// Sales List Page - Main sales history page with responsive layout

import {
	IonChip,
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonSearchbar,
	IonText,
	type RefresherEventDetail,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared';
import { LoadingSpinner } from '@/components/ui';
import { useOrders } from '@/hooks/useOrder';
import { useShop } from '@/hooks/useShop';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { OrderStatus } from '@/types/enums';
import type { Order } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';

// Styled components for split-pane layout
const SplitPaneContainer = styled.div`
	display: flex;
	height: 100%;
	width: 100%;
	max-width: 1400px;
	margin: 0 auto;
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

	&::-webkit-scrollbar {
		height: 4px;
	}
`;

const FilterTab = styled(IonChip)<{ isActive: boolean }>`
	--background: ${props => props.isActive ? 'var(--ion-color-primary)' : 'var(--ion-color-light)'};
	--color: ${props => props.isActive ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-dark)'};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		--background: ${props => props.isActive ? 'var(--ion-color-primary-shade)' : 'var(--ion-color-light-shade)'};
	}
`;

const EmptyOrderDetail = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: var(--ion-color-medium);
	padding: 48px;
	text-align: center;
`;

// Filter type definition
type FilterType = 'all' | 'completed' | 'voided' | 'refunded';

const SalesListPage: React.FC = () => {
	const history = useHistory();
	const { currentShop, isLoading: shopLoading } = useShop();
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
	const {
		data: orders,
		isLoading: ordersLoading,
		refetch,
	} = useOrders({
		status: statusFilter,
		search: searchText || undefined,
	});

	const isLoading = shopLoading || ordersLoading;

	// Currency formatter
	const formatCurrency = useMemo(
		() => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
		[currentShop?.currency_code]
	);

	// Handle pull-to-refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await refetch();
		event.detail.complete();
	};

	// Handle order selection (desktop: set selected, mobile: navigate)
	const handleOrderSelect = (orderId: string) => {
		if (isDesktop) {
			setSelectedOrderId(orderId);
		} else {
			// Mobile: navigate to detail page (will be implemented in later tasks)
			history.push(`/shops/${currentShop?.id}/sales/${orderId}`);
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

	// Get status color
	const getStatusColor = (status: string): string => {
		switch (status) {
			case OrderStatus.Completed:
				return 'success';
			case OrderStatus.Voided:
				return 'danger';
			case OrderStatus.Refunded:
				return 'warning';
			default:
				return 'medium';
		}
	};

	// Get status label
	const getStatusLabel = (status: string): string => {
		switch (status) {
			case OrderStatus.Completed:
				return 'Paid';
			case OrderStatus.Voided:
				return 'Cancelled';
			case OrderStatus.Refunded:
				return 'Refunded';
			default:
				return status;
		}
	};

	// Format date
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		}).format(date);
	};

	// Render order list item
	const renderOrderItem = (order: Order, index: number, ordersLength: number) => {
		const isSelected = isDesktop && selectedOrderId === order.id;

		return (
			<IonItem
				key={order.id}
				lines={index === ordersLength - 1 ? 'none' : 'full'}
				button
				onClick={() => handleOrderSelect(order.id)}
				detail={!isDesktop}
				color={isSelected ? 'light' : undefined}
			>
				<IonLabel>
					<h2>
						<strong>Order #{order.order_number || 'N/A'}</strong>
					</h2>
					<p>{formatDate(order.order_date)}</p>
					{order.customer_name && (
						<p className="ion-text-wrap">
							<IonText color="medium">{order.customer_name}</IonText>
						</p>
					)}
				</IonLabel>
				<IonLabel slot="end" className="ion-text-right">
					<h2>{formatCurrency(order.total_sale)}</h2>
					<IonChip color={getStatusColor(order.status)} style={{ margin: '4px 0 0 0' }}>
						{getStatusLabel(order.status)}
					</IonChip>
				</IonLabel>
			</IonItem>
		);
	};

	// Render order list
	const renderOrderList = () => {
		if (isLoading) {
			return <LoadingSpinner />;
		}

		if (!orders || orders.length === 0) {
			return (
				<div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
					<h2>No Orders Found</h2>
					<p>
						{searchText
							? 'Try a different search term'
							: selectedFilter !== 'all'
							? 'No orders match the selected filter'
							: 'Orders will appear here once created'}
					</p>
				</div>
			);
		}

		return (
			<IonList>
				{orders.map((order, index) => renderOrderItem(order, index, orders.length))}
			</IonList>
		);
	};

	// Placeholder order detail component
	const OrderDetail: React.FC<{ order: Order | null }> = ({ order }) => {
		if (!order) {
			return (
				<EmptyOrderDetail>
					<h2>Select an Order</h2>
					<p>Choose an order from the list to view details</p>
				</EmptyOrderDetail>
			);
		}

		return (
			<CardContainer title={`Order #${order.order_number || 'N/A'}`}>
				<div style={{ padding: '16px' }}>
					<h3>Order Details</h3>
					<p><strong>Date:</strong> {formatDate(order.order_date)}</p>
					<p><strong>Status:</strong> {getStatusLabel(order.status)}</p>
					<p><strong>Total:</strong> {formatCurrency(order.total_sale)}</p>
					{order.customer_name && (
						<p><strong>Customer:</strong> {order.customer_name}</p>
					)}
					{order.customer_email && (
						<p><strong>Email:</strong> {order.customer_email}</p>
					)}
					{order.customer_phone && (
						<p><strong>Phone:</strong> {order.customer_phone}</p>
					)}
					<p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>
						Detailed order information will be displayed here in future tasks.
					</p>
				</div>
			</CardContainer>
		);
	};

	// No shop selected state
	if (!currentShop && !shopLoading) {
		return (
			<IonPage>
				<BasePage title="Sales" showMenu showProfile showLogout>
					<CenteredLayout>
						<div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
							<h2>No Shop Selected</h2>
							<p>Please select a shop to view sales</p>
						</div>
					</CenteredLayout>
				</BasePage>
			</IonPage>
		);
	}

	// Desktop layout with split pane
	if (isDesktop) {
		return (
			<IonPage>
				<BasePage title="Sales" showMenu onRefresh={handleRefresh}>
					<SplitPaneContainer>
						<LeftPanel>
							{renderSearchBar()}
							{renderFilterTabs()}
							{renderOrderList()}
						</LeftPanel>
						<RightPanel>
							<OrderDetail order={selectedOrder} />
						</RightPanel>
					</SplitPaneContainer>
				</BasePage>
			</IonPage>
		);
	}

	// Mobile layout with full-width list
	return (
		<IonPage>
			<BasePage title="Sales" showMenu onRefresh={handleRefresh}>
				<CenteredLayout>
					<CardContainer noPadding>
						{renderSearchBar()}
						{renderFilterTabs()}
						{renderOrderList()}
					</CardContainer>
				</CenteredLayout>
			</BasePage>
		</IonPage>
	);
};

export default SalesListPage;
