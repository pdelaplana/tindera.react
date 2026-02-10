// Inventory Item Transactions Panel - Shows all transactions for a specific inventory item

import { cubeOutline } from 'ionicons/icons';
import type React from 'react';
import { DetailPanel } from '@/components/layouts';
import type { InventoryTransaction } from '@/types';
import InventoryItemTransactionsContent from '../lists/InventoryItemTransactionsContent';

interface InventoryItemTransactionsPanelProps {
  itemId: string;
  itemName: string;
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
}

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
    <DetailPanel
      title="Transactions"
      icon={cubeOutline}
      breadcrumbs={[
        { label: itemName, onClick: onBack },
        { label: 'Transactions' },
      ]}
      scrollable={false}
    >
      <InventoryItemTransactionsContent
        itemId={itemId}
        onTransactionClick={handleTransactionClick}
      />
    </DetailPanel>
  );
};

export default InventoryItemTransactionsPanel;
