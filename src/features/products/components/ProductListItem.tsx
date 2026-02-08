// ProductListItem - Styled product card matching OrderCard pattern

import { IonBadge } from '@ionic/react';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import type { ProductWithCategory } from '@/types';

interface ProductListItemProps {
  product: ProductWithCategory;
  isSelected: boolean;
  onClick: () => void;
  formatPrice: (price: number) => string;
}

// Styled components - matching OrderCard pattern with thumbnail
const Card = styled.div<{ isSelected: boolean }>`
  background: ${(props) =>
    props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
  border-radius: ${designSystem.borderRadius.md};
  padding: ${designSystem.spacing.md};
  cursor: pointer;
  transition: all ${designSystem.transitions.base};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid
    ${(props) =>
      props.isSelected ? designSystem.colors.brand.primary : designSystem.colors.gray[200]};
  display: flex;
  gap: ${designSystem.spacing.md};
  align-items: flex-start;

  &:hover {
    background: ${designSystem.colors.surface.variant};
    box-shadow: ${designSystem.shadows.sm};
  }

  &:active {
    transform: scale(0.99);
  }
`;

const Thumbnail = styled.img`
  width: 56px;
  height: 56px;
  border-radius: ${designSystem.borderRadius.md};
  object-fit: cover;
  flex-shrink: 0;
  background: ${designSystem.colors.gray[100]};
`;

const ThumbnailPlaceholder = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${designSystem.borderRadius.md};
  background: ${designSystem.colors.gray[100]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  font-size: ${designSystem.typography.fontSize.xs};
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designSystem.spacing.xs};
`;

const ProductName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

const ProductPrice = styled.div`
  font-size: ${designSystem.typography.fontSize.lg};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.brand.primary};
  flex-shrink: 0;
  margin-left: ${designSystem.spacing.sm};
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const MetaDivider = styled.span`
  color: ${designSystem.colors.gray[300]};
`;

const StatusBadge = styled(IonBadge)<{ isActive: boolean }>`
  --background: ${(props) =>
    props.isActive ? designSystem.colors.status.paid : designSystem.colors.gray[400]};
  --color: white;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  padding: 2px 8px;
`;

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  isSelected,
  onClick,
  formatPrice,
}) => {
  return (
    <Card isSelected={isSelected} onClick={onClick} role="button" tabIndex={0}>
      {product.image_url ? (
        <Thumbnail src={product.image_url} alt={product.name} />
      ) : (
        <ThumbnailPlaceholder>
          <span>📦</span>
        </ThumbnailPlaceholder>
      )}

      <CardContent>
        <CardHeader>
          <ProductName>{product.name}</ProductName>
          <ProductPrice>{formatPrice(product.price)}</ProductPrice>
        </CardHeader>

        <CardMeta>
          {product.category ? (
            <>
              <span>{product.category.name}</span>
              <MetaDivider>·</MetaDivider>
            </>
          ) : (
            <>
              <span>No category</span>
              <MetaDivider>·</MetaDivider>
            </>
          )}
          <span>{product.image_url ? 'Has image' : 'No image'}</span>
        </CardMeta>

        <StatusBadge isActive={product.is_active}>
          {product.is_active ? 'Active' : 'Inactive'}
        </StatusBadge>
      </CardContent>
    </Card>
  );
};

export default ProductListItem;
