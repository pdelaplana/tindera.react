# Settings Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert SettingsPage into a pure iOS-style navigation menu and consolidate Product Categories, Global Modifiers, and Inventory Categories under `features/settings`.

**Architecture:** SettingsPage becomes a grouped nav list with no inline content. Each setting area gets its own sub-page under `/shops/:shopId/settings/...`. Pages currently in `features/products` and `features/inventory` are moved to `features/settings/pages/` with only `backHref` and route references updated — no logic changes.

**Tech Stack:** React, Ionic React, TypeScript, React Router (v5), ionicons

---

## Context & Key Facts

- All pages use `BasePage` or `PageWithCollapsibleHeader` from `@/components/layouts`
- Section titles use `IonTitle`, nav rows use `IonItem button` with start icon + `chevronForwardOutline` end icon
- `useShop()` provides `currentShop` — use `currentShop?.id` for route construction
- The three existing inline components (`TaxSettings`, `DiscountTypeSettings`, `VoidRefundReasonSettings`) stay unchanged — they just get wrapped in a page shell
- `GlobalModifierGroupManagePage` has a hardcoded `history.replace(\`/shops/${shopId}/modifiers\`)` on delete — this must change to the new route
- SideMenu has a `modifiers` submenu item pointing to the old route — remove it (modifiers now live in settings)
- Tests: this codebase uses Vitest. Run `npx vitest run --reporter=verbose` to check

---

## Task 1: Create the three POS settings sub-pages

These are thin wrappers. No logic changes to the existing components.

**Files:**
- Create: `src/features/settings/pages/TaxSettingsPage.tsx`
- Create: `src/features/settings/pages/DiscountTypeSettingsPage.tsx`
- Create: `src/features/settings/pages/VoidRefundSettingsPage.tsx`

**Step 1: Create TaxSettingsPage**

```tsx
// src/features/settings/pages/TaxSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { TaxSettings } from '../components';

const TaxSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Taxes" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Tax Configuration" noPadding>
          <TaxSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default TaxSettingsPage;
```

**Step 2: Create DiscountTypeSettingsPage**

```tsx
// src/features/settings/pages/DiscountTypeSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { DiscountTypeSettings } from '../components';

const DiscountTypeSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Discount Types" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Discount Types" noPadding>
          <DiscountTypeSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default DiscountTypeSettingsPage;
```

**Step 3: Create VoidRefundSettingsPage**

```tsx
// src/features/settings/pages/VoidRefundSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { VoidRefundReasonSettings } from '../components';

const VoidRefundSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Void & Refund Reasons" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Void & Refund Reasons" noPadding>
          <VoidRefundReasonSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default VoidRefundSettingsPage;
```

**Step 4: Check for TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors in the new files.

**Step 5: Commit**

```bash
git add src/features/settings/pages/TaxSettingsPage.tsx \
        src/features/settings/pages/DiscountTypeSettingsPage.tsx \
        src/features/settings/pages/VoidRefundSettingsPage.tsx
git commit -m "feat: add POS settings sub-pages (Tax, DiscountType, VoidRefund)"
```

---

## Task 2: Move ProductCategoriesPage into settings

The file at `src/features/products/pages/mobile/CategoriesListPage.tsx` moves to `src/features/settings/pages/ProductCategoriesPage.tsx`. Only the `backHref` changes.

**Files:**
- Create: `src/features/settings/pages/ProductCategoriesPage.tsx`
- Modify: `src/features/products/pages/mobile/CategoriesListPage.tsx` (delete file after copying)

**Step 1: Copy to new location**

Copy the entire contents of `src/features/products/pages/mobile/CategoriesListPage.tsx` into `src/features/settings/pages/ProductCategoriesPage.tsx`.

Change the component name from `CategoriesListPage` to `ProductCategoriesPage`.

Change the import for `CategoryFormModal` — the component lives at `src/features/products/components/CategoryFormModal.tsx`. Update the relative import path accordingly:

