# Pages vs Features: Directory Naming Analysis

## Executive Summary

**Recommendation:** Rename `src/pages/` to `src/features/` ✅

**Rationale:** The current `pages/` directory is organized by business features (Inventory, Products, Sales), not by individual page routes. Each subdirectory contains multiple pages, components, and feature-specific logic - this is feature-based architecture, not page-based.

**Confidence Level:** High - This aligns with the actual structure and modern React best practices.

---

## Current Structure Analysis

### What We Have Now

```
src/
├── components/          # Shared/global components
├── contexts/           # React contexts
├── hooks/              # Shared hooks
├── pages/              # ❓ Misleading name - actually features
│   ├── Auth/
│   ├── Home/
│   ├── Inventory/      # Example feature
│   │   ├── InventoryListPage.tsx
│   │   ├── InventoryItemManagePage.tsx
│   │   ├── InventoryTransactionsPage.tsx
│   │   ├── InventoryTransactionDetailsPage.tsx
│   │   ├── InventoryCategoriesListPage.tsx
│   │   ├── PackageSizesPage.tsx
│   │   ├── components/
│   │   └── index.ts
│   ├── Order/
│   ├── POS/
│   ├── Products/       # Example feature
│   │   ├── ProductsListPage.tsx
│   │   ├── ProductManagePage.tsx
│   │   ├── CategoriesListPage.tsx
│   │   ├── GlobalModifiersListPage.tsx
│   │   ├── GlobalModifierGroupManagePage.tsx
│   │   ├── components/
│   │   └── index.ts
│   ├── Sales/          # Example feature
│   │   ├── SalesListPage.tsx
│   │   ├── components/
│   │   └── index.ts
│   ├── Settings/
│   └── Shop/
├── services/
├── theme/
├── types/
└── utils/
```

### Key Observations

1. **Multiple pages per directory** - Each directory contains 2-6 page components, not just one
2. **Feature-specific components** - Each has a `components/` subdirectory for feature-specific components
3. **Feature cohesion** - Related pages and components are grouped by business domain
4. **Vertical slicing** - Each directory is a vertical slice of functionality (feature module)

### What "pages/" Implies vs Reality

| Implication of "pages/" | Reality |
|------------------------|---------|
| One page per directory | ❌ Multiple pages per directory (2-6 pages each) |
| Route-based organization | ❌ Feature/domain-based organization |
| Flat structure of pages | ❌ Hierarchical feature modules |
| Pages only, no components | ❌ Pages + components + logic |
| Just view layer | ❌ Complete feature slices |

---

## Option Analysis

### Option 1: Rename to `features/` ⭐ Recommended

```
src/
├── components/          # Shared components (cross-feature)
├── contexts/
├── hooks/              # Shared hooks (cross-feature)
├── features/           # ✅ Feature modules
│   ├── auth/           # Lowercase for consistency
│   ├── home/
│   ├── inventory/
│   │   ├── pages/      # After reorganization
│   │   ├── components/
│   │   ├── hooks/      # Feature-specific hooks (optional)
│   │   ├── types/      # Feature-specific types (optional)
│   │   └── index.ts
│   ├── order/
│   ├── pos/
│   ├── products/
│   ├── sales/
│   ├── settings/
│   └── shop/
├── services/
├── theme/
├── types/              # Shared types
└── utils/
```

**Pros:**
- ✅ Accurately describes the structure (feature modules)
- ✅ Aligns with modern React architecture patterns
- ✅ Clear that these are vertical slices of functionality
- ✅ Easier to explain to new developers
- ✅ Supports feature-driven development
- ✅ Scales well as app grows
- ✅ Makes feature boundaries explicit
- ✅ Matches terminology used in discussions ("inventory feature")

**Cons:**
- ⚠️ Requires refactoring import paths across the codebase
- ⚠️ Breaking change for existing code
- ⚠️ Need to update build/config files if they reference pages/

**Migration Effort:** Medium (~3-5 hours)

---

### Option 2: Keep `pages/` (Status Quo)

**Pros:**
- ✅ No refactoring needed
- ✅ Familiar to team
- ✅ Common convention in some frameworks (Next.js)

