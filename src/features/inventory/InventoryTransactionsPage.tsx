// Inventory Transactions Page - List all inventory transactions for the shop

import type React from 'react';
import { useHistory } from 'react-router-dom';
import { BasePage } from '@/components/layouts';
import { useShop } from '@/hooks/useShop';
import type { InventoryTransaction } from '@/types';
import InventoryTransactionsContent from './components/transactions/lists/InventoryTransactionsContent';

const InventoryTransactionsPage: React.FC = () => {
  const history = useHistory();
  const { currentShop } = useShop();

  // Handle transaction click
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    history.push(
      `/shops/${currentShop?.id}/inventory/${transaction.item_id}/transactions/${transaction.id}`
    );
  };

  return (
    <BasePage
      title="Inventory Transactions"
      backHref={`/shops/${currentShop?.id}/inventory`}
      showProfile
      showLogout
    >
      <InventoryTransactionsContent
        onTransactionClick={handleTransactionClick}
        showSearchInContent={true}
      />
    </BasePage>
  );
};

export default InventoryTransactionsPage;