```tsx
// OLD (in products folder):
import { CategoryFormModal } from '../../components';

// NEW (in settings/pages folder):
import { CategoryFormModal } from '@/features/products/components';
```

Also update the two `backHref` and `BasePage` references:

```tsx
// OLD:
<BasePage title="Categories" showMenu showProfile showLogout backHref="/products">
// NEW:
<BasePage title="Product Categories" backHref={`/shops/${currentShop?.id}/settings`}>
```

```tsx
// OLD:
<BasePage title="Categories" showMenu backHref={`/shops/${currentShop?.id}/products`}>
// NEW:
<BasePage title="Product Categories" backHref={`/shops/${currentShop?.id}/settings`}>
```

Export as default:
```tsx
export default ProductCategoriesPage;
```

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/features/settings/pages/ProductCategoriesPage.tsx
git commit -m "feat: add ProductCategoriesPage under settings"
```

---

## Task 3: Move GlobalModifiersPage into settings

**Files:**
- Create: `src/features/settings/pages/GlobalModifiersPage.tsx`

**Step 1: Copy to new location**

Copy the entire contents of `src/features/products/pages/mobile/GlobalModifiersListPage.tsx` into `src/features/settings/pages/GlobalModifiersPage.tsx`.

Change the component name from `ModifiersListPage` to `GlobalModifiersPage`.

Update the import path for `GlobalModifierGroupFormModal`:
```tsx
// OLD:
import { GlobalModifierGroupFormModal } from '../../components/globalModifiers/GlobalModifierGroupFormModal';

// NEW:
import { GlobalModifierGroupFormModal } from '@/features/products/components/globalModifiers/GlobalModifierGroupFormModal';
```

Update the `router.push` for navigating to manage page:
```tsx
// OLD:
router.push(`/shops/${currentShop?.id}/modifiers/${group.id}/manage`, 'forward');

// NEW:
router.push(`/shops/${currentShop?.id}/settings/products/modifiers/${group.id}/manage`, 'forward');
```

Add `backHref` to `BasePage`:
```tsx
// OLD:
<BasePage title="Modifiers" showMenu>

// NEW:
<BasePage title="Global Modifiers" backHref={`/shops/${currentShop?.id}/settings`}>
```

Also update the no-shop-selected fallback:
```tsx
// OLD:
<BasePage title="Modifiers" showMenu showProfile showLogout>

// NEW:
<BasePage title="Global Modifiers" backHref={`/shops/${currentShop?.id}/settings`}>
```

Export as default:
```tsx
export default GlobalModifiersPage;
```

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/features/settings/pages/GlobalModifiersPage.tsx
git commit -m "feat: add GlobalModifiersPage under settings"
```

---

## Task 4: Move GlobalModifierGroupManagePage into settings

**Files:**
- Create: `src/features/settings/pages/GlobalModifierGroupManagePage.tsx`

**Step 1: Copy to new location**

Copy `src/features/products/pages/mobile/GlobalModifierGroupManagePage.tsx` to `src/features/settings/pages/GlobalModifierGroupManagePage.tsx`.

Update all three product-relative imports to use `@/features/products/...`:
```tsx
// OLD:
import { GlobalModifierFormModal } from '../../components/globalModifiers/GlobalModifierFormModal';
import { GlobalModifierGroupFormModal } from '../../components/globalModifiers/GlobalModifierGroupFormModal';
import ModifiersList from '../../components/globalModifiers/ModifiersList';
import ModifierGroupActionButtons from '../../components/ModifierGroupActionButtons';

// NEW:
import { GlobalModifierFormModal } from '@/features/products/components/globalModifiers/GlobalModifierFormModal';
import { GlobalModifierGroupFormModal } from '@/features/products/components/globalModifiers/GlobalModifierGroupFormModal';
import ModifiersList from '@/features/products/components/globalModifiers/ModifiersList';
import ModifierGroupActionButtons from '@/features/products/components/ModifierGroupActionButtons';
```

