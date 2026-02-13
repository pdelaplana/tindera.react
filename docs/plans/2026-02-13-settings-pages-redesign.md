# Settings Pages Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign TaxSettingsPage, DiscountTypeSettingsPage, and VoidRefundSettingsPage to match the `InventoryCategoriesPage` pattern: self-contained pages with CardContainer + search + BaseModal add/edit + DeleteConfirmationAlert.

**Architecture:** Each page becomes fully self-contained (list, modal, delete). The three existing `*Settings` component files are deleted. The page files replace their thin wrappers with the full implementation following the InventoryCategoriesPage pattern exactly.

**Tech Stack:** React, Ionic, react-hook-form, zod, @tanstack/react-query

---

## Reference Files

Before starting, read these for patterns:
- `src/features/settings/pages/InventoryCategoriesPage.tsx` — primary reference (full pattern)
- `src/components/shared/BaseModal.tsx` — modal props (note: needs `showActionButton={true}`)
- `src/components/shared/CardContainer.tsx` — `showSearch`, `onActionClick`, `noPadding`
- `src/components/shared/FormFields.tsx` — `TextField`, `NumberField` components
- `src/components/shared/DeleteConfirmationAlert.tsx` — delete alert props

---

## Task 1: Rewrite TaxSettingsPage

**Files:**
- Rewrite: `src/features/settings/pages/TaxSettingsPage.tsx`
- Delete: `src/features/settings/components/TaxSettings.tsx`

### Step 1: Read the current files

Read `src/features/settings/pages/TaxSettingsPage.tsx` and `src/features/settings/components/TaxSettings.tsx` to understand what exists.

### Step 2: Rewrite TaxSettingsPage.tsx

Replace the entire file with:

```tsx
// Tax Settings Page - Manage shop taxes

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonToggle,
  type RefresherEventDetail,
} from '@ionic/react';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { CardContainer } from '@/components/shared/CardContainer';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, TextField } from '@/components/shared/FormFields';
import { LoadingSpinner } from '@/components/ui';
import { Div } from '@/components/shared/base/Div';
import {
  useCreateShopTax,
  useDeleteShopTax,
  useShopTaxes,
  useUpdateShopTax,
} from '@/hooks/useShopTaxes';
import { useShop } from '@/hooks/useShop';
import type { ShopTax } from '@/types';

const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  rate: z.number().min(0, 'Rate must be at least 0').max(100, 'Rate must be at most 100'),
  is_active: z.boolean(),
});

type TaxFormData = z.infer<typeof taxSchema>;

const TaxSettingsPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: taxes, isLoading: taxesLoading, refetch } = useShopTaxes(true);

  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<ShopTax | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);

  const createTax = useCreateShopTax();
  const updateTax = useUpdateShopTax();
  const deleteTax = useDeleteShopTax();

  const isLoading = shopLoading || taxesLoading;

  const filteredTaxes = (taxes ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: { name: '', rate: 0, is_active: true },
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleAdd = () => {
    setEditingTax(null);
    reset({ name: '', rate: 0, is_active: true });
    setShowModal(true);
  };

  const handleEdit = (tax: ShopTax) => {
    setEditingTax(tax);
    reset({ name: tax.name, rate: tax.rate * 100, is_active: tax.is_active });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTax(null);
    reset();
  };

  const onSubmit = async (data: TaxFormData) => {
    const rate = data.rate / 100;
    if (editingTax) {
      await updateTax.mutateAsync({ taxId: editingTax.id, updates: { name: data.name, rate, is_active: data.is_active } });
    } else {
      await createTax.mutateAsync({ name: data.name, rate });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingTaxId) return;
    await deleteTax.mutateAsync(deletingTaxId);
    setDeletingTaxId(null);
    handleCloseModal();
  };

  const isSaving = createTax.isPending || updateTax.isPending;

  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Taxes" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage taxes</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Taxes" backHref={`/shops/${currentShop?.id}/settings`} onRefresh={handleRefresh}>
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search taxes..."
          onActionClick={handleAdd}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !taxes || taxes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Taxes Yet</h2>
              <p>Add taxes to apply to your orders</p>
            </Div>
          ) : filteredTaxes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText color="medium"><h3>No taxes match your search</h3></IonText>
            </Div>
          ) : (
            <IonList>
              {filteredTaxes.map((tax) => (
                <IonItem key={tax.id} button lines="full" onClick={() => handleEdit(tax)}>
                  <IonLabel>
                    <h2>{tax.name}</h2>
                    <IonText color="medium"><p>{(tax.rate * 100).toFixed(2)}%</p></IonText>
                  </IonLabel>
                  {!tax.is_active && <IonBadge color="medium">Inactive</IonBadge>}
                </IonItem>
              ))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTax ? 'Edit Tax' : 'Add Tax'}
        showActionButton
        onActionClick={handleSubmit(onSubmit)}
        actionButtonDisabled={isSaving}
        actionButtonLoading={isSaving}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Tax Name"
            placeholder="e.g., Sales Tax"
            error={errors.name}
            required
          />
          <NumberField
            control={control}
            name="rate"
            label="Rate (%)"
            placeholder="e.g., 8.5"
            error={errors.rate}
            required
          />
          <IonItem lines="none">
            <IonToggle
              checked={!!editingTax?.is_active}
              onIonChange={(e) => {
                if (editingTax) {
                  setEditingTax({ ...editingTax, is_active: e.detail.checked });
                }
              }}
              labelPlacement="start"
            >
              Active
            </IonToggle>
          </IonItem>

          {editingTax && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingTaxId(editingTax.id)}
              disabled={deleteTax.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Tax
            </IonButton>
          )}
        </form>
      </BaseModal>

      <DeleteConfirmationAlert
        isOpen={!!deletingTaxId}
        onDismiss={() => setDeletingTaxId(null)}
        onConfirm={handleDelete}
        itemName={editingTax?.name || ''}
        itemType="Tax"
      />
    </BasePage>
  );
};

export default TaxSettingsPage;
```

