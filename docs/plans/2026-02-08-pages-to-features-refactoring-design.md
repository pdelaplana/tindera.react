# Design: Pages → Features Refactoring

**Date:** 2026-02-08
**Status:** Approved

## Summary

Rename `src/pages/` to `src/features/` and convert all feature directory names from PascalCase to lowercase. This is a purely mechanical refactoring - no logic changes.

## Motivation

The current `src/pages/` directory is organized by business feature (Inventory, Products, Sales, etc.), not by individual routes. Each subdirectory contains multiple pages, feature-specific components, and an index barrel export. The name `pages/` misrepresents the actual architecture.

## What Changes

| Before | After |
|--------|-------|
| `src/pages/Auth/` | `src/features/auth/` |
| `src/pages/Home/` | `src/features/home/` |
| `src/pages/Inventory/` | `src/features/inventory/` |
| `src/pages/Order/` | `src/features/order/` |
| `src/pages/POS/` | `src/features/pos/` |
| `src/pages/Products/` | `src/features/products/` |
| `src/pages/Sales/` | `src/features/sales/` |
| `src/pages/Settings/` | `src/features/settings/` |
| `src/pages/Shop/` | `src/features/shop/` |

No config changes needed - both `tsconfig.json` and `vite.config.ts` use the generic `@/*` → `src/*` alias.

## Implementation

Run the migration script:

```bash
bash docs/architecture/pages-to-features-migration.sh
```

The script performs two phases:

**Phase 1:** `git mv src/pages src/features` + update all import statements
**Phase 2:** Rename each subdirectory PascalCase → lowercase using a temp directory (safe on case-insensitive filesystems) + update imports

After the script completes:

```bash
npx tsc --noEmit   # Verify TypeScript
npm run lint       # Verify linting
npm run dev        # Manual route testing
```

## Constraints

- Run on a feature branch
- Clean working tree required before running
- No functional changes - purely structural

## Out of Scope

- Inventory internal component reorganization (separate refactoring)
- Moving feature-specific hooks/types/services into feature directories
