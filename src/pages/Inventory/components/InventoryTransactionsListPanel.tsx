// Inventory Transactions List Panel - Right panel content for showing all transactions

import type React from 'react';
import styled from 'styled-components';
import { DetailPanelHeader } from '@/components/shared';
import type { InventoryTransaction } from '@/types';
import InventoryTransactionsContent from './InventoryTransactionsContent';

interface InventoryTransactionsListPanelProps {
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const InventoryTransactionsListPanel: React.FC<InventoryTransactionsListPanelProps> = ({
  onBack,
  onTransactionClick,
}) => {
  // Handle transaction click - call the parent's handler with transaction ID
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    onTransactionClick(transaction.id);
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
