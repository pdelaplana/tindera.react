// Product Modifier Modal - Manage product-specific price overrides for modifiers

import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import BaseModal from '@/components/shared/BaseModal';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
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

// Modifier Price Input Component
interface ModifierPriceInputProps {
  modifier: Modifier;
  control: Control<PriceOverrideFormData>;
  formatCurrency: (amount: number) => string;
  formatCurrencyValue: (value: number | null | undefined) => string;
  parseValue: (inputValue: string) => number | null;
  onClearOverride: (modifierId: string) => void;
  hasOverride: boolean;
}

const ModifierPriceInput: React.FC<ModifierPriceInputProps> = ({
  modifier,
  control,
  formatCurrency,
  formatCurrencyValue,
  parseValue,
  onClearOverride,
  hasOverride,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  return (
    <IonItem key={modifier.id}>
      <IonLabel slot="start">
        <h3>{modifier.name}</h3>
        <IonText2 color="medium" fontSize="0.85em">
          Default: {formatCurrency(modifier.default_price_adjustment)}
        </IonText2>
      </IonLabel>
      <div
        slot="end"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Controller
          name={modifier.id}
          control={control}
          render={({ field: { onChange, onBlur, value, name } }) => {
            // Update display value when not focused
            const currentDisplayValue = isFocused
              ? displayValue
              : formatCurrencyValue(value);

            return (
              <IonInput
                fill="outline"
                type="text"
                inputMode="decimal"
                value={currentDisplayValue}
                onIonInput={(e) => {
                  const inputValue = e.detail.value || '';
                  setDisplayValue(inputValue);
                  const parsed = parseValue(inputValue);
                  onChange(parsed);
                  console.log('Input changed:', { inputValue, parsed, modifierId: modifier.id });
                }}
                onIonFocus={() => {
                  setIsFocused(true);
                  // Set display value to raw number when focusing
                  setDisplayValue(value === null || value === undefined ? '' : String(value));
                }}
                onIonBlur={() => {
                  setIsFocused(false);
                  setDisplayValue('');
                  onBlur();
                }}
                placeholder="0.00"
                style={{ minWidth: '120px', maxWidth: '150px' }}
                data-testid={`price-input-${name}`}
              />
            );
          }}
        />
        <IonButton
          size="small"
          fill="clear"
          color="danger"
          onClick={() => onClearOverride(modifier.id)}
          disabled={!hasOverride}
          aria-label="Clear override"
        >
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonButton>
      </div>
    </IonItem>
  );
};

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
    formState,
  } = useForm<PriceOverrideFormData>({
    defaultValues: getDefaultValues(),
  });

  // Access formState properties to ensure subscription
  const { isDirty, dirtyFields } = formState;

  // Watch all form values to track changes
  const formValues = watch();

  // Reset form when modal opens or group changes
  useEffect(() => {
    if (isOpen && group) {
      const values: PriceOverrideFormData = {};
      group.modifiers.forEach((modifier) => {
        values[modifier.id] = priceOverrides[modifier.id] ?? null;
      });
      reset(values);
    }
  }, [isOpen, group, priceOverrides, reset]);

  // Clear override for a modifier
  const handleClearOverride = (modifierId: string) => {
    setValue(modifierId, null, { shouldDirty: true });
  };

  // Save all changes
  const onSubmit = async (data: PriceOverrideFormData) => {
    if (!group) return;

    try {
      const promises: Promise<unknown>[] = [];

      // Process only modified modifiers (using dirtyFields)
      const modifiedModifierIds = Object.keys(dirtyFields);

      for (const modifierId of modifiedModifierIds) {
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
    onClose();
  };

  // Format currency for display
  const formatCurrencyValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency_code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const parseValue = (inputValue: string): number | null => {
    // Return null for empty input
    if (!inputValue || inputValue.trim() === '') {
      return null;
    }
    // Remove non-numeric characters except decimal point and minus sign
    const cleaned = inputValue.replace(/[^0-9.-]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    const parsed = parseFloat(formatted);
    return Number.isNaN(parsed) ? null : parsed;
  };

  // Render modifier item
  const renderModifierItem = (modifier: Modifier) => {
    const currentValue = formValues[modifier.id];
    const hasOverride = currentValue !== null && currentValue !== undefined;

    return (
      <ModifierPriceInput
        key={modifier.id}
        modifier={modifier}
        control={control}
        formatCurrency={formatCurrency}
        formatCurrencyValue={formatCurrencyValue}
        parseValue={parseValue}
        onClearOverride={handleClearOverride}
        hasOverride={hasOverride}
      />
    );
  };

  if (!group) return null;

  const hasChanges = isDirty;
  const isLoading = setOverrideMutation.isPending || removeOverrideMutation.isPending;

  console.log('Form state:', {
    isDirty,
    hasChanges,
    dirtyFields,
    dirtyFieldsKeys: Object.keys(dirtyFields),
    formValues,
  });

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
