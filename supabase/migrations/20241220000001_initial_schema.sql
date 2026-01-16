-- Tindera Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================
-- USER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHOPS (without RLS policies yet)
-- =============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  currency_code TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- SHOP USERS (Many-to-Many with roles)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_users (
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, user_id)
);

-- =============================================
-- Now add RLS policies (after both tables exist)
-- =============================================

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS for shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shops they belong to"
  ON shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = shops.id
      AND shop_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and owners can update their shops"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = shops.id
      AND shop_users.user_id = auth.uid()
      AND shop_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete their shops"
  ON shops FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = shops.id
      AND shop_users.user_id = auth.uid()
      AND shop_users.role = 'owner'
    )
  );

-- RLS for shop_users
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shop_users for their shops"
  ON shop_users FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_users.shop_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves as owner when creating shop"
  ON shop_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can manage shop users"
  ON shop_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_users.shop_id
      AND su.user_id = auth.uid()
      AND su.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete shop users"
  ON shop_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_users.shop_id
      AND su.user_id = auth.uid()
      AND su.role = 'owner'
    )
  );

-- =============================================
-- PRODUCT CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories for their shops"
  ON product_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = product_categories.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage categories"
  ON product_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = product_categories.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  remarks TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products for their shops"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = products.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = products.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- PRODUCT ITEMS (Bill of Materials)
-- =============================================
CREATE TABLE IF NOT EXISTS product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID,
  item_name TEXT NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  quantity DECIMAL(10,3) DEFAULT 1,
  uom TEXT DEFAULT 'piece',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage product items for their shops"
  ON product_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_items.product_id
      AND su.user_id = auth.uid()
    )
  );

-- =============================================
-- PRODUCT ADDONS
-- =============================================
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  inventory_item_id UUID,
  item_name TEXT,
  item_cost DECIMAL(10,2) DEFAULT 0,
  quantity DECIMAL(10,3) DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage product addons for their shops"
  ON product_addons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN shop_users su ON su.shop_id = p.shop_id
      WHERE p.id = product_addons.product_id
      AND su.user_id = auth.uid()
    )
  );

-- =============================================
-- PAYMENT TYPES
-- =============================================
CREATE TABLE IF NOT EXISTS payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payment types for their shops"
  ON payment_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = payment_types.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory categories for their shops"
  ON inventory_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = inventory_categories.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY ADJUSTMENT REASONS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_adjustment_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  adjustment_type TEXT CHECK (adjustment_type IN ('increase', 'decrease')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_adjustment_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage adjustment reasons for their shops"
  ON inventory_adjustment_reasons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = inventory_adjustment_reasons.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  uom TEXT DEFAULT 'piece',
  unit_cost DECIMAL(10,2) DEFAULT 0,
  current_count DECIMAL(10,3) DEFAULT 0,
  reorder_level DECIMAL(10,3) DEFAULT 0,
  notes TEXT,
  qty_received_to_date DECIMAL(10,3) DEFAULT 0,
  cost_of_qty_received_to_date DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory items for their shops"
  ON inventory_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = inventory_items.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('receipt', 'issue', 'sale', 'adjustment', 'countAdjustment')),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  transaction_on TIMESTAMPTZ DEFAULT NOW(),
  quantity_in DECIMAL(10,3) DEFAULT 0,
  quantity_out DECIMAL(10,3) DEFAULT 0,
  reference TEXT,
  notes TEXT,
  adjustment_reason_id UUID REFERENCES inventory_adjustment_reasons(id),
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory transactions for their shops"
  ON inventory_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = inventory_transactions.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY COUNTS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  count_date DATE NOT NULL,
  count_type TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory counts for their shops"
  ON inventory_counts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = inventory_counts.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- INVENTORY COUNT ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  expected_count DECIMAL(10,3) DEFAULT 0,
  actual_count DECIMAL(10,3) DEFAULT 0,
  variance DECIMAL(10,3) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory count items"
  ON inventory_count_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM inventory_counts ic
      JOIN shop_users su ON su.shop_id = ic.shop_id
      WHERE ic.id = inventory_count_items.count_id
      AND su.user_id = auth.uid()
    )
  );

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  total_sale DECIMAL(10,2) DEFAULT 0,
  served_by_id UUID REFERENCES auth.users(id),
  dispatched_by_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_reference TEXT,
  payment_type_id UUID REFERENCES payment_types(id),
  payment_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orders for their shops"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = orders.shop_id
      AND shop_users.user_id = auth.uid()
    )
  );

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_unit_price DECIMAL(10,2) NOT NULL,
  product_category TEXT,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE o.id = order_items.order_id
      AND su.user_id = auth.uid()
    )
  );

-- =============================================
-- ORDER ITEM ADDONS
-- =============================================
CREATE TABLE IF NOT EXISTS order_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0,
  item_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage order item addons"
  ON order_item_addons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE oi.id = order_item_addons.order_item_id
      AND su.user_id = auth.uid()
    )
  );

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_shop_users_user_id ON shop_users(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_users_shop_id ON shop_users(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_id ON inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_shop_id ON inventory_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);

-- =============================================
-- TRIGGER: Auto-create user profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Done!
-- =============================================
