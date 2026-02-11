# Settings Page Redesign — Design Document

**Date:** 2026-02-12
**Status:** Approved

## Overview

Convert the Settings page from an inline-content page into a pure navigation menu (iOS Settings-style). Consolidate Product Categories, Global Modifiers, and Inventory Categories — currently scattered across `features/products` and `features/inventory` — under `features/settings`. Extract the existing inline settings components (Tax, Discounts, Void/Refund) into dedicated sub-pages.

## Goals

- Single entry point for all shop configuration
- Consistent sub-page pattern throughout Settings
- No new business logic — structural reorganization only

---

## Settings Menu Structure

```
Settings
─────────────────────────────
SHOP
  storefrontOutline    Edit Shop Details    >

PRODUCTS
  pricetagOutline      Product Categories   >
  optionsOutline       Global Modifiers     >

INVENTORY
  cubeOutline          Inventory Categories >

POS CONFIGURATION
  cashOutline          Taxes                >
  percentOutline       Discount Types       >
  arrowUndoOutline     Void & Refund Reasons >
─────────────────────────────
```

- Each row: `IonItem` with `button`, start `IonIcon`, `IonLabel` (title + subtitle), `chevronForwardOutline` end icon
- Section titles use `IonTitle` matching existing pattern
- Danger Zone (Delete Shop) moves off this page — lives at the bottom of Edit Shop Details

---

## File Structure

```
features/settings/
  pages/
    SettingsPage.tsx                   ← rewritten as pure nav menu
    TaxSettingsPage.tsx                ← NEW: wraps TaxSettings component
    DiscountTypeSettingsPage.tsx       ← NEW: wraps DiscountTypeSettings component
    VoidRefundSettingsPage.tsx         ← NEW: wraps VoidRefundReasonSettings component
    ProductCategoriesPage.tsx          ← MOVED from features/products/pages/mobile/CategoriesListPage.tsx
    GlobalModifiersPage.tsx            ← MOVED from features/products/pages/mobile/GlobalModifiersListPage.tsx
    GlobalModifierGroupManagePage.tsx  ← MOVED from features/products/pages/mobile/GlobalModifierGroupManagePage.tsx
    InventoryCategoriesPage.tsx        ← MOVED from features/inventory/pages/mobile/InventoryCategoriesListPage.tsx
  components/
    DiscountTypeSettings.tsx           ← unchanged
    TaxSettings.tsx                    ← unchanged
    VoidRefundReasonSettings.tsx       ← unchanged
    index.ts                           ← unchanged
  index.ts                             ← update exports
```

**Shop edit page** — `features/shop/ShopFormPage.tsx` gains the Danger Zone section (delete shop logic) at its bottom.

---

## Route Changes

### Remove
```
/shops/:shopId/products/categories
/shops/:shopId/modifiers
/shops/:shopId/modifiers/:id/manage
/shops/:shopId/inventory/categories
```

### Keep
```
/shops/:shopId/settings              ← SettingsPage (nav menu)
/shops/:shopId/settings/shop         ← ShopFormPage + Danger Zone
```

### Add
```
/shops/:shopId/settings/products/categories
/shops/:shopId/settings/products/modifiers
/shops/:shopId/settings/products/modifiers/:id/manage
/shops/:shopId/settings/inventory/categories
/shops/:shopId/settings/pos/taxes
/shops/:shopId/settings/pos/discounts
/shops/:shopId/settings/pos/void-refund
```

---

## Sub-page Patterns

### Wrap pattern (Tax, Discounts, Void/Refund)
Existing inline components wrapped in `BasePage` + `CenteredLayout` + `CardContainer`. No logic changes.

```tsx
<BasePage title="Taxes" backHref={`/shops/${shopId}/settings`}>
  <CenteredLayout>
    <CardContainer title="Tax Configuration" noPadding>
      <TaxSettings />
    </CardContainer>
  </CenteredLayout>
</BasePage>
```

### Moved pages (ProductCategories, GlobalModifiers, InventoryCategories)
Only `backHref` and internal route references change:

| Page | Old backHref | New backHref |
|------|-------------|-------------|
| ProductCategoriesPage | `/shops/:shopId/products` | `/shops/:shopId/settings` |
| GlobalModifiersPage | (none) | `/shops/:shopId/settings` |
| GlobalModifierGroupManagePage | `/shops/:shopId/modifiers` | `/shops/:shopId/settings/products/modifiers` |
| InventoryCategoriesPage | `/shops/:shopId/inventory` | `/shops/:shopId/settings` |

### Danger Zone relocation
Move delete shop `IonCard` and `DeleteConfirmationAlert` + `useDeleteShop` logic from `SettingsPage.tsx` into the bottom of `ShopFormPage.tsx`.

---

## Implementation Tasks

1. **Rewrite SettingsPage** as pure nav menu with grouped `IonItem` rows
2. **Create TaxSettingsPage** wrapping `TaxSettings` component
3. **Create DiscountTypeSettingsPage** wrapping `DiscountTypeSettings` component
4. **Create VoidRefundSettingsPage** wrapping `VoidRefundReasonSettings` component
5. **Move + update ProductCategoriesPage** (from features/products)
6. **Move + update GlobalModifiersPage** (from features/products)
7. **Move + update GlobalModifierGroupManagePage** (from features/products)
8. **Move + update InventoryCategoriesPage** (from features/inventory)
9. **Add Danger Zone to ShopFormPage**
10. **Update App.tsx** — remove old routes, add new settings routes, update imports
11. **Update index.ts exports** for settings, products, and inventory features
12. **Update SideMenu** — any nav links pointing to old routes
