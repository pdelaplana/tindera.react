-- Add SKU and image_url columns to inventory_items table
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Enforce unique SKU per shop (null SKUs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_shop_sku_unique
ON inventory_items (shop_id, sku)
WHERE sku IS NOT NULL;
