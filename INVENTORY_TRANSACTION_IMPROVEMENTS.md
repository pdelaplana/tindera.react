# Inventory Transaction Improvements

## Summary

Fixed inventory transactions to use the proper `'sale'` transaction type instead of incorrectly recording sales as `'adjustment'` transactions.

---

## ❌ Previous Implementation (INCORRECT)

**Problem**: Sales were being recorded as adjustment transactions with a reason code of "Sale"

```typescript
// ❌ WRONG: Using adjustment transaction for sales
await inventoryService.createAdjustmentTransaction({
  shop_id: shopId,
  item_id: productItem.inventory_item_id,
  item_name: invItemTyped.name,
  adjustment_type: 'decrease',
  quantity: qtyToDecrement,
  adjustment_reason_code: 'Sale', // ❌ Wrong transaction type
  notes: `Order #${orderId}`,
  transaction_on: new Date().toISOString(),
}, userId);
```

**Issues**:
- ❌ Sales mixed with true adjustments (spoilage, theft, damage)
- ❌ Difficult to query sales separately from adjustments
- ❌ Not semantically correct (sales aren't adjustments)
- ❌ Poor data integrity for reporting and analytics

---

## ✅ New Implementation (CORRECT)

**Solution**: Created dedicated `createSaleTransaction()` method and updated order service

### 1. New Service Method: `createSaleTransaction()`

**File**: `src/services/inventory.service.ts` (lines 838-931)

```typescript
/**
 * Create a sale transaction (decrement inventory for customer sales)
 * @param transactionData - Sale transaction details
 * @param userId - ID of the user creating the transaction
 */