Update the three route references (backHref and history.replace):
```tsx
// Loading state backHref — OLD:
<PageLoadingState backHref={`/shops/${shopId}/modifiers`} />
// NEW:
<PageLoadingState backHref={`/shops/${shopId}/settings/products/modifiers`} />

// Not found backHref — OLD:
<PageNotFoundState backHref={`/shops/${shopId}/modifiers`} title="Modifier Group Not Found" />
// NEW:
<PageNotFoundState backHref={`/shops/${shopId}/settings/products/modifiers`} title="Modifier Group Not Found" />

// PageWithCollapsibleHeader backHref — OLD:
<PageWithCollapsibleHeader ... backHref={`/shops/${shopId}/modifiers`} ...>
// NEW:
<PageWithCollapsibleHeader ... backHref={`/shops/${shopId}/settings/products/modifiers`} ...>

// history.replace after delete — OLD:
history.replace(`/shops/${shopId}/modifiers`);
// NEW:
history.replace(`/shops/${shopId}/settings/products/modifiers`);
```

Keep component name as `ModifierGroupManagePage`. Export as default.

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/features/settings/pages/GlobalModifierGroupManagePage.tsx
git commit -m "feat: add GlobalModifierGroupManagePage under settings"
```

---

## Task 5: Move InventoryCategoriesPage into settings

**Files:**
- Create: `src/features/settings/pages/InventoryCategoriesPage.tsx`

**Step 1: Copy to new location**

Copy `src/features/inventory/pages/mobile/InventoryCategoriesListPage.tsx` to `src/features/settings/pages/InventoryCategoriesPage.tsx`.

Change the component name from `InventoryCategoriesListPage` to `InventoryCategoriesPage`.

The page currently has no component-level imports from the inventory feature — all its imports use `@/` aliases already. No import path changes needed.

Update `backHref`:
```tsx
// OLD:
<BasePage
  title="Inventory Categories"
  backHref={`/shops/${currentShop?.id}/inventory`}
  onRefresh={handleRefresh}
>
// NEW:
<BasePage
  title="Inventory Categories"
  backHref={`/shops/${currentShop?.id}/settings`}
  onRefresh={handleRefresh}
>
```

Update the no-shop-selected fallback — change the `PageHeader` title to match and remove `showMenu`:
```tsx
// The IonPage/PageHeader fallback at line ~157 — just update the return JSX title if desired, no functional change needed.
```

Export as default:
```tsx
export default InventoryCategoriesPage;
```

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/features/settings/pages/InventoryCategoriesPage.tsx
git commit -m "feat: add InventoryCategoriesPage under settings"
```

---

## Task 6: Add Danger Zone to ShopFormPage

**Files:**
- Modify: `src/features/shop/pages/ShopFormPage.tsx`

**Step 1: Read ShopFormPage**

Read `src/features/shop/pages/ShopFormPage.tsx` to find where to insert the Danger Zone section and check what hooks are already imported.

**Step 2: Add Danger Zone**

Add these imports if not already present:
```tsx
import { IonButton, IonCard, IonCardContent, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { useDeleteShop } from '@/hooks/useShop';
```

Add state and handlers inside the component (alongside existing state):
```tsx
const history = useHistory();
const deleteShopMutation = useDeleteShop();
const [showDeleteAlert, setShowDeleteAlert] = useState(false);

const handleConfirmDelete = async () => {
  if (!currentShop) return;
  try {
    await deleteShopMutation.mutateAsync(currentShop.id);
    setShowDeleteAlert(false);
    history.push('/');
  } catch (error) {
    console.error('Failed to delete shop:', error);
  }
};
```

