// ProductDetailHeader - Breadcrumb navigation

import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface ProductDetailHeaderProps {
  productName: string;
}

const Container = styled.div`
  margin-bottom: ${designSystem.spacing.lg};
  padding: ${designSystem.spacing.lg};
`;

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

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({ productName }) => {
  return (
    <Container>
      <Breadcrumb>
        <span>Products</span> &gt; {productName}
      </Breadcrumb>
      <Title>Product Details</Title>
    </Container>
  );
};

export default ProductDetailHeader;
