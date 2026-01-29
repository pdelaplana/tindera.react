-- Void/Refund Reasons: Shared reasons for void and refund operations
CREATE TABLE IF NOT EXISTS void_refund_reasons (
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

CREATE INDEX IF NOT EXISTS idx_void_refund_reasons_shop_id ON void_refund_reasons(shop_id);

ALTER TABLE void_refund_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view void refund reasons" ON void_refund_reasons;
CREATE POLICY "Users can view void refund reasons"
  ON void_refund_reasons FOR SELECT
  USING (
    shop_id IS NULL
    OR EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = void_refund_reasons.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage void refund reasons for their shops" ON void_refund_reasons;
CREATE POLICY "Users can manage void refund reasons for their shops"
  ON void_refund_reasons FOR ALL
  USING (
    shop_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = void_refund_reasons.shop_id
      AND su.user_id = auth.uid()
    )
  );

INSERT INTO void_refund_reasons (shop_id, name, is_system) VALUES
  (NULL, 'Customer Request', true),
  (NULL, 'Wrong Order', true),
  (NULL, 'Quality Issue', true),
  (NULL, 'Duplicate Order', true),
  (NULL, 'Test Order', true),
  (NULL, 'Manager Override', true),
  (NULL, 'Other', true);

COMMENT ON TABLE void_refund_reasons IS 'Shared reasons for void and refund operations.';
