// InventoryGeneralDetailsCard - Auto-saving inventory item details form

import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { useInventoryCategories, useUpdateInventoryItem } from '@/hooks/useInventory';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { designSystem } from '@/theme/designSystem';
import type { InventoryItemWithCategory } from '@/types';

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
  const { showError } = useToastNotification();

  const { control, watch, reset } = useForm<InventoryFormData>({
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
    item.id,
    item.name,
    item.sku,
    item.description,
    item.unit_cost,
    item.reorder_level,
    item.base_uom,
    item.category_id,
    reset,
  ]);

  // Auto-save on field changes
  useEffect(() => {
    const subscription = watch(async (formData, { name: fieldName }) => {
      if (!fieldName) return;

      const value = formData[fieldName];
      const currentValue = item[fieldName as keyof InventoryItemWithCategory];

      // Skip if value hasn't changed
      if (value === currentValue) return;

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
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)));
        showError('Failed to save changes');
        // Revert to original value
        reset({
          name: item.name,
          sku: item.sku || '',
          description: item.description || '',
          unit_cost: item.unit_cost,
          reorder_level: item.reorder_level,
          base_uom: item.base_uom,
          category_id: item.category_id || '',
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, item, updateItem, showError, reset]);

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

  // Common UOM options
  const uomOptions = [
    { value: 'ea', label: 'Each' },
    { value: 'lb', label: 'Pound' },
    { value: 'oz', label: 'Ounce' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'L', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'gal', label: 'Gallon' },
    { value: 'qt', label: 'Quart' },
    { value: 'pt', label: 'Pint' },
    { value: 'cup', label: 'Cup' },
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
        />

        <TextField
          name="sku"
          control={control}
          label="SKU"
          placeholder="Enter SKU (optional)"
          disabled={disabled}
        />

        <TextField
          name="description"
          control={control}
          label="Description"
          placeholder="Enter description (optional)"
          disabled={disabled}
        />

        <FieldRow>
          <PriceField
            name="unit_cost"
            control={control}
            label="Unit Cost"
            placeholder="0.00"
            required
            disabled={disabled}
          />

          <SelectField
            name="base_uom"
            control={control}
            label="Base Unit"
            placeholder="Select unit"
            options={uomOptions}
            required
            disabled={disabled}
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
          />

          <SelectField
            name="category_id"
            control={control}
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
            disabled={disabled}
          />
        </FieldRow>
      </FormContent>
    </CardContainer>
  );
};

export default InventoryGeneralDetailsCard;
