# Sales Recording & Order History Design

**Date:** 2026-01-28
**Status:** Approved

## Overview

Enhance the POS system to properly record all sales data (tax, discount, tip) and provide a Sales page to view, search, and manage past orders including void and refund capabilities.

## Goals

1. **Data Integrity** - Persist tax breakdown, discounts, and tips so complete sale records are stored
2. **Order Lifecycle** - Track order status (completed, voided, refunded) with audit trail
3. **Sales Visibility** - View and search past orders with filtering
4. **Order Management** - Void or refund orders with required reasons

## Non-Goals

- Inventory return on void/refund (money only)
- Per-item tax rates (single shop tax rates apply to all items)
- Item-level discounts (order-level only, but schema supports future extension)
- Sales reporting/analytics (separate feature)

---

## Database Schema Changes

### New Tables

#### `shop_taxes`
Multiple tax rates per shop (e.g., State Tax 6%, City Tax 2%).

```sql
CREATE TABLE shop_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "State Tax", "VAT", "City Tax"
  rate DECIMAL(5,4) NOT NULL,            -- 0.0600 for 6%
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(shop_id, name)
);
```

#### `discount_types`
Configurable discount types with system defaults.

```sql
CREATE TABLE discount_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,  -- NULL for system defaults
  name TEXT NOT NULL,                    -- "Senior", "Loyalty", "Promo Code"
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- System defaults (shop_id = NULL, is_system = true)
INSERT INTO discount_types (shop_id, name, is_system) VALUES
  (NULL, 'Senior Discount', true),
  (NULL, 'Loyalty Reward', true),
  (NULL, 'Promo Code', true),
  (NULL, 'Manager Override', true),
  (NULL, 'Other', true);
```

#### `void_refund_reasons`
Shared reasons for void and refund operations.

```sql
CREATE TABLE void_refund_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,  -- NULL for system defaults
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
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
```

#### `order_taxes`
Tax breakdown per order (denormalized for historical accuracy).

```sql
CREATE TABLE order_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_tax_id UUID REFERENCES shop_taxes(id),
  tax_name TEXT NOT NULL,                -- Denormalized: "State Tax"
  tax_rate DECIMAL(5,4) NOT NULL,        -- Denormalized: 0.0600
  tax_amount DECIMAL(10,2) NOT NULL,     -- Calculated: $6.00
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Modified Tables

#### `shops` - Add order prefix

```sql
ALTER TABLE shops
ADD COLUMN order_prefix VARCHAR(10);  -- e.g., "PC", "CAFE", "REST"
```

#### `orders` - Add new columns

```sql
-- Order number (sequential per shop)
ALTER TABLE orders
ADD COLUMN order_number INTEGER;

-- Create sequence trigger for auto-incrementing order numbers per shop
-- (Implementation in migration file)

-- Order status
CREATE TYPE order_status AS ENUM ('completed', 'voided', 'refunded');
ALTER TABLE orders
ADD COLUMN status order_status NOT NULL DEFAULT 'completed';

-- Discount fields
ALTER TABLE orders
ADD COLUMN discount_type_id UUID REFERENCES discount_types(id),
ADD COLUMN discount_method VARCHAR(10) CHECK (discount_method IN ('percentage', 'fixed')),
ADD COLUMN discount_value DECIMAL(10,2),      -- Input: 10 (meaning 10% or $10)
ADD COLUMN discount_amount DECIMAL(10,2);     -- Calculated: $5.00

-- Tip fields
ALTER TABLE orders
ADD COLUMN tip_amount DECIMAL(10,2),
ADD COLUMN tip_recipient_id UUID REFERENCES auth.users(id);

-- Refund fields
ALTER TABLE orders
ADD COLUMN refund_amount DECIMAL(10,2),
ADD COLUMN refund_reason_id UUID REFERENCES void_refund_reasons(id),
ADD COLUMN refunded_at TIMESTAMPTZ,
ADD COLUMN refunded_by UUID REFERENCES auth.users(id);