**Note on the Active toggle:** The form uses `react-hook-form` for name and rate fields. For `is_active`, use a controlled `IonToggle` wired to the form via `Controller` from react-hook-form — or use the `editingTax` local state approach above. The cleanest approach is to include `is_active` in the zod schema and wire it through `Controller`. Update the form implementation to use `Controller` for the toggle:

```tsx
import { Controller } from 'react-hook-form';

// Inside the form:
<Controller
  control={control}
  name="is_active"
  render={({ field }) => (
    <IonItem lines="none">
      <IonToggle
        checked={field.value}
        onIonChange={(e) => field.onChange(e.detail.checked)}
        labelPlacement="start"
      >
        Active
      </IonToggle>
    </IonItem>
  )}
/>
```

Use this Controller approach — it's cleaner and consistent with how react-hook-form manages form state.

### Step 3: Delete TaxSettings.tsx

Delete `src/features/settings/components/TaxSettings.tsx`.

### Step 4: Check for TypeScript errors

Run: `npx tsc --noEmit`

Fix any errors before continuing.

### Step 5: Commit

```bash
git add src/features/settings/pages/TaxSettingsPage.tsx
git rm src/features/settings/components/TaxSettings.tsx
git commit -m "feat: redesign TaxSettingsPage with CardContainer + BaseModal pattern"
```

---

## Task 2: Rewrite DiscountTypeSettingsPage

**Files:**
- Rewrite: `src/features/settings/pages/DiscountTypeSettingsPage.tsx`
- Delete: `src/features/settings/components/DiscountTypeSettings.tsx`

### Step 1: Read the current files

Read `src/features/settings/pages/DiscountTypeSettingsPage.tsx` and `src/features/settings/components/DiscountTypeSettings.tsx`.

### Step 2: Rewrite DiscountTypeSettingsPage.tsx

Replace the entire file with (same pattern as TaxSettingsPage, adapted for DiscountType):

