// Inventory List Page - Responsive master-detail split pane

import {
  IonActionSheet,
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSearchbar,
} from '@ionic/react';
import { add, listOutline, statsChartOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { MasterDetailLayout, PlaceholderContainer } from '@/components/layouts';
import PageHeader from '@/components/shared/PageHeader';
import { FilterPillScroller, LoadingSpinner } from '@/components/ui';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useInventoryCategories, useInventoryItems } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import type { FilterOption, InventoryCategory, InventoryItemWithCategory } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import InventoryItemDetailPanel from '../components/items/panels/InventoryItemDetailPanel';
import InventoryItemFormModal from '../components/items/modals/InventoryItemFormModal';
import InventoryItemListItem from '../components/items/lists/InventoryItemListItem';
import InventoryTransactionDetailsPanel from '../components/transactions/panels/InventoryTransactionDetailsPanel';
import InventoryTransactionsListPanel from '../components/transactions/panels/InventoryTransactionsListPanel';
import InventoryTransactionsSummaryCard from '../components/transactions/cards/InventoryTransactionsSummaryCard';

// Styled components
const LeftPanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  padding: 12px 16px;
  border-bottom: 1px solid var(--ion-color-light-shade);
`;

const SearchBarWrapper = styled.div`
  flex: 1;
`;

const HeaderButton = styled(IonButton)`
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
`;

const FilterContainer = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid var(--ion-color-light-shade);
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.sm};
`;

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: ${designSystem.colors.gray[100]};
  border-radius: ${designSystem.borderRadius.sm};
  margin-bottom: ${designSystem.spacing.xs};
`;

const GroupTitle = styled.h3`
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  text-transform: uppercase;
  margin: 0;
`;

const GroupCount = styled.span`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designSystem.spacing['2xl']};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
  gap: ${designSystem.spacing.sm};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  width: calc(100% - 32px);
  margin: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  border: 2px dashed ${designSystem.colors.gray[300]};
  border-radius: ${designSystem.borderRadius.md};
  background: none;
  cursor: pointer;
  color: ${designSystem.colors.text.secondary};
  font-size: ${designSystem.typography.fontSize.base};
  font-family: ${designSystem.typography.fontFamily.base};
  transition: all ${designSystem.transitions.base};

  &:hover {
    border-color: ${designSystem.colors.brand.primary};
    color: ${designSystem.colors.brand.primary};
  }
