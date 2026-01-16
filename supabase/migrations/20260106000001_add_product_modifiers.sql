-- Migration: Add Product Modifiers System
-- Description: Creates tables for product modifier groups and modifiers to support forced modifier flow in POS
-- Created: 2026-01-06

-- =====================================================
-- Table: product_modifier_groups
-- Description: Groups of related modifiers (e.g., "Choose Cut", "Choose Flavor")
-- =====================================================

CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  min_select INT DEFAULT 0,
  max_select INT DEFAULT 1,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT check_required_min_select CHECK (NOT is_required OR min_select >= 1),
  CONSTRAINT check_max_greater_than_min CHECK (max_select IS NULL OR max_select >= min_select)
);

-- =====================================================
-- Table: product_modifiers
-- Description: Individual modifier options within groups
-- =====================================================

CREATE TABLE IF NOT EXISTS product_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id UUID REFERENCES product_modifier_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,3) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: order_item_modifiers
-- Description: Denormalized modifier selections for order history
-- =====================================================

CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  modifier_group_id UUID NOT NULL,
  modifier_group_name TEXT NOT NULL,
  modifier_id UUID NOT NULL,
  modifier_name TEXT NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  inventory_item_id UUID,
  quantity DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_modifier_groups_product_id ON product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group_id ON product_modifiers(modifier_group_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_order_item ON order_item_modifiers(order_item_id);

-- =====================================================
-- Row-Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- product_modifier_groups: Users can manage modifier groups for their shops
CREATE POLICY "Users can manage modifier groups for their shops"
  ON product_modifier_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_modifier_groups.product_id
      AND su.user_id = auth.uid()
    )
  );

-- product_modifiers: Users can manage modifiers for their shops
CREATE POLICY "Users can manage modifiers for their shops"
  ON product_modifiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM product_modifier_groups pmg
      JOIN products p ON p.id = pmg.product_id
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE pmg.id = product_modifiers.modifier_group_id
      AND su.user_id = auth.uid()
    )
  );

-- order_item_modifiers: Users can manage order item modifiers for their shops
CREATE POLICY "Users can manage order item modifiers"
  ON order_item_modifiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE oi.id = order_item_modifiers.order_item_id
      AND su.user_id = auth.uid()
    )
  );

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE product_modifier_groups IS 'Groups of related modifiers for products (e.g., Choose Cut, Choose Flavor)';
COMMENT ON COLUMN product_modifier_groups.is_required IS 'Whether this modifier group requires selection before adding to cart';
COMMENT ON COLUMN product_modifier_groups.min_select IS 'Minimum number of modifiers that must be selected from this group';
COMMENT ON COLUMN product_modifier_groups.max_select IS 'Maximum number of modifiers that can be selected (NULL = unlimited)';

COMMENT ON TABLE product_modifiers IS 'Individual modifier options within modifier groups';
COMMENT ON COLUMN product_modifiers.price_adjustment IS 'Price change when this modifier is selected (can be positive, negative, or zero)';
COMMENT ON COLUMN product_modifiers.is_default IS 'Whether this modifier should be auto-selected when modal opens';

COMMENT ON TABLE order_item_modifiers IS 'Denormalized modifier selections for order history - preserves modifier data even if product modifiers change';
