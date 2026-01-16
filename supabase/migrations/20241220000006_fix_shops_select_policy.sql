-- Fix SELECT policy to allow users to see shops they just created
-- The issue: INSERT works, but the .select() after insert fails
-- because user isn't in shop_users yet

DROP POLICY IF EXISTS "shops_select_policy" ON shops;

-- Allow SELECT if user is in shop_users OR if they created the shop
CREATE POLICY "shops_select_policy" ON shops
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT shop_id FROM shop_users WHERE user_id = auth.uid()
    )
  );
