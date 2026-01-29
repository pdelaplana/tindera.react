-- Discount Types: Configurable discount types with system defaults
CREATE TABLE IF NOT EXISTS discount_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_discount_types_shop_id ON discount_types(shop_id);

ALTER TABLE discount_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view discount types" ON discount_types;
CREATE POLICY "Users can view discount types"
  ON discount_types FOR SELECT
  USING (
    shop_id IS NULL
    OR EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = discount_types.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage discount types for their shops" ON discount_types;
CREATE POLICY "Users can manage discount types for their shops"
  ON discount_types FOR ALL
  USING (
    shop_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = discount_types.shop_id
      AND su.user_id = auth.uid()
    )
  );

INSERT INTO discount_types (shop_id, name, is_system) VALUES
  (NULL, 'Senior Discount', true),
  (NULL, 'Loyalty Reward', true),
  (NULL, 'Promo Code', true),
  (NULL, 'Manager Override', true),
  (NULL, 'Other', true);

COMMENT ON TABLE discount_types IS 'Configurable discount types. System defaults have shop_id=NULL.';
