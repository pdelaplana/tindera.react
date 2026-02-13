// Inventory Item List Item - Card-based list item for inventory items

import type React from 'react';
import styled from 'styled-components';
import CardItem from '@/components/shared/CardItem';
import { designSystem } from '@/theme/designSystem';
import type { InventoryItemWithCategory } from '@/types';

interface InventoryItemListItemProps {
  item: InventoryItemWithCategory;
  isSelected?: boolean;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

const ItemName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.medium};
  color: ${designSystem.colors.text.primary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const ItemDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const StockInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${designSystem.spacing.xs};
`;

const StockCount = styled.div<{ isLow: boolean; isOut: boolean }>`
  font-size: ${designSystem.typography.fontSize.lg};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${(props) =>
    props.isOut
      ? designSystem.colors.status.outOfStock
      : props.isLow
        ? designSystem.colors.status.lowStock
        : designSystem.colors.text.primary};
`;

const StockLabel = styled.div`
  font-size: ${designSystem.typography.fontSize.xs};
  color: ${designSystem.colors.text.secondary};
  text-transform: uppercase;
`;

const LowStockBadge = styled.span<{ isOut: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${designSystem.spacing.xs} ${designSystem.spacing.sm};
  border-radius: ${designSystem.borderRadius.full};
  background: ${(props) =>
    props.isOut ? designSystem.colors.status.outOfStock : designSystem.colors.status.lowStock};
  color: white;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  margin-left: ${designSystem.spacing.sm};
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  background: ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.full};
  margin-top: ${designSystem.spacing.sm};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percent: number; isLow: boolean }>`
  height: 100%;
  width: ${(props) => props.percent}%;
  background: ${(props) =>
    props.isLow ? designSystem.colors.status.outOfStock : designSystem.colors.status.inStock};
  border-radius: ${designSystem.borderRadius.full};
  transition: width ${designSystem.transitions.base};
`;

const InventoryItemListItem: React.FC<InventoryItemListItemProps> = ({
  item,
  isSelected = false,
  onClick,
  formatCurrency,
}) => {
  const isOutOfStock = item.current_count === 0;
  const isLowStock = !isOutOfStock && item.current_count <= item.reorder_level;
  const isAtOrBelowReorder = item.current_count <= item.reorder_level;

  const maxStock = Math.max(item.reorder_level * 2, 1);
  const stockPercent = Math.min((item.current_count / maxStock) * 100, 100);

  const rightContent = (
    <StockInfo>
      <StockCount isLow={isLowStock} isOut={isOutOfStock}>
        {item.current_count}
      </StockCount>
      <StockLabel>{item.base_uom}</StockLabel>
    </StockInfo>
  );

  return (
    <CardItem isSelected={isSelected} onClick={onClick} rightContent={rightContent}>
      <ItemName>{item.name}</ItemName>
      <ItemDetails>
        <span>
          {formatCurrency(item.unit_cost)} per {item.base_uom}
        </span>
        {isOutOfStock && <LowStockBadge isOut={true}>Out of Stock</LowStockBadge>}
        {isLowStock && <LowStockBadge isOut={false}>Low Stock</LowStockBadge>}
      </ItemDetails>
      <ProgressTrack>
        <ProgressFill percent={stockPercent} isLow={isAtOrBelowReorder} />
      </ProgressTrack>
    </CardItem>
  );
};

export default InventoryItemListItem;
