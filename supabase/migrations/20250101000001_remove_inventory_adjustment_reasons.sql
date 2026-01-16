-- Migration: Remove inventory_adjustment_reasons table and simplify adjustment reason storage
-- Date: 2025-01-01
-- Description: Replace adjustment_reason_id FK with direct adjustment_reason_code and adjustment_reason_other fields

-- 1. Remove FK constraint
ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_adjustment_reason_id_fkey;

-- 2. Remove old column
ALTER TABLE inventory_transactions
  DROP COLUMN IF EXISTS adjustment_reason_id;

-- 3. Add new columns
ALTER TABLE inventory_transactions
  ADD COLUMN adjustment_reason_code TEXT,
  ADD COLUMN adjustment_reason_other TEXT;

-- 4. Create index for filtering by reason
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reason_code
  ON inventory_transactions(shop_id, adjustment_reason_code);

-- 5. Drop the adjustment reasons table
DROP TABLE IF EXISTS inventory_adjustment_reasons CASCADE;
