# Store Team Management — Design Document

**Date:** 2026-02-16
**Route:** `/shops/:shopId/settings/team`
**Feature:** Add and manage additional users (store team) for a shop

## Overview

Owners can create additional users for their store (managers and staff), set their initial passwords, reset passwords, change roles, and remove them. Team members can belong to more than one store. This is an owner-only feature — managers and staff cannot access team management.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| User creation method | Supabase Edge Function (Admin API) | Admin key never exposed to client; cleanest way to create users on behalf of someone else |
| Password reset | Edge Function (`admin.updateUserById`) | Same boundary; owner sets temp password, user can change later |
| Roles | `owner`, `manager`, `staff` | Three-tier; owner = full access; manager/staff = POS + products + inventory + sales only |
| Remove user | Delete `shop_users` row only | User may belong to other shops; auth user is not deleted |
| UI placement | Settings page → "Team" section | Consistent with existing settings pattern |
| Access control | Owner-only (UI + route guard + Edge Function enforcement) | Defence in depth |

## Data Layer

### DB Migration

Update the `shop_users` role check constraint from `('owner', 'admin', 'staff')` to `('owner', 'manager', 'staff')`:

```sql
ALTER TABLE shop_users DROP CONSTRAINT IF EXISTS shop_users_role_check;
ALTER TABLE shop_users ADD CONSTRAINT shop_users_role_check
  CHECK (role IN ('owner', 'manager', 'staff'));
```

Migration file: `supabase/migrations/20260216000001_update_shop_users_role_constraint.sql`

### Edge Function: `manage-shop-user`

Located at `supabase/functions/manage-shop-user/index.ts`.

**Actions:**

| action | Payload | Behaviour |
|---|---|---|
| `create` | `{ shopId, email, displayName, password, role }` | Creates auth user, inserts `user_profiles`, inserts `shop_users` |
| `reset-password` | `{ shopId, userId, password }` | Calls `admin.updateUserById(userId, { password })` |
| `remove` | `{ shopId, userId }` | Deletes `shop_users` row |

**Security:** Before any action, the function verifies that `auth.uid()` has `role = 'owner'` in `shop_users` for the given `shopId`. Returns `403` otherwise.

### Service Layer (`shopService`)

Two new methods added to `src/services/shop.service.ts`:

- `createTeamMember(shopId, { email, displayName, password, role })` — calls the Edge Function `create` action
- `resetTeamMemberPassword(shopId, userId, password)` — calls the Edge Function `reset-password` action

Existing methods reused as-is:
- `getShopUsers(shopId)` — list team
- `removeUserFromShop(shopId, userId)` — remove member
- `updateUserRole(shopId, userId, role)` — change role

## UI Components

### Settings Page (`SettingsPage.tsx`)

A new "Team" section is added above "Danger Zone". It is conditionally rendered only when the current user's role for the active shop is `owner`.

```
[Team]
  Store Team  >  "Add and manage team members"
```

Navigates to `/shops/:shopId/settings/team`.

### Store Team Page (`StoreTeamPage.tsx`)

Path: `src/features/settings/pages/StoreTeamPage.tsx`

- Follows the same layout pattern as `TaxSettingsPage`, `DiscountTypeSettingsPage`, etc.
- Lists all `shop_users` for the current shop via `getShopUsers`
- Each row shows: avatar initial, display name, email, role badge
- Owner row: read-only, no actions
- Non-owner rows: context menu (or `IonItemSliding`) with **Edit Role**, **Reset Password**, **Remove**
- FAB button (bottom right): "Add Member" → opens Add modal

### Add / Edit Member Modal

Single `IonModal` used for both add and edit:

| Field | Add | Edit |
|---|---|---|
| Display Name | editable | editable |
| Email | editable | disabled |
| Role | `IonSelect`: Manager / Staff | `IonSelect`: Manager / Staff |
| Temporary Password | shown | hidden |

On save (add): calls `createTeamMember`.
On save (edit): calls `updateUserRole` (only role changes on edit).

### Reset Password Modal

Separate `IonModal`:
- New Password field
- Confirm Password field
- Save button (disabled until both fields match and are non-empty)

On save: calls `resetTeamMemberPassword`.

## Routing

New route added to `App.tsx`:

```tsx
<Route exact path="/shops/:shopId/settings/team">
  <OwnerOnlyRoute>
    <StoreTeamPage />
  </OwnerOnlyRoute>
</Route>
```

`OwnerOnlyRoute` — a wrapper component that checks the current user's role for the active shop. If role is not `owner`, redirects to `/shops/:shopId`.

## Access Control Summary

| Role | Settings visible | Team section visible | Team route accessible |
|---|---|---|---|
| owner | yes | yes | yes |
| manager | no | no | redirected |
| staff | no | no | redirected |

## Files Changed / Created

| File | Action |
|---|---|
| `supabase/migrations/20260216000001_update_shop_users_role_constraint.sql` | Create |
| `supabase/functions/manage-shop-user/index.ts` | Create |
| `src/services/shop.service.ts` | Edit — add `createTeamMember`, `resetTeamMemberPassword` |
| `src/features/settings/pages/StoreTeamPage.tsx` | Create |
| `src/features/settings/pages/SettingsPage.tsx` | Edit — add Team section |
| `src/components/shared/OwnerOnlyRoute.tsx` | Create |
| `src/App.tsx` | Edit — add team route |
| `src/features/settings/index.ts` | Edit — export `StoreTeamPage` |
