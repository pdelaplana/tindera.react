-- Order Taxes: Tax breakdown per order (denormalized for historical accuracy)
CREATE TABLE IF NOT EXISTS order_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_tax_id UUID REFERENCES shop_taxes(id),
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_order_taxes_order_id ON order_taxes(order_id);

ALTER TABLE order_taxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order taxes for their shops" ON order_taxes;
CREATE POLICY "Users can view order taxes for their shops"
  ON order_taxes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE o.id = order_taxes.order_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage order taxes for their shops" ON order_taxes;
CREATE POLICY "Users can manage order taxes for their shops"
  ON order_taxes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE o.id = order_taxes.order_id
      AND su.user_id = auth.uid()
    )
  );

COMMENT ON TABLE order_taxes IS 'Tax breakdown per order. Denormalized from shop_taxes for historical accuracy.';
COMMENT ON COLUMN order_taxes.tax_name IS 'Denormalized tax name at time of order';
COMMENT ON COLUMN order_taxes.tax_rate IS 'Denormalized tax rate at time of order';
