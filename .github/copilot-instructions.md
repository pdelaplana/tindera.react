# Tindera - AI Agent Instructions

## Project Overview
Tindera is a **multi-tenant POS (Point of Sale)** system built with **Ionic React** and **Supabase**. It supports inventory management, product sales, and shop administration with role-based access control (owner/admin/staff).

**Tech Stack:**
- **Frontend:** Ionic React 8 + Vite + TypeScript + Styled Components
- **State:** TanStack Query v5 (server state) + React Context (UI/auth/shop/cart)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Mobile:** Capacitor 8 (iOS/Android deployment)
- **Forms:** React Hook Form + Zod validation
- **i18n:** i18next with lazy-loaded translations (`/public/locales/`)

## Architecture Patterns

### 1. Multi-Tenant Data Model
All data is scoped by `shop_id`. Users can belong to multiple shops via `shop_users` junction table with roles (`owner`, `admin`, `staff`). RLS policies enforce shop-level access control.

**Key Pattern:**
- Routes use `:shopId` parameter: `/shops/:shopId/products`
- `ShopContext` provides `currentShop` and `hasPermission()` helper
- Services always require `shopId` for data operations

### 2. Context Provider Hierarchy
**Order matters** - contexts nest with dependencies:
```tsx
<UIProvider>           // Toasts, modals (no dependencies)
  <AuthProvider>       // User auth, profile, shop IDs
    <ShopProvider>     // Current shop selection, permissions
      <CartProvider>   // POS cart (needs shop for currency)
```
See [src/contexts/index.tsx](src/contexts/index.tsx) - never reorder these.

### 3. Data Fetching Pattern
**Use TanStack Query hooks** (not direct service calls) for all server state:
- **Queries:** `useInventoryItems()`, `useProduct()`, `useProductCategories()`
- **Mutations:** `useCreateProduct()`, `useUpdateInventoryItem()`
- **Query Keys:** Hierarchical structure with filters (see `inventoryKeys`, `productKeys`)

**Example:**
```tsx
// ✅ Correct - Hook with auto-caching/refetching
const { data: products } = useProducts();

// ❌ Avoid - Direct service call bypasses cache
const products = await productService.getProducts();
```

### 4. Form Validation Pattern
All forms use **React Hook Form + Zod**:
```tsx
const schema = z.object({
  name: z.string().min(1, 'Required'),
  price: z.number().min(0, 'Must be positive'),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```
Use `Controller` from `react-hook-form` for Ionic inputs.

### 5. Component Library
**Use standardized components** from `src/components/`:
- **Pages:** `<BasePage>` (unified header, back button, loading/error states)
- **Layouts:** `<CenteredLayout>` (responsive max-width container)
- **Forms:** `TextField`, `SelectField`, `PriceField`, `NumberField`
- **Modals:** `<BaseModal>` (consistent styling, close handling)
- **UI:** `<CardContainer>`, `<SaveButton>`, `<DeleteConfirmationAlert>`

**See full usage guide:** [COMPONENT_STYLE_GUIDE.md](COMPONENT_STYLE_GUIDE.md)

### 6. Styling Approach
- **Global:** Ionic CSS + SCSS variables ([src/theme/variables.scss](src/theme/variables.scss))
- **Components:** Styled Components with theme tokens ([src/theme/designSystem.ts](src/theme/designSystem.ts))
- **Theme:** Dark purple brand (`#3D1B5B`), minimalist white backgrounds

**Access theme:**
```tsx
const Button = styled.button`
  background: ${props => props.theme.colors.brand.primary};
  padding: ${props => props.theme.spacing.md};
`;
```

## Development Workflows

