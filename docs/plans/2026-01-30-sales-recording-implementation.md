# Sales Recording & Order History - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete sales recording (tax, discount, tip) and a Sales page for viewing, searching, voiding, and refunding past orders.

**Architecture:** Supabase DB migrations for new tables/columns, service layer for CRUD operations, TanStack Query hooks for data fetching, Ionic React pages/components for UI. Follows existing patterns: `ApiResponse<T>` service return type, `useQuery`/`useMutation` hooks, styled-components for custom styling, BaseModal for modals.

**Tech Stack:** React 19, Ionic React 8, Supabase (Postgres + RLS), TanStack Query, styled-components, react-hook-form, TypeScript 5.9, Vitest

**Design Doc:** `docs/plans/2026-01-28-sales-recording-design.md`

---

## Phase 1: Database Migrations

### Task 1: Add order_prefix to shops table

**Files:**
- Create: `supabase/migrations/20260130000001_add_shop_order_prefix.sql`

**Step 1: Write the migration**

```sql
-- Add order prefix for order number display (e.g., "PC", "CAFE")
ALTER TABLE shops
ADD COLUMN order_prefix VARCHAR(10);

COMMENT ON COLUMN shops.order_prefix IS 'Prefix for order numbers, e.g. PC for Potato Corner -> #PC-0001';
```

**Step 2: Push migration to Supabase**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000001_add_shop_order_prefix.sql
git commit -m "feat(db): add order_prefix column to shops table"
```

---

### Task 2: Create shop_taxes table

**Files:**
- Create: `supabase/migrations/20260130000002_create_shop_taxes.sql`

**Step 1: Write the migration**

```sql
-- Shop Taxes: Multiple tax rates per shop (e.g., State Tax 6%, City Tax 2%)
-- Template defaults are created with rate = 0 when a new shop is created.
-- Shop owners update the rates in Settings > Taxes.

CREATE TABLE IF NOT EXISTS shop_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(shop_id, name)
);

CREATE INDEX IF NOT EXISTS idx_shop_taxes_shop_id ON shop_taxes(shop_id);

-- Row Level Security
ALTER TABLE shop_taxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shop taxes for their shops" ON shop_taxes;
CREATE POLICY "Users can view shop taxes for their shops"
  ON shop_taxes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_taxes.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage shop taxes for their shops" ON shop_taxes;
CREATE POLICY "Users can manage shop taxes for their shops"
  ON shop_taxes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = shop_taxes.shop_id
      AND su.user_id = auth.uid()
    )
  );

COMMENT ON TABLE shop_taxes IS 'Multiple tax rates per shop. Template defaults created at rate=0 for new shops.';
COMMENT ON COLUMN shop_taxes.rate IS 'Tax rate as decimal, e.g. 0.0600 for 6%';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000002_create_shop_taxes.sql
git commit -m "feat(db): create shop_taxes table with RLS"
```

---

### Task 3: Create discount_types table

**Files:**
- Create: `supabase/migrations/20260130000003_create_discount_types.sql`

**Step 1: Write the migration**

```sql
-- Discount Types: Configurable discount types with system defaults
-- System defaults have shop_id = NULL and is_system = true

CREATE TABLE IF NOT EXISTS discount_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_discount_types_shop_id ON discount_types(shop_id);

-- Row Level Security
ALTER TABLE discount_types ENABLE ROW LEVEL SECURITY;

-- Users can view system defaults (shop_id IS NULL) OR their shop's types
DROP POLICY IF EXISTS "Users can view discount types" ON discount_types;
CREATE POLICY "Users can view discount types"
  ON discount_types FOR SELECT
  USING (
    shop_id IS NULL
    OR EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = discount_types.shop_id
      AND su.user_id = auth.uid()
    )
  );

-- Users can only manage their shop's custom types (not system defaults)
DROP POLICY IF EXISTS "Users can manage discount types for their shops" ON discount_types;
CREATE POLICY "Users can manage discount types for their shops"
  ON discount_types FOR ALL
  USING (
    shop_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = discount_types.shop_id
      AND su.user_id = auth.uid()
    )
  );

-- System defaults
INSERT INTO discount_types (shop_id, name, is_system) VALUES
  (NULL, 'Senior Discount', true),
  (NULL, 'Loyalty Reward', true),
  (NULL, 'Promo Code', true),
  (NULL, 'Manager Override', true),
  (NULL, 'Other', true);

COMMENT ON TABLE discount_types IS 'Configurable discount types. System defaults have shop_id=NULL.';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000003_create_discount_types.sql
git commit -m "feat(db): create discount_types table with system defaults"
```

---

### Task 4: Create void_refund_reasons table

**Files:**
- Create: `supabase/migrations/20260130000004_create_void_refund_reasons.sql`

**Step 1: Write the migration**

```sql
-- Void/Refund Reasons: Shared reasons for void and refund operations
-- System defaults have shop_id = NULL and is_system = true

CREATE TABLE IF NOT EXISTS void_refund_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_void_refund_reasons_shop_id ON void_refund_reasons(shop_id);