```tsx
// Discount Type Settings Page - Manage discount types

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  type RefresherEventDetail,
} from '@ionic/react';
import type React from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { CardContainer } from '@/components/shared/CardContainer';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { TextField } from '@/components/shared/FormFields';
import { Div } from '@/components/shared/base/Div';
import { LoadingSpinner } from '@/components/ui';
import {
  useCreateDiscountType,
  useDeleteDiscountType,
  useDiscountTypes,
  useUpdateDiscountType,
} from '@/hooks/useDiscountTypes';
import { useShop } from '@/hooks/useShop';
import { IonToggle } from '@ionic/react';
import type { DiscountType } from '@/types';

const discountTypeSchema = z.object({
  name: z.string().min(1, 'Discount type name is required'),
  is_active: z.boolean(),
});

type DiscountTypeFormData = z.infer<typeof discountTypeSchema>;

const DiscountTypeSettingsPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const { data: discountTypes, isLoading: typesLoading, refetch } = useDiscountTypes(true);

  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<DiscountType | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  const createType = useCreateDiscountType();
  const updateType = useUpdateDiscountType();
  const deleteType = useDeleteDiscountType();

  const isLoading = shopLoading || typesLoading;

  const filteredTypes = (discountTypes ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountTypeFormData>({
    resolver: zodResolver(discountTypeSchema),
    defaultValues: { name: '', is_active: true },
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleAdd = () => {
    setEditingType(null);
    reset({ name: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (type: DiscountType) => {
    setEditingType(type);
    reset({ name: type.name, is_active: type.is_active });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    reset();
  };

  const onSubmit = async (data: DiscountTypeFormData) => {
    if (editingType) {
      await updateType.mutateAsync({ discountTypeId: editingType.id, updates: data });
    } else {
      await createType.mutateAsync({ name: data.name, is_active: data.is_active });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingTypeId) return;
    await deleteType.mutateAsync(deletingTypeId);
    setDeletingTypeId(null);
    handleCloseModal();
  };

  const isSaving = createType.isPending || updateType.isPending;

  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Discount Types" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage discount types</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Discount Types" backHref={`/shops/${currentShop?.id}/settings`} onRefresh={handleRefresh}>
      <CenteredLayout>
        <CardContainer
          showSearch
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search discount types..."
          onActionClick={handleAdd}
          noPadding
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !discountTypes || discountTypes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <h2>No Discount Types Yet</h2>
              <p>Add discount types to apply to your orders</p>
            </Div>
          ) : filteredTypes.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText color="medium"><h3>No discount types match your search</h3></IonText>
            </Div>
          ) : (
            <IonList>
              {filteredTypes.map((type) => (
                <IonItem key={type.id} button lines="full" onClick={() => handleEdit(type)}>
                  <IonLabel>
                    <h2>{type.name}</h2>
                  </IonLabel>
                  {type.is_system && <IonBadge color="primary" style={{ marginRight: '8px' }}>System</IonBadge>}
                  {!type.is_active && <IonBadge color="medium">Inactive</IonBadge>}
                </IonItem>
              ))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingType ? 'Edit Discount Type' : 'Add Discount Type'}
        showActionButton
        onActionClick={handleSubmit(onSubmit)}
        actionButtonDisabled={isSaving}
        actionButtonLoading={isSaving}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            control={control}
            name="name"
            label="Name"
            placeholder="e.g., Member Discount"
            error={errors.name}
            required
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <IonItem lines="none">
                <IonToggle
                  checked={field.value}
                  onIonChange={(e) => field.onChange(e.detail.checked)}
                  labelPlacement="start"
                >
                  Active
                </IonToggle>
              </IonItem>
            )}
          />

          {editingType && !editingType.is_system && (
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              type="button"
              onClick={() => setDeletingTypeId(editingType.id)}
              disabled={deleteType.isPending}
              style={{ marginTop: '16px' }}
            >
              Delete Discount Type
            </IonButton>
          )}
        </form>
      </BaseModal>

      <DeleteConfirmationAlert
        isOpen={!!deletingTypeId}
        onDismiss={() => setDeletingTypeId(null)}
        onConfirm={handleDelete}
        itemName={editingType?.name || ''}
        itemType="Discount Type"
      />
    </BasePage>
  );
};

export default DiscountTypeSettingsPage;
```

### Step 3: Delete DiscountTypeSettings.tsx

Delete `src/features/settings/components/DiscountTypeSettings.tsx`.

