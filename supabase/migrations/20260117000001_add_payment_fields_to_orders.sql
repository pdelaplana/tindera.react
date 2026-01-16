-- =====================================================
-- Add Payment Amount Fields to Orders Table
-- Migration: 20260117000001_add_payment_fields_to_orders.sql
-- Purpose: Add cash payment tracking to support checkout flow
-- =====================================================

-- Add payment amount fields for cash transactions
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_amount_received DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_change DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_amount_received IS 'Amount of cash received from customer (NULL for non-cash payments)';
COMMENT ON COLUMN orders.payment_change IS 'Change given to customer (calculated: received - total)';

-- Add check constraint to ensure payment_change is non-negative
ALTER TABLE orders
  ADD CONSTRAINT check_payment_change_non_negative
  CHECK (payment_change IS NULL OR payment_change >= 0);

-- Add check constraint to ensure received >= total when cash payment
ALTER TABLE orders
  ADD CONSTRAINT check_cash_sufficient
  CHECK (
    payment_amount_received IS NULL OR
    payment_amount_received >= total_sale
  );