**Cons:**
- ❌ Misleading name (these aren't just pages)
- ❌ Doesn't match actual architecture
- ❌ Confusing for new developers
- ❌ Perpetuates misunderstanding of structure
- ❌ Not aligned with feature-driven development

**Recommendation:** Not recommended - name should match reality

---

### Option 3: Rename to `modules/`

```
src/
├── modules/            # Feature modules
│   ├── inventory/
│   ├── products/
│   └── sales/
```

**Pros:**
- ✅ Describes modular architecture
- ✅ Common in Angular and some React apps
- ✅ Clear separation of concerns

**Cons:**
- ⚠️ "Modules" is more technical/architectural than "features"
- ⚠️ Less clear connection to business domains
- ⚠️ Can be confused with npm modules or ES modules

**Recommendation:** Good alternative, but `features/` is more business-oriented

---

### Option 4: Rename to `domains/`

```
src/
├── domains/            # Business domains
│   ├── inventory/
│   ├── products/
│   └── sales/
```

**Pros:**
- ✅ Clear business domain focus
- ✅ Aligns with Domain-Driven Design (DDD)
- ✅ Strong semantic meaning

**Cons:**
- ⚠️ "Domain" can imply DDD complexity
- ⚠️ Less common in React ecosystem
- ⚠️ Might be too formal for some teams

**Recommendation:** Good for DDD-focused teams, but `features/` is more accessible

---

## Detailed Recommendation: `features/`

### Why "features" is the Best Choice

1. **Semantic Accuracy**
   - Each directory IS a feature (inventory management, product catalog, sales tracking)
   - Contains everything needed for that feature (pages, components, logic)
   - Name matches what developers already call them

2. **Industry Standard**
   - Widely used in React community
   - Documented in official React patterns
   - Used by major React applications (Redux patterns, React Router examples)

3. **Developer Experience**
   - New developers immediately understand structure
   - Clear where to add new feature code
   - Obvious feature boundaries

4. **Scalability**
   - Easy to extract features to micro-frontends
   - Can add feature-specific configuration
   - Supports independent feature development

5. **Alignment with Discussions**
   - Team already uses "feature" terminology
   - Architecture docs reference features
   - Matches business language

### Proposed Structure with Features

```
src/
├── features/
│   ├── inventory/                  # Inventory Management Feature
│   │   ├── pages/                  # Route components
│   │   │   ├── InventoryListPage.tsx
│   │   │   ├── InventoryItemManagePage.tsx
│   │   │   ├── InventoryTransactionsPage.tsx
│   │   │   ├── InventoryTransactionDetailsPage.tsx
│   │   │   ├── InventoryCategoriesListPage.tsx
│   │   │   └── PackageSizesPage.tsx
│   │   ├── components/             # Feature components (after reorganization)
│   │   │   ├── items/
│   │   │   ├── transactions/
│   │   │   ├── package-sizes/
│   │   │   └── categories/
│   │   ├── hooks/                  # Feature-specific hooks (optional)
│   │   │   ├── useInventoryItems.ts
│   │   │   └── useInventoryTransactions.ts
│   │   ├── types/                  # Feature-specific types (optional)
│   │   │   └── inventory.types.ts
│   │   ├── utils/                  # Feature-specific utilities (optional)
│   │   └── index.ts                # Public API
│   │
│   ├── products/                   # Product Catalog Feature
│   │   ├── pages/
│   │   ├── components/
│   │   └── index.ts
│   │
│   └── sales/                      # Sales Feature
│       ├── pages/
│       ├── components/
│       └── index.ts
│
├── components/                     # Shared components (cross-feature)
├── hooks/                          # Shared hooks (cross-feature)
├── types/                          # Shared types
└── utils/                          # Shared utilities
```

### Enhanced Structure (Optional Future)

As features grow, you can add more subdirectories:

```
src/features/inventory/
├── pages/                          # Route components
├── components/                     # UI components
├── hooks/                          # Feature hooks
├── services/                       # API calls specific to inventory
├── types/                          # TypeScript types
├── utils/                          # Helper functions
├── constants/                      # Feature constants
├── __tests__/                      # Feature tests
└── index.ts                        # Public exports
```

---

## Migration Strategy

### Phase 1: Rename Directory (5 minutes)
```bash
git mv src/pages src/features
```

### Phase 2: Update Import Paths (2-4 hours)

**Find all imports:**
```bash
grep -r "from.*pages/" src/
grep -r "from.*@/pages" src/
```

**Replace pattern:**
```bash
# Example: Update all imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '@/pages/|from '@/features/|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '../pages/|from '../features/|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '../../pages/|from '../../features/|g"
```

### Phase 3: Update Path Aliases (5 minutes)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/features/*": ["src/features/*"],
      // Remove or update:
      // "@/pages/*": ["src/pages/*"]
    }
  }
}
```

**vite.config.ts / webpack.config.js:**
```typescript
resolve: {
  alias: {
    '@/features': path.resolve(__dirname, './src/features'),
    // Remove or update:
    // '@/pages': path.resolve(__dirname, './src/pages'),
  }
}
```

### Phase 4: Update Route Configurations (30 minutes)

Update any route configuration files that import page components:

```typescript
// Before
import { InventoryListPage } from '@/pages/Inventory';

// After
import { InventoryListPage } from '@/features/inventory';
```

### Phase 5: Update Documentation (15 minutes)

- Update README
- Update architecture docs
- Update contribution guidelines
- Update onboarding documentation

### Phase 6: Testing (1-2 hours)

- [ ] TypeScript compilation succeeds
- [ ] All routes load correctly
- [ ] No import errors in console
- [ ] All pages render
- [ ] All tests pass
- [ ] E2E tests pass (if applicable)

### Phase 7: Review & Merge (30 minutes)

- Code review
- Team approval
- Merge to main

**Total Estimated Time:** 4-6 hours

---

## Migration Script

```bash
#!/bin/bash
# Rename pages to features migration script

