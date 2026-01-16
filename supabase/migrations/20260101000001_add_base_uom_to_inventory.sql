-- Migration: Add base_uom to inventory_items
-- This adds a base unit of measure for tracking inventory quantities
-- Existing items will have base_uom set to their current uom for backward compatibility

-- Add base_uom column to inventory_items
ALTER TABLE inventory_items
  ADD COLUMN base_uom TEXT DEFAULT 'piece';

-- Populate base_uom from existing uom for backward compatibility
UPDATE inventory_items SET base_uom = uom WHERE base_uom IS NULL;

-- Add constraint to ensure base_uom is always set
ALTER TABLE inventory_items
  ALTER COLUMN base_uom SET NOT NULL;

-- Index for filtering by base UOM
CREATE INDEX idx_inventory_items_base_uom ON inventory_items(shop_id, base_uom);

-- Add comment explaining the field
COMMENT ON COLUMN inventory_items.base_uom IS 'Base unit of measure for tracking inventory quantities (e.g., kg, liter, piece). Package sizes convert to this unit.';
