// ProductGeneralDetailsCard - Auto-saving product details form

import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { PriceField, SelectField, TextField, ToggleField } from '@/components/shared/FormFields';
import { useProductCategories, useUpdateProduct } from '@/hooks/useProduct';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { designSystem } from '@/theme/designSystem';
import type { ProductWithDetails } from '@/types';

interface ProductGeneralDetailsCardProps {
  product: ProductWithDetails;
  disabled?: boolean;
}

interface ProductFormData {
  name: string;
  price: number;
  category_id: string;
  is_active: boolean;
}

const FormContent = styled.div`
  padding: ${designSystem.spacing.xs};
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${designSystem.spacing.md};
`;

const ProductGeneralDetailsCard: React.FC<ProductGeneralDetailsCardProps> = ({
  product,
  disabled = false,
}) => {
  const updateProduct = useUpdateProduct();
  const { data: categories } = useProductCategories();
  const { showError } = useToastNotification();

  const { control, watch, reset } = useForm<ProductFormData>({
    defaultValues: {
      name: product.name,
      price: product.price,
      category_id: product.category_id || '',
      is_active: product.is_active,
    },
  });

  // Reset form when product changes (e.g., switching products)
  useEffect(() => {
    reset({
      name: product.name,
      price: product.price,
      category_id: product.category_id || '',
      is_active: product.is_active,
    });
  }, [product.id, product.name, product.price, product.category_id, product.is_active, reset]);

  // Auto-save on field changes
  useEffect(() => {
    const subscription = watch(async (formData, { name: fieldName }) => {
      if (!fieldName) return;

      const value = formData[fieldName];
      const currentValue = product[fieldName as keyof ProductWithDetails];

      // Skip if value hasn't changed
      if (value === currentValue) return;

      // Validate and save
      try {
        if (fieldName === 'name' && (!value || String(value).trim() === '')) {
          return; // Don't save empty name
        }
        if (
          fieldName === 'price' &&
          (value === null || value === undefined || (typeof value === 'number' && value < 0))
        ) {
          return; // Don't save invalid price
        }

        await updateProduct.mutateAsync({
          productId: product.id,
          data: { [fieldName]: fieldName === 'category_id' && value === '' ? null : value },
        });
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)));
        showError('Failed to save changes');
        // Revert to original value
        reset({
          name: product.name,
          price: product.price,
          category_id: product.category_id || '',
          is_active: product.is_active,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, product, updateProduct, showError, reset]);

  const categoryOptions = [
    { value: '', label: 'No category' },
    ...(categories?.map((cat) => ({ value: cat.id, label: cat.name })) || []),
  ];

  return (
    <CardContainer title="General Details">
      <FormContent>
        <TextField
          name="name"
          control={control}
          label="Product Name"
          placeholder="Product name"
          required
          disabled={disabled}
        />

        <FieldRow>
          <SelectField
            name="category_id"
            control={control}
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
            disabled={disabled}
          />

          <PriceField
            name="price"
            control={control}
            label="Base Price"
            placeholder="0.00"
            required
            disabled={disabled}
          />
        </FieldRow>

        <ToggleField
          name="is_active"
          control={control}
          label="Active on Menu"
          disabled={disabled}
        />
      </FormContent>
    </CardContainer>
  );
};

export default ProductGeneralDetailsCard;
