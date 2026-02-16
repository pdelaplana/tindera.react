-- Fix self-referential RLS recursion on shop_users SELECT policy.
-- The original policy used EXISTS (SELECT 1 FROM shop_users ...) which is
-- self-referential: the inner query also triggers the same policy, causing
-- PostgreSQL to break the recursion by only using the non-recursive branch.
-- This makes the owner's row visible but prevents other members' rows from
-- being seen.
--
-- Fix: use a SECURITY DEFINER function so the inner lookup bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_shop_member(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_users
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
  );
$$;

-- Fix shop_users SELECT policy
DROP POLICY IF EXISTS "Users can view shop_users for their shops" ON shop_users;

CREATE POLICY "Users can view shop_users for their shops"
  ON shop_users FOR SELECT
  USING (public.is_shop_member(shop_id));

-- Fix user_profiles SELECT policy (migration 2 also queries shop_users,
-- so it has the same recursion problem now that shop_users has RLS fixed)
DROP POLICY IF EXISTS "Users can view profiles of shop members" ON user_profiles;

CREATE POLICY "Users can view profiles of shop members"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (
      SELECT su.user_id FROM public.shop_users su
      WHERE public.is_shop_member(su.shop_id)
    )
  );