-- Row Level Security
ALTER TABLE void_refund_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view void refund reasons" ON void_refund_reasons;
CREATE POLICY "Users can view void refund reasons"
  ON void_refund_reasons FOR SELECT
  USING (
    shop_id IS NULL
    OR EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = void_refund_reasons.shop_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage void refund reasons for their shops" ON void_refund_reasons;
CREATE POLICY "Users can manage void refund reasons for their shops"
  ON void_refund_reasons FOR ALL
  USING (
    shop_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM shop_users su
      WHERE su.shop_id = void_refund_reasons.shop_id
      AND su.user_id = auth.uid()
    )
  );

-- System defaults
INSERT INTO void_refund_reasons (shop_id, name, is_system) VALUES
  (NULL, 'Customer Request', true),
  (NULL, 'Wrong Order', true),
  (NULL, 'Quality Issue', true),
  (NULL, 'Duplicate Order', true),
  (NULL, 'Test Order', true),
  (NULL, 'Manager Override', true),
  (NULL, 'Other', true);

COMMENT ON TABLE void_refund_reasons IS 'Shared reasons for void and refund operations.';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000004_create_void_refund_reasons.sql
git commit -m "feat(db): create void_refund_reasons table with system defaults"
```

---

### Task 5: Add new columns to orders table

**Files:**
- Create: `supabase/migrations/20260130000005_add_order_sales_columns.sql`

**Step 1: Write the migration**

```sql
-- Add sales recording columns to orders table
-- Adds: order_number, status, discount, tip, refund, void fields

-- Order number (sequential per shop, populated by trigger)
ALTER TABLE orders ADD COLUMN order_number INTEGER;

-- Order status enum and column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('completed', 'voided', 'refunded');
  END IF;
END
$$;

ALTER TABLE orders ADD COLUMN status order_status NOT NULL DEFAULT 'completed';

-- Discount fields
ALTER TABLE orders ADD COLUMN discount_type_id UUID REFERENCES discount_types(id);
ALTER TABLE orders ADD COLUMN discount_method VARCHAR(10) CHECK (discount_method IN ('percentage', 'fixed'));
ALTER TABLE orders ADD COLUMN discount_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2);

-- Tip fields
ALTER TABLE orders ADD COLUMN tip_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN tip_recipient_id UUID REFERENCES auth.users(id);

-- Refund fields
ALTER TABLE orders ADD COLUMN refund_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN refund_reason_id UUID REFERENCES void_refund_reasons(id);
ALTER TABLE orders ADD COLUMN refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN refunded_by UUID REFERENCES auth.users(id);

-- Void fields
ALTER TABLE orders ADD COLUMN void_reason_id UUID REFERENCES void_refund_reasons(id);
ALTER TABLE orders ADD COLUMN voided_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN voided_by UUID REFERENCES auth.users(id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_shop_order_number ON orders(shop_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_shop_date ON orders(shop_id, order_date DESC);

COMMENT ON COLUMN orders.order_number IS 'Sequential order number per shop, auto-generated by trigger';
COMMENT ON COLUMN orders.status IS 'Order lifecycle: completed -> voided or refunded';
COMMENT ON COLUMN orders.discount_method IS 'percentage or fixed';
COMMENT ON COLUMN orders.discount_value IS 'Input value (e.g., 10 for 10% or $10)';
COMMENT ON COLUMN orders.discount_amount IS 'Calculated dollar amount of discount';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000005_add_order_sales_columns.sql
git commit -m "feat(db): add order status, discount, tip, void, refund columns"
```

---

### Task 6: Create order_taxes table

**Files:**
- Create: `supabase/migrations/20260130000006_create_order_taxes.sql`

**Step 1: Write the migration**

```sql
-- Order Taxes: Tax breakdown per order (denormalized for historical accuracy)

CREATE TABLE IF NOT EXISTS order_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_tax_id UUID REFERENCES shop_taxes(id),
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_order_taxes_order_id ON order_taxes(order_id);

-- Row Level Security
ALTER TABLE order_taxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order taxes for their shops" ON order_taxes;
CREATE POLICY "Users can view order taxes for their shops"
  ON order_taxes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE o.id = order_taxes.order_id
      AND su.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage order taxes for their shops" ON order_taxes;
CREATE POLICY "Users can manage order taxes for their shops"
  ON order_taxes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shop_users su ON su.shop_id = o.shop_id
      WHERE o.id = order_taxes.order_id
      AND su.user_id = auth.uid()
    )
  );

COMMENT ON TABLE order_taxes IS 'Tax breakdown per order. Denormalized from shop_taxes for historical accuracy.';
COMMENT ON COLUMN order_taxes.tax_name IS 'Denormalized tax name at time of order';
COMMENT ON COLUMN order_taxes.tax_rate IS 'Denormalized tax rate at time of order';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260130000006_create_order_taxes.sql
git commit -m "feat(db): create order_taxes table with RLS"
```

---

### Task 7: Add order number auto-generation trigger

**Files:**
- Create: `supabase/migrations/20260130000007_add_order_number_trigger.sql`

**Step 1: Write the migration**

```sql
-- Auto-generate sequential order numbers per shop

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO NEW.order_number
  FROM orders
  WHERE shop_id = NEW.shop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

