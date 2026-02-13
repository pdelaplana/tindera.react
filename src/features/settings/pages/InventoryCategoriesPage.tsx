// Inventory Categories List Page - Manage inventory categories

import { zodResolver } from '@hookform/resolvers/zod';
import type { ItemReorderEventDetail } from '@ionic/react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonReorder,
  IonReorderGroup,
  IonSearchbar,
  IonText,
  IonToggle,
  type RefresherEventDetail,
} from '@ionic/react';
import { add, reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { CardContainer } from '@/components/shared/CardContainer';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { LoadingSpinner } from '@/components/ui';
import {
  useCreateInventoryCategory,
  useDeleteInventoryCategory,
  useInventoryCategories,
  useUpdateInventoryCategory,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import type { InventoryCategory } from '@/types';

// Validation schema for category form
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable(),
  sequence: z.number().min(0, 'Sequence must be a positive number'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const InventoryCategoriesPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: categories, isLoading: categoriesLoading, refetch } = useInventoryCategories();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const createCategory = useCreateInventoryCategory();
  const updateCategory = useUpdateInventoryCategory();
  const deleteCategory = useDeleteInventoryCategory();

  const isLoading = shopLoading || categoriesLoading;

  const filteredCategories = (categories ?? [])
    .filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => a.sequence - b.sequence);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: null,
      sequence: 0,
    },
  });

  // Handle pull-to-refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  // Open add modal
  const handleAddCategory = () => {
    setEditingCategory(null);
    reset({
      name: '',
      description: null,
      sequence: categories ? categories.length : 0,
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditCategory = (category: InventoryCategory) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description,
      sequence: category.sequence,
    });
    setShowAddModal(true);
  };

  // Submit form (create or update)
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory.mutateAsync({
          categoryId: editingCategory.id,
          updates: data,
        });
      } else {
        // Create new category
        await createCategory.mutateAsync(data);
      }
      setShowAddModal(false);
      reset();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Confirm delete
  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    try {
      await deleteCategory.mutateAsync(deletingCategoryId);
      setDeletingCategoryId(null);
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Reorder categories
  const handleReorder = async (event: CustomEvent<ItemReorderEventDetail>) => {
    event.stopPropagation();
    const { from, to } = event.detail;

    const reordered = [...filteredCategories];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sequence !== i) {
        await updateCategory.mutateAsync({
          categoryId: reordered[i].id,
          updates: { sequence: i },
        });
      }
    }

    event.detail.complete();
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    reset();
  };

  // Empty state
  const renderEmptyState = () => (
    <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
      <h2>No Categories Yet</h2>
      <p>Get started by adding your first inventory category</p>
      <IonButton onClick={handleAddCategory} size="default">
        <IonIcon slot="start" icon={add} />
        Add Category
      </IonButton>
    </Div>
  );

  // No shop selected state
  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Inventory Categories" backHref="/shops" onRefresh={handleRefresh}  >
        
        <IonContent className="ion-padding">
          <CenteredLayout>
            <div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Shop Selected</h2>
              <p>Please select a shop to manage categories</p>
            </div>
          </CenteredLayout>
        </IonContent>
      </BasePage>
    );
  }

  return (
    <BasePage
      title="Inventory Categories"
      backHref={`/shops/${currentShop?.id}/settings`}
      onRefresh={handleRefresh}
    >
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search categories..."
          onActionClick={handleAddCategory}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !categories || categories.length === 0 ? (
            renderEmptyState()
          ) : (
            <IonList>
              <IonReorderGroup disabled={!reorderEnabled} onIonReorderEnd={handleReorder}>
                {filteredCategories.map((category) => (
                  <IonItem
                    key={category.id}
                    lines={'full'}
                    onClick={() => !reorderEnabled && handleEditCategory(category)}
                    button={!reorderEnabled}
                  >
                    <IonLabel>
                      <h2>{category.name}</h2>
                      {category.description && (
                        <IonText color="medium">
                          <p>{category.description}</p>
                        </IonText>
                      )}
                    </IonLabel>
                    {reorderEnabled && (
                      <IonReorder slot="end" className="ion-margin-top">
                        <IonIcon icon={reorderTwoOutline} size="small"  />
                      </IonReorder>
                    )}
                  </IonItem>
                ))}
              </IonReorderGroup>

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
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      {/* Add/Edit Category Modal */}
      <BaseModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        onActionClick={handleSubmit(onSubmit)}
        actionButtonDisabled={createCategory.isPending || updateCategory.isPending}
        actionButtonLoading={createCategory.isPending || updateCategory.isPending}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Category Name"
            placeholder="e.g., Beverages, Produce"
            error={errors.name}
            required
          />

          <TextField
            control={control}
            name="description"
            label="Description"
            placeholder="Optional description"
            error={errors.description}
          />

          <NumberField
            control={control}
            name="sequence"
            label="Sequence"
            placeholder="Display order"
            error={errors.sequence}
            required
          />
          <SaveButton
            type="submit"
            expand="block"
            disabled={createCategory.isPending || updateCategory.isPending}
            isSaving={createCategory.isPending || updateCategory.isPending}
            label="Save Category"
          />

          {editingCategory && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingCategoryId(editingCategory.id)}
              disabled={deleteCategory.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Category
            </IonButton>
          )}
        </form>
      </BaseModal>

      {/* Delete Confirmation Alert */}
      <DeleteConfirmationAlert
        isOpen={!!deletingCategoryId}
        onDismiss={() => setDeletingCategoryId(null)}
        onConfirm={handleDeleteCategory}
        itemName="category"
      />
    </BasePage>
  );
};

export default InventoryCategoriesPage;
