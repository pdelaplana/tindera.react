// ProductSalesPanel - Panel showing all sales orders for a specific product

import { IonIcon } from '@ionic/react';
import { bagHandleOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CenteredLayout, DetailPanel } from '@/components/layouts';
import { LoadingSpinner } from '@/components/ui';
import type { SalesPeriod } from '@/hooks/useOrder';
import { useProductSalesOrders } from '@/hooks/useOrder';
import { useShop } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails } from '@/types';

interface ProductSalesPanelProps {
  productId: string;
  productName: string;
  formatCurrency: (amount: number) => string;
  onBack: () => void;
}

const FilterRow = styled.div`
  display: flex;
  gap: ${designSystem.spacing.xs};
  padding: ${designSystem.spacing.md};
  flex-wrap: wrap;
`;

const PeriodPill = styled.button<{ active: boolean }>`
  padding: ${designSystem.spacing.xs} ${designSystem.spacing.md};
  border-radius: ${designSystem.borderRadius.full};
  border: 1px solid
    ${(props) =>
      props.active ? designSystem.colors.brand.primary : designSystem.colors.gray[300]};
  background: ${(props) => (props.active ? designSystem.colors.brand.primary : 'transparent')};
  color: ${(props) => (props.active ? 'white' : designSystem.colors.text.secondary)};
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designSystem.transitions.base};

  &:hover {
    border-color: ${designSystem.colors.brand.primary};
    color: ${(props) => (props.active ? 'white' : designSystem.colors.brand.primary)};
  }
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.md};
`;

const OrderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designSystem.spacing.md};
  background: ${designSystem.colors.surface.base};
  border: 1px solid ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.md};
`;

const OrderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.xs};
`;

const OrderNumber = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const OrderDate = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const OrderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${designSystem.spacing.xs};
`;

const OrderAmount = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.brand.primary};
`;

const OrderQty = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: ${designSystem.spacing.xl};
  gap: ${designSystem.spacing.md};
  color: ${designSystem.colors.text.secondary};
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${designSystem.colors.surface.variant};
  border-radius: ${designSystem.borderRadius.full};
  color: ${designSystem.colors.text.disabled};

  ion-icon {
    font-size: 28px;
  }
`;

const PERIODS: { label: string; value: SalesPeriod }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const formatOrderNumber = (orderNumber: number | null, prefix: string | undefined | null) => {
  if (!orderNumber) return 'N/A';
  const padded = orderNumber.toString().padStart(4, '0');
  return prefix ? `#${prefix}-${padded}` : `#${padded}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProductLineTotal = (order: OrderWithDetails, productId: string) => {
  return order.order_items
    .filter((item) => item.product_id === productId)
    .reduce(
      (acc, item) => ({
        qty: acc.qty + item.quantity,
        amount: acc.amount + item.quantity * item.product_unit_price,
      }),
      { qty: 0, amount: 0 }
    );
};

const ProductSalesPanel: React.FC<ProductSalesPanelProps> = ({
  productId,
  productName,
  formatCurrency,
  onBack,
}) => {
  const [period, setPeriod] = useState<SalesPeriod>('month');
  const { currentShop } = useShop();
  const { data: orders, isLoading } = useProductSalesOrders(productId, period);

  const shopPrefix = currentShop?.order_prefix;

  return (
    <DetailPanel
      title="Sales"
      icon={bagHandleOutline}
      breadcrumbs={[{ label: productName, onClick: onBack }, { label: 'Sales' }]}
    >
      <CenteredLayout>
        <FilterRow>
          {PERIODS.map((p) => (
            <PeriodPill
              key={p.value}
              active={period === p.value}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </PeriodPill>
          ))}
        </FilterRow>

        {isLoading ? (
          <EmptyState>
            <LoadingSpinner />
          </EmptyState>
        ) : !orders || orders.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <IonIcon icon={bagHandleOutline} />
            </EmptyIcon>
            <div>No sales found for this period</div>
          </EmptyState>
        ) : (
          <OrdersList>
            {orders.map((order) => {
              const { qty, amount } = getProductLineTotal(order, productId);
              return (
                <OrderRow key={order.id}>
                  <OrderLeft>
                    <OrderNumber>{formatOrderNumber(order.order_number, shopPrefix)}</OrderNumber>
                    <OrderDate>{formatDate(order.order_date)}</OrderDate>
                  </OrderLeft>
                  <OrderRight>
                    <OrderAmount>{formatCurrency(amount)}</OrderAmount>
                    <OrderQty>Qty: {qty}</OrderQty>
                  </OrderRight>
                </OrderRow>
              );
            })}
          </OrdersList>
        )}
      </CenteredLayout>
    </DetailPanel>
  );
};

export default ProductSalesPanel;
