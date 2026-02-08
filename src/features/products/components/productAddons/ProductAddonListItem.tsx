// ProductAddonListItem - Styled addon card using reusable CardItem

import type React from 'react';
import styled from 'styled-components';
import { CardItem } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { ProductAddon } from '@/types';

interface ProductAddonListItemProps {
  addon: ProductAddon;
  formatCurrency: (amount: number) => string;
  onClick: () => void;
  canEdit: boolean;
  showReorderHandle?: boolean;
}

// Styled components for content
const AddonName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const AddonMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const MetaDivider = styled.span`
  color: ${designSystem.colors.gray[300]};
`;

const Price = styled.span`
  color: ${designSystem.colors.brand.primary};
  font-weight: ${designSystem.typography.fontWeight.medium};
`;

const ProductAddonListItem: React.FC<ProductAddonListItemProps> = ({
  addon,
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
      <AddonName>{addon.name}</AddonName>

      <AddonMeta>
        <Price>+{formatCurrency(addon.price)}</Price>
        {addon.inventory_item_id && addon.item_name && (
          <>
            <MetaDivider>·</MetaDivider>
            <span>
              uses {addon.quantity} {addon.item_name}
            </span>
          </>
        )}
      </AddonMeta>
    </CardItem>
  );
};

export default ProductAddonListItem;
