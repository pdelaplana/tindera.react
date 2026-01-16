-- Migration: Create package_sizes table
-- This table stores different packaging options for inventory items
-- Example: Fries can be received in "3kg Bag", "1kg Bag", or "5kg Box"

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Package sizes table
CREATE TABLE package_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,

  -- Package details
  package_name TEXT NOT NULL,           -- e.g., "3kg Bag", "Case of 24", "Pallet"
  package_uom TEXT NOT NULL,            -- e.g., "bag", "case", "pallet"
  units_per_package DECIMAL(10,3) NOT NULL,  -- e.g., 3.0 (for 3kg per bag)

  -- Cost information
  cost_per_package DECIMAL(10,2),       -- Optional: typical cost per package

  -- Display
  is_default BOOLEAN DEFAULT false,     -- Default package for this item
  sequence INT DEFAULT 0,               -- Display order

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT package_sizes_units_per_package_positive CHECK (units_per_package > 0),
  CONSTRAINT unique_package_per_item UNIQUE (shop_id, item_id, package_name)
);

-- Indexes
CREATE INDEX idx_package_sizes_item ON package_sizes(item_id);
CREATE INDEX idx_package_sizes_shop ON package_sizes(shop_id);

-- RLS Policies
ALTER TABLE package_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY package_sizes_select ON package_sizes
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE id = shop_id)
  );

CREATE POLICY package_sizes_insert ON package_sizes
  FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE id = shop_id)
  );

CREATE POLICY package_sizes_update ON package_sizes
  FOR UPDATE USING (
    shop_id IN (SELECT id FROM shops WHERE id = shop_id)
  );

CREATE POLICY package_sizes_delete ON package_sizes
  FOR DELETE USING (
    shop_id IN (SELECT id FROM shops WHERE id = shop_id)
  );

-- Trigger for updated_at
CREATE TRIGGER set_package_sizes_updated_at
  BEFORE UPDATE ON package_sizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE package_sizes IS 'Defines different packaging options for inventory items (e.g., bags, cases, pallets)';
COMMENT ON COLUMN package_sizes.package_name IS 'User-friendly name for the package (e.g., "3kg Bag", "Case of 24")';
COMMENT ON COLUMN package_sizes.package_uom IS 'Unit of measure for the package itself (e.g., "bag", "case", "box")';
COMMENT ON COLUMN package_sizes.units_per_package IS 'How many base units are in one package (e.g., 3.0 kg per bag)';
COMMENT ON COLUMN package_sizes.cost_per_package IS 'Optional typical cost per package (can be overridden at receipt time)';
COMMENT ON COLUMN package_sizes.is_default IS 'Whether this package size should be pre-selected in forms';
