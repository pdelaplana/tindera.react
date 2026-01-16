-- Fix RLS Policy Infinite Recursion
-- The shop_users SELECT policy was referencing shop_users within itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view shop_users for their shops" ON shop_users;
DROP POLICY IF EXISTS "Owners and admins can manage shop users" ON shop_users;
DROP POLICY IF EXISTS "Owners can delete shop users" ON shop_users;

-- Recreate shop_users SELECT policy without self-reference
-- Users can see their own shop_user entries (which shops they belong to)
CREATE POLICY "Users can view their own shop memberships"
  ON shop_users FOR SELECT
  USING (user_id = auth.uid());

-- For UPDATE: owners/admins can update other users in their shops
-- We need to avoid recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.is_shop_admin(check_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shop_users
    WHERE shop_id = check_shop_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_shop_owner(check_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shop_users
    WHERE shop_id = check_shop_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate UPDATE policy using security definer function
CREATE POLICY "Admins can update shop users"
  ON shop_users FOR UPDATE
  USING (public.is_shop_admin(shop_id));

-- Recreate DELETE policy using security definer function
CREATE POLICY "Owners can delete shop users"
  ON shop_users FOR DELETE
  USING (public.is_shop_owner(shop_id));

-- Also fix the existing user who doesn't have a profile
-- Insert profile for any auth users that don't have one yet
INSERT INTO user_profiles (id, display_name)
SELECT id, raw_user_meta_data->>'display_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
