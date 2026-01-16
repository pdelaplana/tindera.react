-- Add custom units of measure table for shop-specific UOMs
-- System defaults (piece, ounce, liter, gram, kilogram, milliliter) remain in application enum

-- =============================================
-- UNITS OF MEASURE (Shop-specific custom UOMs)
-- =============================================
CREATE TABLE IF NOT EXISTS units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per shop
  CONSTRAINT unique_uom_name_per_shop UNIQUE (shop_id, name)
);

-- Enable Row Level Security
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage UOMs for their shops
CREATE POLICY "Users can manage units of measure for their shops"
  ON units_of_measure FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = units_of_measure.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_units_of_measure_shop_id ON units_of_measure(shop_id);
CREATE INDEX idx_units_of_measure_sequence ON units_of_measure(shop_id, sequence);

-- Add comment
COMMENT ON TABLE units_of_measure IS 'Shop-specific custom units of measure (system defaults remain in application enum)';
