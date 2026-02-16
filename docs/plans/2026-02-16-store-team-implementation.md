# Store Team Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow shop owners to create, manage, and set passwords for team members (manager/staff roles) directly from the Settings page.

**Architecture:** A Supabase Edge Function (`manage-shop-user`) handles user creation and password resets using the Admin API. The frontend calls the function via two new `shopService` methods. A new `StoreTeamPage` lives under `/shops/:shopId/settings/team`, guarded by an `OwnerOnlyGuard` component. The Settings page gains a "Team" section visible only to owners.

**Tech Stack:** React, TypeScript, Ionic/React, TanStack Query, Supabase (Edge Functions, Admin API, RLS), Zod, React Hook Form, Vitest

---

## Context & Key Files

- `src/contexts/ShopContext.tsx` — exposes `currentRole`, `hasPermission`; contains `ROLE_HIERARCHY`
- `src/services/shop.service.ts` — all shop/team DB operations
- `src/hooks/useShop.ts` — TanStack Query hooks for shop operations; add team member hooks here
- `src/types/index.ts` — `ShopUser`, `UserProfile` types; `ShopWithRole`
- `src/App.tsx` — route registration
- `src/features/settings/index.ts` — barrel export for settings pages
- `src/features/settings/pages/SettingsPage.tsx` — add Team section here
- `src/components/AuthGuard.tsx` — pattern to follow for `OwnerOnlyGuard`
- `supabase/migrations/` — DB migrations
- `supabase/functions/` — Edge Functions

---

## Task 1: DB Migration — Rename `admin` to `manager`

The `shop_users` role constraint currently allows `('owner', 'admin', 'staff')`. Rename `admin` → `manager`.

**Files:**
- Create: `supabase/migrations/20260216000001_update_shop_users_role_constraint.sql`

**Step 1: Create the migration file**

```sql
-- Update role constraint: rename 'admin' to 'manager'
ALTER TABLE shop_users DROP CONSTRAINT IF EXISTS shop_users_role_check;

-- Migrate any existing 'admin' rows to 'manager'
UPDATE shop_users SET role = 'manager' WHERE role = 'admin';

ALTER TABLE shop_users
  ADD CONSTRAINT shop_users_role_check
  CHECK (role IN ('owner', 'manager', 'staff'));
```

**Step 2: Apply migration locally (if Supabase CLI is set up)**

```bash
npx supabase db push
```

