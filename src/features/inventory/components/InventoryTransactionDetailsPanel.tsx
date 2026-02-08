// Inventory Transaction Details Panel - Right panel content for transaction details

import type React from 'react';
import styled from 'styled-components';
import { CenteredLayout } from '@/components/layouts';
import { DetailPanelHeader } from '@/components/shared';
import InventoryTransactionDetailsContent from './InventoryTransactionDetailsContent';

interface InventoryTransactionDetailsPanelProps {
  transactionId: string;
  onBack: () => void;
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
  onBack,
}) => {
  return (
    <Container>
      <DetailPanelHeader title="Transaction Details" onBack={onBack} backLabel="Back to transactions" />

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
