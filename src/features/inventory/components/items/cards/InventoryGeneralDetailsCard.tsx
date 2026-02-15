// InventoryGeneralDetailsCard - Auto-saving inventory item details form

import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { useInventoryCategories, useUpdateInventoryItem } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { logger } from '@/services/sentry';
import { designSystem } from '@/theme/designSystem';
import type { InventoryItemWithCategory } from '@/types';
import { UnitOfMeasure as UnitOfMeasureEnum } from '@/types/enums';

interface InventoryGeneralDetailsCardProps {
  item: InventoryItemWithCategory;
  disabled?: boolean;
}

interface InventoryFormData {
  name: string;
  sku: string;
  description: string;
  unit_cost: number;
  reorder_level: number;
  base_uom: string;
  category_id: string;
}

const FormContent = styled.div`
  padding: ${designSystem.spacing.xs};
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${designSystem.spacing.md};
`;

const InventoryGeneralDetailsCard: React.FC<InventoryGeneralDetailsCardProps> = ({
  item,
  disabled = false,
}) => {
  const updateItem = useUpdateInventoryItem();
  const { data: categories } = useInventoryCategories();

  const { currentShop } = useShop();

  const { control, watch, reset, setError, clearErrors, formState: { errors } } = useForm<InventoryFormData>({
    defaultValues: {
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      unit_cost: item.unit_cost,
      reorder_level: item.reorder_level,
      base_uom: item.base_uom,
      category_id: item.category_id || '',
    },
  });

  // Reset form when item changes
  useEffect(() => {
    reset({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      unit_cost: item.unit_cost,
      reorder_level: item.reorder_level,
      base_uom: item.base_uom,
      category_id: item.category_id || '',
    });
  }, [
    item.name,
    item.sku,
    item.description,
    item.unit_cost,
    item.reorder_level,
    item.base_uom,
    item.category_id,
    reset,
  ]);

  // Auto-save on field changes (debounced 500ms)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const subscription = watch((formData, { name: fieldName }) => {
      if (!fieldName) return;

      const value = formData[fieldName];
      const currentValue = item[fieldName as keyof InventoryItemWithCategory];

      // Skip if value hasn't changed
      if (value === currentValue) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        // Validate and save
        try {
          if (fieldName === 'name' && (!value || String(value).trim() === '')) {
            return; // Don't save empty name
          }
          if (
            (fieldName === 'unit_cost' || fieldName === 'reorder_level') &&
            (value === null || value === undefined || (typeof value === 'number' && value < 0))
          ) {
            return; // Don't save invalid numbers
          }

          await updateItem.mutateAsync({
            itemId: item.id,
            data: { [fieldName]: fieldName === 'category_id' && value === '' ? null : value },
          });
          clearErrors(fieldName as keyof InventoryFormData);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(err);
          const message =
            err.message.includes('inventory_items_shop_sku_unique')
              ? 'SKU is already in use by another item'
              : 'Failed to save changes';
          setError(fieldName as keyof InventoryFormData, { type: 'server', message });
        }
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimer);
    };
  }, [watch, item, updateItem, setError, clearErrors]);

  // Transform categories for select options
  const categoryOptions =
    categories
      ?.sort((a, b) => a.sequence - b.sequence)
      .map((cat) => ({
        value: cat.id,
        label: cat.description || cat.name,
      })) || [];

  // Add "None" option
  categoryOptions.unshift({ value: '', label: 'None' });

  const uomOptions = [
    { value: UnitOfMeasureEnum.Piece, label: 'Piece' },
    { value: UnitOfMeasureEnum.Kilogram, label: 'Kilogram (KG)' },
    { value: UnitOfMeasureEnum.Gram, label: 'Gram (G)' },
    { value: UnitOfMeasureEnum.Liter, label: 'Liter (L)' },
    { value: UnitOfMeasureEnum.Milliliter, label: 'Milliliter (ML)' },
    { value: UnitOfMeasureEnum.Ounce, label: 'Ounce (OZ)' },
  ];

  return (
    <CardContainer title="General Details">
      <FormContent>
        <TextField
          name="name"
          control={control}
          label="Item Name"
          placeholder="Enter item name"
          required
          disabled={disabled}
          error={errors.name}
        />

        <TextField
          name="sku"
          control={control}
          label="SKU"
          placeholder="Enter SKU (optional)"
          disabled={disabled}
          error={errors.sku}
        />

        <TextField
          name="description"
          control={control}
          label="Description"
          placeholder="Enter description (optional)"
          disabled={disabled}
          error={errors.description}
        />

        <FieldRow>
          <PriceField
            name="unit_cost"
            control={control}
            label="Unit Cost"
            placeholder="0.00"
            required
            disabled={disabled}
            currency={currentShop?.currency_code || 'USD'}
            error={errors.unit_cost}
          />

          <SelectField
            name="base_uom"
            control={control}
            label="Base Unit"
            placeholder="Select unit"
            options={uomOptions}
            required
            disabled={disabled}
            error={errors.base_uom}
          />
        </FieldRow>

        <FieldRow>
          <TextField
            name="reorder_level"
            control={control}
            label="Reorder Level"
            placeholder="0"
            required
            disabled={disabled}
            error={errors.reorder_level}
          />

          <SelectField
            name="category_id"
            control={control}
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
            disabled={disabled}
            error={errors.category_id}
          />
        </FieldRow>
      </FormContent>
    </CardContainer>
  );
};

export default InventoryGeneralDetailsCard;