-- Void fields
ALTER TABLE orders
ADD COLUMN void_reason_id UUID REFERENCES void_refund_reasons(id),
ADD COLUMN voided_at TIMESTAMPTZ,
ADD COLUMN voided_by UUID REFERENCES auth.users(id);
```

### Order Number Generation

Sequential order numbers per shop using a trigger:

```sql
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

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();
```

---

## Tax Calculation

**Method:** Simple addition (each tax calculated independently on subtotal)

**Example:**
- Subtotal: $100.00
- State Tax (6%): $6.00
- City Tax (2%): $2.00
- Total Tax: $8.00
- Grand Total: $108.00

**Flow:**
1. Fetch active `shop_taxes` for the shop
2. For each tax: `tax_amount = subtotal * rate`
3. Sum all tax amounts
4. Store each tax in `order_taxes` table

---

## Discount Handling

**Scope:** Order-level only (item-level can be added later)

**Types:** Configurable per shop with system defaults

**Methods:**
- **Percentage:** `discount_amount = subtotal * (discount_value / 100)`
- **Fixed:** `discount_amount = discount_value`

**Fields stored:**
- `discount_type_id` - Reference to discount type
- `discount_method` - 'percentage' or 'fixed'
- `discount_value` - The input value (10 for 10% or $10)
- `discount_amount` - Calculated dollar amount

---

## Tip Handling

**Recipient:** Auto-assigned to server (`served_by_id`) with ability to override

**Fields stored:**
- `tip_amount` - The tip amount
- `tip_recipient_id` - Who receives the tip (defaults to server)

---

## Order Status Lifecycle

```
┌───────────┐
│ completed │ (default on creation)
└─────┬─────┘
      │
      ├──────────────────┐
      │                  │
      ▼                  ▼