COMMENT ON FUNCTION generate_order_number IS 'Auto-generates sequential order numbers per shop';
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Regenerate TypeScript types**

Run: `npm run db:types`
Expected: `src/types/supabase.generated.ts` updated with new tables/columns

**Step 4: Commit**

```bash
git add supabase/migrations/20260130000007_add_order_number_trigger.sql src/types/supabase.generated.ts
git commit -m "feat(db): add order number auto-generation trigger"
```

---

## Phase 2: TypeScript Types

### Task 8: Add new type definitions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/types/enums.ts`

**Step 1: Add OrderStatus enum to enums.ts**

Add to `src/types/enums.ts`:

```typescript
export enum OrderStatus {
  Completed = 'completed',
  Voided = 'voided',
  Refunded = 'refunded',
}
```

**Step 2: Add new types to index.ts**

Add after the `// ===== Shop Types =====` section in `src/types/index.ts`:

```typescript
// ===== Shop Tax Types =====

export interface ShopTax extends Auditable {
  id: string;
  shop_id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

export type ShopTaxInsert = Omit<ShopTax, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
export type ShopTaxUpdate = Partial<Omit<ShopTaxInsert, 'shop_id'>>;

// ===== Discount Type Types =====

export interface DiscountType extends Auditable {
  id: string;
  shop_id: string | null;
  name: string;
  is_system: boolean;
  is_active: boolean;
}

export type DiscountTypeInsert = Omit<DiscountType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'is_system'>;
export type DiscountTypeUpdate = Partial<Omit<DiscountTypeInsert, 'shop_id'>>;

// ===== Void/Refund Reason Types =====

export interface VoidRefundReason extends Auditable {
  id: string;
  shop_id: string | null;
  name: string;
  is_system: boolean;
  is_active: boolean;
}

export type VoidRefundReasonInsert = Omit<VoidRefundReason, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'is_system'>;

// ===== Order Tax Types =====

export interface OrderTax extends Auditable {
  id: string;
  order_id: string;
  shop_tax_id: string | null;
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
}
```

**Step 3: Update the Order interface**

Update the existing `Order` interface in `src/types/index.ts` to add the new fields:

```typescript
export interface Order extends Auditable {
  id: string;
  shop_id: string;
  order_date: string;
  order_number: number | null;
  status: string;  // 'completed' | 'voided' | 'refunded'
  total_sale: number;
  served_by_id: string | null;
  dispatched_by_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_reference: string | null;
  payment_type_id: string | null;
  payment_received: boolean;
  payment_amount_received: number | null;
  payment_change: number | null;
  // Discount fields
  discount_type_id: string | null;
  discount_method: string | null;  // 'percentage' | 'fixed'
  discount_value: number | null;
  discount_amount: number | null;
  // Tip fields
  tip_amount: number | null;
  tip_recipient_id: string | null;
  // Refund fields
  refund_amount: number | null;
  refund_reason_id: string | null;
  refunded_at: string | null;
  refunded_by: string | null;
  // Void fields
  void_reason_id: string | null;
  voided_at: string | null;
  voided_by: string | null;
}
```

**Step 4: Update OrderWithDetails to include taxes**

```typescript
export interface OrderWithDetails extends Order {
  payment_type: PaymentType | null;
  order_items: OrderItemWithDetails[];
  order_taxes: OrderTax[];
}

export interface OrderItemWithDetails extends OrderItem {
  modifiers: OrderItemModifier[];
  addons: OrderItemAddon[];
}
```

**Step 5: Update Shop interface to include order_prefix**

Add `order_prefix` to the existing `Shop` interface:

```typescript
export interface Shop extends Auditable {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  currency_code: string;
  image_url: string | null;
  order_prefix: string | null;
}
```

**Step 6: Update CreateOrderData**

Update `CreateOrderData` in `src/types/index.ts`:

```typescript
export interface CreateOrderData {
  shop_id: string;
  order_date: string;
  total_sale: number;
  served_by_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_type_id: string | null;
  payment_received: boolean;
  payment_amount_received: number | null;
  payment_change: number | null;
  items: CartItem[];
  // Tax breakdown
  taxes: Array<{
    shop_tax_id: string;
    tax_name: string;
    tax_rate: number;
    tax_amount: number;
  }>;
  // Discount
  discount_type_id: string | null;
  discount_method: string | null;
  discount_value: number | null;
  discount_amount: number | null;
  // Tip
  tip_amount: number | null;
  tip_recipient_id: string | null;
}
```

