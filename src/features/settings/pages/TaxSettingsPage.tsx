// Tax Settings Page - Manage shop taxes

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
import { NumberField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { LoadingSpinner } from '@/components/ui';
import { Div } from '@/components/shared/base/Div';
import {
  useCreateShopTax,
  useDeleteShopTax,
  useShopTaxes,
  useUpdateShopTax,
} from '@/hooks/useShopTaxes';
import { useShop } from '@/hooks/useShop';
import type { ShopTax } from '@/types';

const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  rate: z.number().min(0, 'Rate must be at least 0').max(100, 'Rate must be at most 100'),
  is_active: z.boolean(),
});

type TaxFormData = z.infer<typeof taxSchema>;

const TaxSettingsPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: taxes, isLoading: taxesLoading, refetch } = useShopTaxes(true);

  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<ShopTax | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);

  const createTax = useCreateShopTax();
  const updateTax = useUpdateShopTax();
  const deleteTax = useDeleteShopTax();

  const isLoading = shopLoading || taxesLoading;

  const filteredTaxes = (taxes ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: { name: '', rate: 0, is_active: true },
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleAdd = () => {
    setEditingTax(null);
    reset({ name: '', rate: 0, is_active: true });
    setShowModal(true);
  };

  const handleEdit = (tax: ShopTax) => {
    setEditingTax(tax);
    reset({ name: tax.name, rate: tax.rate * 100, is_active: tax.is_active });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTax(null);
    reset();
  };

  const onSubmit = async (data: TaxFormData) => {
    const rate = data.rate / 100;
    if (editingTax) {
      await updateTax.mutateAsync({ taxId: editingTax.id, updates: { name: data.name, rate, is_active: data.is_active } });
    } else {
      await createTax.mutateAsync({ name: data.name, rate });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingTaxId) return;
    await deleteTax.mutateAsync(deletingTaxId);
    setDeletingTaxId(null);
    handleCloseModal();
  };

  const isSaving = createTax.isPending || updateTax.isPending;

  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Taxes" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage taxes</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Taxes" backHref={`/shops/${currentShop?.id}/settings`} onRefresh={handleRefresh}>
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search taxes..."
          onActionClick={handleAdd}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !taxes || taxes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Taxes Yet</h2>
              <p>Add taxes to apply to your orders</p>
            </Div>
          ) : filteredTaxes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText color="medium"><h3>No taxes match your search</h3></IonText>
            </Div>
          ) : (
            <IonList>
              {filteredTaxes.map((tax) => (
                <IonItem key={tax.id} button lines="full" onClick={() => handleEdit(tax)}>
                  <IonLabel>
                    <h2>{tax.name}</h2>
                    <IonText color="medium"><p>{(tax.rate * 100).toFixed(2)}%</p></IonText>
                  </IonLabel>
                  {!tax.is_active && <IonBadge color="medium">Inactive</IonBadge>}
                </IonItem>
              ))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTax ? 'Edit Tax' : 'Add Tax'}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Tax Name"
            placeholder="e.g., Sales Tax"
            error={errors.name}
            required
          />
          <NumberField
            control={control}
            name="rate"
            label="Rate (%)"
            placeholder="e.g., 8.5"
            error={errors.rate}
            required
          />
          {editingTax && (
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

          <SaveButton
            type="submit"
            expand="block"
            isSaving={isSaving}
            disabled={isSaving}
            label="Save Tax"
          />

          {editingTax && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingTaxId(editingTax.id)}
              disabled={deleteTax.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Tax
            </IonButton>
          )}
        </form>
      </BaseModal>

      <DeleteConfirmationAlert
        isOpen={!!deletingTaxId}
        onDismiss={() => setDeletingTaxId(null)}
        onConfirm={handleDelete}
        itemName={editingTax?.name || ''}
        itemType="Tax"
      />
    </BasePage>
  );
};

export default TaxSettingsPage;
