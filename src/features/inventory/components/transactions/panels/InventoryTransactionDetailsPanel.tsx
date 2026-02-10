// Inventory Transaction Details Panel - Right panel content for transaction details

import { cubeOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CenteredLayout, DetailPanel } from '@/components/layouts';
import InventoryTransactionDetailsContent from '../sections/InventoryTransactionDetailsContent';

interface InventoryTransactionDetailsPanelProps {
  transactionId: string;
  itemName?: string;
  fromAllTransactions?: boolean;
  onBack: () => void;
  onBackToItem?: () => void;
}

const ContentWrapper = styled.div`
  padding: 16px 0;
`;

const InventoryTransactionDetailsPanel: React.FC<InventoryTransactionDetailsPanelProps> = ({
  transactionId,
  itemName,
  fromAllTransactions,
  onBack,
  onBackToItem,
}) => {
  const breadcrumbs = itemName
    ? [
        { label: itemName, onClick: onBackToItem },
        { label: 'Transactions', onClick: onBack },
        { label: 'Details' },
      ]
    : fromAllTransactions
      ? [{ label: 'All Transactions', onClick: onBack }, { label: 'Details' }]
      : [{ label: 'Transaction Details' }];

  return (
    <DetailPanel title="Transaction Details" icon={cubeOutline} breadcrumbs={breadcrumbs}>
      <CenteredLayout>
        <ContentWrapper>
          <InventoryTransactionDetailsContent transactionId={transactionId} />
        </ContentWrapper>
      </CenteredLayout>
    </DetailPanel>
  );
};

export default InventoryTransactionDetailsPanel;
