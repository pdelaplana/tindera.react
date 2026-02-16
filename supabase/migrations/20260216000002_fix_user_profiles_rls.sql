-- Allow users to view profiles of other members in their shops
CREATE POLICY "Users can view profiles of shop members"
  ON user_profiles FOR SELECT
  USING (
    id IN (
      SELECT su2.user_id FROM shop_users su2
      WHERE su2.shop_id IN (
        SELECT su1.shop_id FROM shop_users su1 WHERE su1.user_id = auth.uid()
      )
    )
  );
