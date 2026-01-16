-- Add foreign key constraint for product_items.inventory_item_id
-- This enables PostgREST to automatically resolve the relationship

ALTER TABLE product_items 
ADD CONSTRAINT product_items_inventory_item_id_fkey 
FOREIGN KEY (inventory_item_id) 
REFERENCES inventory_items(id) 
ON DELETE SET NULL;
