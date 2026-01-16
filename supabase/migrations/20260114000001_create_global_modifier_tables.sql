-- Global Modifier System Migration
-- Creates shop-level modifier groups and modifiers that can be reused across products

-- ============================================================================
-- TABLE: modifier_groups (Shop-Level Modifier Groups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE NOT NULL,
  min_select INT DEFAULT 0 NOT NULL,
  max_select INT,
  sequence INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT check_required_min_select CHECK (NOT is_required OR min_select >= 1),
  CONSTRAINT check_max_greater_than_min CHECK (max_select IS NULL OR max_select >= min_select)
);

-- Index for shop queries
CREATE INDEX IF NOT EXISTS idx_modifier_groups_shop_id ON modifier_groups(shop_id);

-- Row Level Security
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view modifier groups for their shops" ON modifier_groups;
CREATE POLICY "Users can view modifier groups for their shops"
  ON modifier_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = modifier_groups.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage modifier groups for their shops" ON modifier_groups;
CREATE POLICY "Users can manage modifier groups for their shops"
  ON modifier_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = modifier_groups.shop_id
      AND su.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: modifiers (Shop-Level Modifiers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_price_adjustment DECIMAL(10,2) DEFAULT 0 NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,3) DEFAULT 0 NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  sequence INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for group queries
CREATE INDEX IF NOT EXISTS idx_modifiers_group_id ON modifiers(modifier_group_id);

-- Row Level Security
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view modifiers for their shops" ON modifiers;
CREATE POLICY "Users can view modifiers for their shops"
  ON modifiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modifier_groups mg
      JOIN shop_users su ON su.shop_id = mg.shop_id
      WHERE mg.id = modifiers.modifier_group_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage modifiers for their shops" ON modifiers;
CREATE POLICY "Users can manage modifiers for their shops"
  ON modifiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modifier_groups mg
      JOIN shop_users su ON su.shop_id = mg.shop_id
      WHERE mg.id = modifiers.modifier_group_id
      AND su.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: product_modifier_group_links (Junction Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_modifier_group_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE NOT NULL,
  sequence INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(product_id, modifier_group_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pmgl_product_id ON product_modifier_group_links(product_id);
CREATE INDEX IF NOT EXISTS idx_pmgl_modifier_group_id ON product_modifier_group_links(modifier_group_id);

-- Row Level Security
ALTER TABLE product_modifier_group_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view product modifier links for their shops" ON product_modifier_group_links;
CREATE POLICY "Users can view product modifier links for their shops"
  ON product_modifier_group_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_modifier_group_links.product_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage product modifier links for their shops" ON product_modifier_group_links;
CREATE POLICY "Users can manage product modifier links for their shops"
  ON product_modifier_group_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_modifier_group_links.product_id
      AND su.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: product_modifier_price_overrides (Product-Specific Pricing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_modifier_price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  modifier_id UUID REFERENCES modifiers(id) ON DELETE CASCADE NOT NULL,
  price_adjustment DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(product_id, modifier_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pmpo_product_modifier ON product_modifier_price_overrides(product_id, modifier_id);

-- Row Level Security
ALTER TABLE product_modifier_price_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view price overrides for their shops" ON product_modifier_price_overrides;
CREATE POLICY "Users can view price overrides for their shops"
  ON product_modifier_price_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_modifier_price_overrides.product_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage price overrides for their shops" ON product_modifier_price_overrides;
CREATE POLICY "Users can manage price overrides for their shops"
  ON product_modifier_price_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_modifier_price_overrides.product_id
      AND su.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE modifier_groups IS 'Shop-level reusable modifier groups (e.g., Size, Toppings)';
COMMENT ON TABLE modifiers IS 'Individual modifier options within groups (e.g., Small, Medium, Large)';
COMMENT ON TABLE product_modifier_group_links IS 'Junction table linking products to global modifier groups';
COMMENT ON TABLE product_modifier_price_overrides IS 'Product-specific price adjustments for modifiers';

COMMENT ON COLUMN modifiers.default_price_adjustment IS 'Default price adjustment for this modifier. Can be overridden per product.';
COMMENT ON COLUMN product_modifier_price_overrides.price_adjustment IS 'Product-specific price override for this modifier';