If not using CLI locally, apply the SQL manually in the Supabase Dashboard → SQL Editor. Note the migration file still needs to exist for version tracking.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216000001_update_shop_users_role_constraint.sql
git commit -m "feat: update shop_users role constraint from admin to manager"
```

---

## Task 2: Update `ShopContext` — Rename `admin` → `manager`

`ROLE_HIERARCHY` uses `admin`. Update it to `manager` throughout.

**Files:**
- Modify: `src/contexts/ShopContext.tsx`

**Step 1: Update `ROLE_HIERARCHY`**

Find (line ~41):
```ts
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  staff: 1,
};
```

Replace with:
```ts
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};
```

**Step 2: Update `hasPermission` type signature**

Find (line ~31 in interface, ~250 in implementation):
```ts
hasPermission: (requiredRole: 'owner' | 'admin' | 'staff') => boolean;
```
and
```ts
(requiredRole: 'owner' | 'admin' | 'staff'): boolean => {
```

Replace both with:
```ts
hasPermission: (requiredRole: 'owner' | 'manager' | 'staff') => boolean;
```
and
```ts
(requiredRole: 'owner' | 'manager' | 'staff'): boolean => {
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/contexts/ShopContext.tsx
git commit -m "refactor: rename admin to manager in ROLE_HIERARCHY and hasPermission"
```

---

## Task 3: Update `ShopUser` type

Add a typed `role` and an `email` field to `ShopUser` so the team list can display email.

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Update `ShopUser` interface**

Find:
```ts
export interface ShopUser {
  shop_id: string;
  user_id: string;
  role: string;
  user_profiles?: {
    display_name: string | null;
  };
}
```

Replace with:
```ts
export type ShopRole = 'owner' | 'manager' | 'staff';

export interface ShopUser {
  shop_id: string;
  user_id: string;
  role: ShopRole;
  email?: string | null;
  user_profiles?: {
    display_name: string | null;
  };
}
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors surfaced (e.g., passing `string` where `ShopRole` is now expected).

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: add ShopRole type and email field to ShopUser"
```

---

## Task 4: Supabase Edge Function — `manage-shop-user`

Handles user creation, password reset, and removal using the Supabase Admin API.

**Files:**
- Create: `supabase/functions/manage-shop-user/index.ts`

**Step 1: Create the function**

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Build admin client using service role key (available in Edge Function env)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Build user client to verify caller's identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the calling user
    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, shopId } = body;

    if (!action || !shopId) {
      return new Response(JSON.stringify({ error: 'Missing action or shopId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is owner of the shop
    const { data: shopUser, error: roleError } = await supabaseAdmin
      .from('shop_users')
      .select('role')
      .eq('shop_id', shopId)
      .eq('user_id', caller.id)
      .single();

    if (roleError || !shopUser || shopUser.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Forbidden: owner role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Actions ---

    if (action === 'create') {
      const { email, displayName, password, role } = body;

      if (!email || !displayName || !password || !role) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!['manager', 'staff'].includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (createError || !newUser.user) {
        return new Response(JSON.stringify({ error: createError?.message ?? 'Failed to create user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create user profile
      await supabaseAdmin.from('user_profiles').insert({
        id: newUser.user.id,
        display_name: displayName,
      });

      // Add to shop
      const { error: shopError } = await supabaseAdmin.from('shop_users').insert({
        shop_id: shopId,
        user_id: newUser.user.id,
        role,
      });

      if (shopError) {
        // Cleanup: delete the auth user if shop assignment fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: shopError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ userId: newUser.user.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reset-password') {
      const { userId, password } = body;

      if (!userId || !password) {
        return new Response(JSON.stringify({ error: 'Missing userId or password' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify the target user is actually in this shop (not an arbitrary user)
      const { data: targetShopUser } = await supabaseAdmin
        .from('shop_users')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single();

      if (!targetShopUser) {
        return new Response(JSON.stringify({ error: 'User not in shop' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (resetError) {
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove') {
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent owner from removing themselves
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: 'Cannot remove yourself' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: removeError } = await supabaseAdmin
        .from('shop_users')
        .delete()
        .eq('shop_id', shopId)
        .eq('user_id', userId);

      if (removeError) {
        return new Response(JSON.stringify({ error: removeError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Deploy the function (if Supabase CLI is set up)**

```bash
npx supabase functions deploy manage-shop-user
```

If not using CLI, deploy via Supabase Dashboard → Edge Functions.

**Step 3: Commit**

```bash
git add supabase/functions/manage-shop-user/index.ts
git commit -m "feat: add manage-shop-user Edge Function for team management"
```

---

## Task 5: Add `createTeamMember` and `resetTeamMemberPassword` to `shopService`

**Files:**
- Modify: `src/services/shop.service.ts`

**Step 1: Add `createTeamMember` after `getShopUsers`**

Add the following imports at the top of the file if not already present:
```ts
import { supabase } from './supabase';
```
(already present — no change needed)

Add these two methods at the end of the `shopService` object, before the closing `}`:

```ts
/**
 * Create a new team member for a shop via Edge Function
 */
async createTeamMember(
  shopId: string,
  data: { email: string; displayName: string; password: string; role: string }
): Promise<{ userId: string | null; error: Error | null }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('manage-shop-user', {
      body: { action: 'create', shopId, ...data },
    });

    if (error) {
      logger.error(new Error(error.message), { context: 'createTeamMember', shopId });
      return { userId: null, error: new Error(error.message) };
    }

    return { userId: result?.userId ?? null, error: null };
  } catch (err) {
    const error = err as Error;
    logger.error(error, { context: 'createTeamMember', shopId });
    return { userId: null, error };
  }
},

/**
 * Reset a team member's password via Edge Function
 */
async resetTeamMemberPassword(
  shopId: string,
  userId: string,
  password: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.functions.invoke('manage-shop-user', {
      body: { action: 'reset-password', shopId, userId, password },
    });

    if (error) {
      logger.error(new Error(error.message), { context: 'resetTeamMemberPassword', shopId, userId });
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    const error = err as Error;
    logger.error(error, { context: 'resetTeamMemberPassword', shopId, userId });
    return { error };
  }
},

