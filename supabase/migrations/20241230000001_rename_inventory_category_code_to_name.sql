-- Rename code column to name in inventory_categories table
ALTER TABLE inventory_categories
RENAME COLUMN code TO name;

-- Update the comment if it exists
COMMENT ON COLUMN inventory_categories.name IS 'Category name/code (e.g., RAW-MAT, PACKAGING, SUPPLIES)';
