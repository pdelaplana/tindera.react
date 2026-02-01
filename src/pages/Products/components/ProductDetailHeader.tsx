// ProductDetailHeader - Breadcrumb navigation and delete button

import { IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface ProductDetailHeaderProps {
  productName: string;
  onDelete: () => void;
  canDelete: boolean;
}

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${designSystem.spacing.lg};
`;

const Left = styled.div``;

const Breadcrumb = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  margin-bottom: ${designSystem.spacing.xs};

  & span {
    color: ${designSystem.colors.brand.primary};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${designSystem.typography.fontSize.xl};
  font-weight: ${designSystem.typography.fontWeight.bold};
  color: ${designSystem.colors.text.primary};
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: none;
  border: none;
  cursor: pointer;
  color: ${designSystem.colors.danger};
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  font-family: ${designSystem.typography.fontFamily.base};
  transition: opacity ${designSystem.transitions.base};

  &:hover {
    opacity: 0.7;
  }
`;

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  productName,
  onDelete,
  canDelete,
}) => {
  return (
    <Container>
      <Left>
        <Breadcrumb>
          <span>Products</span> &gt; {productName}
        </Breadcrumb>
        <Title>Product Details</Title>
      </Left>
      {canDelete && (
        <DeleteButton onClick={onDelete}>
          <IonIcon icon={trashOutline} />
          Delete
        </DeleteButton>
      )}
    </Container>
  );
};

export default ProductDetailHeader;
