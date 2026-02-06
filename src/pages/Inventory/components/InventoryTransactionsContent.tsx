// Inventory Transactions Content - Shared content for transaction list views

import { IonSearchbar } from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CenteredLayout } from '@/components/layouts';
import { CardItem } from '@/components/shared';
import { FilterPillScroller, LoadingSpinner } from '@/components/ui';
import { useShopInventoryTransactions } from '@/hooks/useInventory';
import { designSystem } from '@/theme/designSystem';
import type { FilterOption, InventoryTransaction } from '@/types';

interface InventoryTransactionsContentProps {
  onTransactionClick: (transaction: InventoryTransaction) => void;
  showSearchInContent?: boolean; // Whether to show search/filters in the content or expect them to be outside
}

// Styled components
const SearchFilterSection = styled.div`
  flex-shrink: 0;
  background: white;
`;

const SearchBarContainer = styled.div`
  padding: 12px 12px;
`;

const FilterContainer = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light-shade);
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
  padding: 0 16px;
`;

const TransactionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.md} 0;
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

  h3 {
    font-size: ${designSystem.typography.fontSize.lg};
    font-weight: ${designSystem.typography.fontWeight.semibold};
    color: ${designSystem.colors.text.primary};
    margin: 0;
  }

  p {
    font-size: ${designSystem.typography.fontSize.sm};
    margin: 0;
  }
`;

const TransactionItemName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const TransactionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.xs};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const TransactionType = styled.span<{ type: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${designSystem.borderRadius.sm};
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  background: ${(props) => {
    switch (props.type) {
      case 'receipt':
        return designSystem.colors.status.paid;
      case 'sale':
        return designSystem.colors.danger;
      case 'adjustment':
        return designSystem.colors.info;
      default:
        return designSystem.colors.gray[300];
    }
  }};
  color: white;
  text-transform: capitalize;
`;

const TransactionDate = styled.div`
  font-size: ${designSystem.typography.fontSize.xs};
  color: ${designSystem.colors.text.hint};
`;

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'sale', label: 'Sales' },
  { id: 'adjustment', label: 'Adjustments' },
];

const InventoryTransactionsContent: React.FC<InventoryTransactionsContentProps> = ({
  onTransactionClick,
  showSearchInContent = true,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch transactions
  const { data: transactions, isLoading } = useShopInventoryTransactions(
    selectedFilter !== 'all' ? { transactionType: selectedFilter } : undefined
  );

  // Filter by search text
  const filteredTransactions = useMemo(() => {
    if (!transactions || !searchText) return transactions || [];

    const lowerSearch = searchText.toLowerCase();
    return transactions.filter(
      (t) =>
        t.item_name.toLowerCase().includes(lowerSearch) ||
        t.reference?.toLowerCase().includes(lowerSearch) ||
        t.supplier?.toLowerCase().includes(lowerSearch)
    );
  }, [transactions, searchText]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Render transaction item
  const renderTransactionItem = (transaction: InventoryTransaction) => {
    const quantityText =
      transaction.quantity_in > 0
        ? `+${transaction.quantity_in}`
        : transaction.quantity_out > 0
          ? `-${transaction.quantity_out}`
          : '0';

    return (
      <CardItem key={transaction.id} onClick={() => onTransactionClick(transaction)}>
        <TransactionItemName>{transaction.item_name}</TransactionItemName>
        <TransactionDetails>
          <div>
            <TransactionType type={transaction.transaction_type}>
              {transaction.transaction_type}
            </TransactionType>
            {' • '}
            {quantityText} units
          </div>
          {transaction.reference && <div>Ref: {transaction.reference}</div>}
          {transaction.supplier && <div>Supplier: {transaction.supplier}</div>}
          <TransactionDate>{formatDate(transaction.transaction_on)}</TransactionDate>
        </TransactionDetails>
      </CardItem>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <EmptyContainer>
      <h3>No Transactions Found</h3>
      <p>
        {searchText
          ? 'Try adjusting your search or filters'
          : 'Transactions will appear here when inventory is received, sold, or adjusted'}
      </p>
    </EmptyContainer>
  );

  return (
    <>
      {showSearchInContent && (
        <SearchFilterSection>
          <CenteredLayout>
            <SearchBarContainer>
              <IonSearchbar
                value={searchText}
                onIonInput={(e) => setSearchText(e.detail.value ?? '')}
                placeholder="Search transactions..."
                debounce={300}
                className="searchBar"
              />
            </SearchBarContainer>

            <FilterContainer>
              <FilterPillScroller
                filters={filterOptions}
                selectedId={selectedFilter}
                onSelect={setSelectedFilter}
              />
            </FilterContainer>
          </CenteredLayout>
        </SearchFilterSection>
      )}

      <ScrollableSection>
        <ScrollContent>
          <CenteredLayout>
            {isLoading ? (
              <LoadingSpinner />
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              <TransactionsList>
                {filteredTransactions.map((transaction) => renderTransactionItem(transaction))}
              </TransactionsList>
            ) : (
              renderEmptyState()
            )}
          </CenteredLayout>
        </ScrollContent>
      </ScrollableSection>
    </>
  );
};

export default InventoryTransactionsContent;
