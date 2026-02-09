// Inventory Item Transactions Content - Shared content for item-specific transaction list views

import {
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonNote,
  IonText,
} from '@ionic/react';
import {
  arrowDownSharp,
  arrowUpSharp,
  calculatorSharp,
  cashSharp,
  construct,
  swapVerticalSharp,
} from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared';
import { FilterPillScroller, LoadingSpinner } from '@/components/ui';
import { useInventoryTransactionsInfinite } from '@/hooks/useInventory';
import { designSystem } from '@/theme/designSystem';
import type { FilterOption, InventoryTransaction } from '@/types';
import { formatDateLabel } from '@/utils/date';

interface InventoryItemTransactionsContentProps {
  itemId: string;
  onTransactionClick: (transaction: InventoryTransaction) => void;
}

// Styled components
const FilterSection = styled.div`
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid var(--ion-color-light-shade);
`;

const FilterContainer = styled.div`
  padding: 8px 0;
`;

const ScrollableSection = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;

  h3 {
    margin: 0 0 8px 0;
  }

  p {
    margin: 0;
  }
`;

const TransactionsContainer = styled.div`
  padding: 12px 0;
`;

const IconCircle = styled.div<{ type: string }>`
  margin-top: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => {
    switch (props.type) {
      case 'receipt':
        return designSystem.colors.status.paid;
      case 'issue':
        return designSystem.colors.warning;
      case 'sale':
        return designSystem.colors.danger;
      case 'adjustment':
        return designSystem.colors.info;
      case 'countAdjustment':
        return designSystem.colors.brand.secondary;
      default:
        return designSystem.colors.gray[300];
    }
  }};

  ion-icon {
    color: white;
    font-size: 20px;
  }
`;

const StyledIonItem = styled(IonItem)`
  --detail-icon-color: ${designSystem.colors.brand.primary};
  --detail-icon-opacity: 1;
`;

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'sale', label: 'Sales' },
  { id: 'adjustment', label: 'Adjustments' },
];

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    receipt: 'Receipt',
    issue: 'Issue',
    sale: 'Sale',
    adjustment: 'Adjustment',
    countAdjustment: 'Count Adjustment',
  };
  return labels[type] || type;
};

const getTransactionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    receipt: arrowDownSharp,
    issue: arrowUpSharp,
    sale: cashSharp,
    adjustment: swapVerticalSharp,
    countAdjustment: calculatorSharp,
  };
  return icons[type] || construct;
};

const InventoryItemTransactionsContent: React.FC<InventoryItemTransactionsContentProps> = ({
  itemId,
  onTransactionClick,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventoryTransactionsInfinite(
    itemId,
    selectedFilter !== 'all' ? { transactionType: selectedFilter } : undefined
  );

  // Flatten paginated transactions data
  const transactions = transactionsData?.pages.flatMap((page) => page.data) ?? [];

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};

    return transactions.reduce(
      (groups, transaction) => {
        const dateLabel = formatDateLabel(transaction.transaction_on);
        if (!groups[dateLabel]) groups[dateLabel] = [];
        groups[dateLabel].push(transaction);
        return groups;
      },
      {} as Record<string, typeof transactions>
    );
  }, [transactions]);

  const handleLoadMore = async (event: CustomEvent<void>) => {
    if (hasNextPage) {
      await fetchNextPage();
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  // Empty state
  const renderEmptyState = () => (
    <EmptyContainer>
      <h3>No Transactions Found</h3>
      <p>
        <IonText color="medium">
          {selectedFilter !== 'all'
            ? 'Try adjusting your filters'
            : 'Transactions will appear here when inventory is received, sold, or adjusted'}
        </IonText>
      </p>
    </EmptyContainer>
  );

  const groupEntries = Object.entries(groupedTransactions);

  return (
    <>
      <FilterSection>
        <CenteredLayout>
          <FilterContainer>
            <FilterPillScroller
              filters={filterOptions}
              selectedId={selectedFilter}
              onSelect={setSelectedFilter}
            />
          </FilterContainer>
        </CenteredLayout>
      </FilterSection>

      <ScrollableSection>
        <ScrollContent>
          <CenteredLayout>
            {isLoading ? (
              <EmptyContainer>
                <LoadingSpinner />
              </EmptyContainer>
            ) : transactions && transactions.length > 0 ? (
              <TransactionsContainer>
                <CardContainer noPadding={true}>
                  <IonList lines="full">
                    {groupEntries.map(([date, txns], groupIndex) => (
                      <IonItemGroup key={date}>
                        <IonItemDivider>
                          <IonLabel color="dark">
                            <h2>{date}</h2>
                          </IonLabel>
                        </IonItemDivider>
                        {txns.map((txn, txnIndex) => {
                          const isLastItem =
                            groupIndex === groupEntries.length - 1 && txnIndex === txns.length - 1;
                          return (
                            <StyledIonItem
                              key={txn.id}
                              button
                              detail={true}
                              lines={isLastItem ? 'none' : undefined}
                              onClick={() => onTransactionClick(txn)}
                            >
                              <IconCircle slot="start" type={txn.transaction_type}>
                                <IonIcon icon={getTransactionTypeIcon(txn.transaction_type)} />
                              </IconCircle>
                              <IonLabel>
                                <h3>{getTransactionTypeLabel(txn.transaction_type)}</h3>
                                <p>{new Date(txn.transaction_on).toLocaleTimeString()}</p>
                                {txn.reference && <p>Ref: {txn.reference}</p>}
                                {txn.supplier && <p>Supplier: {txn.supplier}</p>}
                              </IonLabel>
                              <IonLabel slot="end" className="ion-text-right ion-padding-end">
                                <h3>
                                  {txn.quantity_in > 0
                                    ? `+${txn.quantity_in}`
                                    : `-${txn.quantity_out}`}
                                </h3>
                                <IonNote>{txn.inventory_items?.base_uom || 'units'}</IonNote>
                              </IonLabel>
                            </StyledIonItem>
                          );
                        })}
                      </IonItemGroup>
                    ))}
                  </IonList>
                </CardContainer>
              </TransactionsContainer>
            ) : (
              renderEmptyState()
            )}

            {/* Infinite Scroll */}
            {hasNextPage && (
              <IonInfiniteScroll
                threshold="100px"
                disabled={isFetchingNextPage}
                onIonInfinite={handleLoadMore}
              >
                <IonInfiniteScrollContent loadingText="Loading more transactions..." />
              </IonInfiniteScroll>
            )}
          </CenteredLayout>
        </ScrollContent>
      </ScrollableSection>
    </>
  );
};

export default InventoryItemTransactionsContent;