echo "Starting migration from pages/ to features/..."

# Phase 1: Rename directory
git mv src/pages src/features

# Phase 2: Update imports in TypeScript files
echo "Updating imports..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|from '@/pages/|from '@/features/|g" {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|from '../pages/|from '../features/|g" {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|from '../../pages/|from '../../features/|g" {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|from '../../../pages/|from '../../../features/|g" {} +

# Phase 3: Update path alias in tsconfig.json
echo "Don't forget to manually update:"
echo "  1. tsconfig.json (paths)"
echo "  2. vite.config.ts or webpack.config.js (resolve.alias)"
echo "  3. Any route configuration files"
echo "  4. Documentation"

echo "Migration complete! Please review changes and run tests."
```

---

## Impact Analysis

### Files Affected

```bash
# Count files that import from pages/
grep -r "from.*pages/" src/ | wc -l
grep -r "from.*@/pages" src/ | wc -l
```

Estimated: 50-100 import statements to update

### Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Broken imports | Medium | Automated find-replace, TypeScript compiler will catch |
| Missed configurations | Low | Checklist of config files to update |
| Route breakage | Low | Routes reference variables, not paths |
| Test failures | Low | Tests import components, which remain same |
| Merge conflicts | Medium | Coordinate with team, do during low-activity period |

**Overall Risk:** Low-Medium (manageable with proper testing)

---

## Naming Convention Decisions

### Should feature names be lowercase?

**Current:** `src/pages/Inventory/` (PascalCase)

**Options:**
1. `src/features/inventory/` (lowercase) ⭐ Recommended
2. `src/features/Inventory/` (PascalCase)

**Recommendation:** Use **lowercase** (option 1)

**Reasons:**
- ✅ Standard for directory names in JavaScript/TypeScript
- ✅ Consistent with npm packages, node_modules
- ✅ Matches common React conventions
- ✅ Avoids case-sensitivity issues across operating systems
- ✅ More flexible (can include hyphens: `pos-terminal/`)

**Exception:** Component files remain PascalCase (e.g., `InventoryListPage.tsx`)

### Directory Structure Standard

```
✅ Recommended:
src/features/inventory/pages/InventoryListPage.tsx

❌ Not recommended:
src/features/Inventory/Pages/InventoryListPage.tsx
```

---

## Additional Considerations

### Combining with Inventory Reorganization

If you proceed with both refactorings, recommended order:

**Option A: Pages → Features First (Recommended)**
1. Rename `pages/` to `features/`
2. Update all imports
3. Test and merge
4. Then reorganize inventory components

**Pros:**
- Smaller changes per PR
- Easier to review
- Less risky

**Option B: Do Both Together**
1. Rename `pages/` to `features/`
2. Reorganize inventory components
3. Update all imports for both changes

**Pros:**
- One-time disruption
- Faster overall

**Recommendation:** Option A (sequential) - safer and easier to rollback

---

## Questions to Answer

### 1. Should we move feature-specific hooks to features/?

**Current:**
```
src/hooks/useInventory.ts
src/hooks/useProducts.ts
```

**Proposed:**
```
src/features/inventory/hooks/useInventory.ts
src/features/products/hooks/useProducts.ts
```

**Recommendation:** Yes, eventually - but as a separate refactoring

---

### 2. Should we move feature-specific types to features/?

**Current:**
```
src/types/inventory.ts
src/types/products.ts
```

**Proposed:**
```
src/features/inventory/types/inventory.ts
src/features/products/types/products.ts
```

**Recommendation:** Yes, eventually - but as a separate refactoring

---

### 3. Should features have their own services/?

**Current:**
```
src/services/inventoryService.ts
src/services/productsService.ts
```

**Proposed:**
```
src/features/inventory/services/inventoryService.ts
src/features/products/services/productsService.ts
```

**Recommendation:** Yes, if services are feature-specific

---

## Final Recommendation

**Proceed with renaming `pages/` to `features/`**

### Immediate Action
1. ✅ Rename `src/pages/` to `src/features/`
2. ✅ Use lowercase for feature directory names
3. ✅ Update import paths
4. ✅ Update configuration files
5. ✅ Test thoroughly

### Future Actions (Separate PRs)
1. Move feature-specific hooks into features/
2. Move feature-specific types into features/
3. Move feature-specific services into features/
4. Reorganize inventory components (as proposed)

### Timeline
- **Immediate:** Rename pages → features (1 sprint)
- **Next:** Reorganize inventory components (1 sprint)
- **Future:** Move hooks/types/services into features (as needed)

---

## Summary

| Aspect | Current | Recommended | Reason |
|--------|---------|-------------|--------|
| **Directory name** | `pages/` | `features/` | Accurately describes structure |
| **Subdirectory case** | PascalCase | lowercase | Standard convention |
| **Structure** | Flat with components/ | After reorg: structured | Better organization |
| **Scope** | Just rename | Rename + document | Clear communication |
| **Timing** | N/A | Before inventory reorg | Cleaner separation |

**Bottom Line:** Rename to `features/` - it's the right name for what you have.