/**
 * Remove a team member via Edge Function
 */
async removeTeamMember(
  shopId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.functions.invoke('manage-shop-user', {
      body: { action: 'remove', shopId, userId },
    });

    if (error) {
      logger.error(new Error(error.message), { context: 'removeTeamMember', shopId, userId });
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    const error = err as Error;
    logger.error(error, { context: 'removeTeamMember', shopId, userId });
    return { error };
  }
},
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/services/shop.service.ts
git commit -m "feat: add createTeamMember, resetTeamMemberPassword, removeTeamMember to shopService"
```

---

## Task 6: Add TanStack Query hooks for team member operations

**Files:**
- Modify: `src/hooks/useShop.ts`

**Step 1: Add the three new hooks at the end of the file (before `export default`)**

```ts
/**
 * Hook to create a new team member for a shop.
 */
export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      data,
    }: {
      shopId: string;
      data: { email: string; displayName: string; password: string; role: string };
    }) => {
      const { userId, error } = await shopService.createTeamMember(shopId, data);
      if (error) throw error;
      return userId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.users(variables.shopId) });
    },
  });
}

/**
 * Hook to reset a team member's password.
 */
export function useResetTeamMemberPassword() {
  return useMutation({
    mutationFn: async ({
      shopId,
      userId,
      password,
    }: {
      shopId: string;
      userId: string;
      password: string;
    }) => {
      const { error } = await shopService.resetTeamMemberPassword(shopId, userId, password);
      if (error) throw error;
    },
  });
}

/**
 * Hook to remove a team member via Edge Function.
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shopId, userId }: { shopId: string; userId: string }) => {
      const { error } = await shopService.removeTeamMember(shopId, userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.users(variables.shopId) });
    },
  });
}
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useShop.ts
git commit -m "feat: add useCreateTeamMember, useResetTeamMemberPassword, useRemoveTeamMember hooks"
```

---

## Task 7: Create `OwnerOnlyGuard` component

Mirrors `AuthGuard` but redirects non-owners away from the team management route.

**Files:**
- Create: `src/components/OwnerOnlyGuard.tsx`

**Step 1: Write the component**

```tsx
// OwnerOnlyGuard - Protect routes that require owner role

import { IonLoading } from '@ionic/react';
import type React from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { useShop } from '@/hooks/useShop';

interface OwnerOnlyGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps routes that require the owner role.
 * Redirects non-owners to the shop home page.
 */
function OwnerOnlyGuard({ children }: OwnerOnlyGuardProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole, isLoading } = useShop();

  if (isLoading) {
    return <IonLoading isOpen={true} message="Loading..." />;
  }

  if (currentRole !== 'owner') {
    return <Redirect to={`/shops/${shopId}`} />;
  }

  return <>{children}</>;
}

export default OwnerOnlyGuard;
```

**Step 2: Export from components index (if one exists)**

```bash
grep -n "AuthGuard" src/components/index.ts 2>/dev/null || echo "no index found"
```

If `src/components/index.ts` exists and exports `AuthGuard`, add `OwnerOnlyGuard` to it:
```ts
export { default as OwnerOnlyGuard } from './OwnerOnlyGuard';
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/OwnerOnlyGuard.tsx
git commit -m "feat: add OwnerOnlyGuard route protection component"
```

---

## Task 8: Create `StoreTeamPage`

The main team management page under Settings.

**Files:**
- Create: `src/features/settings/pages/StoreTeamPage.tsx`

**Step 1: Write the page**

```tsx
// Store Team Page - Manage shop team members

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonActionSheet,
  IonAvatar,
  IonBadge,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/react';
import { add, ellipsisVertical } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { TextField } from '@/components/shared/FormFields';
import { LoadingSpinner } from '@/components/ui';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import {
  useShop,
  useShopUsers,
  useUpdateUserRole,
  useCreateTeamMember,
  useResetTeamMemberPassword,
  useRemoveTeamMember,
} from '@/hooks/useShop';
import type { ShopUser, ShopRole } from '@/types';

// --- Schemas ---