Add the Danger Zone card at the bottom of the page content (just before the closing tag of the content area):
```tsx
{/* Danger Zone */}
{currentShop && (
  <>
    <IonCard
      className="flat-card"
      style={{ marginTop: '16px', border: '1px solid var(--ion-color-danger)' }}
    >
      <IonCardContent>
        <IonList lines="none">
          <IonItem>
            <IonLabel>
              <h2>Delete Shop</h2>
              <p>Permanently delete this shop and all its data</p>
            </IonLabel>
            <IonButton
              color="danger"
              fill="solid"
              size="default"
              onClick={() => setShowDeleteAlert(true)}
            >
              <IonIcon slot="start" icon={trashOutline} />
              Delete
            </IonButton>
          </IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>

    <DeleteConfirmationAlert
      isOpen={showDeleteAlert}
      onDismiss={() => setShowDeleteAlert(false)}
      onConfirm={handleConfirmDelete}
      itemName={currentShop.name}
      itemType="Shop"
    />
  </>
)}
```

**Step 3: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 4: Commit**

```bash
git add src/features/shop/pages/ShopFormPage.tsx
git commit -m "feat: add Danger Zone (delete shop) to ShopFormPage"
```

---

## Task 7: Rewrite SettingsPage as pure nav menu

**Files:**
- Modify: `src/features/settings/pages/SettingsPage.tsx`

**Step 1: Replace SettingsPage content**

Replace the entire file with:

```tsx
// Settings Page - Navigation menu for all shop settings

import {
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
} from '@ionic/react';
import {
  arrowUndoOutline,
  cashOutline,
  chevronForwardOutline,
  cubeOutline,
  optionsOutline,
  percentOutline,
  pricetagOutline,
  storefrontOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useHistory } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import PageHeader from '@/components/shared/PageHeader';
import { useShop } from '@/hooks/useShop';

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { currentShop } = useShop();

  const shopId = currentShop?.id;

  const navigate = (path: string) => {
    history.push(path);
  };

  return (
    <IonPage>
      <PageHeader title="Settings" showLogout collapse collapseTitle="Settings" />

      <IonContent fullscreen className="ion-padding-top">
        <CenteredLayout className="ion-margin-top">
          {currentShop && (
            <>
              {/* Shop */}
              <IonTitle>Shop</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/shop`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={storefrontOutline} />
                      <IonLabel>
                        <h2>Edit Shop Details</h2>
                        <p>Update shop name, location, and other information</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* Products */}
              <IonTitle>Products</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/products/categories`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={pricetagOutline} />
                      <IonLabel>
                        <h2>Product Categories</h2>
                        <p>Organize products into categories</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/products/modifiers`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={optionsOutline} />
                      <IonLabel>
                        <h2>Global Modifiers</h2>
                        <p>Manage reusable modifier groups for products</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* Inventory */}
              <IonTitle>Inventory</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/inventory/categories`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={cubeOutline} />
                      <IonLabel>
                        <h2>Inventory Categories</h2>
                        <p>Organize inventory items into categories</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* POS Configuration */}
              <IonTitle>POS Configuration</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/taxes`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={cashOutline} />
                      <IonLabel>
                        <h2>Taxes</h2>
                        <p>Configure tax rates applied at checkout</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/discounts`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={percentOutline} />
                      <IonLabel>
                        <h2>Discount Types</h2>
                        <p>Manage discount types available at checkout</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/void-refund`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={arrowUndoOutline} />
                      <IonLabel>
                        <h2>Void & Refund Reasons</h2>
                        <p>Define reasons for voiding or refunding orders</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </CenteredLayout>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
```

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/features/settings/pages/SettingsPage.tsx
git commit -m "feat: rewrite SettingsPage as pure navigation menu"
```

---

## Task 8: Update settings index.ts exports

**Files:**
- Modify: `src/features/settings/index.ts`

**Step 1: Update exports**

Replace the file contents with:

