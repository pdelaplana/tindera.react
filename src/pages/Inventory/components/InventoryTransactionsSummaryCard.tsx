// Inventory Transactions Summary Card - Display transaction statistics

import { IonButton, IonIcon } from '@ionic/react';
import { arrowForward, receiptOutline, trendingDown, trendingUp } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import { useInventoryTransactionsSummary } from '@/hooks/useInventory';

interface InventoryTransactionsSummaryCardProps {
  onViewAll: () => void;
}

const CardContent = styled.div`
  padding: ${designSystem.spacing.md};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${designSystem.spacing.md};
  margin-bottom: ${designSystem.spacing.md};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${designSystem.spacing.md};
  background: ${designSystem.colors.surface.variant};
  border-radius: ${designSystem.borderRadius.md};
  gap: ${designSystem.spacing.xs};
`;

const StatIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.color};
  border-radius: ${designSystem.borderRadius.full};
  color: white;

  ion-icon {
    font-size: 20px;
  }
`;

const StatValue = styled.div`
  font-size: ${designSystem.typography.fontSize['2xl']};
  font-weight: ${designSystem.typography.fontWeight.bold};
  color: ${designSystem.colors.text.primary};
`;

const StatLabel = styled.div`
  font-size: ${designSystem.typography.fontSize.xs};
  color: ${designSystem.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ViewAllButton = styled(IonButton)`
  width: 100%;
`;

const LoadingState = styled.div`
  padding: ${designSystem.spacing.lg};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
`;

const InventoryTransactionsSummaryCard: React.FC<InventoryTransactionsSummaryCardProps> = ({
  onViewAll,
}) => {
  const { data: summary, isLoading } = useInventoryTransactionsSummary();

  return (
    <CardContainer title="Transaction Summary">
      <CardContent>
        {isLoading ? (
          <LoadingState>Loading transaction summary...</LoadingState>
        ) : (
          <>
            <StatsGrid>
              <StatItem>
                <StatIcon color={designSystem.colors.status.paid}>
                  <IonIcon icon={receiptOutline} />
                </StatIcon>
                <StatValue>{summary?.receipts || 0}</StatValue>
                <StatLabel>Receipts</StatLabel>
              </StatItem>

              <StatItem>
                <StatIcon color={designSystem.colors.danger}>
                  <IonIcon icon={trendingDown} />
                </StatIcon>
                <StatValue>{summary?.sales || 0}</StatValue>
                <StatLabel>Sales</StatLabel>
              </StatItem>

              <StatItem>
                <StatIcon color={designSystem.colors.info}>
                  <IonIcon icon={trendingUp} />
                </StatIcon>
                <StatValue>{summary?.adjustments || 0}</StatValue>
                <StatLabel>Adjustments</StatLabel>
              </StatItem>
            </StatsGrid>

            <ViewAllButton fill="clear" onClick={onViewAll}>
              View All Transactions
              <IonIcon slot="end" icon={arrowForward} />
            </ViewAllButton>
          </>
        )}
      </CardContent>
    </CardContainer>
  );
};

export default InventoryTransactionsSummaryCard;
