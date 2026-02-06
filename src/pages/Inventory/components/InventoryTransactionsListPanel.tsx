// Inventory Transactions List Panel - Right panel content for showing all transactions

import type React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { DetailPanelHeader } from '@/components/shared';
import { useShop } from '@/hooks/useShop';
import type { InventoryTransaction } from '@/types';
import InventoryTransactionsContent from './InventoryTransactionsContent';

interface InventoryTransactionsListPanelProps {
  onBack: () => void;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const InventoryTransactionsListPanel: React.FC<InventoryTransactionsListPanelProps> = ({
  onBack,
}) => {
  const history = useHistory();
  const { currentShop } = useShop();

  // Handle transaction click
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    history.push(
      `/shops/${currentShop?.id}/inventory/${transaction.item_id}/transactions/${transaction.id}`
    );
  };

  return (
    <Container>
      <DetailPanelHeader title="All Transactions" onBack={onBack} backLabel="Back to summary" />

      <InventoryTransactionsContent
        onTransactionClick={handleTransactionClick}
        showSearchInContent={true}
      />
    </Container>
  );
};

export default InventoryTransactionsListPanel;
