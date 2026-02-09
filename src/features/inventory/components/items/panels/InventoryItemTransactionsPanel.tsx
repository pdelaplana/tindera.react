// Inventory Item Transactions Panel - Shows all transactions for a specific inventory item

import { cubeOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { DetailPanelHeader } from '@/components/shared';
import type { InventoryTransaction } from '@/types';
import InventoryItemTransactionsContent from '../lists/InventoryItemTransactionsContent';

interface InventoryItemTransactionsPanelProps {
  itemId: string;
  itemName: string;
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const InventoryItemTransactionsPanel: React.FC<InventoryItemTransactionsPanelProps> = ({
  itemId,
  itemName,
  onBack,
  onTransactionClick,
}) => {
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    onTransactionClick(transaction.id);
  };

  return (
    <Container>
      <DetailPanelHeader
        title="Transactions"
        icon={cubeOutline}
        breadcrumbs={[
          { label: itemName, onClick: onBack },
          { label: 'Transactions' },
        ]}
      />

      <ContentWrapper>
        <InventoryItemTransactionsContent
          itemId={itemId}
          onTransactionClick={handleTransactionClick}
        />
      </ContentWrapper>
    </Container>
  );
};

export default InventoryItemTransactionsPanel;
