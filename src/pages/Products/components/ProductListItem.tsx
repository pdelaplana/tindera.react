// ProductListItem - Styled product list item with selection support

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

const Card = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  cursor: pointer;
  transition: all ${designSystem.transitions.base};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  background: ${(props) =>
    props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
  border-bottom: 1px solid ${designSystem.colors.gray[100]};

  &:hover {
    background: ${designSystem.colors.surface.variant};
  }

  &:active {
    transform: scale(0.99);
  }
`;

const Thumbnail = styled.img`
  width: 48px;
  height: 48px;
  border-radius: ${designSystem.borderRadius.md};
  object-fit: cover;
  flex-shrink: 0;
  background: ${designSystem.colors.gray[100]};
`;

const ThumbnailPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${designSystem.borderRadius.md};
  background: ${designSystem.colors.gray[100]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  font-size: ${designSystem.typography.fontSize.xs};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Category = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.brand.primary};
  margin-top: 2px;
`;

const PriceContainer = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const Price = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.brand.primary};
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
        <ThumbnailPlaceholder>No img</ThumbnailPlaceholder>
      )}
      <Info>
        <Name>{product.name}</Name>
        {product.category && <Category>{product.category.name}</Category>}
      </Info>
      <PriceContainer>
        <Price>{formatPrice(product.price)}</Price>
      </PriceContainer>
    </Card>
  );
};

export default ProductListItem;
