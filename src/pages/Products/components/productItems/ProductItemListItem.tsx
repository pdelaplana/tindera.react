// ProductItemListItem - Styled product item card using reusable CardItem

import type React from 'react';
import styled from 'styled-components';
import { CardItem } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { ProductItem } from '@/types';

interface ProductItemListItemProps {
  item: ProductItem;
  formatCurrency: (amount: number) => string;
  onClick: () => void;
  canEdit: boolean;
  showReorderHandle?: boolean;
}

// Styled components for content
const ItemName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const ItemMeta = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const ProductItemListItem: React.FC<ProductItemListItemProps> = ({
  item,
  formatCurrency,
  onClick,
  canEdit,
  showReorderHandle = false,
}) => {
  return (
    <CardItem
      canClick={canEdit}
      onClick={onClick}
      showReorderHandle={showReorderHandle}
    >
      <ItemName>{item.item_name}</ItemName>

      <ItemMeta>
        {item.quantity} {item.uom} @ {formatCurrency(item.unit_cost)} per {item.uom}
      </ItemMeta>
    </CardItem>
  );
};

export default ProductItemListItem;
