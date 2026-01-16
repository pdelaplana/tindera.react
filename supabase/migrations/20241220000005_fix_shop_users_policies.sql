-- Fix shop_users policies to ensure users can add themselves after creating a shop

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert themselves as owner when creating shop" ON shop_users;
DROP POLICY IF EXISTS "Users can add themselves to shops" ON shop_users;

-- Grant necessary permissions
GRANT ALL ON shop_users TO authenticated;

-- Create INSERT policy - users can add themselves to any shop
-- (The shops INSERT policy controls who can create shops)
CREATE POLICY "shop_users_insert_policy" ON shop_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
