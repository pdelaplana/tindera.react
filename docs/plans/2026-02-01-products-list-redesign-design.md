# Products List Page Redesign

## Overview

Redesign the Products List Page from a single-column list with navigation to a separate manage page, into a responsive master-detail split panel. Follows the same pattern as `SalesListPage`.

- **Desktop (>= tablet):** Side-by-side split pane. Left panel shows the product list, right panel shows inline-editable product details.
- **Mobile (< tablet):** Full-width product list. Tapping a product navigates to the restyled `ProductManagePage`.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Save behavior | Auto-save on blur/change (no Save button) |
| Stock status on list items | Skipped for now |
| Breakpoint | 768px (tablet) via `useIsTabletOrLarger()` |
| Add new product | Keep existing `ProductFormModal` |
| Detail sections | All: General Details, Modifiers, Add-ons, Ingredients |
| Layout pattern | Follow `SalesListPage` split pane pattern |
| Mobile detail | Restyle existing `ProductManagePage` with shared components |

## Layout Architecture

Follow the `SalesListPage` pattern using styled-components:

```
SplitPaneContainer (flex: row, 100% height)
+-- LeftPanel (fixed ~380px, border-right, overflow-y: auto)
|   +-- SearchBar
|   +-- CategoryPillScroller
|   +-- ProductList (scrollable)
|   +-- AddNewProductButton (sticky bottom)
|
+-- RightPanel (flex: 1, overflow-y: auto, padding)
    +-- ProductDetailPanel
        +-- Header (breadcrumb, delete button)
        +-- ProductImageSection (hero image, update button)
        +-- GeneralDetailsCard (name, category, price, active toggle)
        +-- ModifiersSection
        +-- AddonsSection
        +-- IngredientsSection
```

### Desktop Selection Flow

```
User clicks ProductListItem
  -> setSelectedProductId(product.id)
  -> selectedProduct derived from products array
  -> ProductDetailPanel re-renders with new product data
```

### Mobile Navigation Flow

```
User clicks ProductListItem
  -> history.push(`/shops/{shopId}/products/{id}/manage`)
  -> ProductManagePage renders (restyled)
```

## Left Panel - Product List

### Search Bar
- Styled rounded search input
- Placeholder: "Search products..."
- Debounced 300ms, filters via `useProducts({ search })`

### Category Filter Pills
- Reuse existing `CategoryPillScroller` component
- "All" selected by default (primary filled), others outlined
- Filters via `useProducts({ categoryId })`

### Product List Items
Each item displays:
- Thumbnail image (48px avatar, rounded)
- Product name (bold)
- Category name (smaller, primary/orange color)
- Price (right-aligned, primary/orange color)

Selection styling (desktop only):
- Background highlight when selected
- Border color changes to primary

### Add New Product Button
- Sticky at bottom of left panel
- Dashed border outline style
- Opens existing `ProductFormModal`

## Right Panel - Product Detail

### Header
- Breadcrumb: "Products > {Product Name}"
- Title: "Product Details"
- Delete button (red, icon + label)
- No Save Changes button (auto-save)

### Product Image Section
- Large hero image (~300px height, rounded corners, object-fit: cover)
- "Update Photo" button overlaid on bottom-right
- Adapted from existing `ImageUpload` component
- Auto-saves to Supabase storage on file select

### General Details Card
Card with info icon header containing:
- **Product Name**: text input, auto-saves on blur
- **Category**: select dropdown, auto-saves on change
- **Base Price**: currency input with `$` prefix, auto-saves on blur
- **Active on Menu**: toggle switch, auto-saves on toggle

All fields use `useUpdateProduct` mutation for auto-save.

### Modifiers Section
- Card header: sliders icon + "Modifiers" + "+ Add Group" button
- Each modifier group as a sub-card:
  - Group name (uppercase)
  - Selection rule badge ("Pick 1")
  - Options in 2-column grid with radio/checkbox indicators
- Tapping group opens existing `ProductModifierModal`
- "+ Add Group" opens existing `ProductModifierSelectModal`
- Reuse `ProductModifiersList` logic, restyled

### Add-ons Section
- Card header: icon + "Add-ons" + "+ Add Add-on" button
- List of add-ons with name and price
- Tapping opens existing `ProductAddonModal`
- Reuse `ProductAddonsList` logic, restyled

### Ingredients Section
- Card header: icon + "Ingredients" + "+ Add Ingredient" button
- List of ingredients with quantity and unit cost
- Tapping opens existing `ProductItemModal`
- Reuse `ProductItemsList` logic, restyled

### Empty State
- "Select a product to view details" centered message
- Shown when no product is selected

## Mobile Detail Page

Restyle existing `ProductManagePage` to match the new design:
- Replace `ProductSummary` + `ProductActionButtons` with hero image + General Details form + Active on Menu toggle
- Add auto-save behavior (same hooks as desktop)
- Remove "Sales/Manage" segment tabs
- Keep back button navigation
- Keep Modifiers, Addons, Ingredients sections (restyled)

## Shared Components (extracted to avoid duplication)

Components used by both desktop `ProductDetailPanel` and mobile `ProductManagePage`:

- `ProductDetailHeader` - breadcrumb, delete button
- `ProductGeneralDetailsCard` - name, category, price, active toggle with auto-save
- `ProductImageSection` - hero image with update photo button

## Auto-Save Behavior

- Each field saves independently on blur/change via `useUpdateProduct` mutation
- Image uploads immediately on file select to Supabase storage
- Inline save indicator: spinner while saving, checkmark on success, red text on failure
- On failure: field reverts to last saved state, toast notification shows error
- Text inputs debounced 500ms after blur

## Error Handling

- Delete: opens `DeleteConfirmationAlert`, on confirm uses `useDeleteProduct`
  - Desktop: clears selection, shows empty state
  - Mobile: navigates back to list
- Loading: `LoadingSpinner` in right panel during initial load and product switching
- List loading: existing spinner in left panel

## Permissions

- `hasPermission('staff')`: edit capability (fields editable)
- `hasPermission('admin')`: delete capability (delete button visible)
- Without edit permission: fields render as read-only (disabled)

## Files to Create/Modify

### New Files
- `src/pages/Products/components/ProductDetailPanel.tsx` - desktop right panel container
- `src/pages/Products/components/ProductDetailHeader.tsx` - breadcrumb + delete
- `src/pages/Products/components/ProductGeneralDetailsCard.tsx` - auto-save form
- `src/pages/Products/components/ProductImageSection.tsx` - hero image with upload
- `src/pages/Products/components/ProductListItem.tsx` - styled list item

### Modified Files
- `src/pages/Products/ProductsListPage.tsx` - complete rewrite with split pane
- `src/pages/Products/ProductManagePage.tsx` - restyle to use shared components
- `src/pages/Products/components/ProductModifiersList.tsx` - restyle to card layout
- `src/pages/Products/components/ProductAddonsList.tsx` - restyle to card layout
- `src/pages/Products/components/ProductItemsList.tsx` - restyle to card layout
- `src/pages/Products/components/index.ts` - export new components

### Unchanged Files
- All modal components (ProductFormModal, ProductModifierModal, ProductModifierSelectModal, ProductAddonModal, ProductItemModal)
- All hooks (useProducts, useProduct, useUpdateProduct, useDeleteProduct, etc.)
- App.tsx routing (existing routes sufficient)
