// ProductDetailContent - Shared product detail content for both mobile and desktop views

import type React from 'react';
import styled from 'styled-components';
import { CardContainer, DeleteButton } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type {
  ModifierGroupWithModifiers,
  ProductAddon,
  ProductItem,
  ProductWithDetails,
} from '@/types';
import {
  ProductAddonsList,
  ProductGeneralDetailsCard,
  ProductImageSection,
  ProductItemsList,
  ProductModifiersList,
  ProductSalesSummaryCard,
} from './';

interface ProductDetailContentProps {
  product: ProductWithDetails;
  shopId: string;
  formatCurrency: (amount: number) => string;
  canEdit: boolean;
  canDelete: boolean;
  onImageUploaded: (url: string) => void;
  onAddModifierGroup: () => void;
  onEditModifierGroup: (group: ModifierGroupWithModifiers) => void;
  onReorderModifierGroup: (event: CustomEvent) => void;
  onAddAddon: () => void;
  onEditAddon: (addon: ProductAddon) => void;
  onAddItem: () => void;
  onEditItem: (item: ProductItem) => void;
  onDeleteProduct: () => void;
  onViewSales?: () => void;
}

const DangerCardContainer = styled(CardContainer)`
  margin-top: ${designSystem.spacing.xl};
  border: 1px solid ${designSystem.colors.danger};

  h2 {
    color: ${designSystem.colors.danger};
  }
`;

const DangerZoneContent = styled.div`
  padding: ${designSystem.spacing.md};
  display: flex;
  flex-direction: column;

`;

const DangerZoneDescription = styled.p`
  margin: 0 0 ${designSystem.spacing.md} 0;
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const ProductDetailContent: React.FC<ProductDetailContentProps> = ({
  product,
  shopId,
  formatCurrency,
  canEdit,
  canDelete,
  onImageUploaded,
  onAddModifierGroup,
  onEditModifierGroup,
  onReorderModifierGroup,
  onAddAddon,
  onEditAddon,
  onAddItem,
  onEditItem,
  onDeleteProduct,
  onViewSales,
}) => {
  return (
    <>
      <ProductImageSection
        imageUrl={product.image_url}
        productId={product.id}
        shopId={shopId}
        onImageUploaded={onImageUploaded}
        disabled={!canEdit}
      />

      <ProductGeneralDetailsCard product={product} disabled={!canEdit} />

      <ProductSalesSummaryCard
        productId={product.id}
        formatCurrency={formatCurrency}
        onViewAll={onViewSales}
      />

      <ProductModifiersList
        linkedGroups={product.linkedModifierGroups || []}
        priceOverrides={product.priceOverrides || {}}
        formatCurrency={formatCurrency}
        onAdd={onAddModifierGroup}
        onEdit={onEditModifierGroup}
        onReorder={onReorderModifierGroup}
        canEdit={canEdit}
      />

      <ProductAddonsList
        addons={product.addons || []}
        formatCurrency={formatCurrency}
        onAdd={onAddAddon}
        onEdit={onEditAddon}
        canEdit={canEdit}
      />

      <ProductItemsList
        items={product.items || []}
        formatCurrency={formatCurrency}
        onAdd={onAddItem}
        onEdit={onEditItem}
        canEdit={canEdit}
      />

      {canDelete && (
        <DangerCardContainer title="Danger Zone">
          <DangerZoneContent>
            <DangerZoneDescription>
              Deleting this product will permanently remove it from your catalog. This action cannot
              be undone.
            </DangerZoneDescription>
            <DeleteButton
              isDeleting={false}
              onClick={onDeleteProduct}
              label="Delete Product"
              fill="solid"
              expand="block"
            />
          </DangerZoneContent>
        </DangerCardContainer>
      )}
    </>
  );
};

export default ProductDetailContent;
