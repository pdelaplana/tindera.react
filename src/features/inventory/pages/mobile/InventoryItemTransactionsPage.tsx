// Inventory Item Transactions Page - View all transactions for a specific inventory item (Mobile)

import type React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { BasePage } from '@/components/layouts';
import PageLoadingState from '@/components/shared/PageLoadingState';
import { useInventoryItem } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import type { InventoryTransaction } from '@/types';
import InventoryItemTransactionsContent from '../../components/items/lists/InventoryItemTransactionsContent';

interface RouteParams {
  itemId: string;
}

const InventoryItemTransactionsPage: React.FC = () => {
  const { itemId } = useParams<RouteParams>();
  const history = useHistory();
  const { currentShop } = useShop();

  // Fetch item to get the name
  const { data: item, isLoading } = useInventoryItem(itemId);

  // Handle transaction click
  const handleTransactionClick = (transaction: InventoryTransaction) => {
    history.push(
      `/shops/${currentShop?.id}/inventory/${transaction.item_id}/transactions/${transaction.id}`
    );
  };

  if (isLoading) {
    return <PageLoadingState backHref={`/shops/${currentShop?.id}/inventory/${itemId}/manage`} />;
  }

  return (
    <BasePage
      title={`${item?.name || 'Item'} - Transactions`}
      backHref={`/shops/${currentShop?.id}/inventory/${itemId}/manage`}
      showProfile
      showLogout
    >
      <InventoryItemTransactionsContent
        itemId={itemId}
        onTransactionClick={handleTransactionClick}
      />
    </BasePage>
  );
};

export default InventoryItemTransactionsPage;
