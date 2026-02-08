// Package Size Form Modal - Add/Edit Package Sizes for Inventory Items

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Div } from '@/components/shared/base/Div';
import { DeleteButton } from '@/components/shared/DeleteButton';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import {
  useCreatePackageSize,
  useDeletePackageSize,
  useUpdatePackageSize,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { PackageSize, PackageSizeInsert, PackageSizeUpdate } from '@/types';

// Validation schema for package size form
const packageSizeSchema = z.object({
  package_name: z.string().min(1, 'Package name is required'),
  package_uom: z.string().min(1, 'Package UOM is required'),
  units_per_package: z.number().min(0.001, 'Must be greater than 0'),
  cost_per_package: z.number().min(0).nullable(),
  is_default: z.boolean(),
});

type PackageSizeFormData = z.infer<typeof packageSizeSchema>;

// Common package UOM options
const PACKAGE_UOM_OPTIONS = [
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'case', label: 'Case' },
  { value: 'carton', label: 'Carton' },
  { value: 'container', label: 'Container' },
  { value: 'crate', label: 'Crate' },
  { value: 'pack', label: 'Pack' },
  { value: 'pallet', label: 'Pallet' },
  { value: 'roll', label: 'Roll' },
  { value: 'sack', label: 'Sack' },
  { value: 'tray', label: 'Tray' },
];

interface PackageSizeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  baseUom: string;
  editingPackage: PackageSize | null;
  packageSizesCount: number;
}

const PackageSizeFormModal: React.FC<PackageSizeFormModalProps> = ({
  isOpen,
  onClose,
  itemId,
  baseUom,
  editingPackage,
  packageSizesCount,
}) => {
  const { currentShop, hasPermission } = useShop();
  const { showSuccess, showError } = useToastNotification();
  const createPackageSize = useCreatePackageSize();
  const updatePackageSize = useUpdatePackageSize();
  const deletePackageSize = useDeletePackageSize();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageSizeFormData>({
    resolver: zodResolver(packageSizeSchema),
    defaultValues: {
      package_name: '',
      package_uom: '',
      units_per_package: 1,
      cost_per_package: null,
      is_default: false,
    },
  });

  const canDelete = hasPermission('admin');
  const isSaving =
    createPackageSize.isPending || updatePackageSize.isPending || deletePackageSize.isPending;

  // Reset form when modal opens or editingPackage changes
  useEffect(() => {
    if (isOpen) {
      if (editingPackage) {
        reset({
          package_name: editingPackage.package_name,
          package_uom: editingPackage.package_uom,
          units_per_package: editingPackage.units_per_package,
          cost_per_package: editingPackage.cost_per_package,
          is_default: editingPackage.is_default,
        });
      } else {
        reset({
          package_name: '',
          package_uom: '',
          units_per_package: 1,
          cost_per_package: null,
          is_default: false,
        });
      }
    }
  }, [isOpen, editingPackage, reset]);

  const handlePackageSizeSubmit = async (data: PackageSizeFormData) => {
    if (!currentShop) return;

    try {
      if (editingPackage) {
        // Update existing package
        const updates: PackageSizeUpdate = {
          package_name: data.package_name,
          package_uom: data.package_uom,
          units_per_package: data.units_per_package,
          cost_per_package: data.cost_per_package,
          is_default: data.is_default,
        };

        await updatePackageSize.mutateAsync({
          packageId: editingPackage.id,
          itemId: itemId,
          updates,
        });
        showSuccess('Package size updated successfully');
      } else {
        // Create new package
        const newPackage: PackageSizeInsert = {
          shop_id: currentShop.id,
          item_id: itemId,
          package_name: data.package_name,
          package_uom: data.package_uom,
          units_per_package: data.units_per_package,
          cost_per_package: data.cost_per_package,
          is_default: data.is_default,
          sequence: packageSizesCount,
        };

        await createPackageSize.mutateAsync(newPackage);
        showSuccess('Package size added successfully');
      }

      onClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError(editingPackage ? 'Failed to update package size' : 'Failed to add package size');
    }
  };

  const handleDelete = async () => {
    if (!editingPackage) return;

    try {
      await deletePackageSize.mutateAsync({
        packageId: editingPackage.id,
        itemId: itemId,
      });
      showSuccess('Package size deleted successfully');
      onClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete package size');
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.75, 1]}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{editingPackage ? 'Edit' : 'Add'} Package Size</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit(handlePackageSizeSubmit)}>
          <TextField
            name="package_name"
            control={control}
            label="Package Name"
            placeholder="e.g., 3kg Bag, Case of 24"
            required
            error={errors.package_name}
            disabled={isSaving}
          />

          <SelectField
            name="package_uom"
            control={control}
            label="Package UOM"
            options={PACKAGE_UOM_OPTIONS}
            required
            error={errors.package_uom}
            disabled={isSaving}
          />

          <NumberField
            name="units_per_package"
            control={control}
            label={`Units per Package (${baseUom})`}
            placeholder="0"
            required
            error={errors.units_per_package}
            disabled={isSaving}
          />

          <PriceField
            name="cost_per_package"
            control={control}
            label="Typical Cost per Package (Optional)"
            placeholder="0.00"
            error={errors.cost_per_package}
            disabled={isSaving}
            currency={currentShop?.currency_code || 'USD'}
          />

          <IonCheckbox
            slot="start"
            labelPlacement="end"
            checked={control._formValues.is_default}
            onIonChange={(e) => {
              reset({ ...control._formValues, is_default: e.detail.checked });
            }}
            disabled={isSaving}
          >
            Set as default package size
          </IonCheckbox>

          <Div className="ion-margin-top ion-flex-column" style={{ gap: '12px' }}>
            <SaveButton
              expand="block"
              type="submit"
              isSaving={isSaving}
              label={editingPackage ? 'Update Package Size' : 'Add Package Size'}
            />

            {editingPackage && canDelete && (
              <DeleteButton
                expand="block"
                onClick={() => setShowDeleteAlert(true)}
                isDeleting={false}
                disabled={isSaving}
                label="Delete Package Size"
              />
            )}
          </Div>
        </form>
      </IonContent>

      {/* Delete Confirmation */}
      {editingPackage && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={handleDelete}
          itemName={editingPackage.package_name}
          itemType="Package Size"
        />
      )}
    </IonModal>
  );
};

export default PackageSizeFormModal;
