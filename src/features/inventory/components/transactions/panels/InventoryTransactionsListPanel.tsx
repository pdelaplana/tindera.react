// Inventory Transactions List Panel - Right panel content for showing all transactions

import { cubeOutline } from 'ionicons/icons';
import type React from 'react';
import { DetailPanel } from '@/components/layouts';
import type { InventoryTransaction } from '@/types';
import InventoryTransactionsContent from '../lists/InventoryTransactionsContent';

interface InventoryTransactionsListPanelProps {
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
}

const InventoryTransactionsListPanel: React.FC<InventoryTransactionsListPanelProps> = ({
  onBack,
  onTransactionClick,
}) => {
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    onTransactionClick(transaction.id);
  };

  return (
    <DetailPanel
      title="All Transactions"
      icon={cubeOutline}
      breadcrumbs={[{ label: 'All Transactions' }]}
      scrollable={false}
    >
      <InventoryTransactionsContent
        onTransactionClick={handleTransactionClick}
        showSearchInContent={true}
      />
    </DetailPanel>
  );
};

export default InventoryTransactionsListPanel;