async createSaleTransaction(
  transactionData: {
    shop_id: string;
    item_id: string;
    item_name: string;
    quantity: number;
    unit_cost: number;
    reference: string; // Order ID
    notes?: string | null;
    transaction_on: string;
  },
  userId: string
): Promise<ApiResponse<InventoryTransaction>>
```

**Key Features**:
- ✅ Uses `transaction_type: 'sale'` (semantically correct)
- ✅ Captures `unit_cost` for COGS calculation
- ✅ Links to order via `reference` field
- ✅ Properly decrements `current_count`
- ✅ Sets audit fields (`created_by`, `updated_by`)

### 2. Updated Order Service

**File**: `src/services/order.service.ts` (lines 348-490)

**Changed in THREE locations:**

#### a) Product Items (lines 373-385)
```typescript
const saleResult = await inventoryService.createSaleTransaction({
  shop_id: shopId,
  item_id: productItem.inventory_item_id,
  item_name: invItemTyped.name,
  quantity: qtyToDecrement,
  unit_cost: invItemTyped.unit_cost || 0,
  reference: orderId,
  notes: `Product: ${cartItem.product.name} (Qty: ${cartItem.quantity})`,
  transaction_on: new Date().toISOString(),
}, userId);
```

#### b) Modifiers with Inventory (lines 420-432)
```typescript
const saleResult = await inventoryService.createSaleTransaction({
  shop_id: shopId,
  item_id: modifier.inventory_item_id || '',
  item_name: invItem.name,
  quantity: qtyToDecrement,
  unit_cost: invItem.unit_cost || 0,
  reference: orderId,
  notes: `Modifier: ${modifier.modifier_name} for ${cartItem.product.name}`,
  transaction_on: new Date().toISOString(),
}, userId);
```

#### c) Addons with Inventory (lines 463-475)
```typescript
const saleResult = await inventoryService.createSaleTransaction({
  shop_id: shopId,
  item_id: addon.item_id || '',
  item_name: invItem.name,
  quantity: qtyToDecrement,
  unit_cost: invItem.unit_cost || 0,
  reference: orderId,
  notes: `Addon: ${addon.name} (${addon.quantity}x) for ${cartItem.product.name}`,
  transaction_on: new Date().toISOString(),
}, userId);
```

**Improvements**:
- ✅ Added `unit_cost` to SELECT queries
- ✅ Better notes with context (product name, modifier name, addon name)
- ✅ Proper transaction type classification

---

## 📊 Database Schema

**Transaction Types** (already defined in schema):

```sql
transaction_type TEXT CHECK (transaction_type IN (
  'receipt',       -- Receiving inventory from suppliers
  'issue',         -- General dispatches/issues
  'sale',          -- Customer sales ← NOW USED
  'adjustment',    -- Manual adjustments (spoilage, theft, damage)
  'countAdjustment' -- Physical count corrections
))
```

**Relevant Fields**:
- `transaction_type`: Now correctly set to `'sale'`
- `quantity_out`: Amount decremented
- `unit_cost`: Cost per unit (for COGS)
- `reference`: Order ID (traceability)
- `notes`: Context about the sale
- `adjustment_reason_code`: NOT used for sales (set to null)

---

## 📈 Benefits

### 1. Data Integrity
- ✅ **Clear Separation**: Sales are now distinct from adjustments
- ✅ **Proper Classification**: Each transaction type has its purpose
  - `receipt` → Receiving inventory
  - `sale` → Customer purchases
  - `adjustment` → Manual corrections (spoilage, theft, etc.)

### 2. Reporting & Analytics
- ✅ **Easy Queries**: `SELECT * FROM inventory_transactions WHERE transaction_type = 'sale'`
- ✅ **COGS Calculation**: Direct access to sales with unit costs
- ✅ **Sales Analysis**: Total sales by item, date, time period
- ✅ **Inventory Movement**: Clear distinction between operational sales vs. adjustments

### 3. Traceability
- ✅ **Order Linking**: `reference` field contains order ID
- ✅ **Context**: Notes include product/modifier/addon details
- ✅ **Audit Trail**: `created_by`, `updated_by` for accountability

### 4. Best Practices
- ✅ **Semantic Correctness**: Transaction types match their purpose
- ✅ **Industry Standard**: Aligns with inventory management best practices
- ✅ **Future-Proof**: Easy to add more transaction types (e.g., `'issue'`, `'transfer'`)

---

## 🔄 Transaction Type Usage Matrix

| Type | Used? | Purpose | Created By | Notes Field |
|------|-------|---------|------------|-------------|
| `receipt` | ✅ Yes | Receiving inventory | `createReceiptTransaction()` | Supplier, reference |
| `sale` | ✅ Yes | Customer sales | `createSaleTransaction()` | Product/modifier/addon details |
| `adjustment` | ✅ Yes | Manual corrections | `createAdjustmentTransaction()` | Adjustment reason |
| `issue` | ❌ No | General dispatches | Not implemented yet | Future use |
| `countAdjustment` | ⚠️ Partial | Physical count fixes | Via adjustment | Count details |

---

## 🧪 Testing Checklist

### Before Testing
- [ ] Apply migration `20260117000003_add_audit_fields.sql` to add audit fields

### Test Cases

#### 1. Complete an Order with Products
- [ ] Create an order with products that have inventory links
- [ ] Check `inventory_transactions` table
- [ ] Verify `transaction_type = 'sale'`
- [ ] Verify `reference` = order ID
- [ ] Verify `notes` contains product details
- [ ] Verify `quantity_out` = correct amount
- [ ] Verify `unit_cost` is populated
- [ ] Verify `created_by` and `updated_by` are set

#### 2. Complete an Order with Modifiers
- [ ] Create an order with modifiers that have inventory links
- [ ] Check `inventory_transactions` table
- [ ] Verify modifier sale transactions created
- [ ] Verify `notes` contains modifier and product name

#### 3. Complete an Order with Addons
- [ ] Create an order with addons that have inventory links
- [ ] Check `inventory_transactions` table
- [ ] Verify addon sale transactions created
- [ ] Verify `notes` contains addon and product name

#### 4. Verify Inventory Decrements
- [ ] Check `inventory_items.current_count` before order
- [ ] Complete order
- [ ] Check `inventory_items.current_count` after order
- [ ] Verify count decreased by correct amount

#### 5. Query Sales Transactions
- [ ] Run: `SELECT * FROM inventory_transactions WHERE transaction_type = 'sale'`
- [ ] Verify all sales are returned
- [ ] Verify no adjustment transactions in results

#### 6. Verify Adjustments Are Still Working
- [ ] Create a manual adjustment (spoilage, damage, etc.)
- [ ] Verify it uses `transaction_type = 'adjustment'`
- [ ] Verify sales and adjustments are separate

---

## 📝 SQL Queries for Validation

### Check Recent Sales
```sql
SELECT
  id,
  transaction_type,
  item_name,
  quantity_out,
  unit_cost,
  reference,
  notes,
  created_by,
  transaction_on
