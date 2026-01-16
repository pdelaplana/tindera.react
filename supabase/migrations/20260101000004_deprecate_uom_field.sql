-- Migration to deprecate uom field from inventory_items
-- Since base_uom is now the single source of truth

-- Drop the uom column from inventory_items
-- All inventory tracking and display now uses base_uom
ALTER TABLE inventory_items DROP COLUMN IF EXISTS uom;

-- Drop the units_of_measure table (no longer needed for custom UOMs)
-- This table supported custom user-defined units, but we're now limiting
-- to predefined system units (Piece, Kilogram, Gram, Liter, Milliliter, Ounce)
DROP TABLE IF EXISTS units_of_measure;

-- Note: base_uom remains as the single UOM field for inventory tracking
-- All package conversions and inventory calculations use base_uom
