// Product Item Modal Component - Handles both Add and Edit

import { zodResolver } from '@hookform/resolvers/zod';
import { IonButton, IonText } from '@ionic/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import BaseModal from '@/components/shared/BaseModal';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, SelectField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { useInventoryItems } from '@/hooks/useInventory';
import { useAddProductItem, useUpdateProductItem } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ProductItem } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';

const itemSchema = z.object({
  inventory_item_id: z.string().min(1, 'Please select an inventory item'),
  quantity: z.number().positive('Quantity must be greater than 0'),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ProductItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ProductItem | null;
  productId: string;
  onDelete?: (item: ProductItem) => void;
}

const ProductItemModal: React.FC<ProductItemModalProps> = ({
  isOpen,
  onClose,
  item,
  productId,
  onDelete,
}) => {
  const { showSuccess, showError } = useToastNotification();
  const updateProductItem = useUpdateProductItem();
  const addProductItem = useAddProductItem();
  const { currentShop } = useShop();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Determine if this is edit or add mode
  const isEditMode = Boolean(item);

  // Fetch inventory items for dropdown
  const { data: inventoryItems = [] } = useInventoryItems();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    mode: 'onSubmit',
    defaultValues: {
      inventory_item_id: '',
      quantity: 1,
    },
  });

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      reset({
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
      });
    }
  }, [item, reset]);

  // Watch form values for calculations
  const watchedItemId = watch('inventory_item_id');
  const watchedQuantity = watch('quantity') || 0;

  // Get selected inventory item
  const selectedItem = useMemo(() => {
    return inventoryItems.find((invItem) => invItem.id === watchedItemId);
  }, [inventoryItems, watchedItemId]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!selectedItem) return 0;
    return watchedQuantity * selectedItem.unit_cost;
  }, [selectedItem, watchedQuantity]);

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  const onSubmit = async (data: ItemFormData) => {
    if (!selectedItem) {
      showError('Please select an inventory item');
      return;
    }

    try {
      if (isEditMode && item) {
        // Edit existing item
        await updateProductItem.mutateAsync({
          itemId: item.id,
          productId: productId,
          updates: {
            product_id: productId,
            inventory_item_id: data.inventory_item_id,
            item_name: selectedItem.name,
            quantity: data.quantity,
            uom: selectedItem.base_uom,
            unit_cost: selectedItem.unit_cost,
          },
        });
        showSuccess('Ingredient updated successfully');
      } else {
        // Add new item
        await addProductItem.mutateAsync({
          product_id: productId,
          inventory_item_id: data.inventory_item_id,
          item_name: selectedItem.name,
          quantity: data.quantity,
          uom: selectedItem.base_uom,
          unit_cost: selectedItem.unit_cost,
        });
        showSuccess('Ingredient added successfully');
      }

      onClose();
      reset();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError(isEditMode ? 'Failed to update ingredient' : 'Failed to add ingredient');
    }
  };

  const handleClose = () => {
    onClose();
    reset({
      inventory_item_id: '',
      quantity: 1,
    });
  };

  // Create dropdown options
  const inventoryOptions = useMemo(() => {
    return inventoryItems.map((invItem) => ({
      value: invItem.id,
      label: `${invItem.name} (${invItem.base_uom})`,
    }));
  }, [inventoryItems]);

  // Determine loading state and button text
  const isLoading = isEditMode ? updateProductItem.isPending : addProductItem.isPending;
  const modalTitle = isEditMode ? 'Edit Ingredient' : 'Add Ingredient';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      initialBreakpoint={0.99}
      breakpoints={[0, 0.75, 0.99]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Inventory Item Selection */}
        <SelectField
          name="inventory_item_id"
          control={control}
          label="Inventory Item"
          placeholder="Select inventory item"
          required
          error={errors.inventory_item_id}
          options={inventoryOptions}
          disabled={isLoading}
        />

        {/* Quantity Field */}
        <NumberField
          name="quantity"
          control={control}
          label={selectedItem ? `Quantity (${selectedItem.base_uom})` : 'Quantity'}
          placeholder="0"
          required
          error={errors.quantity}
          disabled={isLoading}
          min={0.001}
          step="any"
        />

        {/* Calculated Info Display */}
        {selectedItem && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'var(--ion-color-light)',
              borderRadius: '8px',
            }}
          >
            <IonText color="medium" style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Unit Cost:</strong> {formatCurrency(selectedItem.unit_cost)} per{' '}
                {selectedItem.base_uom}
              </p>
              <p style={{ margin: '0' }}>
                <strong>Total Cost:</strong> {formatCurrency(totalCost)}
              </p>
            </IonText>
          </div>
        )}

        <SaveButton
          expand="block"
          type="submit"
          disabled={(isEditMode && !isDirty) || isLoading}
          isSaving={isLoading}
          label={isEditMode ? 'Save Changes' : 'Add Ingredient'}
          savingLabel={isEditMode ? 'Saving...' : 'Adding...'}
        />

        {isEditMode && onDelete && item && (
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            type="button"
            onClick={() => setShowDeleteAlert(true)}
            disabled={isLoading}
            style={{ marginTop: '16px' }}
          >
            Delete Ingredient
          </IonButton>
        )}
      </form>

      {item && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={() => {
            setShowDeleteAlert(false);
            onDelete?.(item);
          }}
          itemName={item.item_name}
          itemType="Ingredient"
          requireConfirmation={false}
        />
      )}
    </BaseModal>
  );
};

export default ProductItemModal;
