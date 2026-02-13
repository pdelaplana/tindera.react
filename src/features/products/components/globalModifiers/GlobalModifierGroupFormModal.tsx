// GlobalModifierGroupFormModal - Combined Add/Edit Modal for Modifier Groups

import { zodResolver } from '@hookform/resolvers/zod';
import { IonButton, IonItem, IonText, IonToggle } from '@ionic/react';
import type React from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import BaseModal from '@/components/shared/BaseModal';
import { NumberField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import {
  useCreateModifierGroup,
  useDeleteModifierGroup,
  useUpdateModifierGroup,
} from '@/hooks/useModifier';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ModifierGroupWithModifiers } from '@/types';

const modifierGroupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().max(200).optional().nullable(),
    min_select: z.number().min(0, 'Minimum selections must be at least 0'),
    max_select: z.number().min(1, 'Maximum selections must be at least 1').nullable(),
    is_required: z.boolean(),
  })
  .refine((data) => !data.max_select || data.max_select >= data.min_select, {
    message: 'Maximum must be greater than or equal to minimum',
    path: ['max_select'],
  });

type ModifierGroupFormData = z.infer<typeof modifierGroupSchema>;

interface GlobalModifierGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: ModifierGroupWithModifiers | null;
}

export const GlobalModifierGroupFormModal: React.FC<GlobalModifierGroupFormModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const { showSuccess, showError } = useToastNotification();
  const { currentShop } = useShop();
  const isEditMode = !!group;

  const createModifierGroup = useCreateModifierGroup();
  const updateModifierGroup = useUpdateModifierGroup();
  const deleteModifierGroup = useDeleteModifierGroup();

  const isSaving =
    createModifierGroup.isPending || updateModifierGroup.isPending || deleteModifierGroup.isPending;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ModifierGroupFormData>({
    resolver: zodResolver(modifierGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      min_select: 0,
      max_select: 1,
      is_required: false,
    },
    mode: 'onChange',
  });

  const minSelect = watch('min_select');
  const maxSelect = watch('max_select');

  // Reset form when modal opens or group changes
  useEffect(() => {
    if (isOpen) {
      reset(
        group
          ? {
              name: group.name,
              description: group.description ?? '',
              min_select: group.min_select,
              max_select: group.max_select,
              is_required: group.is_required,
            }
          : {
              name: '',
              description: '',
              min_select: 0,
              max_select: 1,
              is_required: false,
            }
      );
    }
  }, [isOpen, group, reset]);

  // Auto-adjust max_select when min_select changes
  useEffect(() => {
    if (maxSelect !== null && maxSelect < minSelect) {
      setValue('max_select', minSelect);
    }
  }, [minSelect, maxSelect, setValue]);

  const handleFormSubmit = async (data: ModifierGroupFormData) => {
    if (!currentShop) {
      showError('No shop selected');
      return;
    }

    try {
      if (isEditMode && group) {
        await updateModifierGroup.mutateAsync({
          groupId: group.id,
          updates: {
            name: data.name,
            description: data.description || null,
            min_select: data.min_select,
            max_select: data.max_select,
            is_required: data.is_required,
          },
        });
        showSuccess('Modifier group updated successfully');
      } else {
        await createModifierGroup.mutateAsync({
          shop_id: currentShop.id,
          name: data.name,
          description: data.description || null,
          min_select: data.min_select,
          max_select: data.max_select,
          is_required: data.is_required,
          sequence: 0,
        });
        showSuccess('Modifier group created successfully');
      }
      reset();
      onClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError(isEditMode ? 'Failed to update modifier group' : 'Failed to create modifier group');
    }
  };

  const handleDelete = async () => {
    if (!group) return;

    try {
      await deleteModifierGroup.mutateAsync(group.id);
      showSuccess('Modifier group deleted successfully');
      reset();
      onClose();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete modifier group');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasModifiers = group?.modifiers && group.modifiers.length > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Modifier Group' : 'Add Modifier Group'}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 1]}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <TextField
          name="name"
          control={control}
          label="Internal Name"
          placeholder="e.g., Flavour, Size, Toppings"
          helperText="Used internally to identify this group"
          error={errors.name}
          required
        />

        <TextField
          name="description"
          control={control}
          label="POS Label"
          placeholder="e.g., Choose a Flavour, Pick a Size"
          helperText="Shown on the POS to guide staff. Optional."
          error={errors.description}
        />

        <Controller
          name="is_required"
          control={control}
          render={({ field }) => (
            <IonItem lines="none" style={{ marginBottom: '16px' }}>
              <IonToggle
                checked={field.value}
                onIonChange={(e) => field.onChange(e.detail.checked)}
                labelPlacement="end"
              >
                Required
              </IonToggle>
            </IonItem>
          )}
        />

        <NumberField
          name="min_select"
          control={control}
          label="Minimum Selections"
          placeholder="0"
          error={errors.min_select}
          min={0}
          step={1}
        />

        <NumberField
          name="max_select"
          control={control}
          label="Maximum Selections"
          placeholder="1"
          error={errors.max_select}
          min={minSelect}
          step={1}
        />

        <SaveButton
          expand="block"
          type="submit"
          disabled={isEditMode && !isDirty}
          isSaving={isSaving}
          label={isEditMode ? 'Save Changes' : 'Create Group'}
          savingLabel={isEditMode ? 'Saving...' : 'Creating...'}
        />

        {isEditMode && group && (
          <>
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={handleDelete}
              disabled={isSaving || hasModifiers}
              style={{ marginTop: '16px' }}
            >
              Delete Modifier Group
            </IonButton>
            {hasModifiers && (
              <IonText
                color="medium"
                style={{
                  fontSize: '0.875rem',
                  marginTop: '8px',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                <p>Cannot delete group with modifiers. Remove all modifiers first.</p>
              </IonText>
            )}
          </>
        )}
      </form>
    </BaseModal>
  );
};
