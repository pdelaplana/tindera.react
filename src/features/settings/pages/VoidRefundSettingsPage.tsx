// Void & Refund Settings Page - Manage shop void/refund reasons

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
  useCreateVoidRefundReason,
  useDeleteVoidRefundReason,
  useUpdateVoidRefundReason,
  useVoidRefundReasons,
} from '@/hooks/useVoidRefundReasons';
import { useShop } from '@/hooks/useShop';
import type { VoidRefundReason } from '@/types';

const voidRefundReasonSchema = z.object({
  name: z.string().min(1, 'Reason name is required'),
  is_active: z.boolean(),
});

type VoidRefundReasonFormData = z.infer<typeof voidRefundReasonSchema>;

const VoidRefundSettingsPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: reasons, isLoading: reasonsLoading, refetch } = useVoidRefundReasons(true);

  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReason, setEditingReason] = useState<VoidRefundReason | null>(null);
  const [deletingReasonId, setDeletingReasonId] = useState<string | null>(null);

  const createReason = useCreateVoidRefundReason();
  const updateReason = useUpdateVoidRefundReason();
  const deleteReason = useDeleteVoidRefundReason();

  const isLoading = shopLoading || reasonsLoading;

  const filteredReasons = (reasons ?? []).filter((r) =>
    r.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoidRefundReasonFormData>({
    resolver: zodResolver(voidRefundReasonSchema),
    defaultValues: { name: '', is_active: true },
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleAdd = () => {
    setEditingReason(null);
    reset({ name: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (reason: VoidRefundReason) => {
    setEditingReason(reason);
    reset({ name: reason.name, is_active: reason.is_active });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReason(null);
    reset();
  };

  const onSubmit = async (data: VoidRefundReasonFormData) => {
    if (editingReason) {
      await updateReason.mutateAsync({
        reasonId: editingReason.id,
        updates: { name: data.name, is_active: data.is_active },
      });
    } else {
      await createReason.mutateAsync({ name: data.name });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingReasonId) return;
    await deleteReason.mutateAsync(deletingReasonId);
    setDeletingReasonId(null);
    handleCloseModal();
  };

  const isSaving = createReason.isPending || updateReason.isPending;

  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Void & Refund Reasons" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage void/refund reasons</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage
      title="Void & Refund Reasons"
      backHref={`/shops/${currentShop?.id}/settings`}
      onRefresh={handleRefresh}
    >
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search reasons..."
          onActionClick={handleAdd}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !reasons || reasons.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Void/Refund Reasons Yet</h2>
              <p>Add reasons to document void and refund actions</p>
            </Div>
          ) : filteredReasons.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText color="medium">
                <h3>No reasons match your search</h3>
              </IonText>
            </Div>
          ) : (
            <IonList>
              {filteredReasons.map((reason, index) => (
                <IonItem
                  key={reason.id}
                  button
                  lines={index === filteredReasons.length - 1 ? 'none' : 'full'}
                  onClick={() => handleEdit(reason)}
                >
                  <IonLabel>
                    <h2>{reason.name}</h2>
                    {reason.is_system && (
                    <IonBadge color="primary" style={{ marginTop: '8px' }}>
                      System
                    </IonBadge>
                  )}
                  </IonLabel>
                  
                  {!reason.is_active && <IonBadge color="medium">Inactive</IonBadge>}
                </IonItem>
              ))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingReason ? 'Edit Reason' : 'Add Reason'}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Reason Name"
            placeholder="e.g., Wrong Order"
            error={errors.name}
            required
          />
          {editingReason && !editingReason.is_system && (
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

          {!editingReason?.is_system && (
            <SaveButton
              type="submit"
              expand="block"
              isSaving={isSaving}
              disabled={isSaving}
              label="Save Reason"
            />
          )}

          {editingReason && !editingReason.is_system && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingReasonId(editingReason.id)}
              disabled={deleteReason.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Reason
            </IonButton>
          )}
        </form>
      </BaseModal>

      <DeleteConfirmationAlert
        isOpen={!!deletingReasonId}
        onDismiss={() => setDeletingReasonId(null)}
        onConfirm={handleDelete}
        itemName={editingReason?.name || ''}
        itemType="Void/Refund Reason"
      />
    </BasePage>
  );
};

export default VoidRefundSettingsPage;
