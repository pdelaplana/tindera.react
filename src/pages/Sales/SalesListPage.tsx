// Sales List Page - Main sales history page with responsive layout

import { IonChip, IonContent, IonPage, IonSearchbar } from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '@/components/shared/PageHeader';
import { useShopContext } from '@/contexts/ShopContext';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useOrders } from '@/hooks/useOrder';
import type { OrderWithDetails } from '@/types';
import { OrderDetail, OrderList, RefundModal, VoidModal } from './components';

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
	--background: ${(props) => (props.isActive ? 'var(--ion-color-primary)' : 'var(--ion-color-light)')};
	--color: ${(props) => (props.isActive ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-dark)')};
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

const SalesListPage: React.FC = () => {
  const history = useHistory();
  const isDesktop = useIsTabletOrLarger();
  const { currentShop } = useShopContext();

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Determine status filter for API
  const statusFilter = useMemo(() => {
    if (selectedFilter === 'all') return undefined;
    return selectedFilter;
  }, [selectedFilter]);

  // Fetch orders with filters
  const {
    data: orders,
    error,
    isLoading,
  } = useOrders({
    status: statusFilter,
    search: searchText || undefined,
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

  // Render filter tabs
  const renderFilterTabs = () => (
    <FilterTabsContainer>
      <FilterTab isActive={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')}>
        All
      </FilterTab>
      <FilterTab
        isActive={selectedFilter === 'completed'}
        onClick={() => setSelectedFilter('completed')}
      >
        Paid
      </FilterTab>
      <FilterTab isActive={selectedFilter === 'voided'} onClick={() => setSelectedFilter('voided')}>
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
    <div className="ion-padding">
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value ?? '')}
        placeholder="Search by order number..."
        debounce={300}
        className="searchBar"
      />
    </div>
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
                orders={orders || []}
                onSelect={handleOrderSelect}
                selectedOrderId={selectedOrderId ?? undefined}
                isLoading={isLoading}
                shopPrefix={currentShop?.order_prefix}
              />
            </LeftPanel>
            <RightPanel>
              <OrderDetail
                order={selectedOrder || null}
                shop={currentShop!}
                onVoid={() => setShowVoidModal(true)}
                onRefund={() => setShowRefundModal(true)}
              />
            </RightPanel>
          </SplitPaneContainer>
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
            orders={orders || []}
            onSelect={handleOrderSelect}
            selectedOrderId={selectedOrderId ?? undefined}
            isLoading={isLoading}
            shopPrefix={currentShop?.order_prefix}
          />
        </MobileContainer>
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