┌──────────┐      ┌──────────┐
│  voided  │      │ refunded │
└──────────┘      └──────────┘
```

**Status display mapping:**
- `completed` → "Paid" (green)
- `voided` → "Cancelled" (red)
- `refunded` → "Refunded" (orange)

---

## Void Flow

1. User clicks "Void" on a completed order
2. Confirmation modal appears
3. User selects reason from dropdown (required)
4. On confirm:
   - Set `status = 'voided'`
   - Set `void_reason_id`, `voided_at`, `voided_by`
5. No inventory changes (already consumed)

---

## Refund Flow

1. User clicks "Issue Refund" on a completed order
2. Refund modal appears showing order total
3. User enters refund amount (defaults to full, can be partial)
4. User selects reason from dropdown (required)
5. On confirm:
   - Set `status = 'refunded'`
   - Set `refund_amount`, `refund_reason_id`, `refunded_at`, `refunded_by`
6. No inventory changes (money only)

---

## Sales Page UI

### Page Location
Navigation: "Sales" menu item (between Inventory and Settings, or as appropriate)

### Responsive Layout

**Desktop/Tablet (>768px):**
- Split-pane layout
- Left: Order list (scrollable)
- Right: Order detail panel (receipt style)

**Mobile (<768px):**
- Full-width order list
- Tapping order opens detail in modal

### Left Panel - Order List

**Header:**
- Title: "Sales"
- Filter button

**Search:**
- Search bar: "Search order #XXX-xxxx"

**Filter Tabs:**
- All | Paid | Cancelled | Refunded

**Order Cards:**
```
┌────────────────────────────────────────┐
│ 📋 #PC-0012                    $12.50 │
│    10:42 AM • Jane Doe        3 items │
│    ● Paid                             │
└────────────────────────────────────────┘
```

Fields displayed:
- Order number (with shop prefix)
- Time
- Server name
- Total amount
- Item count
- Status badge (color-coded)

### Right Panel / Modal - Order Detail

**Receipt-style layout:**

```
┌─────────────────────────────────────┐
│           [Shop Logo]               │
│         Potato Corner               │
│   123 Savory Street, Food Court     │
│      San Francisco, CA 94103        │
│       Tax ID: 12-3456789            │
├─────────────────────────────────────┤
│ ORDER ID          DATE              │
│ #PC-0012          Jan 28, 2026      │
│                   10:42 AM          │
├─────────────────────────────────────┤
│      ✓ Paid Successfully            │
├─────────────────────────────────────┤
│ 1  Mega Fries              $6.50    │
│    Flavor: BBQ                      │
│ 1  Chicken Pop             $4.50    │
│    Spicy                            │
│ 1  Soda (Coke)             $1.50    │
│    Regular                          │
├─────────────────────────────────────┤
│ Subtotal                   $12.50   │
│ State Tax (6%)              $0.75   │
│ City Tax (2%)               $0.25   │
│ Discount (Senior -10%)     -$1.25   │
│ Tip                         $2.00   │
├─────────────────────────────────────┤
│ Total Amount              $14.25    │
├─────────────────────────────────────┤
│ 💳 Paid via VISA ****2424           │
├─────────────────────────────────────┤
│ [Print Receipt] [Email Receipt]     │
│                                     │
│        ↩ Issue Refund               │
│        ✕ Void Order                 │
└─────────────────────────────────────┘
```

**Actions:**
- Print Receipt
- Email Receipt
- Issue Refund (opens refund modal)
- Void Order (opens confirmation with reason)

**Conditional display:**
- Hide Void/Refund buttons if order already voided or refunded
- Show void/refund info if applicable (reason, amount, who, when)

---

## Checkout Flow Updates

### Tax Display
Show tax breakdown in checkout:
```
Subtotal          $100.00
State Tax (6%)      $6.00
City Tax (2%)       $2.00
────────────────────────
Total             $108.00
```

### Discount Section
Optional discount selection:
- Dropdown: Select discount type
- Toggle: Percentage / Fixed amount
- Input: Value (e.g., 10)
- Display: Calculated amount

### Tip Section
- Input: Tip amount
- Recipient: Defaults to current user, dropdown to change

---

## Service Layer Changes

### Order Service Updates

**createOrder():**
- Accept discount fields, tip fields
- Fetch active shop taxes
- Calculate and store tax breakdown in `order_taxes`
- Generate order number (via DB trigger)
- Set `status = 'completed'`

**voidOrder(orderId, reasonId, userId):**
- Validate order exists and is completed
- Update status to 'voided'
- Set void_reason_id, voided_at, voided_by
- No inventory changes

**refundOrder(orderId, amount, reasonId, userId):**
- Validate order exists and is completed
- Validate refund amount <= order total
- Update status to 'refunded'
- Set refund_amount, refund_reason_id, refunded_at, refunded_by
- No inventory changes

### New Services

**shopTaxService:**
- getShopTaxes(shopId)
- createShopTax(shopId, name, rate)
- updateShopTax(taxId, updates)
- deleteShopTax(taxId)

**discountTypeService:**
- getDiscountTypes(shopId) - includes system defaults
- createDiscountType(shopId, name)
- updateDiscountType(typeId, updates)
- deleteDiscountType(typeId)

**voidRefundReasonService:**
- getReasons(shopId) - includes system defaults

---

## File Structure

```
src/
├── pages/
│   └── Sales/
│       ├── SalesListPage.tsx        # Main sales page with list
│       ├── components/
│       │   ├── OrderList.tsx        # Order list component
│       │   ├── OrderCard.tsx        # Individual order card
│       │   ├── OrderDetail.tsx      # Receipt-style detail view
│       │   ├── OrderDetailModal.tsx # Mobile modal wrapper
│       │   ├── RefundModal.tsx      # Refund flow modal
│       │   └── VoidModal.tsx        # Void confirmation modal
│       └── index.ts
├── services/
│   ├── order.service.ts             # Update existing
│   ├── shopTax.service.ts           # New
│   ├── discountType.service.ts      # New
│   └── voidRefundReason.service.ts  # New
├── hooks/
│   ├── useOrders.ts                 # Update/expand
│   ├── useShopTaxes.ts              # New
│   ├── useDiscountTypes.ts          # New
│   └── useVoidRefundReasons.ts      # New
└── types/
    └── index.ts                     # Add new types
```

---

## Migration Files Needed

1. `YYYYMMDD000001_add_shop_order_prefix.sql`
2. `YYYYMMDD000002_create_shop_taxes.sql`
3. `YYYYMMDD000003_create_discount_types.sql`
4. `YYYYMMDD000004_create_void_refund_reasons.sql`
5. `YYYYMMDD000005_add_order_columns.sql`
6. `YYYYMMDD000006_create_order_taxes.sql`
7. `YYYYMMDD000007_add_order_number_trigger.sql`

---

## Summary

This design adds complete sales recording with:
- Multiple tax rates per shop with breakdown storage
- Configurable discount types with amount tracking
- Tip recording with recipient tracking
- Order status lifecycle (completed/voided/refunded)
- Sequential order numbers per shop with prefix
- Full-featured Sales page with responsive layout
- Void and refund capabilities with required reasons