```ts
export { default as DiscountTypeSettingsPage } from './pages/DiscountTypeSettingsPage';
export { default as GlobalModifierGroupManagePage } from './pages/GlobalModifierGroupManagePage';
export { default as GlobalModifiersPage } from './pages/GlobalModifiersPage';
export { default as InventoryCategoriesPage } from './pages/InventoryCategoriesPage';
export { default as ProductCategoriesPage } from './pages/ProductCategoriesPage';
export { default as SettingsPage } from './pages/SettingsPage';
export { default as TaxSettingsPage } from './pages/TaxSettingsPage';
export { default as VoidRefundSettingsPage } from './pages/VoidRefundSettingsPage';
```

**Step 2: Commit**

```bash
git add src/features/settings/index.ts
git commit -m "feat: update settings index with new page exports"
```

---

## Task 9: Update App.tsx — routes and imports

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update imports**

Remove `CategoriesListPage`, `ModifierGroupManagePage`, `ModifiersListPage` from the products import, and remove `InventoryCategoriesListPage` from the inventory import.

Add new imports from settings:
```tsx
import {
  DiscountTypeSettingsPage,
  GlobalModifierGroupManagePage,
  GlobalModifiersPage,
  InventoryCategoriesPage,
  ProductCategoriesPage,
  SettingsPage,
  TaxSettingsPage,
  VoidRefundSettingsPage,
} from '@/features/settings';
```

**Step 2: Remove old routes**

Remove these four `<Route>` blocks entirely:
```tsx
// REMOVE:
<Route exact path="/shops/:shopId/products/categories">...</Route>
<Route exact path="/shops/:shopId/modifiers/:id/manage">...</Route>
<Route exact path="/shops/:shopId/modifiers">...</Route>
<Route exact path="/shops/:shopId/inventory/categories">...</Route>
```

**Step 3: Add new settings routes**

In the Settings Routes section, after the existing `/shops/:shopId/settings/shop` route, add:

```tsx
{/* Settings — Products */}
<Route exact path="/shops/:shopId/settings/products/categories">
  <AuthGuard>
    <ProductCategoriesPage />
  </AuthGuard>
</Route>
{/* Modifier Group Manage - MUST come before list route */}
<Route exact path="/shops/:shopId/settings/products/modifiers/:id/manage">
  <AuthGuard>
    <GlobalModifierGroupManagePage />
  </AuthGuard>
</Route>
<Route exact path="/shops/:shopId/settings/products/modifiers">
  <AuthGuard>
    <GlobalModifiersPage />
  </AuthGuard>
</Route>

{/* Settings — Inventory */}
<Route exact path="/shops/:shopId/settings/inventory/categories">
  <AuthGuard>
    <InventoryCategoriesPage />
  </AuthGuard>
</Route>

{/* Settings — POS Configuration */}
<Route exact path="/shops/:shopId/settings/pos/taxes">
  <AuthGuard>
    <TaxSettingsPage />
  </AuthGuard>
</Route>
<Route exact path="/shops/:shopId/settings/pos/discounts">
  <AuthGuard>
    <DiscountTypeSettingsPage />
  </AuthGuard>
</Route>
<Route exact path="/shops/:shopId/settings/pos/void-refund">
  <AuthGuard>
    <VoidRefundSettingsPage />
  </AuthGuard>
</Route>
```