FROM inventory_transactions
WHERE transaction_type = 'sale'
ORDER BY transaction_on DESC
LIMIT 10;
```

### Check Sales by Order
```sql
SELECT
  reference AS order_id,
  item_name,
  quantity_out,
  unit_cost,
  quantity_out * unit_cost AS total_cost,
  notes
FROM inventory_transactions
WHERE transaction_type = 'sale'
  AND reference = 'YOUR_ORDER_ID_HERE';
```

### Verify Adjustments Don't Have 'Sale' Reason
```sql
-- This should return 0 rows (no more sales as adjustments)
SELECT *
FROM inventory_transactions
WHERE transaction_type = 'adjustment'
  AND adjustment_reason_code = 'Sale';
```

### COGS (Cost of Goods Sold) Report
```sql
SELECT
  item_name,
  SUM(quantity_out) AS total_quantity_sold,
  SUM(quantity_out * unit_cost) AS total_cogs
FROM inventory_transactions
WHERE transaction_type = 'sale'
  AND transaction_on >= '2026-01-01'
  AND transaction_on < '2026-02-01'
GROUP BY item_name
ORDER BY total_cogs DESC;
```

---

## 🚀 Migration Notes

### Files Modified
1. ✅ `src/services/inventory.service.ts` - Added `createSaleTransaction()`
2. ✅ `src/services/order.service.ts` - Updated `_decrementInventory()` to use sale transactions
3. ✅ No database migration needed (transaction types already defined in schema)

### Backward Compatibility
- ✅ **No Breaking Changes**: Old adjustment transactions remain in database
- ✅ **Query Adjustment**: Update any reports that query adjustments with reason='Sale'
- ⚠️ **Historical Data**: Past sales still recorded as adjustments (data cleanup optional)

### Optional Data Cleanup (Future)
If you want to clean up historical data:
```sql
-- Convert old sale adjustments to proper sale transactions
UPDATE inventory_transactions
SET
  transaction_type = 'sale',
  adjustment_reason_code = NULL,
  reference = SUBSTRING(notes FROM 'Order #(.+)')
WHERE transaction_type = 'adjustment'
  AND adjustment_reason_code = 'Sale';
```

---

## ✅ Completion Status

- [x] Created `createSaleTransaction()` method
- [x] Updated product items decrement
- [x] Updated modifiers decrement
- [x] Updated addons decrement
- [x] Fixed TypeScript errors
- [x] Applied linting fixes
- [ ] Apply database migration (audit fields)
- [ ] Test in development environment
- [ ] Verify reporting queries work correctly

---

## 📚 Related Documentation

- **Database Schema**: `supabase/migrations/20241220000001_initial_schema.sql` (lines 378-397)
- **Transaction Types Enum**: `src/types/enums.ts` (lines 3-9)
- **Audit Fields Migration**: `supabase/migrations/20260117000003_add_audit_fields.sql`
- **Service Audit Fixes**: `SERVICE_AUDIT_FIXES_NEEDED.md`
