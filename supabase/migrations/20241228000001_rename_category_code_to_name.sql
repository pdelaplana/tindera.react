-- Rename code column to name in product_categories table
ALTER TABLE product_categories
RENAME COLUMN code TO name;

-- Update the comment if it exists
COMMENT ON COLUMN product_categories.name IS 'Category name (e.g., Appetizer, Main Course, Dessert)';
