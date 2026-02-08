// Categories List Page - Product category management

import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonReorder,
  IonReorderGroup,
  IonText,
  IonToggle,
  type ItemReorderEventDetail,
  type RefresherEventDetail,
} from '@ionic/react';
import { reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { LoadingSpinner } from '@/components/ui';
import type { ProductCategory } from '@/types';
import { useProductCategories, useUpdateProductCategory } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { CategoryFormModal } from '../../components';

export const CategoriesListPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading, hasPermission } = useShop();
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [reorderEnabled, setReorderEnabled] = useState(false);

  // Permissions
  const canEdit = hasPermission('staff');

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, refetch } = useProductCategories();

  const isLoading = shopLoading || categoriesLoading;

  // Apply search filter
  const filteredCategories = useMemo(() => {
    if (!categories) return [];

    let filtered = categories;

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by sequence
    return filtered.sort((a, b) => a.sequence - b.sequence);
  }, [categories, searchText]);

  // Handle pull-to-refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  // Navigate to add category
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  // Navigate to edit category
  const handleEditCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  // Close modal and refetch data
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    refetch();
  };

  const updateCategory = useUpdateProductCategory();

  // Handle reorder
  const handleReorder = async (event: CustomEvent<ItemReorderEventDetail>) => {
    if (!categories) return;

    // Create a mutable copy of the categories array
    const reorderedCategories = [...categories];

    // Move the item from the old index to the new index
    const itemToMove = reorderedCategories.splice(event.detail.from, 1)[0];
    reorderedCategories.splice(event.detail.to, 0, itemToMove);

    // Update sequence numbers for all affected categories
    const updatePromises = reorderedCategories.map((category, index) =>
      updateCategory.mutateAsync({
        categoryId: category.id,
        updates: { sequence: index },
      })
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to update category order:', error);
    }

    // Complete the reorder animation
    event.detail.complete();
  };

  // Render individual category
  const renderCategory = (category: ProductCategory, _index: number) => {
    return (
      <IonItem
        key={category.id}
        lines="full"
        button={canEdit}
        onClick={() => canEdit && handleEditCategory(category)}
      >
        <IonLabel>
          <h2>{category.name}</h2>
          {category.description && <p>{category.description}</p>}
        </IonLabel>
        {canEdit && reorderEnabled && (
          <IonReorder slot="end" className="ion-margin-top">
            <IonIcon icon={reorderTwoOutline} size="small" />
          </IonReorder>
        )}
      </IonItem>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
      <h2>No Categories Yet</h2>
      <p>Create categories to organize your products</p>
    </Div>
  );

  // No shop selected state
  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Categories" showMenu showProfile showLogout backHref="/products">
        <CenteredLayout>
          <div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage categories</p>
          </div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Categories" showMenu backHref={`/shops/${currentShop?.id}/products`}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <CenteredLayout>
        <CardContainer
          title="Product Categories"
          onActionClick={handleAddCategory}
          noPadding
          showSearch={true}
          searchPlaceholder="Search categories..."
          searchValue={searchText}
          onSearchChange={setSearchText}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !categories || categories.length === 0 ? (
            renderEmptyState()
          ) : filteredCategories.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText>
                <h3>No categories match your search</h3>
              </IonText>
            </Div>
          ) : (
            <>
              <IonList>
                <IonReorderGroup
                  disabled={!canEdit || !reorderEnabled}
                  onIonReorderEnd={handleReorder}
                >
                  {filteredCategories.map((category, index) => renderCategory(category, index))}
                </IonReorderGroup>
              </IonList>

              {/* Reorder Toggle - Only show if there are items and user can edit */}
              {filteredCategories.length > 0 && canEdit && (
                <Div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '12px 16px',
                    gap: '8px',
                  }}
                >
                  <IonToggle
                    checked={reorderEnabled}
                    onIonChange={(e) => setReorderEnabled(e.detail.checked)}
                    labelPlacement="start"
                  >
                    Reorder
                  </IonToggle>
                </Div>
              )}
            </>
          )}
        </CardContainer>
      </CenteredLayout>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={selectedCategory}
      />
    </BasePage>
  );
};
