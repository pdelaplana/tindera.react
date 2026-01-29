-- Add order prefix for order number display (e.g., "PC", "CAFE")
ALTER TABLE shops
ADD COLUMN order_prefix VARCHAR(10);

COMMENT ON COLUMN shops.order_prefix IS 'Prefix for order numbers, e.g. PC for Potato Corner -> #PC-0001';
