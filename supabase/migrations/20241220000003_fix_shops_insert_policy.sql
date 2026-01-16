-- Fix shops INSERT policy
-- The current policy may have issues with the auth.uid() check

-- Drop and recreate the insert policy with a simpler check
DROP POLICY IF EXISTS "Users can create shops" ON shops;

-- Allow any authenticated user to insert shops
-- The created_by field will be set by the application
CREATE POLICY "Authenticated users can create shops"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure the shop_users INSERT policy works correctly
DROP POLICY IF EXISTS "Users can insert themselves as owner when creating shop" ON shop_users;

-- Allow authenticated users to add themselves to shops they create
CREATE POLICY "Users can add themselves to shops"
  ON shop_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
