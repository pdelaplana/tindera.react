// Discount Type Settings Page - Manage shop discount types

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonToggle,
  type RefresherEventDetail,
} from '@ionic/react';
import type React from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { CardContainer } from '@/components/shared/CardContainer';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { LoadingSpinner } from '@/components/ui';
import { Div } from '@/components/shared/base/Div';
import {
  useCreateDiscountType,
  useDeleteDiscountType,
  useDiscountTypes,
  useUpdateDiscountType,
} from '@/hooks/useDiscountTypes';
import { useShop } from '@/hooks/useShop';
import type { DiscountType } from '@/types';

const discountTypeSchema = z.object({
  name: z.string().min(1, 'Discount type name is required'),
  is_active: z.boolean(),
});

type DiscountTypeFormData = z.infer<typeof discountTypeSchema>;

const DiscountTypeSettingsPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: discountTypes, isLoading: typesLoading, refetch } = useDiscountTypes(true);

  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<DiscountType | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  const createType = useCreateDiscountType();
  const updateType = useUpdateDiscountType();
  const deleteType = useDeleteDiscountType();

  const isLoading = shopLoading || typesLoading;

  const filteredTypes = (discountTypes ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountTypeFormData>({
    resolver: zodResolver(discountTypeSchema),
    defaultValues: { name: '', is_active: true },
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleAdd = () => {
    setEditingType(null);
    reset({ name: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (discountType: DiscountType) => {
    setEditingType(discountType);
    reset({ name: discountType.name, is_active: discountType.is_active });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    reset();
  };

  const onSubmit = async (data: DiscountTypeFormData) => {
    if (editingType) {
      await updateType.mutateAsync({
        discountTypeId: editingType.id,
        updates: { name: data.name, is_active: data.is_active },
      });
    } else {
      await createType.mutateAsync({ name: data.name });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingTypeId) return;
    await deleteType.mutateAsync(deletingTypeId);
    setDeletingTypeId(null);
    handleCloseModal();
  };

  const isSaving = createType.isPending || updateType.isPending;

  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Discount Types" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage discount types</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage
      title="Discount Types"
      backHref={`/shops/${currentShop?.id}/settings`}
      onRefresh={handleRefresh}
    >
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search discount types..."
          onActionClick={handleAdd}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !discountTypes || discountTypes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Discount Types Yet</h2>
              <p>Add discount types to apply to your orders</p>
            </Div>
          ) : filteredTypes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText color="medium">
                <h3>No discount types match your search</h3>
              </IonText>
            </Div>
          ) : (
            <IonList>
              {filteredTypes.map((discountType, index) => (
                <IonItem
                  key={discountType.id}
                  button
                  lines={index === filteredTypes.length - 1 ? 'none' : 'full'}
                  onClick={() => handleEdit(discountType)}
                >
                  <IonLabel>
                    <h2>{discountType.name}</h2>
                      {discountType.is_system && (
                    <IonBadge color="primary" style={{ marginTop: '8px' }}>
                      System
                    </IonBadge>
                  )}
                  </IonLabel>
                
                  {!discountType.is_active && <IonBadge color="medium">Inactive</IonBadge>}
                </IonItem>
              ))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingType ? 'Edit Discount Type' : 'Add Discount Type'}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Discount Type Name"
            placeholder="e.g., Member Discount"
            error={errors.name}
            required
          />
          {editingType && !editingType.is_system && (
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <IonItem lines="none">
                  <IonToggle
                    checked={field.value}
                    onIonChange={(e) => field.onChange(e.detail.checked)}
                    labelPlacement="start"
                  >
                    Active
                  </IonToggle>
                </IonItem>
              )}
            />
          )}

          {!editingType?.is_system && (
            <SaveButton
              type="submit"
              expand="block"
              isSaving={isSaving}
              disabled={isSaving}
              label="Save Discount Type"
            />
          )}

          {editingType && !editingType.is_system && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingTypeId(editingType.id)}
              disabled={deleteType.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Discount Type
            </IonButton>
          )}
        </form>
      </BaseModal>

      <DeleteConfirmationAlert
        isOpen={!!deletingTypeId}
        onDismiss={() => setDeletingTypeId(null)}
        onConfirm={handleDelete}
        itemName={editingType?.name || ''}
        itemType="Discount Type"
      />
    </BasePage>
  );
};

export default DiscountTypeSettingsPage;
