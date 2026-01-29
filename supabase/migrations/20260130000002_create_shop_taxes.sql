-- Shop Taxes: Multiple tax rates per shop (e.g., State Tax 6%, City Tax 2%)
CREATE TABLE IF NOT EXISTS shop_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(shop_id, name)
);

CREATE INDEX IF NOT EXISTS idx_shop_taxes_shop_id ON shop_taxes(shop_id);

ALTER TABLE shop_taxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shop taxes for their shops" ON shop_taxes;
CREATE POLICY "Users can view shop taxes for their shops"
  ON shop_taxes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_taxes.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage shop taxes for their shops" ON shop_taxes;
CREATE POLICY "Users can manage shop taxes for their shops"
  ON shop_taxes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_taxes.shop_id
      AND su.user_id = auth.uid()
    )
  );

COMMENT ON TABLE shop_taxes IS 'Multiple tax rates per shop. Template defaults created at rate=0 for new shops.';
COMMENT ON COLUMN shop_taxes.rate IS 'Tax rate as decimal, e.g. 0.0600 for 6%';
