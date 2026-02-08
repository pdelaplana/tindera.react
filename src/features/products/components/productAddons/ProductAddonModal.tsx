// Product Addon Modal Component - Handles both Add and Edit

import { zodResolver } from '@hookform/resolvers/zod';
import { IonButton, IonItem, IonToggle } from '@ionic/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import BaseModal from '@/components/shared/BaseModal';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { useInventoryItems } from '@/hooks/useInventory';
import { useAddProductAddon, useUpdateProductAddon } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ProductAddon } from '@/types';

const addonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  price: z.number().min(0, 'Price must be positive'),
  inventory_item_id: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0').optional().nullable(),
});

type AddonFormData = z.infer<typeof addonSchema>;

interface ProductAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  addon?: ProductAddon | null;
  productId: string;
  onDelete?: (addon: ProductAddon) => void;
}

const ProductAddonModal: React.FC<ProductAddonModalProps> = ({
  isOpen,
  onClose,
  addon,
  productId,
  onDelete,
}) => {
  const { showSuccess, showError } = useToastNotification();
  const updateProductAddon = useUpdateProductAddon();
  const addProductAddon = useAddProductAddon();
  const { currentShop } = useShop();

  // Determine if this is edit or add mode
  const isEditMode = Boolean(addon);

  // State for inventory linking toggle
  const [linkToInventory, setLinkToInventory] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Fetch inventory items for dropdown
  const { data: inventoryItems = [] } = useInventoryItems();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      price: 0,
      inventory_item_id: null,
      quantity: null,
    },
  });

  // Populate form when addon changes
  useEffect(() => {
    if (addon) {
      reset({
        name: addon.name,
        price: addon.price,
        inventory_item_id: addon.inventory_item_id || null,
        quantity: addon.quantity || null,
      });
      setLinkToInventory(!!addon.inventory_item_id);
    }
  }, [addon, reset]);

  // Watch form values
  const watchedItemId = watch('inventory_item_id');

  // Get selected inventory item
  const selectedItem = useMemo(() => {
    if (!watchedItemId) return null;
    return inventoryItems.find((item) => item.id === watchedItemId);
  }, [inventoryItems, watchedItemId]);

  const onSubmit = async (data: AddonFormData) => {
    try {
      // Calculate item_cost if inventory item is linked
      const item_cost =
        linkToInventory && selectedItem && data.quantity
          ? selectedItem.unit_cost * data.quantity
          : 0;

      if (isEditMode && addon) {
        // Edit existing addon
        await updateProductAddon.mutateAsync({
          addonId: addon.id,
          productId: productId,
          updates: {
            product_id: productId,
            name: data.name.trim(),
            price: data.price,
            inventory_item_id: linkToInventory ? data.inventory_item_id || null : null,
            item_name: linkToInventory && selectedItem ? selectedItem.name : null,
            item_cost,
            quantity: linkToInventory && data.quantity ? data.quantity : 0,
          },
        });
        showSuccess('Add-on updated successfully');
      } else {
        // Add new addon
        await addProductAddon.mutateAsync({
          product_id: productId,
          name: data.name.trim(),
          price: data.price,
          inventory_item_id: linkToInventory ? (data.inventory_item_id ?? null) : null,
          item_name: linkToInventory && selectedItem ? selectedItem.name : null,
          item_cost,
          quantity: linkToInventory && data.quantity ? data.quantity : 0,
        });
        showSuccess('Add-on added successfully');
      }

      handleClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError(isEditMode ? 'Failed to update add-on' : 'Failed to add add-on');
    }
  };

  const handleClose = () => {
    onClose();
    setLinkToInventory(false);
    reset({
      name: '',
      price: 0,
      inventory_item_id: null,
      quantity: null,
    });
  };

  // Create dropdown options
  const inventoryOptions = useMemo(() => {
    return inventoryItems.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.base_uom})`,
    }));
  }, [inventoryItems]);

  // Determine loading state and modal title
  const isLoading = isEditMode ? updateProductAddon.isPending : addProductAddon.isPending;
  const modalTitle = isEditMode ? 'Edit Add-on' : 'Add Add-on';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 1]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name Field */}
        <TextField
          name="name"
          control={control}
          label="Add-on Name"
          placeholder="e.g., Extra Cheese, Large Size"
          required
          error={errors.name}
          disabled={isLoading}
        />

        {/* Price Field */}
        <PriceField
          name="price"
          control={control}
          label="Price"
          required
          error={errors.price}
          disabled={isLoading}
          currency={currentShop?.currency_code || 'USD'}
        />

        {/* Link to Inventory Toggle */}
        <IonItem lines="none" style={{ marginBottom: '16px' }}>
          <IonToggle
            checked={linkToInventory}
            onIonChange={(e) => setLinkToInventory(e.detail.checked)}
            disabled={isLoading}
            labelPlacement="end"
          >
            Link to inventory item?
          </IonToggle>
        </IonItem>

        {/* Conditional Fields - Show only if linking to inventory */}
        {linkToInventory && (
          <>
            <SelectField
              name="inventory_item_id"
              control={control}
              label="Inventory Item"
              placeholder="Select inventory item"
              error={errors.inventory_item_id}
              options={inventoryOptions}
              disabled={isLoading}
            />

            {watchedItemId && (
              <NumberField
                name="quantity"
                control={control}
                label={selectedItem ? `Quantity (${selectedItem.base_uom})` : 'Quantity'}
                placeholder="0"
                error={errors.quantity}
                disabled={isLoading}
                min={0.001}
                step="any"
              />
            )}
          </>
        )}

        <SaveButton
          expand="block"
          type="submit"
          disabled={(isEditMode && !isDirty) || isLoading}
          isSaving={isLoading}
          label={isEditMode ? 'Save Changes' : 'Add Add-on'}
          savingLabel={isEditMode ? 'Saving...' : 'Adding...'}
        />

        {isEditMode && onDelete && addon && (
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            type="button"
            onClick={() => setShowDeleteAlert(true)}
            disabled={isLoading}
            style={{ marginTop: '16px' }}
          >
            Delete Add-on
          </IonButton>
        )}
      </form>

      {addon && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={() => {
            setShowDeleteAlert(false);
            onDelete?.(addon);
          }}
          itemName={addon.name}
          itemType="Add-on"
          requireConfirmation={false}
        />
      )}
    </BaseModal>
  );
};

export default ProductAddonModal;
