-- Migration: Add package tracking to inventory_transactions
-- This allows transactions to record which package size was used for receipts
-- and how many packages were received

-- Add package tracking columns
ALTER TABLE inventory_transactions
  ADD COLUMN package_size_id UUID REFERENCES package_sizes(id) ON DELETE SET NULL,
  ADD COLUMN package_quantity DECIMAL(10,3),
  ADD COLUMN package_cost_per_unit DECIMAL(10,2);

-- Index for querying transactions by package
CREATE INDEX idx_inventory_transactions_package ON inventory_transactions(package_size_id);

-- Comments explaining the fields
COMMENT ON COLUMN inventory_transactions.package_size_id IS 'Reference to package size used for receipt (NULL for direct base unit receipts)';
COMMENT ON COLUMN inventory_transactions.package_quantity IS 'Number of packages received (e.g., 5 bags). NULL for non-package receipts';
COMMENT ON COLUMN inventory_transactions.package_cost_per_unit IS 'Cost per package at time of receipt. NULL for non-package receipts';