**Step 4: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. If there are import errors for removed exports, proceed to Task 10 first.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: update App.tsx routes for settings redesign"
```

---

## Task 10: Update products and inventory index.ts exports

**Files:**
- Modify: `src/features/products/index.ts`
- Modify: `src/features/inventory/index.ts`

**Step 1: Update products/index.ts**

Remove `CategoriesListPage`, `ModifierGroupManagePage`, `ModifiersListPage` exports. Keep `ProductManagePage`, `ProductSalesPage`, `ProductsListPage`:

```ts
// Products Pages - Export
export { default as ProductManagePage } from './pages/mobile/ProductManagePage';
export { default as ProductSalesPage } from './pages/mobile/ProductSalesPage';
export { default as ProductsListPage } from './pages/ProductsListPage';
```

**Step 2: Update inventory/index.ts**

Remove `InventoryCategoriesListPage` export. Keep everything else:

```ts
// Inventory Pages - Export
export { default as InventoryItemFormModal } from './components/items/modals/InventoryItemFormModal';
export { default as InventoryItemManagePage } from './pages/mobile/InventoryItemManagePage';
export { default as InventoryItemTransactionsPage } from './pages/mobile/InventoryItemTransactionsPage';
export { default as InventoryListPage } from './pages/InventoryListPage';
export { default as InventoryTransactionDetailsPage } from './pages/mobile/InventoryTransactionDetailsPage';
export { default as InventoryTransactionsPage } from './pages/mobile/InventoryTransactionsPage';
export { default as PackageSizesPage } from './pages/mobile/PackageSizesPage';
```

**Step 3: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 4: Commit**

```bash
git add src/features/products/index.ts src/features/inventory/index.ts
git commit -m "feat: remove moved pages from products and inventory exports"
```

---

## Task 11: Update SideMenu — remove modifiers submenu item

The `/modifiers` route no longer exists. The Products menu item currently has a submenu entry for "Modifiers" that points to the old route.

**Files:**
- Modify: `src/components/SideMenu.tsx`

**Step 1: Remove the modifiers submenu entry**

Find this block in `menuItems` (around line 86-97):
```tsx
submenu: [
  {
    title: t('navigation.catalog'),
    url: currentShop ? `/shops/${currentShop.id}/products` : '/products',
    icon: pricetagOutline,
  },
  {
    title: t('navigation.modifiers'),
    url: currentShop ? `/shops/${currentShop.id}/modifiers` : '/modifiers',
    icon: optionsOutline,
  },
],
```

Remove just the modifiers entry:
```tsx
submenu: [
  {
    title: t('navigation.catalog'),
    url: currentShop ? `/shops/${currentShop.id}/products` : '/products',
    icon: pricetagOutline,
  },
],
```

**Step 2: Check TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Commit**

```bash
git add src/components/SideMenu.tsx
git commit -m "feat: remove modifiers submenu from SideMenu (moved to settings)"
```

---

## Task 12: Delete the original source files

Now that pages have moved and all references are updated, delete the original files.

**Files:**
- Delete: `src/features/products/pages/mobile/CategoriesListPage.tsx`
- Delete: `src/features/products/pages/mobile/GlobalModifiersListPage.tsx`
- Delete: `src/features/products/pages/mobile/GlobalModifierGroupManagePage.tsx`
- Delete: `src/features/inventory/pages/mobile/InventoryCategoriesListPage.tsx`

**Step 1: Run TypeScript check first**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Confirm zero errors before deleting.

**Step 2: Delete files**

```bash
git rm src/features/products/pages/mobile/CategoriesListPage.tsx \
       src/features/products/pages/mobile/GlobalModifiersListPage.tsx \
       src/features/products/pages/mobile/GlobalModifierGroupManagePage.tsx \
       src/features/inventory/pages/mobile/InventoryCategoriesListPage.tsx
```

**Step 3: Run TypeScript again**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

**Step 4: Commit**

```bash
git commit -m "chore: delete original pages moved to settings feature"
```

---

## Task 13: Run tests and manual verification

**Step 1: Run tests**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: all passing (no tests reference the moved pages directly).

**Step 2: TypeScript final check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors.

**Step 3: Manual smoke test (Playwright or browser)**

Navigate to `/shops/:shopId/settings` and verify:
- All 7 nav items render with correct icons
- Tapping each item navigates to the correct sub-page
- Each sub-page has a working back button returning to Settings
- Edit Shop Details page shows Danger Zone at bottom
- Global Modifier Group manage page back button goes to `/settings/products/modifiers`

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: post-migration cleanup"
```
