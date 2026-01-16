-- Completely rebuild shops RLS policies
-- Drop all existing policies on shops
DROP POLICY IF EXISTS "Users can view shops they belong to" ON shops;
DROP POLICY IF EXISTS "Users can create shops" ON shops;
DROP POLICY IF EXISTS "Authenticated users can create shops" ON shops;
DROP POLICY IF EXISTS "Admins and owners can update their shops" ON shops;
DROP POLICY IF EXISTS "Owners can delete their shops" ON shops;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated role
GRANT ALL ON shops TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create simple INSERT policy - any authenticated user can create
CREATE POLICY "shops_insert_policy" ON shops
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create SELECT policy - users can view shops they belong to
CREATE POLICY "shops_select_policy" ON shops
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT shop_id FROM shop_users WHERE user_id = auth.uid()
    )
  );

-- Create UPDATE policy - admins and owners can update
CREATE POLICY "shops_update_policy" ON shops
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT shop_id FROM shop_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create DELETE policy - only owners can delete
CREATE POLICY "shops_delete_policy" ON shops
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT shop_id FROM shop_users
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );
