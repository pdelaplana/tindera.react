// Product Modifier Modal - Manage product-specific price overrides for modifiers

import { IonButton, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import BaseModal from '@/components/shared/BaseModal';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { PriceField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { IonText2 } from '@/components/ui';
import { useRemoveModifierPriceOverride, useSetModifierPriceOverride } from '@/hooks';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { Modifier, ModifierGroupWithModifiers } from '@/types';

interface ProductModifierModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Callback when modal is dismissed */
  onClose: () => void;
  /** Product ID */
  productId: string;
  /** Modifier group with modifiers */
  group: ModifierGroupWithModifiers | null;
  /** Current price overrides (modifier_id -> price_adjustment) */
  priceOverrides: Record<string, number>;
  /** Currency formatter function */
  formatCurrency: (amount: number) => string;
  /** Handler to unlink the modifier group */
  onDelete?: (group: ModifierGroupWithModifiers) => void;
}

// Dynamic form type - one optional number field per modifier
type PriceOverrideFormData = Record<string, number | null>;

const ProductModifierModal: React.FC<ProductModifierModalProps> = ({
  isOpen,
  onClose,
  productId,
  group,
  priceOverrides,
  formatCurrency,
  onDelete,
}) => {
  const { showSuccess, showError } = useToastNotification();
  const { currentShop } = useShop();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Mutations
  const setOverrideMutation = useSetModifierPriceOverride();
  const removeOverrideMutation = useRemoveModifierPriceOverride();

  // Initialize form with default values
  const getDefaultValues = (): PriceOverrideFormData => {
    if (!group) return {};
    const values: PriceOverrideFormData = {};
    group.modifiers.forEach((modifier) => {
      values[modifier.id] = priceOverrides[modifier.id] ?? null;
    });
    return values;
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty, dirtyFields },
  } = useForm<PriceOverrideFormData>({
    defaultValues: getDefaultValues(),
  });

  // Watch all form values to track changes
  const formValues = watch();

  // Reset form when modal opens or group changes
  useEffect(() => {
    if (isOpen && group) {
      reset(getDefaultValues());
      setModifiedFields(new Set());
    }
  }, [isOpen, group, priceOverrides]);

  // Track which fields have been modified based on dirtyFields
  useEffect(() => {
    const modified = new Set<string>();
    Object.keys(dirtyFields).forEach((fieldName) => {
      if (dirtyFields[fieldName]) {
        modified.add(fieldName);
      }
    });
    setModifiedFields(modified);
  }, [dirtyFields]);

  // Clear override for a modifier
  const handleClearOverride = (modifierId: string) => {
    setValue(modifierId, null, { shouldDirty: true });
    setModifiedFields((prev) => new Set(prev).add(modifierId));
  };

  // Save all changes
  const onSubmit = async (data: PriceOverrideFormData) => {
    if (!group) return;

    try {
      const promises: Promise<unknown>[] = [];

      // Process only modified modifiers
      for (const modifierId of modifiedFields) {
        const overrideValue = data[modifierId];
        const existingOverride = priceOverrides[modifierId];

        if (overrideValue !== null && overrideValue !== undefined) {
          // Set override
          promises.push(
            setOverrideMutation.mutateAsync({
              productId,
              modifierId,
              priceAdjustment: overrideValue,
            })
          );
        } else if (existingOverride !== undefined) {
          // Remove override (field was cleared)
          promises.push(
            removeOverrideMutation.mutateAsync({
              productId,
              modifierId,
            })
          );
        }
      }

      await Promise.all(promises);
      showSuccess('Price overrides updated successfully');
      handleClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to update price overrides');
    }
  };

  const handleClose = () => {
    reset();
    setModifiedFields(new Set());
    onClose();
  };

  // Render modifier item
  const renderModifierItem = (modifier: Modifier) => {
    const currentValue = formValues[modifier.id];
    const hasOverride = currentValue !== null && currentValue !== undefined;

    return (
      <IonItem key={modifier.id}>
        <IonLabel slot="start" className="ion-margin-top">
          <h3>{modifier.name}</h3>
          <IonText2 color="medium" fontSize="0.85em">
            Default: {formatCurrency(modifier.default_price_adjustment)}
          </IonText2>
        </IonLabel>
        <div
          slot="end"
          className="ion-align-items-baseline  ion-flex-row ion-display-flex ion-margin-top"
        >
          <PriceField
            name={modifier.id}
            control={control}
            label="Price"
            placeholder="0.00"
            currency={currentShop?.currency_code || 'USD'}
          />
          <IonButton
            size="small"
            fill="clear"
            color="danger"
            onClick={() => handleClearOverride(modifier.id)}
            disabled={!hasOverride}
          >
            Clear
          </IonButton>
        </div>
      </IonItem>
    );
  };

  if (!group) return null;

  const hasChanges = isDirty && modifiedFields.size > 0;
  const isLoading = setOverrideMutation.isPending || removeOverrideMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${group.name}`}
      initialBreakpoint={0.99}
      breakpoints={[0, 0.75, 0.99]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ padding: '16px', backgroundColor: 'var(--ion-color-light)' }}>
          <IonText color="medium">
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Set product-specific prices for modifiers. Leave blank to use default prices.
            </p>
          </IonText>
        </div>

        <IonList lines="full">
          {group.modifiers.length === 0 ? (
            <IonItem>
              <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
                <p>No modifiers in this group</p>
              </IonLabel>
            </IonItem>
          ) : (
            group.modifiers.map(renderModifierItem)
          )}
        </IonList>

        <SaveButton
          expand="block"
          type="submit"
          disabled={!hasChanges || isLoading}
          isSaving={isLoading}
          label="Save Changes"
          savingLabel="Saving..."
        />

        {onDelete && (
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            type="button"
            onClick={() => setShowDeleteAlert(true)}
            disabled={isLoading}
            style={{ marginTop: '16px' }}
          >
            Unlink Modifier Group
          </IonButton>
        )}
      </form>

      {group && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={() => {
            setShowDeleteAlert(false);
            onDelete?.(group);
          }}
          itemName={group.name}
          itemType="Modifier Group"
          requireConfirmation={false}
        />
      )}
    </BaseModal>
  );
};

export default ProductModifierModal;
