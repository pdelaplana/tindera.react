// Sales List Page - Main sales history page with responsive layout

import {
  IonContent,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { MasterDetailLayout, PlaceholderContainer } from '@/components/layouts';
import PageHeader from '@/components/shared/PageHeader';
import { useShopContext } from '@/contexts/ShopContext';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useOrders } from '@/hooks/useOrder';
import type { OrderWithDetails } from '@/types';
import { OrderDetail } from '../components/orders/sections/OrderDetail';
import { OrderList } from '../components/orders/lists/OrderList';
import { RefundModal } from '../components/orders/modals/RefundModal';
import { VoidModal } from '../components/orders/modals/VoidModal';

// Styled components
const FilterRowContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	border-bottom: 1px solid var(--ion-color-light-shade);
`;

const PillSelect = styled(IonSelect)`
	--background: var(--ion-color-light);
	--color: var(--ion-color-dark);
	--highlight-color: var(--ion-color-dark);
	--placeholder-opacity: 1;
	--border-width: 0;
	border-radius: 16px;
	padding: 0 4px;
	font-size: 0.875rem;
	min-height: 32px;
	width: fit-content;
`;

const SearchBarContainer = styled.div`
	padding: 12px 16px;
`;

// Filter type definition
type FilterType = 'all' | 'completed' | 'voided' | 'refunded';
type DateFilterType = 'today' | 'week' | 'month' | 'all';

const SalesListPage: React.FC = () => {
  const history = useHistory();
  const isDesktop = useIsTabletOrLarger();
  const { currentShop } = useShopContext();

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Determine status filter for API
  const statusFilter = useMemo(() => {
    if (selectedFilter === 'all') return undefined;
    return selectedFilter;
  }, [selectedFilter]);

  // Calculate date range based on selected date filter
  const dateRange = useMemo(() => {
    if (selectedDateFilter === 'all') return undefined;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedDateFilter) {
      case 'today': {
        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        };
      }
      case 'week': {
        const startOfWeek = new Date(today);
        const dayOfWeek = startOfWeek.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as first day
        startOfWeek.setDate(startOfWeek.getDate() - diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString(),
        };
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        };
      }
      default:
        return undefined;
    }
  }, [selectedDateFilter]);

  // Fetch orders with filters
  const {
    data: orders,
    error,
    isLoading,
  } = useOrders({
    status: statusFilter,
    search: searchText || undefined,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  });

  // Handle order selection (desktop: set selected, mobile: navigate)
  const handleOrderSelect = (order: OrderWithDetails) => {
    if (isDesktop) {
      setSelectedOrderId(order.id);
    } else {
      // Mobile: navigate to detail page
      if (currentShop) {
        history.push(`/shops/${currentShop.id}/sales/${order.id}`);
      }
    }
  };

  // Get selected order
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId || !orders) return null;
    return orders.find((order) => order.id === selectedOrderId) || null;
  }, [selectedOrderId, orders]);

  // Render filter row with status and date dropdowns
  const renderFilterRow = () => (
    <FilterRowContainer>
      <PillSelect
        interface="popover"
        value={selectedFilter}
        onIonChange={(e) => setSelectedFilter(e.detail.value as FilterType)}
      >
        <IonSelectOption value="all">All</IonSelectOption>
        <IonSelectOption value="completed">Paid</IonSelectOption>
        <IonSelectOption value="voided">Cancelled</IonSelectOption>
        <IonSelectOption value="refunded">Refunded</IonSelectOption>
      </PillSelect>
      <PillSelect
        interface="popover"
        value={selectedDateFilter}
        onIonChange={(e) => setSelectedDateFilter(e.detail.value as DateFilterType)}
      >
        <IonSelectOption value="all">All Time</IonSelectOption>
        <IonSelectOption value="today">Today</IonSelectOption>
        <IonSelectOption value="week">This Week</IonSelectOption>
        <IonSelectOption value="month">This Month</IonSelectOption>
      </PillSelect>
    </FilterRowContainer>
  );

  // Render search bar
  const renderSearchBar = () => (
    <SearchBarContainer>
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value ?? '')}
        placeholder="Search by order number..."
        debounce={300}
        className="searchBar"
      />
    </SearchBarContainer>
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

  // Render left panel content (list)
  const leftPanelContent = (
    <>
      {renderSearchBar()}
      {renderFilterRow()}
      <OrderList
        orders={orders || []}
        onSelect={handleOrderSelect}
        selectedOrderId={selectedOrderId ?? undefined}
        isLoading={isLoading}
        shopPrefix={currentShop?.order_prefix}
      />
    </>
  );

  // Render right panel content (detail)
  const rightPanelContent = (
    <OrderDetail
      order={selectedOrder || null}
      shop={currentShop!}
      onVoid={() => setShowVoidModal(true)}
      onRefund={() => setShowRefundModal(true)}
    />
  );

  return (
    <IonPage>
      <PageHeader title="Sales" />
      <IonContent>
        <MasterDetailLayout leftPanel={leftPanelContent} rightPanel={rightPanelContent} />
      </IonContent>
      {selectedOrder && (
        <>
          <VoidModal
            isOpen={showVoidModal}
            onClose={() => setShowVoidModal(false)}
            order={selectedOrder}
            onSuccess={() => {
              setShowVoidModal(false);
              // Query will auto-refetch due to invalidation in the mutation
            }}
          />

          <RefundModal
            isOpen={showRefundModal}
            onClose={() => setShowRefundModal(false)}
            order={selectedOrder}
            onSuccess={() => {
              setShowRefundModal(false);
              // Query will auto-refetch due to invalidation in the mutation
            }}
          />
        </>
      )}
    </IonPage>
  );
};

export default SalesListPage;
