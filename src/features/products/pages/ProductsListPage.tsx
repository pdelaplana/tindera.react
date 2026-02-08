// Products List Page - Responsive master-detail split pane

import { IonContent, IonPage, IonSearchbar } from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { MasterDetailLayout, PlaceholderContainer } from '@/components/layouts';
import { CategoryPillScroller } from '@/components/pos';
import PageHeader from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/ui';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useProductCategories, useProducts } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import type { ProductWithCategory } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import { ProductDetailPanel, ProductFormModal, ProductListItem } from '../components';

// Styled components
const SearchBarContainer = styled.div`
  padding: 12px 16px;
`;

const CategoryContainer = styled.div`
  padding: 0 16px 8px 16px;
  border-bottom: 1px solid var(--ion-color-light-shade);
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.sm};
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designSystem.spacing['2xl']};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
  gap: ${designSystem.spacing.sm};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  width: calc(100% - 32px);
  margin: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  border: 2px dashed ${designSystem.colors.gray[300]};
  border-radius: ${designSystem.borderRadius.md};
  background: none;
  cursor: pointer;
  color: ${designSystem.colors.text.secondary};
  font-size: ${designSystem.typography.fontSize.base};
  font-family: ${designSystem.typography.fontFamily.base};
  transition: all ${designSystem.transitions.base};

  &:hover {
    border-color: ${designSystem.colors.brand.primary};
    color: ${designSystem.colors.brand.primary};
  }
`;

const ProductsListPage: React.FC = () => {
  const history = useHistory();
  const isDesktop = useIsTabletOrLarger();
  const { currentShop, isLoading: shopLoading } = useShop();

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  const { data: products, isLoading: productsLoading } = useProducts({
    search: searchText || undefined,
    categoryId: selectedCategory || undefined,
  });

  const { data: categories } = useProductCategories();

  const isLoading = shopLoading || productsLoading;

  // Currency formatter
  const formatPrice = useMemo(() => {
    const formatter = createCurrencyFormatter(currentShop?.currency_code || 'USD');
    return (price: number) => formatter(price);
  }, [currentShop?.currency_code]);

  // Handle product selection (desktop: set selected, mobile: navigate)
  const handleProductSelect = (product: ProductWithCategory) => {
    if (isDesktop) {
      setSelectedProductId(product.id);
    } else {
      if (currentShop) {
        history.push(`/shops/${currentShop.id}/products/${product.id}/manage`);
      }
    }
  };

  const handleAddProduct = () => {
    setIsModalOpen(true);
  };

  const handleProductDeleted = () => {
    setSelectedProductId(null);
  };

  // Render search bar
  const renderSearchBar = () => (
    <SearchBarContainer>
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value ?? '')}
        placeholder="Search products..."
        debounce={300}
        className="searchBar"
      />
    </SearchBarContainer>
  );

  // Render category pills
  const renderCategoryPills = () => {
    if (!categories || categories.length === 0) return null;
    return (
      <CategoryContainer>
        <CategoryPillScroller
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </CategoryContainer>
    );
  };

  // Render product list
  const renderProductList = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!products || products.length === 0) {
      return (
        <EmptyContainer>
          <h3>No Products Yet</h3>
          <p>Get started by adding your first product</p>
        </EmptyContainer>
      );
    }

    return (
      <ListContainer>
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            isSelected={isDesktop && selectedProductId === product.id}
            onClick={() => handleProductSelect(product)}
            formatPrice={formatPrice}
          />
        ))}
      </ListContainer>
    );
  };

  // No shop state
  if (!currentShop && !shopLoading) {
    return (
      <IonPage>
        <PageHeader title="Products" showProfile showLogout />
        <IonContent>
          <PlaceholderContainer>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to view products</p>
          </PlaceholderContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Render left panel content (list)
  const leftPanelContent = (
    <>
      {renderSearchBar()}
      {renderCategoryPills()}
      {renderProductList()}
      <AddButton onClick={handleAddProduct}>+ Add New Product</AddButton>
    </>
  );

  // Render right panel content (detail)
  const rightPanelContent = (
    <ProductDetailPanel productId={selectedProductId} onProductDeleted={handleProductDeleted} />
  );

  return (
    <IonPage>
      <PageHeader title="Products" showProfile showLogout />
      <IonContent>
        <MasterDetailLayout leftPanel={leftPanelContent} rightPanel={rightPanelContent} />
      </IonContent>
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={null}
      />
    </IonPage>
  );
};

export default ProductsListPage;
