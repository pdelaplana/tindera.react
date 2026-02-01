-- Add is_active column to products table
ALTER TABLE products ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN products.is_active IS 'Whether product is active on the POS menu';
