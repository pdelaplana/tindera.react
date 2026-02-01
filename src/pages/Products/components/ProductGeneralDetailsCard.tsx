// ProductGeneralDetailsCard - Auto-saving product details form

import { IonIcon, IonItem, IonLabel, IonToggle } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import { useProductCategories, useUpdateProduct } from '@/hooks/useProduct';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ProductCategory, ProductWithDetails } from '@/types';

interface ProductGeneralDetailsCardProps {
  product: ProductWithDetails;
  disabled?: boolean;
}

const Card = styled.div`
  background: ${designSystem.colors.surface.base};
  border-radius: ${designSystem.borderRadius.lg};
  border: 1px solid ${designSystem.colors.gray[200]};
  padding: ${designSystem.spacing.lg};
  margin-bottom: ${designSystem.spacing.lg};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  margin-bottom: ${designSystem.spacing.lg};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: ${designSystem.typography.fontSize.lg};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const CardIcon = styled(IonIcon)`
  font-size: 20px;
  color: ${designSystem.colors.brand.primary};
`;

const FieldLabel = styled.label`
  display: block;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${designSystem.spacing.xs};
`;

const TextInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.md};
  font-size: ${designSystem.typography.fontSize.base};
  font-family: ${designSystem.typography.fontFamily.base};
  color: ${designSystem.colors.text.primary};
  background: ${designSystem.colors.surface.base};
  outline: none;
  transition: border-color ${designSystem.transitions.base};

  &:focus {
    border-color: ${designSystem.colors.brand.primary};
  }

  &:disabled {
    background: ${designSystem.colors.surface.variant};
    color: ${designSystem.colors.text.disabled};
    cursor: not-allowed;
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.md};
  font-size: ${designSystem.typography.fontSize.base};
  font-family: ${designSystem.typography.fontFamily.base};
  color: ${designSystem.colors.text.primary};
  background: ${designSystem.colors.surface.base};
  outline: none;
  cursor: pointer;
  appearance: auto;
  transition: border-color ${designSystem.transitions.base};

  &:focus {
    border-color: ${designSystem.colors.brand.primary};
  }

  &:disabled {
    background: ${designSystem.colors.surface.variant};
    color: ${designSystem.colors.text.disabled};
    cursor: not-allowed;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: ${designSystem.spacing.md};
`;

const FieldRow = styled.div`
  display: flex;
  gap: ${designSystem.spacing.md};

  & > * {
    flex: 1;
  }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${designSystem.colors.surface.variant};
  border-radius: ${designSystem.borderRadius.md};
  margin-top: ${designSystem.spacing.md};
`;

const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.medium};
  color: ${designSystem.colors.text.primary};
`;

const ToggleIcon = styled.div<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: ${designSystem.borderRadius.full};
  background: ${(props) => (props.isActive ? designSystem.colors.success : designSystem.colors.gray[300])};
`;

const ProductGeneralDetailsCard: React.FC<ProductGeneralDetailsCardProps> = ({
  product,
  disabled = false,
}) => {
  const updateProduct = useUpdateProduct();
  const { data: categories } = useProductCategories();
  const { showError } = useToastNotification();

  // Local state for form fields (allows editing before auto-save)
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [categoryId, setCategoryId] = useState(product.category_id || '');
  const [isActive, setIsActive] = useState(product.is_active);

  // Sync local state when product changes (e.g., switching products)
  useEffect(() => {
    setName(product.name);
    setPrice(String(product.price));
    setCategoryId(product.category_id || '');
    setIsActive(product.is_active);
  }, [product.id, product.name, product.price, product.category_id, product.is_active]);

  const saveField = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await updateProduct.mutateAsync({ productId: product.id, data });
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)));
        showError('Failed to save changes');
        // Revert local state
        setName(product.name);
        setPrice(String(product.price));
        setCategoryId(product.category_id || '');
        setIsActive(product.is_active);
      }
    },
    [product, updateProduct, showError]
  );

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== product.name) {
      saveField({ name: trimmed });
    } else {
      setName(product.name);
    }
  };

  const handlePriceBlur = () => {
    const parsed = Number.parseFloat(price);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== product.price) {
      saveField({ price: parsed });
    } else {
      setPrice(String(product.price));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryId(value);
    saveField({ category_id: value || null });
  };

  const handleToggleChange = (checked: boolean) => {
    setIsActive(checked);
    saveField({ is_active: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardIcon icon={informationCircleOutline} />
        <CardTitle>General Details</CardTitle>
      </CardHeader>

      <FieldGroup>
        <FieldLabel>Product Name</FieldLabel>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          disabled={disabled}
          placeholder="Product name"
        />
      </FieldGroup>

      <FieldRow>
        <FieldGroup>
          <FieldLabel>Category</FieldLabel>
          <SelectInput
            value={categoryId}
            onChange={handleCategoryChange}
            disabled={disabled}
          >
            <option value="">No category</option>
            {categories?.map((cat: ProductCategory) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Base Price</FieldLabel>
          <TextInput
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={handlePriceBlur}
            disabled={disabled}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </FieldGroup>
      </FieldRow>

      <ToggleRow>
        <ToggleLabel>
          <ToggleIcon isActive={isActive} />
          Active on Menu
        </ToggleLabel>
        <IonToggle
          checked={isActive}
          onIonChange={(e) => handleToggleChange(e.detail.checked)}
          disabled={disabled}
        />
      </ToggleRow>
    </Card>
  );
};

export default ProductGeneralDetailsCard;