**Step 7: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors (existing code that uses `tax: number`, `discount: number`, `tip: number` on CreateOrderData will need updating in Phase 6 — that's expected at this point)

**Step 8: Commit**

```bash
git add src/types/index.ts src/types/enums.ts
git commit -m "feat(types): add sales recording types (ShopTax, DiscountType, OrderTax, OrderStatus)"
```

---

## Phase 3: New Services

### Task 9: Create shopTax service

**Files:**
- Create: `src/services/shopTax.service.ts`

**Step 1: Write the service**

Follow the pattern from `src/services/shop.service.ts`. The service should export `shopTaxService` with methods:

- `getShopTaxes(shopId: string)` - Fetch active taxes for a shop, ordered by name
- `createShopTax(shopId: string, name: string, rate: number, userId: string)` - Create a new tax
- `updateShopTax(taxId: string, updates: ShopTaxUpdate, userId: string)` - Update a tax (name, rate, is_active)
- `deleteShopTax(taxId: string)` - Delete a tax

All methods return `ApiResponse<T>`. Use `logger.error()` for error logging. Use `supabase` client.

**Step 2: Write unit test**

Create `src/services/__tests__/shopTax.service.test.ts`:
- Test that methods exist and are callable
- Mock supabase calls
- Test error handling returns proper ApiResponse

**Step 3: Run tests**

Run: `npx vitest run src/services/__tests__/shopTax.service.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/services/shopTax.service.ts src/services/__tests__/shopTax.service.test.ts
git commit -m "feat(services): add shopTax service for CRUD operations"
```

---

### Task 10: Create discountType service

**Files:**
- Create: `src/services/discountType.service.ts`

**Step 1: Write the service**

Export `discountTypeService` with methods:

- `getDiscountTypes(shopId: string)` - Fetch system defaults (`shop_id IS NULL`) AND shop-specific types, ordered by name. Filter to `is_active = true`.
- `createDiscountType(shopId: string, name: string, userId: string)` - Create a shop-specific type
- `updateDiscountType(typeId: string, updates: DiscountTypeUpdate, userId: string)` - Update a type
- `deleteDiscountType(typeId: string)` - Delete a custom type (service should not allow deleting system types)

For `getDiscountTypes`, use `.or('shop_id.is.null,shop_id.eq.${shopId}')` to fetch both system defaults and shop-specific types.

**Step 2: Write unit test**

Create `src/services/__tests__/discountType.service.test.ts`

**Step 3: Run tests**

Run: `npx vitest run src/services/__tests__/discountType.service.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/services/discountType.service.ts src/services/__tests__/discountType.service.test.ts
git commit -m "feat(services): add discountType service"
```

---

### Task 11: Create voidRefundReason service

**Files:**
- Create: `src/services/voidRefundReason.service.ts`

**Step 1: Write the service**

Export `voidRefundReasonService` with methods:

- `getReasons(shopId: string)` - Fetch system defaults AND shop-specific reasons, active only, ordered by name
- `createReason(shopId: string, name: string, userId: string)` - Create a shop-specific reason
- `updateReason(reasonId: string, updates: { name?: string; is_active?: boolean }, userId: string)` - Update
- `deleteReason(reasonId: string)` - Delete custom reason

Same pattern as discountType service. Use `.or()` for fetching both system and shop-specific.

**Step 2: Write unit test**

Create `src/services/__tests__/voidRefundReason.service.test.ts`

**Step 3: Run tests and commit**

```bash
git add src/services/voidRefundReason.service.ts src/services/__tests__/voidRefundReason.service.test.ts
git commit -m "feat(services): add voidRefundReason service"
```

---

### Task 12: Update order service with sales recording

**Files:**
- Modify: `src/services/order.service.ts`

**Step 1: Update createOrder to handle tax breakdown, discount, and tip**

In the order insert (Step 2 of createOrder, around line 62), add the new fields from `CreateOrderData`:

```typescript
// In the .insert() call, add:
status: 'completed',
discount_type_id: orderData.discount_type_id,
discount_method: orderData.discount_method,
discount_value: orderData.discount_value,
discount_amount: orderData.discount_amount,
tip_amount: orderData.tip_amount,
tip_recipient_id: orderData.tip_recipient_id,
```

After Step 3 (create order items), add a new step to create order_taxes:

```typescript
// STEP 3.5: Create order tax breakdown
if (orderData.taxes && orderData.taxes.length > 0) {
  const orderTaxes = orderData.taxes.map(tax => ({
    order_id: order.id,
    shop_tax_id: tax.shop_tax_id,
    tax_name: tax.tax_name,
    tax_rate: tax.tax_rate,
    tax_amount: tax.tax_amount,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
  }));

  const { error: taxError } = await supabase
    .from('order_taxes')
    .insert(orderTaxes);

  if (taxError) {
    await supabase.from('orders').delete().eq('id', order.id);
    return { data: null, error: new Error(`Failed to create order taxes: ${taxError.message}`) };
  }
}
```

**Step 2: Add getOrders method**

Add to `orderService`:

```typescript
async getOrders(shopId: string, options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<OrderWithDetails[]>> {
  // Build query with order_items, order_item_modifiers, order_item_addons, order_taxes, payment_type
  // Filter by status if provided
  // Search by order_number if search term is numeric
  // Order by order_date DESC
}
```

**Step 3: Add getOrder method (single order with full details)**

```typescript
async getOrder(orderId: string): Promise<ApiResponse<OrderWithDetails>> {
  // Fetch order with:
  // - payment_type (via payment_types join)
  // - order_items with modifiers and addons
  // - order_taxes
}
```

**Step 4: Add voidOrder method**

```typescript
async voidOrder(orderId: string, reasonId: string, userId: string): Promise<ApiResponse<Order>> {
  // Validate order exists and status is 'completed'
  // Update: status='voided', void_reason_id, voided_at=now(), voided_by
}
```

**Step 5: Add refundOrder method**

```typescript
async refundOrder(
  orderId: string,
  amount: number,
  reasonId: string,
  userId: string
): Promise<ApiResponse<Order>> {
  // Validate order exists and status is 'completed'
  // Validate amount <= total_sale
  // Update: status='refunded', refund_amount, refund_reason_id, refunded_at=now(), refunded_by
}
```

**Step 6: Write unit tests**

Create/update `src/services/__tests__/order.service.test.ts` to test the new methods.

**Step 7: Run tests and commit**

```bash
git add src/services/order.service.ts src/services/__tests__/order.service.test.ts
git commit -m "feat(services): update order service with tax, void, refund operations"
```

---

## Phase 4: React Query Hooks

### Task 13: Create useShopTaxes hook

**Files:**
- Create: `src/hooks/useShopTaxes.ts`

**Step 1: Write the hook**

Follow the pattern from `src/hooks/useOrder.ts`. Export:

- `shopTaxKeys` - Query key factory (`all`, `list(shopId)`)
- `useShopTaxes()` - `useQuery` that fetches active taxes for current shop
- `useCreateShopTax()` - `useMutation` that creates a tax and invalidates cache
- `useUpdateShopTax()` - `useMutation` that updates and invalidates
- `useDeleteShopTax()` - `useMutation` that deletes and invalidates

All mutations should call `queryClient.invalidateQueries({ queryKey: shopTaxKeys.all })` on success.

**Step 2: Add export to hooks/index.ts**

Add `export * from './useShopTaxes';` to `src/hooks/index.ts`.

**Step 3: Commit**

```bash
git add src/hooks/useShopTaxes.ts src/hooks/index.ts
git commit -m "feat(hooks): add useShopTaxes hook"
```

---

### Task 14: Create useDiscountTypes hook

**Files:**
- Create: `src/hooks/useDiscountTypes.ts`

**Step 1: Write the hook**

Export:
- `discountTypeKeys` - Query key factory
- `useDiscountTypes()` - Fetches system defaults + shop types
- `useCreateDiscountType()` - Creates shop-specific type
- `useUpdateDiscountType()` - Updates type
- `useDeleteDiscountType()` - Deletes custom type

**Step 2: Add export to hooks/index.ts**

**Step 3: Commit**

```bash
git add src/hooks/useDiscountTypes.ts src/hooks/index.ts
git commit -m "feat(hooks): add useDiscountTypes hook"
```

---

### Task 15: Create useVoidRefundReasons hook

**Files:**
- Create: `src/hooks/useVoidRefundReasons.ts`

**Step 1: Write the hook**

Export:
- `voidRefundReasonKeys`
- `useVoidRefundReasons()`
- `useCreateVoidRefundReason()`
- `useUpdateVoidRefundReason()`
- `useDeleteVoidRefundReason()`

**Step 2: Add export to hooks/index.ts**

**Step 3: Commit**

```bash
git add src/hooks/useVoidRefundReasons.ts src/hooks/index.ts
git commit -m "feat(hooks): add useVoidRefundReasons hook"
```

---

### Task 16: Update useOrder hook with new queries and mutations

**Files:**
- Modify: `src/hooks/useOrder.ts`

**Step 1: Add order query keys**

Update `orderKeys`:

```typescript
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (shopId: string, filters?: Record<string, unknown>) =>
    [...orderKeys.lists(), shopId, filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
  paymentTypes: (shopId: string) => [...orderKeys.all, 'payment-types', shopId] as const,
};
```

**Step 2: Add useOrders hook**

```typescript
export function useOrders(options?: { status?: string; search?: string }) {
  const { currentShop } = useShopContext();
  // useQuery that calls orderService.getOrders(currentShop.id, options)
}
```

**Step 3: Add useOrder hook (single order)**

```typescript
export function useOrderDetail(orderId: string) {
  // useQuery that calls orderService.getOrder(orderId)
}
```

**Step 4: Add useVoidOrder mutation**

```typescript
export function useVoidOrder() {
  // useMutation that calls orderService.voidOrder
  // Invalidate order list and detail on success
}
```

**Step 5: Add useRefundOrder mutation**

```typescript
export function useRefundOrder() {
  // useMutation that calls orderService.refundOrder
  // Invalidate order list and detail on success
}
```

**Step 6: Commit**

```bash
git add src/hooks/useOrder.ts
git commit -m "feat(hooks): add order list, detail, void, refund hooks"
```

---

## Phase 5: Settings Page Updates

### Task 17: Create TaxSettings component

**Files:**
- Create: `src/pages/Settings/components/TaxSettings.tsx`

**Step 1: Build the component**

A card-based section for managing shop taxes. Uses `useShopTaxes()` hook. Features:
- List of taxes with name, rate (displayed as percentage), active toggle
- "Add Tax" button opens inline form or modal (name + rate fields)
- Edit existing tax (inline or modal)
- Delete button for custom taxes
- Uses Ionic components: `IonCard`, `IonCardContent`, `IonList`, `IonItem`, `IonLabel`, `IonToggle`

Follow the existing Settings page pattern with `IonCard` sections.

**Step 2: Commit**

```bash
git add src/pages/Settings/components/TaxSettings.tsx
git commit -m "feat(settings): add TaxSettings component"
```

---

### Task 18: Create DiscountTypeSettings component

**Files:**
- Create: `src/pages/Settings/components/DiscountTypeSettings.tsx`

**Step 1: Build the component**

Similar to TaxSettings. Uses `useDiscountTypes()`. Features:
- List of discount types (system defaults shown with badge, non-deletable)
- Add custom type
- Toggle active/inactive for any type
- Delete custom types only

**Step 2: Commit**

```bash
git add src/pages/Settings/components/DiscountTypeSettings.tsx
git commit -m "feat(settings): add DiscountTypeSettings component"
```

---

### Task 19: Create VoidRefundReasonSettings component

**Files:**
- Create: `src/pages/Settings/components/VoidRefundReasonSettings.tsx`

**Step 1: Build the component**

Same pattern. Uses `useVoidRefundReasons()`. System defaults shown with badge, custom reasons editable/deletable.

**Step 2: Commit**

```bash
git add src/pages/Settings/components/VoidRefundReasonSettings.tsx
git commit -m "feat(settings): add VoidRefundReasonSettings component"
```

---

### Task 20: Wire settings components into SettingsPage

**Files:**
- Modify: `src/pages/Settings/SettingsPage.tsx`
- Create: `src/pages/Settings/components/index.ts`

**Step 1: Create barrel export**

```typescript
// src/pages/Settings/components/index.ts
export { default as TaxSettings } from './TaxSettings';
export { default as DiscountTypeSettings } from './DiscountTypeSettings';
export { default as VoidRefundReasonSettings } from './VoidRefundReasonSettings';
```

**Step 2: Update SettingsPage**

Add imports and render the three new components as sections between "Shop Settings" and "Danger Zone":

```tsx
{/* Tax Settings */}
<IonTitle>Tax Configuration</IonTitle>
<TaxSettings />

{/* Discount Types */}
<IonTitle>Discount Types</IonTitle>
<DiscountTypeSettings />

{/* Void/Refund Reasons */}
<IonTitle>Void & Refund Reasons</IonTitle>
<VoidRefundReasonSettings />
```

**Step 3: Add order_prefix to shop form**

Update `src/pages/Shop/ShopFormPage.tsx` to include an `order_prefix` field (TextField, optional, max 10 chars). This uses the existing form pattern.

**Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/pages/Settings/ src/pages/Shop/ShopFormPage.tsx
git commit -m "feat(settings): wire tax, discount, reason settings into Settings page"
```

---

## Phase 6: Checkout Flow Updates

### Task 21: Update checkout with tax breakdown support

**Files:**
- Modify: `src/hooks/useCart.ts`
- Modify: `src/components/pos/CheckoutModal.tsx`
- Modify: `src/components/pos/OrderTotals.tsx`

**Step 1: Update useCart for multi-tax support**

Update `CartTotals` interface and `useCart` to accept shop taxes and compute per-tax amounts:

```typescript
export interface CartTotals {
  subtotal: number;
  taxes: Array<{ name: string; rate: number; amount: number; shop_tax_id: string }>;
  totalTax: number;
  discount: number;
  discountPercent: number;
  tip: number;
  total: number;
}
```

Update `UseCartOptions` to accept `shopTaxes: ShopTax[]` instead of `taxRate: number`.

Compute each tax independently: `tax_amount = (subtotal - discount) * rate`.

Keep backward compatibility: if `taxRate` is provided (legacy), use the old calculation.

**Step 2: Update OrderTotals component**

Update `src/components/pos/OrderTotals.tsx` to render each tax line individually instead of a single tax line:

```
Subtotal               $100.00
State Tax (6%)           $6.00
City Tax (2%)            $2.00
Discount (Senior -10%) -$10.00
Tip                      $2.00
─────────────────────────────
Total                   $98.00
```

**Step 3: Add discount and tip sections to CheckoutModal**

Add before the payment method section:
- **Discount Section** (optional, collapsible):
  - Dropdown: Select discount type (from `useDiscountTypes()`)
  - Toggle: Percentage / Fixed
  - Input: Value
  - Display: Calculated discount amount
- **Tip Section** (optional):
  - Input: Tip amount
  - Recipient defaults to current user

**Step 4: Update CheckoutModal's onSubmit to pass new CreateOrderData**

Build the `taxes` array from shop taxes, pass discount and tip fields.

**Step 5: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/hooks/useCart.ts src/components/pos/CheckoutModal.tsx src/components/pos/OrderTotals.tsx
git commit -m "feat(checkout): add multi-tax breakdown, discount, and tip support"
```

---

## Phase 7: Sales Page

### Task 22: Create SalesListPage with responsive layout ✅ COMPLETED

**Files:**
- Create: `src/pages/Sales/SalesListPage.tsx` ✅
- Create: `src/pages/Sales/index.ts` ✅

**Step 1: Create barrel export** ✅

```typescript
// src/pages/Sales/index.ts
export { default as SalesListPage } from './SalesListPage';
```

**Step 2: Build SalesListPage** ✅

The main sales page with responsive split-pane layout. Uses:
- `useOrders()` for fetching orders
- `useBreakpoint()` for responsive behavior
- `IonPage`, `IonContent`, `PageHeader`
- Desktop: left panel (order list) + right panel (order detail)
- Mobile: full-width list, tapping navigates to detail page

Structure:
```tsx
<IonPage>
  <PageHeader title="Sales" />
  <IonContent>
    {isDesktop ? (
      <SplitPaneLayout>
        <LeftPanel>
          <SearchBar />
          <FilterTabs /> {/* All | Paid | Cancelled | Refunded */}
          <OrderList onSelect={setSelectedOrder} />
        </LeftPanel>
        <RightPanel>
          <OrderDetail order={selectedOrder} />
        </RightPanel>
      </SplitPaneLayout>
    ) : (
      <MobileLayout>
        <SearchBar />
        <FilterTabs />
        <OrderList onSelect={navigateToDetail} />
      </MobileLayout>
    )}
  </IonContent>
</IonPage>
```

**Step 3: Commit** ✅

Committed: `785f5f6 - feat(sales): create SalesListPage with responsive layout`

```bash
git add src/pages/Sales/
git commit -m "feat(sales): create SalesListPage with responsive layout"
```

---

### Task 23: Create OrderCard component

**Files:**
- Create: `src/pages/Sales/components/OrderCard.tsx`

**Step 1: Build the component**

Displays a single order card in the list:
```
┌────────────────────────────────────────┐
│ #PC-0012                       $12.50 │
│ 10:42 AM . Jane Doe          3 items │
│ Paid                                  │
└────────────────────────────────────────┘
```

Props: `order: OrderWithDetails`, `isSelected: boolean`, `onClick: () => void`, `shopPrefix: string | null`

Uses styled-components. Status badge uses colors:
- completed -> green "Paid"
- voided -> red "Cancelled"
- refunded -> orange "Refunded"

Format order number: `#{prefix}-{order_number padded to 4 digits}` (e.g., #PC-0012)

**Step 2: Commit**

```bash
git add src/pages/Sales/components/OrderCard.tsx
git commit -m "feat(sales): create OrderCard component"
```

---

### Task 24: Create OrderList component

**Files:**
- Create: `src/pages/Sales/components/OrderList.tsx`

**Step 1: Build the component**

Scrollable list of OrderCard components. Props:
- `orders: OrderWithDetails[]`
- `selectedOrderId?: string`
- `onSelect: (order: OrderWithDetails) => void`
- `isLoading: boolean`

Show loading state with `PageLoadingState` when fetching. Show empty state when no orders match filter.

**Step 2: Commit**

```bash
git add src/pages/Sales/components/OrderList.tsx
git commit -m "feat(sales): create OrderList component"
```

---

### Task 25: Create OrderDetail component (receipt-style)

**Files:**
- Create: `src/pages/Sales/components/OrderDetail.tsx`

**Step 1: Build the component**

Receipt-style order detail view. Props: `order: OrderWithDetails | null`, `shop: Shop`, `onVoid: () => void`, `onRefund: () => void`

Layout follows the design doc receipt mockup:
1. Shop header (name, location)
2. Order ID + date
3. Status badge
4. Line items with modifiers/addons
5. Subtotal, tax breakdown (each tax line), discount, tip
6. Total
7. Payment method
8. Action buttons: Print, Email, Issue Refund, Void Order

Conditional rendering:
- Hide Void/Refund if already voided/refunded
- Show void/refund info section if applicable (reason, who, when)

Uses styled-components for receipt styling.

**Step 2: Commit**

```bash
git add src/pages/Sales/components/OrderDetail.tsx
git commit -m "feat(sales): create OrderDetail receipt-style component"
```

---

### Task 26: Create OrderDetailPage (mobile full-page view)

**Files:**
- Create: `src/pages/Sales/components/OrderDetailPage.tsx`

**Step 1: Build the component**

Mobile full-page version of OrderDetail. Uses `useParams()` to get orderId from route, `useOrderDetail()` to fetch. Wraps OrderDetail in `IonPage` with back button.

```tsx
const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId);
  const { currentShop } = useShop();
  // ... render with IonPage, PageHeader with back button, OrderDetail
};
```

**Step 2: Commit**

```bash
git add src/pages/Sales/components/OrderDetailPage.tsx
git commit -m "feat(sales): create OrderDetailPage for mobile"
```

---

### Task 27: Create VoidModal component

**Files:**
- Create: `src/pages/Sales/components/VoidModal.tsx`

**Step 1: Build the component**

Confirmation modal for voiding an order. Uses `BaseModal`.

Props: `isOpen`, `onClose`, `order: OrderWithDetails`, `onSuccess: () => void`

Content:
- Confirmation message: "Are you sure you want to void order #XX-XXXX?"
- Dropdown: Select reason (from `useVoidRefundReasons()`, required)
- Confirm button calls `useVoidOrder()` mutation
- On success: show toast, call onSuccess

**Step 2: Commit**

```bash
git add src/pages/Sales/components/VoidModal.tsx
git commit -m "feat(sales): create VoidModal component"
```

---

### Task 28: Create RefundModal component

**Files:**
- Create: `src/pages/Sales/components/RefundModal.tsx`

**Step 1: Build the component**

Refund modal with amount entry. Uses `BaseModal`.

Props: `isOpen`, `onClose`, `order: OrderWithDetails`, `onSuccess: () => void`

Content:
- Order total display
- Refund amount input (defaults to full amount, can be partial)
- Validation: refund amount <= order total_sale
- Dropdown: Select reason (required)
- Confirm button calls `useRefundOrder()` mutation
- On success: show toast, call onSuccess

**Step 2: Commit**

```bash
git add src/pages/Sales/components/RefundModal.tsx
git commit -m "feat(sales): create RefundModal component"
```

---

### Task 29: Create Sales component barrel exports

**Files:**
- Create: `src/pages/Sales/components/index.ts`
- Modify: `src/pages/Sales/index.ts`

**Step 1: Create barrel exports**

```typescript
// src/pages/Sales/components/index.ts
export { default as OrderList } from './OrderList';
export { default as OrderCard } from './OrderCard';
export { default as OrderDetail } from './OrderDetail';
export { default as OrderDetailPage } from './OrderDetailPage';
export { default as VoidModal } from './VoidModal';
export { default as RefundModal } from './RefundModal';
```

```typescript
// src/pages/Sales/index.ts
export { default as SalesListPage } from './SalesListPage';
export { OrderDetailPage } from './components';
```

**Step 2: Commit**

```bash
git add src/pages/Sales/
git commit -m "feat(sales): add barrel exports for Sales page components"
```

---

## Phase 8: Navigation & Routes

### Task 30: Update navigation and routes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/SideMenu.tsx`

**Step 1: Update SideMenu**

The SideMenu already has a "Sales" menu item at line 100-103 pointing to `/sales`. Update it to use the shop-scoped URL:

```typescript
{
  title: t('navigation.sales'),
  url: currentShop ? `/shops/${currentShop.id}/sales` : '/sales',
  icon: statsChartOutline,
},
```

**Step 2: Add routes to App.tsx**

Add imports and routes:

```tsx
import { SalesListPage, OrderDetailPage } from '@/pages/Sales';

// Inside <Switch>, add before Settings routes:
{/* Sales Routes */}
<Route exact path="/shops/:shopId/sales">
  <AuthGuard>
    <SalesListPage />
  </AuthGuard>
</Route>
<Route exact path="/shops/:shopId/sales/:orderId">
  <AuthGuard>
    <OrderDetailPage />
  </AuthGuard>
</Route>
```

**Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/App.tsx src/components/SideMenu.tsx
git commit -m "feat(nav): add Sales page routes and navigation"
```

---

## Phase 9: Integration Testing & Polish

### Task 31: End-to-end verification

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Run the dev server**

Run: `npm run dev`
Expected: App starts without errors

**Step 4: Manual testing with Playwright**

Test the following flows:
1. Navigate to Settings > verify Tax, Discount, Reason sections appear
2. Add a tax rate (e.g., "Sales Tax" at 6%)
3. Navigate to POS > add items to cart > checkout
4. Verify tax breakdown shows in checkout
5. Add a discount, add a tip, complete order
6. Navigate to Sales page > verify order appears in list
7. Click order > verify receipt detail shows correctly
8. Test void flow on an order
9. Test refund flow on an order
10. Test mobile responsive view

**Step 5: Fix any issues found**

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete sales recording and order history feature"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-7 | Database migrations (7 SQL files) |
| 2 | 8 | TypeScript types |
| 3 | 9-12 | Services (3 new + 1 updated) |
| 4 | 13-16 | React Query hooks (3 new + 1 updated) |
| 5 | 17-20 | Settings page components |
| 6 | 21 | Checkout flow updates |
| 7 | 22-29 | Sales page (8 components) |
| 8 | 30 | Navigation & routes |
| 9 | 31 | Integration testing |

**Total: 31 tasks across 9 phases**

**Dependencies:**
- Phase 1 must complete before Phase 2 (types depend on DB schema)
- Phase 2 must complete before Phase 3 (services use types)
- Phase 3 must complete before Phase 4 (hooks use services)
- Phase 4 must complete before Phases 5, 6, 7 (UI uses hooks)
- Phase 5 is independent of Phases 6 and 7 (can be done in parallel)
- Phase 8 depends on Phase 7 (routes need pages)
- Phase 9 depends on all other phases
