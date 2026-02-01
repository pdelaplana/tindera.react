# Products List Page Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Products List Page from a single-column list into a responsive master-detail split panel following the SalesListPage pattern.

**Architecture:** Desktop shows a split pane (380px product list | flexible detail panel with inline-editable fields). Mobile shows full-width list; tapping navigates to restyled ProductManagePage. Auto-save on blur/change for all fields. Shared components between desktop and mobile views.

**Tech Stack:** React 19, Ionic React, styled-components, TanStack React Query, react-hook-form, Zod, Supabase

**Design Doc:** `docs/plans/2026-02-01-products-list-redesign-design.md`

---

## Prerequisites

- Read `src/pages/Sales/SalesListPage.tsx` to understand the split pane pattern being replicated
- Read `src/pages/Sales/components/OrderCard.tsx` for selection styling pattern
- Read `src/pages/Sales/components/OrderDetail.tsx` for empty state pattern
- Read `src/theme/designSystem.ts` for design tokens
- Read `src/hooks/useBreakpoint.ts` for responsive hook
- Read `src/hooks/useProduct.ts` for all product mutation/query hooks
- Read `src/services/storage.ts` for `uploadProductImage()` function
- Read `src/pages/Products/components/ProductFormModal.tsx` for image upload pattern
- Read `src/components/shared/FormFields.tsx` for available form field components
- Read `src/components/ui/ImageUpload.tsx` for image upload component

---

## Task 1: Add `is_active` Column to Products Table

The design includes an "Active on Menu" toggle, but the `products` table lacks an `is_active` column.

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_is_active_to_products.sql`
- Modify: `src/types/index.ts:168-178` (Product interface)

**Step 1: Create the migration file**

Create `supabase/migrations/20260201000000_add_is_active_to_products.sql`:

```sql
-- Add is_active column to products table
ALTER TABLE products ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN products.is_active IS 'Whether product is active on the POS menu';
```

**Step 2: Push the migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Regenerate TypeScript types**

Run: `npx supabase gen types typescript --project-id bwcrsmbmkmoigzwtuhjn > src/types/supabase.generated.ts`
Expected: File updated with `is_active` column in products table types

**Step 4: Update the Product interface**

In `src/types/index.ts`, add `is_active` to the `Product` interface (after `image_url` field at line 177):

```typescript
export interface Product extends Auditable {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  remarks: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
}
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (ProductInsert and ProductUpdate derive from Product via Omit/Partial, so they auto-include is_active)

**Step 6: Commit**

```bash
git add supabase/migrations/ src/types/
git commit -m "feat: add is_active column to products table"
```

---

## Task 2: Create ProductListItem Component

A styled list item for the product list, following the OrderCard selection pattern.

**Files:**
- Create: `src/pages/Products/components/ProductListItem.tsx`

**Step 1: Create the component**

Create `src/pages/Products/components/ProductListItem.tsx`:

```tsx
// ProductListItem - Styled product list item with selection support

import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import type { ProductWithCategory } from '@/types';

interface ProductListItemProps {
  product: ProductWithCategory;
  isSelected: boolean;
  onClick: () => void;
  formatPrice: (price: number) => string;
}

const Card = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  cursor: pointer;
  transition: all ${designSystem.transitions.base};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  background: ${(props) =>
    props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
  border-bottom: 1px solid ${designSystem.colors.gray[100]};

  &:hover {
    background: ${designSystem.colors.surface.variant};
  }

  &:active {
    transform: scale(0.99);
  }
`;

const Thumbnail = styled.img`
  width: 48px;
  height: 48px;
  border-radius: ${designSystem.borderRadius.md};
  object-fit: cover;
  flex-shrink: 0;
  background: ${designSystem.colors.gray[100]};
`;

const ThumbnailPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${designSystem.borderRadius.md};
  background: ${designSystem.colors.gray[100]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  font-size: ${designSystem.typography.fontSize.xs};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Category = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.brand.primary};
  margin-top: 2px;
`;

const PriceContainer = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const Price = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.brand.primary};
`;

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  isSelected,
  onClick,
  formatPrice,
}) => {
  return (
    <Card isSelected={isSelected} onClick={onClick} role="button" tabIndex={0}>
      {product.image_url ? (
        <Thumbnail src={product.image_url} alt={product.name} />
      ) : (
        <ThumbnailPlaceholder>No img</ThumbnailPlaceholder>
      )}
      <Info>
        <Name>{product.name}</Name>
        {product.category && <Category>{product.category.name}</Category>}
      </Info>
      <PriceContainer>
        <Price>{formatPrice(product.price)}</Price>
      </PriceContainer>
    </Card>
  );
};

