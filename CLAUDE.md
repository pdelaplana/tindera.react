# Tindera React — CLAUDE.md

## Project Overview

Tindera is a **mobile-web POS and shop management application** built with React 19 + Ionic 8 + Supabase. It targets mobile browsers and can be deployed natively via Capacitor.

# Project Rules

## Workflow Integration
- We use **Gemini Conductor** for planning.
- Always check `conductor/tracks/` for the active `plan.md` before starting work.
- Mark tasks as [x] in the `plan.md` after successful implementation and testing.

## Coding Standards
- Use TDD: Create a test in Vitest before implementing logic.
- Deployment: Never push to `main` without running `npm run lint`.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19, Ionic React 8 |
| Routing | React Router v5 (via `@ionic/react-router`) |
| Backend | Supabase (PostgreSQL, Realtime, Edge Functions) |
| State | React Context (auth/cart/shop/ui) + TanStack Query v5 |
| Styling | Styled Components 6 + SCSS + Ionic CSS variables |
| Forms | React Hook Form 7 + Zod 4 |
| i18n | i18next + react-i18next |
| Build | Vite 5 + TypeScript 5 (strict) |
| Formatter | **Biome** (primary) |
| Linter | ESLint + Biome |
| Unit Tests | Vitest + Testing Library |
| E2E Tests | Cypress 13 |
| Error Tracking | Sentry |
| Native | Capacitor 8 |

## Key Commands

```bash
npm run dev              # Start dev server
npm run build            # Type-check + build
npm run test.unit        # Run Vitest unit tests
npm run test.e2e         # Run Cypress e2e tests
npm run lint             # Run ESLint
npm run biome:check      # Check with Biome
npm run biome:fix        # Auto-fix with Biome
npm run biome:format     # Format with Biome
npm run db:types         # Regenerate Supabase TypeScript types
```

## Architecture

### Directory Structure

```
src/
├── components/        # Shared/layout components (AuthGuard, SideMenu, ui/, shared/)
├── contexts/          # React Context providers (Auth, Cart, Shop, UI)
├── features/          # Domain-organized pages and components
│   ├── auth/
│   ├── inventory/
│   ├── pos/           # Point of Sale
│   ├── products/
│   ├── sales/
│   ├── settings/
│   └── shop/
├── hooks/             # Custom hooks (business logic + TanStack Query)
├── services/          # Supabase API calls (one file per domain)
├── theme/             # Design tokens, Styled Components theme, SCSS
├── types/             # TypeScript types, enums, auto-generated Supabase types
└── utils/             # Pure utility functions
```

### Key Patterns

- **Feature-based architecture** — code lives in `features/<domain>/components/` or `features/<domain>/pages/`
- **Service layer** — all Supabase calls go in `services/<domain>.service.ts`; hooks call services
- **Custom hooks** — business logic and TanStack Query queries/mutations live in `hooks/use<Domain>.ts`
- **Context + Hooks** — global state via Context; accessed through custom hooks (`useAuth`, `useCart`, `useShop`)
- **Provider order** — `UIProvider → AuthProvider → ShopProvider → CartProvider` (respect dependencies)
- **Path alias** — use `@/` for `src/` in all imports

### Styling Conventions

- Use **Styled Components** for component-scoped styles
- Use **Ionic CSS variables** for theming (defined in `theme/global.scss`)
- Use design tokens from `theme/designSystem.ts` — do not hardcode colors or spacing
- Global styles in `theme/global.scss`, SCSS variables in `theme/variables.scss`
- Use **IonIcons** 

### TypeScript

- **Strict mode enabled** — no `any`, no implicit types
- Auto-generated Supabase types live in `src/types/supabase.generated.ts` — do not edit manually, run `npm run db:types` to regenerate
- Business types in `src/types/index.ts` and `src/types/enums.ts`

## Testing Requirements

After any code change:
1. Run `npm run biome:check` and fix all issues
2. Run `npm run lint` and fix all issues
3. Run `npm run test.unit` — all tests must pass
4. For UI changes, verify with Playwright or Cypress manually

Unit tests go in `__tests__/` directories co-located with the feature or in the same directory as the file being tested.

## Code Quality Rules

- Biome is the **primary formatter** — do not use Prettier
- Line width: 100 characters (enforced by Biome)
- Always use `@/` path aliases, never relative paths that go up more than one level
- Do not add `console.log` to production code; use Sentry for error tracking
- Forms must use React Hook Form + Zod for validation

## Supabase Notes

- Client initialized in `src/services/supabase.ts`
- Edge Functions deployed via `npm run functions:deploy`
- Realtime subscriptions used in several features — be careful about cleanup in `useEffect`
- Never expose Supabase service role key on the client side

## Mobile / Ionic Notes

- This is a **mobile-first** app — test all UI changes at mobile viewport sizes
- Use Ionic components for layout (IonPage, IonHeader, IonContent, IonFooter) to ensure proper safe-area handling
- Haptics and status bar are controlled via Capacitor plugins
