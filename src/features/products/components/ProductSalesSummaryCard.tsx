// ProductSalesSummaryCard - Sales statistics card for a product with period filter

import { IonIcon } from '@ionic/react';
import { bagHandleOutline, cashOutline, chevronForwardOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { SalesPeriod } from '@/hooks/useOrder';
import { useProductSalesSummary } from '@/hooks/useOrder';

interface ProductSalesSummaryCardProps {
  productId: string;
  formatCurrency: (amount: number) => string;
  onViewAll?: () => void;
}

const CardContent = styled.div`
  padding: ${designSystem.spacing.md};
`;

const PeriodFilterRow = styled.div`
  display: flex;
  gap: ${designSystem.spacing.xs};
  margin-bottom: ${designSystem.spacing.md};
  flex-wrap: wrap;
`;

const PeriodPill = styled.button<{ active: boolean }>`
  padding: ${designSystem.spacing.xs} ${designSystem.spacing.md};
  border-radius: ${designSystem.borderRadius.full};
  border: 1px solid
    ${(props) =>
      props.active ? designSystem.colors.brand.primary : designSystem.colors.gray[300]};
  background: ${(props) =>
    props.active ? designSystem.colors.brand.primary : 'transparent'};
  color: ${(props) =>
    props.active ? 'white' : designSystem.colors.text.secondary};
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designSystem.transitions.base};

  &:hover {
    border-color: ${designSystem.colors.brand.primary};
    color: ${(props) => (props.active ? 'white' : designSystem.colors.brand.primary)};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${designSystem.spacing.md};
  margin-bottom: ${designSystem.spacing.sm};
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
  text-align: center;
`;

const ViewAllLink = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.xs};
  width: 100%;
  padding: ${designSystem.spacing.md};
  background: transparent;
  border: none;
  border-top: 1px solid ${designSystem.colors.gray[200]};
  color: ${designSystem.colors.brand.primary};
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${designSystem.colors.surface.variant};
  }

  ion-icon {
    font-size: 18px;
  }
`;

const LoadingState = styled.div`
  padding: ${designSystem.spacing.lg};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
  font-size: ${designSystem.typography.fontSize.sm};
`;

const PERIODS: { label: string; value: SalesPeriod }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const ProductSalesSummaryCard: React.FC<ProductSalesSummaryCardProps> = ({
  productId,
  formatCurrency,
  onViewAll,
}) => {
  const [period, setPeriod] = useState<SalesPeriod>('month');
  const { data: summary, isLoading } = useProductSalesSummary(productId, period);

  return (
    <CardContainer title="Sales Summary" noPadding>
      <CardContent>
        <PeriodFilterRow>
          {PERIODS.map((p) => (
            <PeriodPill key={p.value} active={period === p.value} onClick={() => setPeriod(p.value)}>
              {p.label}
            </PeriodPill>
          ))}
        </PeriodFilterRow>

        {isLoading ? (
          <LoadingState>Loading sales data...</LoadingState>
        ) : (
          <StatsGrid>
            <StatItem>
              <StatIcon color={designSystem.colors.brand.primary}>
                <IonIcon icon={bagHandleOutline} />
              </StatIcon>
              <StatValue>{(summary?.totalQty ?? 0).toLocaleString()}</StatValue>
              <StatLabel>Units Sold</StatLabel>
            </StatItem>

            <StatItem>
              <StatIcon color={designSystem.colors.status.paid}>
                <IonIcon icon={cashOutline} />
              </StatIcon>
              <StatValue>{formatCurrency(summary?.totalAmount ?? 0)}</StatValue>
              <StatLabel>Total Revenue</StatLabel>
            </StatItem>
          </StatsGrid>
        )}
      </CardContent>

      {onViewAll && (
        <ViewAllLink onClick={onViewAll}>
          View All Sales
          <IonIcon icon={chevronForwardOutline} />
        </ViewAllLink>
      )}
    </CardContainer>
  );
};

export default ProductSalesSummaryCard;
