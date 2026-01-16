-- Migration: Add Missing Audit Fields
-- Description: Adds created_by, updated_by, and updated_at fields to tables missing them
-- Date: 2026-01-17

-- ============================================================================
-- 1. MODIFIER SYSTEM TABLES (High Priority)
-- ============================================================================

-- modifier_groups: Add created_by, updated_by
ALTER TABLE modifier_groups
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- modifiers: Add created_by, updated_by
ALTER TABLE modifiers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- product_modifier_price_overrides: Add created_by, updated_by
ALTER TABLE product_modifier_price_overrides
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 2. CATEGORY TABLES (High Priority)
-- ============================================================================

-- product_categories: Add updated_at, created_by, updated_by
ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- inventory_categories: Add updated_at, created_by, updated_by
ALTER TABLE inventory_categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 3. PAYMENT TYPES (High Priority)
-- ============================================================================

-- payment_types: Add updated_at, created_by, updated_by
ALTER TABLE payment_types
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 4. PRODUCT CHILD TABLES (Medium Priority)
-- ============================================================================

-- product_items: Add updated_at, created_by, updated_by
ALTER TABLE product_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- product_addons: Add updated_at, created_by, updated_by
ALTER TABLE product_addons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- product_modifier_group_links: Add updated_at, created_by, updated_by
ALTER TABLE product_modifier_group_links
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 5. USER/SHOP TABLES (Medium Priority)
-- ============================================================================

-- shop_users: Add updated_at, created_by, updated_by
ALTER TABLE shop_users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- user_profiles: Add created_by, updated_by
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 6. INVENTORY COUNT ITEMS (Low Priority - Rarely Modified)
-- ============================================================================

-- inventory_count_items: Add updated_at, created_by, updated_by
ALTER TABLE inventory_count_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 7. ORDER CHILD TABLES (Low Priority - Generally Immutable)
-- ============================================================================

-- order_items: Add updated_at, created_by, updated_by
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- order_item_addons: Add updated_at, created_by, updated_by
ALTER TABLE order_item_addons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- order_item_modifiers: Add updated_at, created_by, updated_by
ALTER TABLE order_item_modifiers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 8. CREATE TRIGGERS FOR AUTO-UPDATING updated_at
-- ============================================================================

-- Create trigger function if it doesn't exist (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables that now have updated_at
CREATE TRIGGER set_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_inventory_categories_updated_at
  BEFORE UPDATE ON inventory_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_payment_types_updated_at
  BEFORE UPDATE ON payment_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_items_updated_at
  BEFORE UPDATE ON product_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_addons_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_modifier_group_links_updated_at
  BEFORE UPDATE ON product_modifier_group_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_shop_users_updated_at
  BEFORE UPDATE ON shop_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_modifier_groups_updated_at
  BEFORE UPDATE ON modifier_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_modifiers_updated_at
  BEFORE UPDATE ON modifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_modifier_price_overrides_updated_at
  BEFORE UPDATE ON product_modifier_price_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_inventory_count_items_updated_at
  BEFORE UPDATE ON inventory_count_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_order_item_addons_updated_at
  BEFORE UPDATE ON order_item_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_order_item_modifiers_updated_at
  BEFORE UPDATE ON order_item_modifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN modifier_groups.created_by IS 'User who created this modifier group';
COMMENT ON COLUMN modifier_groups.updated_by IS 'User who last updated this modifier group';

COMMENT ON COLUMN modifiers.created_by IS 'User who created this modifier';
COMMENT ON COLUMN modifiers.updated_by IS 'User who last updated this modifier';

COMMENT ON COLUMN product_categories.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN product_categories.created_by IS 'User who created this category';
COMMENT ON COLUMN product_categories.updated_by IS 'User who last updated this category';

COMMENT ON COLUMN inventory_categories.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN inventory_categories.created_by IS 'User who created this category';
COMMENT ON COLUMN inventory_categories.updated_by IS 'User who last updated this category';

COMMENT ON COLUMN payment_types.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN payment_types.created_by IS 'User who created this payment type';
COMMENT ON COLUMN payment_types.updated_by IS 'User who last updated this payment type';