const addMemberSchema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['manager', 'staff']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const editRoleSchema = z.object({
  role: z.enum(['manager', 'staff']),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AddMemberForm = z.infer<typeof addMemberSchema>;
type EditRoleForm = z.infer<typeof editRoleSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// --- Role badge colour ---
const roleBadgeColor: Record<ShopRole, string> = {
  owner: 'primary',
  manager: 'secondary',
  staff: 'medium',
};

// --- Helper: avatar initial ---
function avatarInitial(name: string | null | undefined): string {
  return (name ?? '?').charAt(0).toUpperCase();
}

// --- Page ---

const StoreTeamPage: React.FC = () => {
  const { currentShop } = useShop();
  const shopId = currentShop?.id;

  const { data: members, isLoading } = useShopUsers(shopId);

  const createMember = useCreateTeamMember();
  const updateRole = useUpdateUserRole();
  const resetPassword = useResetTeamMemberPassword();
  const removeMember = useRemoveTeamMember();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ShopUser | null>(null);
  const [resetMember, setResetMember] = useState<ShopUser | null>(null);
  const [removingMember, setRemovingMember] = useState<ShopUser | null>(null);
  const [actionSheetMember, setActionSheetMember] = useState<ShopUser | null>(null);

  // Forms
  const addForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'staff' },
  });

  const editForm = useForm<EditRoleForm>({
    resolver: zodResolver(editRoleSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // --- Handlers ---

  const handleAdd = addForm.handleSubmit(async (values) => {
    if (!shopId) return;
    await createMember.mutateAsync({
      shopId,
      data: {
        email: values.email,
        displayName: values.displayName,
        password: values.password,
        role: values.role,
      },
    });
    addForm.reset();
    setShowAddModal(false);
  });

  const openEditModal = (member: ShopUser) => {
    setEditingMember(member);
    editForm.reset({ role: member.role === 'owner' ? 'staff' : member.role });
  };

  const handleEditRole = editForm.handleSubmit(async (values) => {
    if (!shopId || !editingMember) return;
    await updateRole.mutateAsync({ shopId, userId: editingMember.user_id, role: values.role });
    setEditingMember(null);
  });

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    if (!shopId || !resetMember) return;
    await resetPassword.mutateAsync({ shopId, userId: resetMember.user_id, password: values.password });
    resetForm.reset();
    setResetMember(null);
  });

  const handleRemove = async () => {
    if (!shopId || !removingMember) return;
    await removeMember.mutateAsync({ shopId, userId: removingMember.user_id });
    setRemovingMember(null);
  };

  if (isLoading) return <LoadingSpinner />;

  const memberName = (m: ShopUser) => m.user_profiles?.display_name ?? m.email ?? 'Unknown';

  return (
    <BasePage title="Store Team" backHref={`/shops/${shopId}/settings`}>
      <CenteredLayout>
        <IonList lines="none" className="ion-no-padding">
          {(members ?? []).map((member) => (
            <IonItem key={member.user_id}>
              <IonAvatar slot="start" style={{ width: 36, height: 36, background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 600 }}>{avatarInitial(member.user_profiles?.display_name)}</span>
              </IonAvatar>
              <IonLabel>
                <h2>{memberName(member)}</h2>
                {member.email && <p>{member.email}</p>}
              </IonLabel>
              <IonBadge color={roleBadgeColor[member.role]} slot="end" style={{ marginRight: 8 }}>
                {member.role}
              </IonBadge>
              {member.role !== 'owner' && (
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={() => setActionSheetMember(member)}
                >
                  <IonIcon icon={ellipsisVertical} />
                </IonButton>
              )}
            </IonItem>
          ))}
        </IonList>

        {/* Action sheet for member actions */}
        <IonActionSheet
          isOpen={!!actionSheetMember}
          onDidDismiss={() => setActionSheetMember(null)}
          header={actionSheetMember ? memberName(actionSheetMember) : undefined}
          buttons={[
            {
              text: 'Edit Role',
              handler: () => {
                if (actionSheetMember) openEditModal(actionSheetMember);
              },
            },
            {
              text: 'Reset Password',
              handler: () => {
                if (actionSheetMember) {
                  setResetMember(actionSheetMember);
                  resetForm.reset();
                }
              },
            },
            {
              text: 'Remove',
              role: 'destructive',
              handler: () => {
                if (actionSheetMember) setRemovingMember(actionSheetMember);
              },
            },
            { text: 'Cancel', role: 'cancel' },
          ]}
        />

        {/* Add Member FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => { addForm.reset({ role: 'staff' }); setShowAddModal(true); }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Add Member Modal */}
        <BaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Team Member"
          showActionButton
          actionButtonLabel="Add"
          onActionClick={handleAdd}
          actionButtonLoading={createMember.isPending}
          actionButtonDisabled={createMember.isPending}
        >
          <Controller
            control={addForm.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <TextField
                label="Full Name"
                placeholder="e.g. Maria Santos"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={addForm.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label="Email"
                placeholder="staff@example.com"
                type="email"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={addForm.control}
            name="role"
            render={({ field, fieldState }) => (
              <TextField
                label="Role"
                placeholder="manager or staff"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={addForm.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="Temporary Password"
                placeholder="Min. 6 characters"
                type="password"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          {createMember.isError && (
            <IonText color="danger">
              <p style={{ padding: '0 16px' }}>{(createMember.error as Error)?.message}</p>
            </IonText>
          )}
        </BaseModal>

        {/* Edit Role Modal */}
        <BaseModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          title="Edit Role"
          showActionButton
          actionButtonLabel="Save"
          onActionClick={handleEditRole}
          actionButtonLoading={updateRole.isPending}
          actionButtonDisabled={updateRole.isPending}
        >
          <Controller
            control={editForm.control}
            name="role"
            render={({ field, fieldState }) => (
              <TextField
                label="Role"
                placeholder="manager or staff"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
        </BaseModal>

        {/* Reset Password Modal */}
        <BaseModal
          isOpen={!!resetMember}
          onClose={() => setResetMember(null)}
          title="Reset Password"
          showActionButton
          actionButtonLabel="Save"
          onActionClick={handleResetPassword}
          actionButtonLoading={resetPassword.isPending}
          actionButtonDisabled={resetPassword.isPending}
        >
          <Controller
            control={resetForm.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="New Password"
                placeholder="Min. 6 characters"
                type="password"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={resetForm.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <TextField
                label="Confirm Password"
                placeholder="Repeat password"
                type="password"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
              />
            )}
          />
          {resetPassword.isError && (
            <IonText color="danger">
              <p style={{ padding: '0 16px' }}>{(resetPassword.error as Error)?.message}</p>
            </IonText>
          )}
        </BaseModal>

        {/* Remove confirmation */}
        <DeleteConfirmationAlert
          isOpen={!!removingMember}
          onDismiss={() => setRemovingMember(null)}
          onConfirm={handleRemove}
          itemName={removingMember ? memberName(removingMember) : ''}
          itemType="Team Member"
        />
      </CenteredLayout>
    </BasePage>
  );
};

export default StoreTeamPage;
```

**Step 2: Check if `BasePage` accepts a `backHref` prop — verify the component signature**

```bash
grep -n "backHref\|interface BasePage\|BasePage" src/components/layouts/BasePage.tsx 2>/dev/null | head -10
```

Adjust the `BasePage` usage to match the actual prop names if needed.

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors.

**Step 4: Commit**

```bash
git add src/features/settings/pages/StoreTeamPage.tsx
git commit -m "feat: add StoreTeamPage with team list, add/edit/remove/reset-password"
```

---

## Task 9: Update Settings index export and `SettingsPage`

**Files:**
- Modify: `src/features/settings/index.ts`
- Modify: `src/features/settings/pages/SettingsPage.tsx`

**Step 1: Export `StoreTeamPage` from the settings barrel**

Add to `src/features/settings/index.ts`:
```ts
export { default as StoreTeamPage } from './pages/StoreTeamPage';
```

**Step 2: Add "Team" section to `SettingsPage`**

Import `peopleOutline` from `ionicons/icons` and `useShop` is already imported.

Add the import:
```ts
import { peopleOutline } from 'ionicons/icons';
```

Then add the Team section just before the Danger Zone section. Find the comment `{/* Danger Zone */}` and add above it:

```tsx
{/* Team — owner only */}
{currentShop.role === 'owner' && (
  <>
    <IonTitle>Team</IonTitle>
    <IonCard className="flat-card">
      <IonCardContent>
        <IonList lines="none" className="ion-no-padding">
          <IonItem
            button
            onClick={() => navigate(`/shops/${shopId}/settings/team`)}
            detail={false}
          >
            <IonIcon slot="start" icon={peopleOutline} />
            <IonLabel>
              <h2>Store Team</h2>
              <p>Add and manage team members</p>
            </IonLabel>
            <IonIcon slot="end" icon={chevronForwardOutline} />
          </IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>
  </>
)}
```

Note: `currentShop` here is `ShopWithRole` which has a `role` field. No new imports needed beyond `peopleOutline`.

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/features/settings/index.ts src/features/settings/pages/SettingsPage.tsx
git commit -m "feat: add Team section to SettingsPage (owner only)"
```

---

## Task 10: Register route in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add the import**

Find the existing settings imports line (e.g. `import { ..., VoidRefundSettingsPage } from '@/features/settings';`) and add `StoreTeamPage`:

```ts
import {
  DiscountTypeSettingsPage,
  GlobalModifierGroupManagePage,
  GlobalModifiersPage,
  InventoryCategoriesPage,
  ProductCategoriesPage,
  SettingsPage,
  ShopSettingsPage,
  StoreTeamPage,
  TaxSettingsPage,
  VoidRefundSettingsPage,
} from '@/features/settings';
```

Also import `OwnerOnlyGuard`:
```ts
import OwnerOnlyGuard from '@/components/OwnerOnlyGuard';
```

**Step 2: Add the route**

Find the last settings route (the void-refund one) and add after it:

```tsx
<Route exact path="/shops/:shopId/settings/team">
  <AuthGuard>
    <OwnerOnlyGuard>
      <StoreTeamPage />
    </OwnerOnlyGuard>
  </AuthGuard>
</Route>
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Run the dev server and manually test**

```bash
npm run dev
```

- Sign in as an owner → Settings → "Store Team" entry should be visible
- Navigate to `/shops/:shopId/settings/team` → team list should render
- Add a team member → should appear in the list
- Open action sheet → Edit Role, Reset Password, Remove should work
- Sign in as a manager/staff → Settings → no "Team" entry; direct URL → redirected

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /settings/team route with OwnerOnlyGuard"
```

---

## Task 11: Write unit tests

**Files:**
- Create: `src/features/settings/pages/StoreTeamPage.test.tsx`

**Step 1: Write tests for `StoreTeamPage`**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import StoreTeamPage from './StoreTeamPage';

// Mock hooks
vi.mock('@/hooks/useShop', () => ({
  useShop: () => ({ currentShop: { id: 'shop-1', name: 'Test Shop', role: 'owner' } }),
  useShopUsers: () => ({
    data: [
      { user_id: 'u1', role: 'owner', user_profiles: { display_name: 'Alice' } },
      { user_id: 'u2', role: 'staff', email: 'bob@test.com', user_profiles: { display_name: 'Bob' } },
    ],
    isLoading: false,
  }),
  useCreateTeamMember: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useUpdateUserRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResetTeamMemberPassword: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useRemoveTeamMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Wrap in minimal providers if needed (Router, QueryClient)
// ... add providers as needed for your test setup

describe('StoreTeamPage', () => {
  it('renders all team members', async () => {
    render(<StoreTeamPage />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows owner badge for owner member', () => {
    render(<StoreTeamPage />);
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('shows action button only for non-owner members', () => {
    render(<StoreTeamPage />);
    // Bob (staff) should have an action button; Alice (owner) should not
    const actionButtons = screen.getAllByRole('button', { name: /more/i });
    expect(actionButtons).toHaveLength(1);
  });

  it('opens add modal when FAB is clicked', async () => {
    render(<StoreTeamPage />);
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByText('Add Team Member')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests**

```bash
npx vitest run src/features/settings/pages/StoreTeamPage.test.tsx
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add src/features/settings/pages/StoreTeamPage.test.tsx
git commit -m "test: add StoreTeamPage unit tests"
```

---

## Checklist

- [ ] Task 1: DB migration (admin → manager)
- [ ] Task 2: ShopContext ROLE_HIERARCHY updated
- [ ] Task 3: ShopUser type updated with ShopRole
- [ ] Task 4: Edge Function created and deployed
- [ ] Task 5: shopService new methods added
- [ ] Task 6: TanStack Query hooks added
- [ ] Task 7: OwnerOnlyGuard component
- [ ] Task 8: StoreTeamPage
- [ ] Task 9: Settings index + SettingsPage Team section
- [ ] Task 10: App.tsx route
- [ ] Task 11: Unit tests
