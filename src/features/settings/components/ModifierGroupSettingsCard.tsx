// ModifierGroupSettingsCard - Inline auto-saving form for modifier group settings

import { zodResolver } from '@hookform/resolvers/zod';
import { IonIcon, IonItem,  IonSpinner, IonToggle } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CardContainer } from '@/components/shared';
import { NumberField, TextField } from '@/components/shared/FormFields';
import { IonText2 } from '@/components/ui';
import { useUpdateModifierGroup } from '@/hooks/useModifier';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ModifierGroupWithModifiers } from '@/types';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().max(200).optional().nullable(),
    min_select: z.number().min(0),
    max_select: z.number().min(1).nullable(),
    is_required: z.boolean(),
  })
  .refine((data) => !data.max_select || data.max_select >= data.min_select, {
    message: 'Max must be ≥ min',
    path: ['max_select'],
  });

type FormData = z.infer<typeof schema>;

type SaveState = 'idle' | 'saving' | 'saved';

interface Props {
  group: ModifierGroupWithModifiers;
  onSaved?: () => void;
}

const ModifierGroupSettingsCard: React.FC<Props> = ({ group, onSaved }) => {
  const updateGroup = useUpdateModifierGroup();
  const { showError } = useToastNotification();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    watch,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: group.name,
      description: group.description ?? '',
      min_select: group.min_select,
      max_select: group.max_select,
      is_required: group.is_required,
    },
    mode: 'onChange',
  });

  // Sync form when group data changes from outside (e.g. refetch)
  useEffect(() => {
    reset({
      name: group.name,
      description: group.description ?? '',
      min_select: group.min_select,
      max_select: group.max_select,
      is_required: group.is_required,
    });
  }, [group.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const minSelect = watch('min_select');
  const maxSelect = watch('max_select');

  // Auto-adjust max when min exceeds it
  useEffect(() => {
    if (maxSelect !== null && maxSelect < minSelect) {
      setValue('max_select', minSelect, { shouldDirty: true });
    }
  }, [minSelect, maxSelect, setValue]);

  const save = async () => {
    const valid = await trigger();
    if (!valid || !isDirty) return;

    const data = getValues();
    setSaveState('saving');
    try {
      await updateGroup.mutateAsync({
        groupId: group.id,
        updates: {
          name: data.name,
          description: data.description || null,
          min_select: data.min_select,
          max_select: data.max_select,
          is_required: data.is_required,
        },
      });
      reset(data); // clear isDirty
      setSaveState('saved');
      onSaved?.();

      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to save group settings');
      setSaveState('idle');
    }
  };

  // Debounce auto-save on every form value change
  const values = watch();
  useEffect(() => {
    if (!isDirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.description, values.min_select, values.max_select, values.is_required]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const saveIndicator =
    saveState === 'saving' ? (
      <IonText2 color="medium" fontSize="0.8em" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <IonSpinner name="crescent" style={{ width: '12px', height: '12px' }} />
        Saving…
      </IonText2>
    ) : saveState === 'saved' ? (
      <IonText2 color="success" fontSize="0.8em" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <IonIcon icon={checkmarkOutline} style={{ fontSize: '12px' }} />
        Saved
      </IonText2>
    ) : null;

  return (
    <CardContainer title="Group Settings" subtitle={saveIndicator}>
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
        helperText='Shown on the POS to guide staff. Keep it short and clear. Optional - if left blank, the internal name will be used as fallback.'
        error={errors.description}
      />

      <Controller
        name="is_required"
        control={control}
        render={({ field }) => (
          <IonItem lines="none" style={{ marginBottom: '16px' }}>
            <IonToggle
              slot="start"
              checked={field.value}
              onIonChange={(e) => field.onChange(e.detail.checked)}
             
              labelPlacement='end'
            >Required</IonToggle>
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
    </CardContainer>
  );
};

export default ModifierGroupSettingsCard;