### Common Commands
```bash
npm run dev                  # Start dev server (Vite)
npm run build                # TypeScript + Vite production build
npm run biome:fix            # Auto-fix linting/formatting (preferred)
npm run lint                 # ESLint only

# Supabase Database
npm run db:push              # Apply local migrations to remote
npm run db:pull              # Pull remote schema to local
npm run db:types             # Generate TypeScript types from DB schema
npm run db:reset             # Reset local Supabase (destructive)

# Testing
npm run test.unit            # Run Vitest
npm run test.e2e             # Run Cypress
```

### Path Aliases
Use `@/` for all imports (configured in [vite.config.ts](vite.config.ts)):
```tsx
import { useProduct } from '@/hooks/useProduct';
import { productService } from '@/services/product.service';
```

### Code Quality
- **Linting:** Biome (primary) + ESLint (legacy)
- **Formatting:** Tabs, 100 char line width (see [biome.json](biome.json))
- **TypeScript:** Strict mode enabled

## Key Integration Points

### Supabase Setup
- **Client:** [src/services/supabase.ts](src/services/supabase.ts) - PKCE flow for mobile
- **Env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env.local`)
- **Types:** Auto-generated from DB schema → [src/types/supabase.generated.ts](src/types/supabase.generated.ts)
- **Migrations:** [supabase/migrations/](supabase/migrations/) - sequential numbered files

### Service Layer Pattern
All Supabase operations wrapped in services:
- [auth.service.ts](src/services/auth.service.ts) - Auth operations, profile management
- [shop.service.ts](src/services/shop.service.ts) - Shop CRUD, user assignments
- [product.service.ts](src/services/product.service.ts) - Products, categories, modifiers
- [inventory.service.ts](src/services/inventory.service.ts) - Stock management, transactions

**Services return:** `{ data, error }` (Supabase-style), never throw.

### Image Upload Pattern
Use `storage.ts` helpers for Supabase Storage:
```tsx
import { uploadProductImage } from '@/services/storage';

const imageUrl = await uploadProductImage(shopId, file);
// Handles bucket creation, path generation, error handling
```
Buckets: `shop-images`, `product-images`, `inventory-images`

## Common Pitfalls

1. **Context Order:** Breaking provider hierarchy causes runtime errors
2. **Direct Service Calls:** Bypassing TanStack Query hooks breaks caching
3. **Missing shopId:** All data operations need current shop context
4. **RLS Policies:** DB operations fail if user lacks shop membership/role
5. **Type Generation:** Run `npm run db:types` after schema changes
6. **Component Imports:** Use barrel exports from `@/components/shared` not deep paths

## Adding New Features

### New Database Table
1. Create migration: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Add RLS policies (reference [20241220000001_initial_schema.sql](supabase/migrations/20241220000001_initial_schema.sql))
3. Run `npm run db:push` (remote) or `supabase db reset` (local)
4. Generate types: `npm run db:types`
5. Create service in `src/services/`
6. Create TanStack Query hooks in `src/hooks/`

### New Page/Route
1. Create page component in `src/pages/`
2. Use `<BasePage>` wrapper with appropriate props
3. Add route to [App.tsx](src/App.tsx) inside `<AuthGuard>` if protected
4. Add menu item to [SideMenu.tsx](src/components/SideMenu.tsx)
5. Use `:shopId` parameter in route path

### New Form Modal
1. Create Zod schema
2. Use `<BaseModal>` + `react-hook-form` + shared `FormFields`
3. Reference [ProductFormModal.tsx](src/pages/Products/components/ProductFormModal.tsx) for pattern
4. Use TanStack Query mutations for submit (`.isPending` for loading state)

## Project-Specific Conventions
- **Component files:** PascalCase with descriptive names (`ProductFormModal.tsx`)
- **Service files:** Kebab-case + `.service.ts` suffix
- **Hook files:** `use` prefix + PascalCase (`useProduct.ts`)
- **Types:** Export from [src/types/index.ts](src/types/index.ts), extend generated Supabase types
- **Error handling:** Use `useToastNotification()` hook for user-facing errors
- **Logging:** Use `logger` from [services/sentry.ts](src/services/sentry.ts) for error tracking
