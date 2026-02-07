// Inventory Transaction Summary Card - Display summary statistics for inventory transactions

import { IonIcon } from '@ionic/react';
import {
  cubeOutline,
  listOutline,
  receiptOutline,
  swapVerticalSharp,
  trendingDown,
} from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';

interface InventoryTransactionSummaryCardProps {
  baseUom: string;
  currentCount: number;
  unitCost: number;
  totalReceipts?: number;
  totalSales?: number;
  totalValueIn?: number;
  totalValueOut?: number;
  formatCurrency: (amount: number) => string;
}

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
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

const InventoryTransactionSummaryCard: React.FC<InventoryTransactionSummaryCardProps> = ({
  baseUom,
  currentCount,
  unitCost,
  totalReceipts = 0,
  totalSales = 0,
  totalValueIn = 0,
  totalValueOut = 0,
  formatCurrency,
}) => {
  const currentValue = currentCount * unitCost;

  return (
    <CardContainer title="Transaction Summary" noPadding>
      <StatsGrid>
        <StatItem>
          <StatIcon color={designSystem.colors.status.paid}>
            <IonIcon icon={receiptOutline} />
          </StatIcon>
          <StatValue>{totalReceipts.toLocaleString()}</StatValue>
          <StatLabel>Total Receipts</StatLabel>
        </StatItem>

        <StatItem>
          <StatIcon color={designSystem.colors.danger}>
            <IonIcon icon={trendingDown} />
          </StatIcon>
          <StatValue>{totalSales.toLocaleString()}</StatValue>
          <StatLabel>Total Sales</StatLabel>
        </StatItem>

        <StatItem>
          <StatIcon color={designSystem.colors.success}>
            <IonIcon icon={swapVerticalSharp} />
          </StatIcon>
          <StatValue>{formatCurrency(totalValueIn)}</StatValue>
          <StatLabel>Value In</StatLabel>
        </StatItem>

        <StatItem>
          <StatIcon color={designSystem.colors.warning}>
            <IonIcon icon={swapVerticalSharp} />
          </StatIcon>
          <StatValue>{formatCurrency(totalValueOut)}</StatValue>
          <StatLabel>Value Out</StatLabel>
        </StatItem>

        <StatItem>
          <StatIcon color={designSystem.colors.info}>
            <IonIcon icon={cubeOutline} />
          </StatIcon>
          <StatValue>{currentCount.toLocaleString()}</StatValue>
          <StatLabel>On Hand {baseUom}</StatLabel>
        </StatItem>

        <StatItem>
          <StatIcon color={designSystem.colors.primary}>
            <IonIcon icon={listOutline} />
          </StatIcon>
          <StatValue>{formatCurrency(currentValue)}</StatValue>
          <StatLabel>Current Value</StatLabel>
        </StatItem>
      </StatsGrid>
    </CardContainer>
  );
};

export default InventoryTransactionSummaryCard;
