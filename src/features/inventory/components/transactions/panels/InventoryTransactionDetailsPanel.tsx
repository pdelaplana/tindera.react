// Inventory Transaction Details Panel - Right panel content for transaction details

import { cubeOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CenteredLayout } from '@/components/layouts';
import { DetailPanelHeader } from '@/components/shared';
import InventoryTransactionDetailsContent from '../sections/InventoryTransactionDetailsContent';

interface InventoryTransactionDetailsPanelProps {
  transactionId: string;
  itemName?: string;
  onBack: () => void;
  onBackToItem?: () => void;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ContentWrapper = styled.div`
  padding: 16px 0;
`;

const InventoryTransactionDetailsPanel: React.FC<InventoryTransactionDetailsPanelProps> = ({
  transactionId,
  itemName,
  onBack,
  onBackToItem,
}) => {
  const breadcrumbs = itemName
    ? [
        { label: itemName, onClick: onBackToItem },
        { label: 'Transactions', onClick: onBack },
        { label: 'Details' },
      ]
    : undefined;

  return (
    <Container>
      <DetailPanelHeader
        title="Transaction Details"
        icon={cubeOutline}
        breadcrumbs={breadcrumbs}
      />

      <ScrollContent>
        <CenteredLayout>
          <ContentWrapper>
            <InventoryTransactionDetailsContent transactionId={transactionId} />
          </ContentWrapper>
        </CenteredLayout>
      </ScrollContent>
    </Container>
  );
};

export default InventoryTransactionDetailsPanel;