### Step 4: Check for TypeScript errors

Run: `npx tsc --noEmit`

Fix any errors before continuing.

### Step 5: Commit

```bash
git add src/features/settings/pages/DiscountTypeSettingsPage.tsx
git rm src/features/settings/components/DiscountTypeSettings.tsx
git commit -m "feat: redesign DiscountTypeSettingsPage with CardContainer + BaseModal pattern"
```

---

## Task 3: Rewrite VoidRefundSettingsPage

**Files:**
- Rewrite: `src/features/settings/pages/VoidRefundSettingsPage.tsx`
- Delete: `src/features/settings/components/VoidRefundReasonSettings.tsx`

### Step 1: Read the current files

Read `src/features/settings/pages/VoidRefundSettingsPage.tsx` and `src/features/settings/components/VoidRefundReasonSettings.tsx`.

### Step 2: Rewrite VoidRefundSettingsPage.tsx

Same pattern as DiscountTypeSettingsPage, but for VoidRefundReason. Key differences:
- Title: "Void & Refund Reasons"
- backHref: `/shops/${currentShop?.id}/settings`
- Hook: `useVoidRefundReasons(true)`, `useCreateVoidRefundReason`, `useUpdateVoidRefundReason`, `useDeleteVoidRefundReason`
- mutateAsync for create: `{ name: data.name }` — hook only accepts `{ name: string }`, `is_active` not supported on create
- mutateAsync for update: `{ reasonId: editingReason.id, updates: data }`
- mutateAsync for delete: `deletingReasonId`
- Type: `VoidRefundReason`
- Empty state text: "No Void/Refund Reasons Yet" / "Add reasons to document void and refund actions"
- Modal title: "Add Reason" / "Edit Reason"
- Delete button label: "Delete Reason"
- itemType for DeleteConfirmationAlert: "Void/Refund Reason"
- Search placeholder: "Search reasons..."

Check hook signatures in `src/hooks/useVoidRefundReasons.ts` before writing — verify parameter names for update (`reasonId`) and delete.

### Step 3: Delete VoidRefundReasonSettings.tsx

Delete `src/features/settings/components/VoidRefundReasonSettings.tsx`.

### Step 4: Check for TypeScript errors

Run: `npx tsc --noEmit`

Fix any errors before continuing.

### Step 5: Commit

```bash
git add src/features/settings/pages/VoidRefundSettingsPage.tsx
git rm src/features/settings/components/VoidRefundReasonSettings.tsx
git commit -m "feat: redesign VoidRefundSettingsPage with CardContainer + BaseModal pattern"
```

---

## Task 4: Clean Up Components Index

**Files:**
- Modify: `src/features/settings/components/index.ts`

### Step 1: Read the file

Read `src/features/settings/components/index.ts`.

### Step 2: Remove the three deleted exports

Remove the three export lines for `TaxSettings`, `DiscountTypeSettings`, and `VoidRefundReasonSettings`. If the file is now empty, delete it and check if it's imported anywhere.

Run: `grep -r "settings/components" src/` to verify no remaining imports of the deleted components.

### Step 3: Commit

```bash
git add src/features/settings/components/index.ts
git commit -m "chore: remove deleted settings component exports from index"
```

---

## Task 5: Manual Verification

Use Playwright to verify all three pages work correctly:

1. Navigate to Settings → Taxes
   - Confirm list loads with search bar and + button
   - Add a new tax (name + rate + active)
   - Edit an existing tax
   - Toggle active/inactive via modal
   - Delete a tax (confirm dialog appears)
   - Search filters the list

2. Navigate to Settings → Discount Types
   - Same flow as above
   - Confirm system items show "System" badge
   - Confirm delete button is hidden for system items

3. Navigate to Settings → Void & Refund Reasons
   - Same flow as Discount Types

---

## Notes

- `BaseModal` requires `showActionButton={true}` prop (not just `onActionClick`) to show the save button in the header
- `IonToggle` must use `Controller` from react-hook-form for proper form state integration
- Rate for taxes: display as percentage (×100), store as decimal (÷100)
- System items (`is_system: true`) for DiscountType and VoidRefundReason: hide the delete button in modal, but name is still editable