export default ProductListItem;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/ProductListItem.tsx
git commit -m "feat: add ProductListItem component with selection styling"
```

---

## Task 3: Create ProductImageSection Component

Hero image display with "Update Photo" overlay button. Auto-saves image on file select.

**Files:**
- Create: `src/pages/Products/components/ProductImageSection.tsx`

**Reference:** Image upload pattern from `src/pages/Products/components/ProductFormModal.tsx:207-247` and `src/services/storage.ts:131-203` (`uploadProductImage` function).

**Step 1: Create the component**

Create `src/pages/Products/components/ProductImageSection.tsx`:

```tsx
// ProductImageSection - Hero image with update photo overlay button

import { IonIcon, IonSpinner } from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import type React from 'react';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface ProductImageSectionProps {
  imageUrl: string | null;
  productId: string;
  shopId: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: ${designSystem.borderRadius.lg};
  overflow: hidden;
  background: ${designSystem.colors.gray[100]};
  margin-bottom: ${designSystem.spacing.lg};
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  font-size: ${designSystem.typography.fontSize.lg};
`;

const UpdateButton = styled.button`
  position: absolute;
  bottom: ${designSystem.spacing.md};
  right: ${designSystem.spacing.md};
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: ${designSystem.colors.surface.base};
  border: 1px solid ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.md};
  cursor: pointer;
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  color: ${designSystem.colors.text.primary};
  transition: all ${designSystem.transitions.base};
  box-shadow: ${designSystem.shadows.sm};

  &:hover {
    background: ${designSystem.colors.surface.variant};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ProductImageSection: React.FC<ProductImageSectionProps> = ({
  imageUrl,
  productId,
  shopId,
  onImageUploaded,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    try {
      const { uploadProductImage } = await import('@/services/storage');
      const publicUrl = await uploadProductImage(file, shopId, productId);
      onImageUploaded(publicUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error; // Let parent handle the error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container>
      {imageUrl ? (
        <Image src={imageUrl} alt="Product" />
      ) : (
        <Placeholder>No product image</Placeholder>
      )}
      {!disabled && (
        <UpdateButton onClick={handleClick} disabled={isUploading}>
          {isUploading ? (
            <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
          ) : (
            <IonIcon icon={cameraOutline} />
          )}
          {isUploading ? 'Uploading...' : 'Update Photo'}
        </UpdateButton>
      )}
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />
    </Container>
  );
};

export default ProductImageSection;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/ProductImageSection.tsx
git commit -m "feat: add ProductImageSection with upload overlay"
```

---

## Task 4: Create ProductGeneralDetailsCard Component

Auto-saving form card with product name, category, base price, and active toggle.

**Files:**
- Create: `src/pages/Products/components/ProductGeneralDetailsCard.tsx`

**Reference:**
- Form fields: `src/components/shared/FormFields.tsx` (TextField, SelectField, PriceField, ToggleField)
- Update hook: `src/hooks/useProduct.ts:206-222` (`useUpdateProduct` takes `{ productId, data: ProductUpdate }`)
- Toast: `src/hooks/useToastNotification.ts`
- Categories: `src/hooks/useProduct.ts` (`useProductCategories`)

**Step 1: Create the component**

Create `src/pages/Products/components/ProductGeneralDetailsCard.tsx`:

```tsx
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
  background: ${(props) => (props.isActive ? designSystem.colors.semantic.success : designSystem.colors.gray[300])};
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/ProductGeneralDetailsCard.tsx
git commit -m "feat: add ProductGeneralDetailsCard with auto-save"
```

---

## Task 5: Create ProductDetailHeader Component

Breadcrumb and delete button header for the detail panel.

**Files:**
- Create: `src/pages/Products/components/ProductDetailHeader.tsx`

**Reference:** `src/components/shared/DeleteConfirmationAlert.tsx` for delete flow.

**Step 1: Create the component**

Create `src/pages/Products/components/ProductDetailHeader.tsx`:

```tsx
// ProductDetailHeader - Breadcrumb navigation and delete button

import { IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface ProductDetailHeaderProps {
  productName: string;
  onDelete: () => void;
  canDelete: boolean;
}

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${designSystem.spacing.lg};
`;

const Left = styled.div``;

const Breadcrumb = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  margin-bottom: ${designSystem.spacing.xs};

  & span {
    color: ${designSystem.colors.brand.primary};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${designSystem.typography.fontSize.xl};
  font-weight: ${designSystem.typography.fontWeight.bold};
  color: ${designSystem.colors.text.primary};
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: none;
  border: none;
  cursor: pointer;
  color: ${designSystem.colors.semantic.danger};
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  font-family: ${designSystem.typography.fontFamily.base};
  transition: opacity ${designSystem.transitions.base};

  &:hover {
    opacity: 0.7;
  }
`;

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  productName,
  onDelete,
  canDelete,
}) => {
  return (
    <Container>
      <Left>
        <Breadcrumb>
          <span>Products</span> &gt; {productName}
        </Breadcrumb>
        <Title>Product Details</Title>
      </Left>
      {canDelete && (
        <DeleteButton onClick={onDelete}>
          <IonIcon icon={trashOutline} />
          Delete
        </DeleteButton>
      )}
    </Container>
  );
};

export default ProductDetailHeader;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/ProductDetailHeader.tsx
git commit -m "feat: add ProductDetailHeader with breadcrumb and delete"
```

---

## Task 6: Create ProductDetailPanel Component

Container component for the right panel that orchestrates all detail sections.

**Files:**
- Create: `src/pages/Products/components/ProductDetailPanel.tsx`

**Reference:**
- Empty state pattern: `src/pages/Sales/components/OrderDetail.tsx:27-40,353-361`
- Product data hook: `src/hooks/useProduct.ts:78-110` (`useProduct(id)` returns `ProductWithDetails`)
- Delete flow: `src/pages/Products/ProductManagePage.tsx:118-132`
- Modifier list: `src/pages/Products/components/productModifiers/ProductModifiersList.tsx`
- Addon list: `src/pages/Products/components/productAddons/ProductAddonsList.tsx`
- Item list: `src/pages/Products/components/productItems/ProductItemsList.tsx`
- Modifier modals: `ProductModifierModal`, `ProductModifierSelectModal`, `ProductAddonModal`, `ProductItemModal`

**Step 1: Create the component**

Create `src/pages/Products/components/ProductDetailPanel.tsx`:

```tsx
// ProductDetailPanel - Right panel container for product details

import type React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useIonLoading } from '@ionic/react';
import { designSystem } from '@/theme/designSystem';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { LoadingSpinner } from '@/components/ui';
import {
  useDeleteProduct,
  useProduct,
  useRemoveProductAddon,
  useRemoveProductItem,
  useUpdateProduct,
} from '@/hooks/useProduct';
import { useUnlinkModifierGroup, useUpdateLinkSequence } from '@/hooks';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { createCurrencyFormatter } from '@/utils/currency';
import type { ModifierGroupWithModifiers, ProductAddon, ProductItem } from '@/types';
import type { ItemReorderEventDetail } from '@ionic/react';
import ProductDetailHeader from './ProductDetailHeader';
import ProductImageSection from './ProductImageSection';
import ProductGeneralDetailsCard from './ProductGeneralDetailsCard';
import {
  ProductModifiersList,
  ProductAddonsList,
  ProductItemsList,
  ProductModifierModal,
  ProductModifierSelectModal,
  ProductAddonModal,
  ProductItemModal,
} from './';

interface ProductDetailPanelProps {
  productId: string | null;
  onProductDeleted: () => void;
}

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${designSystem.spacing.xl};
  text-align: center;
`;

const EmptyText = styled.div`
  font-size: ${designSystem.typography.fontSize.lg};
  color: ${designSystem.colors.text.secondary};
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${designSystem.spacing.lg};
  max-width: 800px;
`;

const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({
  productId,
  onProductDeleted,
}) => {
  const { currentShop, hasPermission } = useShop();
  const { data: product, isLoading, refetch: refetchProduct } = useProduct(productId ?? undefined);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const removeProductItem = useRemoveProductItem();
  const removeProductAddon = useRemoveProductAddon();
  const unlinkModifierGroup = useUnlinkModifierGroup();
  const updateLinkSequence = useUpdateLinkSequence();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Modal states
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showModifierSelectModal, setShowModifierSelectModal] = useState(false);
  const [showPriceOverridesModal, setShowPriceOverridesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<ProductAddon | null>(null);
  const [selectedModifierGroup, setSelectedModifierGroup] =
    useState<ModifierGroupWithModifiers | null>(null);

  // Handlers
  const handleDeleteProduct = async () => {
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await deleteProduct.mutateAsync(product.id);
      showSuccess('Product deleted successfully');
      onProductDeleted();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete product');
    } finally {
      await dismiss();
    }
  };

  const handleImageUploaded = async (url: string) => {
    if (!product) return;
    try {
      await updateProduct.mutateAsync({ productId: product.id, data: { image_url: url } });
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to update image');
    }
  };

  const handleEditItem = (item: ProductItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (item: ProductItem) => {
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await removeProductItem.mutateAsync({ itemId: item.id, productId: product.id });
      showSuccess('Ingredient removed');
      setSelectedItem(null);
      setShowItemModal(false);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to remove ingredient');
    } finally {
      await dismiss();
    }
  };

  const handleEditAddon = (addon: ProductAddon) => {
    setSelectedAddon(addon);
    setShowAddonModal(true);
  };

  const handleDeleteAddon = async (addon: ProductAddon) => {
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await removeProductAddon.mutateAsync({ addonId: addon.id, productId: product.id });
      showSuccess('Add-on removed');
      setSelectedAddon(null);
      setShowAddonModal(false);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to remove add-on');
    } finally {
      await dismiss();
    }
  };

  const handleAddModifierGroup = () => {
    setShowModifierSelectModal(true);
  };

  const handleEditModifierGroup = (group: ModifierGroupWithModifiers) => {
    setSelectedModifierGroup(group);
    setShowPriceOverridesModal(true);
  };

  const handleUnlinkModifierGroup = async (group: ModifierGroupWithModifiers) => {
    if (!product) return;
    try {
      await present({ message: 'Unlinking...' });
      await unlinkModifierGroup.mutateAsync({ productId: product.id, groupId: group.id });
      showSuccess('Modifier group unlinked');
      setSelectedModifierGroup(null);
      setShowPriceOverridesModal(false);
      refetchProduct();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to unlink modifier group');
    } finally {
      await dismiss();
    }
  };

  const handleReorderModifierGroup = async (event: CustomEvent<ItemReorderEventDetail>) => {
    if (!product?.linkedModifierGroups) {
      event.detail.complete();
      return;
    }

    const linkedGroups = [...product.linkedModifierGroups];
    const { from, to } = event.detail;
    event.detail.complete();
    if (from === to) return;

    const [movedItem] = linkedGroups.splice(from, 1);
    linkedGroups.splice(to, 0, movedItem);

    try {
      const updatePromises = linkedGroups.map((group, index) =>
        updateLinkSequence.mutateAsync({
          productId: product.id,
          groupId: group.id,
          sequence: index,
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to reorder modifier groups');
    }
  };

  // Empty state
  if (!productId) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Select a product to view details</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner />
        </EmptyState>
      </Container>
    );
  }

  // Not found
  if (!product) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Product not found</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollContent>
        <ProductDetailHeader
          productName={product.name}
          onDelete={() => setShowDeleteAlert(true)}
          canDelete={canDelete}
        />

        <ProductImageSection
          imageUrl={product.image_url}
          productId={product.id}
          shopId={currentShop?.id || ''}
          onImageUploaded={handleImageUploaded}
          disabled={!canEdit}
        />

        <ProductGeneralDetailsCard
          product={product}
          disabled={!canEdit}
        />

        <ProductModifiersList
          linkedGroups={product.linkedModifierGroups || []}
          priceOverrides={product.priceOverrides || {}}
          formatCurrency={formatCurrency}
          onAdd={handleAddModifierGroup}
          onEdit={handleEditModifierGroup}
          onReorder={handleReorderModifierGroup}
          canEdit={canEdit}
        />

        <ProductAddonsList
          addons={product.addons || []}
          formatCurrency={formatCurrency}
          onAdd={() => setShowAddonModal(true)}
          onEdit={handleEditAddon}
          canEdit={canEdit}
        />

        <ProductItemsList
          items={product.items || []}
          formatCurrency={formatCurrency}
          onAdd={() => setShowItemModal(true)}
          onEdit={handleEditItem}
          canEdit={canEdit}
        />
      </ScrollContent>

      {/* Modals */}
      <ProductAddonModal
        isOpen={showAddonModal}
        onClose={() => { setShowAddonModal(false); setSelectedAddon(null); }}
        addon={selectedAddon}
        productId={product.id}
        onDelete={handleDeleteAddon}
      />

      <ProductItemModal
        isOpen={showItemModal}
        onClose={() => { setShowItemModal(false); setSelectedItem(null); }}
        item={selectedItem}
        productId={product.id}
        onDelete={handleDeleteItem}
      />

      <DeleteConfirmationAlert
        isOpen={showDeleteAlert}
        onDismiss={() => setShowDeleteAlert(false)}
        onConfirm={handleDeleteProduct}
        itemName={product.name}
        itemType="Product"
      />

      <ProductModifierSelectModal
        isOpen={showModifierSelectModal}
        onClose={() => { setShowModifierSelectModal(false); refetchProduct(); }}
        productId={product.id}
        linkedGroupIds={(product.linkedModifierGroups || []).map((g) => g.id)}
      />

      <ProductModifierModal
        isOpen={showPriceOverridesModal}
        onClose={() => {
          setShowPriceOverridesModal(false);
          setSelectedModifierGroup(null);
          refetchProduct();
        }}
        productId={product.id}
        group={selectedModifierGroup}
        priceOverrides={product.priceOverrides || {}}
        formatCurrency={formatCurrency}
        onDelete={handleUnlinkModifierGroup}
      />
    </Container>
  );
};

export default ProductDetailPanel;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/ProductDetailPanel.tsx
git commit -m "feat: add ProductDetailPanel container component"
```

---

## Task 7: Update Barrel Exports

Add new components to the barrel export file.

**Files:**
- Modify: `src/pages/Products/components/index.ts`

**Step 1: Add exports**

Add these lines to `src/pages/Products/components/index.ts`:

```typescript
export { default as ProductDetailHeader } from './ProductDetailHeader';
export { default as ProductDetailPanel } from './ProductDetailPanel';
export { default as ProductGeneralDetailsCard } from './ProductGeneralDetailsCard';
export { default as ProductImageSection } from './ProductImageSection';
export { default as ProductListItem } from './ProductListItem';
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Products/components/index.ts
git commit -m "feat: export new product detail components"
```

---

## Task 8: Rewrite ProductsListPage with Split Pane

Complete rewrite following the SalesListPage split pane pattern.

**Files:**
- Modify: `src/pages/Products/ProductsListPage.tsx` (complete rewrite)

**Reference:** `src/pages/Sales/SalesListPage.tsx` - the exact pattern to follow for styled components, responsive layout, and selection handling.

**Step 1: Rewrite the component**

Replace the entire contents of `src/pages/Products/ProductsListPage.tsx` with:

```tsx
// Products List Page - Responsive master-detail split pane

import { IonContent, IonPage, IonSearchbar } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { CategoryPillScroller } from '@/components/pos';
import PageHeader from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/ui';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useProductCategories, useProducts } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { createCurrencyFormatter } from '@/utils/currency';
import { designSystem } from '@/theme/designSystem';
import type { ProductWithCategory } from '@/types';
import { ProductDetailPanel, ProductFormModal, ProductListItem } from './components';

// Styled components - following SalesListPage pattern
const SplitPaneContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 0 0 380px;
  border-right: 1px solid var(--ion-color-light-shade);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--ion-color-light);
`;

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SearchBarContainer = styled.div`
  padding: 12px 16px;
`;

const CategoryContainer = styled.div`
  padding: 0 16px 8px 16px;
  border-bottom: 1px solid var(--ion-color-light-shade);
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designSystem.spacing['2xl']};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
  gap: ${designSystem.spacing.sm};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  width: calc(100% - 32px);
  margin: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  border: 2px dashed ${designSystem.colors.gray[300]};
  border-radius: ${designSystem.borderRadius.md};
  background: none;
  cursor: pointer;
  color: ${designSystem.colors.text.secondary};
  font-size: ${designSystem.typography.fontSize.base};
  font-family: ${designSystem.typography.fontFamily.base};
  transition: all ${designSystem.transitions.base};

  &:hover {
    border-color: ${designSystem.colors.brand.primary};
    color: ${designSystem.colors.brand.primary};
  }
`;

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
  color: var(--ion-color-medium);
  gap: 8px;
`;

const ProductsListPage: React.FC = () => {
  const history = useHistory();
  const isDesktop = useIsTabletOrLarger();
  const { currentShop, isLoading: shopLoading } = useShop();

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  const {
    data: products,
    isLoading: productsLoading,
  } = useProducts({
    search: searchText || undefined,
    categoryId: selectedCategory || undefined,
  });

  const { data: categories } = useProductCategories();

  const isLoading = shopLoading || productsLoading;

  // Currency formatter
  const formatPrice = useMemo(() => {
    const formatter = createCurrencyFormatter(currentShop?.currency_code || 'USD');
    return (price: number) => formatter(price);
  }, [currentShop?.currency_code]);

  // Handle product selection (desktop: set selected, mobile: navigate)
  const handleProductSelect = (product: ProductWithCategory) => {
    if (isDesktop) {
      setSelectedProductId(product.id);
    } else {
      if (currentShop) {
        history.push(`/shops/${currentShop.id}/products/${product.id}/manage`);
      }
    }
  };

  const handleAddProduct = () => {
    setIsModalOpen(true);
  };

  const handleProductDeleted = () => {
    setSelectedProductId(null);
  };

  // Render search bar
  const renderSearchBar = () => (
    <SearchBarContainer>
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value ?? '')}
        placeholder="Search products..."
        debounce={300}
      />
    </SearchBarContainer>
  );

  // Render category pills
  const renderCategoryPills = () => {
    if (!categories || categories.length === 0) return null;
    return (
      <CategoryContainer>
        <CategoryPillScroller
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </CategoryContainer>
    );
  };

  // Render product list
  const renderProductList = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!products || products.length === 0) {
      return (
        <EmptyContainer>
          <h3>No Products Yet</h3>
          <p>Get started by adding your first product</p>
        </EmptyContainer>
      );
    }

    return (
      <ListContainer>
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            isSelected={isDesktop && selectedProductId === product.id}
            onClick={() => handleProductSelect(product)}
            formatPrice={formatPrice}
          />
        ))}
      </ListContainer>
    );
  };

  // No shop state
  if (!currentShop && !shopLoading) {
    return (
      <IonPage>
        <PageHeader title="Products" showProfile showLogout />
        <IonContent>
          <PlaceholderContainer>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to view products</p>
          </PlaceholderContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Desktop layout with split pane
  if (isDesktop) {
    return (
      <IonPage>
        <PageHeader title="Products" showProfile showLogout />
        <IonContent>
          <SplitPaneContainer>
            <LeftPanel>
              {renderSearchBar()}
              {renderCategoryPills()}
              {renderProductList()}
              <AddButton onClick={handleAddProduct}>
                + Add New Product
              </AddButton>
            </LeftPanel>
            <RightPanel>
              <ProductDetailPanel
                productId={selectedProductId}
                onProductDeleted={handleProductDeleted}
              />
            </RightPanel>
          </SplitPaneContainer>
        </IonContent>
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={null}
        />
      </IonPage>
    );
  }

  // Mobile layout
  return (
    <IonPage>
      <PageHeader title="Products" showProfile showLogout />
      <IonContent>
        <MobileContainer>
          {renderSearchBar()}
          {renderCategoryPills()}
          {renderProductList()}
          <AddButton onClick={handleAddProduct}>
            + Add New Product
          </AddButton>
        </MobileContainer>
      </IonContent>
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={null}
      />
    </IonPage>
  );
};

export default ProductsListPage;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Visual test in browser**

Run: `npm run dev`
Expected:
- Desktop: Split pane layout with product list on left, detail on right
- Click a product: detail panel loads with image, general details, modifiers, addons, ingredients
- Mobile (resize < 768px): Full-width list, clicking navigates to manage page
- Search and category filters work
- "Add New Product" opens the modal

**Step 4: Commit**

```bash
git add src/pages/Products/ProductsListPage.tsx
git commit -m "feat: rewrite ProductsListPage with split pane layout"
```

---

## Task 9: Restyle ProductManagePage for Mobile

Replace the current ProductManagePage header section with shared components for mobile view consistency.

**Files:**
- Modify: `src/pages/Products/ProductManagePage.tsx`

**Step 1: Update the component**

Replace the import section, remove unused imports, and replace the top section (ProductSummary + ProductActionButtons + segment tabs) with the shared components (ProductDetailHeader, ProductImageSection, ProductGeneralDetailsCard). Keep back button, keep modifiers/addons/items sections, keep all modals.

Key changes:
- Remove imports: `ProductSummary`, `ProductActionButtons`, `IonSegment`, `IonSegmentButton`, `IonLabel`, `IonText`, segment state, `productNameRef`, `observedElementRef`
- Add imports: `ProductDetailHeader`, `ProductImageSection`, `ProductGeneralDetailsCard`
- Replace `PageWithCollapsibleHeader` with `IonPage` + standard header with back button
- Replace top section with: `ProductDetailHeader`, `ProductImageSection`, `ProductGeneralDetailsCard`
- Remove segment control and sales placeholder
- Remove `handleEditProduct` and `handleOptions` (no longer needed - editing is inline)
- Keep all modifier, addon, item handlers and modals

The updated component should use `IonPage` + `IonHeader` + `IonContent` instead of `PageWithCollapsibleHeader`, and directly render the shared detail components followed by the existing list components.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Visual test on mobile**

Run: `npm run dev` and resize to mobile
Expected:
- Navigate to a product from the list
- See back button, breadcrumb, delete button
- Hero image with update photo
- General details card with auto-save fields
- Modifiers, addons, ingredients sections below
- All modals still work

**Step 4: Commit**

```bash
git add src/pages/Products/ProductManagePage.tsx
git commit -m "refactor: restyle ProductManagePage with shared detail components"
```

---

## Task 10: Clean Up and Final Verification

Remove dead code and verify everything works end-to-end.

**Files:**
- Review: `src/pages/Products/components/ProductSummary.tsx` - may be unused now
- Review: `src/pages/Products/components/ProductActionButtons.tsx` - may be unused now
- Verify: `src/pages/Products/components/index.ts` - clean up unused exports

**Step 1: Check if ProductSummary is used anywhere else**

Run: search for `ProductSummary` across codebase (excluding index.ts and the component file itself).
If only used in old ProductManagePage (now removed), delete the component.

**Step 2: Check if ProductActionButtons is used anywhere else**

Run: search for `ProductActionButtons` across codebase.
If only used in old ProductManagePage (now removed), delete the component.

**Step 3: Remove unused exports from index.ts**

Remove any exports for deleted components.

**Step 4: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Run linter**

Run: `npx biome check src/pages/Products/`
Expected: No errors (fix any that appear)

**Step 6: Run existing tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 7: Full manual test**

Run: `npm run dev`

Test these flows:
1. Desktop: Products page shows split pane
2. Click a product → detail loads in right panel
3. Edit product name → blur → saves automatically
4. Change category → saves automatically
5. Change price → blur → saves automatically
6. Toggle "Active on Menu" → saves automatically
7. Upload image → saves automatically
8. Click delete → confirmation → product deleted → empty state
9. Click "+ Add New Product" → modal opens → create product → appears in list
10. Search works
11. Category pills filter works
12. Resize to mobile → list-only view
13. Mobile: tap product → navigates to manage page with all detail sections
14. Mobile: back button returns to list

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor: clean up unused product components"
```

---

## Summary of All Files

### Created (5 files)
| File | Purpose |
|------|---------|
| `supabase/migrations/20260201000000_add_is_active_to_products.sql` | DB migration for is_active column |
| `src/pages/Products/components/ProductListItem.tsx` | Styled list item with selection |
| `src/pages/Products/components/ProductImageSection.tsx` | Hero image with upload overlay |
| `src/pages/Products/components/ProductGeneralDetailsCard.tsx` | Auto-save form card |
| `src/pages/Products/components/ProductDetailHeader.tsx` | Breadcrumb + delete header |
| `src/pages/Products/components/ProductDetailPanel.tsx` | Right panel container |

### Modified (3 files)
| File | Change |
|------|--------|
| `src/types/index.ts` | Add `is_active` to Product interface |
| `src/pages/Products/ProductsListPage.tsx` | Complete rewrite with split pane |
| `src/pages/Products/ProductManagePage.tsx` | Restyle with shared components |
| `src/pages/Products/components/index.ts` | Add new component exports |

### Potentially Deleted (2 files)
| File | Reason |
|------|--------|
| `src/pages/Products/components/ProductSummary.tsx` | Replaced by shared components |
| `src/pages/Products/components/ProductActionButtons.tsx` | Replaced by inline editing |