`;

// Helper function to parse compound filter IDs
const parseFilterId = (filterId: string): { type: string; value: string } => {
  if (filterId === 'all') {
    return { type: 'all', value: '' };
  }

  const [type, ...rest] = filterId.split(':');
  return { type, value: rest.join(':') };
};

// Helper function to build unified filter options
const buildFilterOptions = (categories: InventoryCategory[] | undefined): FilterOption[] => {
  const options: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'stock:low', label: 'Low Stock' },
    { id: 'stock:out', label: 'Out of Stock' },
    { id: 'stock:in', label: 'In Stock', separator: true },
  ];

  if (categories && categories.length > 0) {
    const sortedCategories = [...categories].sort((a, b) => a.sequence - b.sequence);

    options.push(
      ...sortedCategories.map((cat) => ({
        id: `category:${cat.id}`,
        label: cat.description || cat.name,
      }))
    );
  }

  options.push({ id: 'category:uncategorized', label: 'Uncategorized' });

  return options;
};

const InventoryListPage: React.FC = () => {
  const history = useHistory();
  const isDesktop = useIsTabletOrLarger();
  const { currentShop, isLoading: shopLoading } = useShop();
  const [searchText, setSearchText] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showTransactionsList, setShowTransactionsList] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Fetch inventory items and categories
  const { data: items, isLoading: itemsLoading } = useInventoryItems({
    search: searchText || undefined,
  });

  const { data: categories } = useInventoryCategories();
  const isLoading = shopLoading || itemsLoading;

  // Build filter options
  const filterOptions = useMemo(() => buildFilterOptions(categories), [categories]);

  // Apply filters and group items by category
  const filteredAndGroupedItems = useMemo(() => {
    if (!items || !categories) {
      return { categorized: {}, uncategorized: [] };
    }

    const { type, value } = parseFilterId(selectedFilter);

    // Step 1: Apply stock-level filter
    let filteredItems = items;

    if (type === 'stock') {
      switch (value) {
        case 'low':
          // Low stock: current_count <= reorder_level
          filteredItems = items.filter((item) => item.current_count <= item.reorder_level);
          break;
        case 'out':
          // Out of stock: current_count === 0
          filteredItems = items.filter((item) => item.current_count === 0);
          break;
        case 'in':
          // In stock: current_count > 0
          filteredItems = items.filter((item) => item.current_count > 0);
          break;
      }
    }

    // Step 2: Apply category filter
    if (type === 'category') {
      if (value === 'uncategorized') {
        // Only uncategorized items
        filteredItems = filteredItems.filter((item) => !item.category_id);
      } else {
        // Specific category
        filteredItems = filteredItems.filter((item) => item.category_id === value);
      }
    }

    // Step 3: Group items by category for display
    const categorized: Record<string, InventoryItemWithCategory[]> = {};
    const uncategorized: InventoryItemWithCategory[] = [];

    // Initialize category groups
    for (const cat of categories) {
      categorized[cat.id] = [];
    }

    // Group items
    for (const item of filteredItems) {
      if (item.category_id && categorized[item.category_id]) {
        categorized[item.category_id].push(item);
      } else {
        uncategorized.push(item);
      }
    }

    return { categorized, uncategorized };
  }, [items, categories, selectedFilter]);

  // Memoized currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Handle item selection (desktop: set selected, mobile: navigate)
  const handleItemClick = (item: InventoryItemWithCategory) => {
    if (isDesktop) {
      setShowTransactionsList(false);
      setSelectedTransactionId(null);
      setSelectedItemId(item.id);
    } else {
      history.push(`/shops/${currentShop?.id}/inventory/${item.id}/manage`);
    }
  };

  // Handle add item
  const handleAddItem = () => {
    setShowItemModal(true);
  };

  // Handle navigate to categories
  const handleNavigateToCategories = () => {
    history.push(`/shops/${currentShop?.id}/inventory/categories`);
  };

  // Handle navigate to transactions (desktop: show panel, mobile: navigate)
  const handleNavigateToTransactions = () => {
    if (isDesktop) {
      setSelectedItemId(null);
      setSelectedTransactionId(null);
      setShowTransactionsList(true);
    } else {
      history.push(`/shops/${currentShop?.id}/inventory/transactions`);
    }
  };

  // Handle back from transactions list to summary
  const handleBackToSummary = () => {
    setShowTransactionsList(false);
    setSelectedTransactionId(null);
  };

  // Handle transaction details view (desktop: show panel, mobile: navigate)
  const handleTransactionClick = (transactionId: string) => {
    if (isDesktop) {
      setSelectedTransactionId(transactionId);
    } else {
      // Mobile navigation handled by InventoryTransactionsContent component
    }
  };

  // Handle back from transaction details to transactions list
  const handleBackToTransactionsList = () => {
    setSelectedTransactionId(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowItemModal(false);
  };

  // Handle item deletion
  const handleItemDeleted = () => {
    setSelectedItemId(null);
    setShowTransactionsList(false);
    setSelectedTransactionId(null);
  };

  // Render individual inventory item
  const renderInventoryItem = (item: InventoryItemWithCategory) => (
    <InventoryItemListItem
      key={item.id}
      item={item}
      isSelected={isDesktop && selectedItemId === item.id}
      onClick={() => handleItemClick(item)}
      formatCurrency={formatCurrency}
    />
  );

  // Render category group
  const renderCategoryGroup = (categoryId: string, categoryItems: InventoryItemWithCategory[]) => {
    const category = categories?.find((c) => c.id === categoryId);
    if (!category || categoryItems.length === 0) return null;

    return (
      <GroupContainer key={categoryId}>
        <GroupHeader>
          <GroupTitle>{category.description || category.name}</GroupTitle>
          <GroupCount>{categoryItems.length} items</GroupCount>
        </GroupHeader>
        {categoryItems.map((item) => renderInventoryItem(item))}
      </GroupContainer>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <EmptyContainer>
      <h3>No Inventory Items Yet</h3>
      <p>Get started by adding your first inventory item</p>
      <IonButton onClick={handleAddItem} size="default">
        <IonIcon slot="start" icon={add} />
        Add Item
      </IonButton>
    </EmptyContainer>
  );

  // Render left panel header with search and actions
  const renderLeftPanelHeader = () => (
    <LeftPanelHeader>
      <SearchBarWrapper>
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          placeholder="Search inventory..."
          debounce={300}
          className="searchBar"
        />
      </SearchBarWrapper>
      <HeaderButton
        fill="clear"
        onClick={handleNavigateToTransactions}
        aria-label="View transactions"
        title="View Transactions"
      >
        <IonIcon slot="icon-only" icon={statsChartOutline} />
      </HeaderButton>
    </LeftPanelHeader>
  );

  // Render filter pills
  const renderFilterPills = () => {
    if (filterOptions.length === 0) return null;
    return (
      <FilterContainer>
        <FilterPillScroller
          filters={filterOptions}
          selectedId={selectedFilter}
          onSelect={setSelectedFilter}
          showManageButton={true}
          onManageClick={handleNavigateToCategories}
        />
      </FilterContainer>
    );
  };

  // Render inventory list
  const renderInventoryList = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!items || items.length === 0) {
      return renderEmptyState();
    }

    return (
      <ListContainer>
        {/* Render categorized items */}
        {categories
          ?.sort((a, b) => a.sequence - b.sequence)
          .map((cat) =>
            renderCategoryGroup(cat.id, filteredAndGroupedItems.categorized[cat.id] || [])
          )}

        {/* Render uncategorized items */}
        {filteredAndGroupedItems.uncategorized.length > 0 && (
          <GroupContainer>
            <GroupHeader>
              <GroupTitle>Uncategorized</GroupTitle>
              <GroupCount>{filteredAndGroupedItems.uncategorized.length} items</GroupCount>
            </GroupHeader>
            {filteredAndGroupedItems.uncategorized.map((item) => renderInventoryItem(item))}
          </GroupContainer>
        )}
      </ListContainer>
    );
  };

  // No shop selected state
  if (!currentShop && !shopLoading) {
    return (
      <IonPage>
        <PageHeader title="Inventory" showProfile showLogout />
        <IonContent>
          <PlaceholderContainer>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to view inventory</p>
          </PlaceholderContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Render left panel content (list)
  const leftPanelContent = (
    <>
      {renderLeftPanelHeader()}
      {renderFilterPills()}
      {renderInventoryList()}
      <AddButton onClick={handleAddItem}>
        <IonIcon icon={add} />
        Add New Item
      </AddButton>
    </>
  );

  // Render right panel content (transaction details, transactions list, item detail, or summary)
  const rightPanelContent = selectedTransactionId ? (
    <InventoryTransactionDetailsPanel
      transactionId={selectedTransactionId}
      onBack={handleBackToTransactionsList}
    />
  ) : showTransactionsList ? (
    <InventoryTransactionsListPanel
      onBack={handleBackToSummary}
      onTransactionClick={handleTransactionClick}
    />
  ) : selectedItemId ? (
    <InventoryItemDetailPanel itemId={selectedItemId} onItemDeleted={handleItemDeleted} />
  ) : (
    <InventoryTransactionsSummaryCard onViewAll={handleNavigateToTransactions} />
  );

  return (
    <IonPage>
      <PageHeader title="Inventory" showProfile showLogout />
      <IonContent>
        <MasterDetailLayout leftPanel={leftPanelContent} rightPanel={rightPanelContent} />
      </IonContent>

      {/* Inventory Item Form Modal - For adding new items */}
      <InventoryItemFormModal isOpen={showItemModal} onClose={handleCloseModal} />

      {/* Action Sheet for More Options */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Inventory Options"
        buttons={[
          {
            text: 'Manage Categories',
            icon: listOutline,
            handler: handleNavigateToCategories,
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ]}
      />
    </IonPage>
  );
};

export default InventoryListPage;
