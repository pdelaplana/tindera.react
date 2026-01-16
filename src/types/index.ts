// Tindera - Type Definitions

export * from './enums';
export * from './supabase.generated';

// ===== Base Types =====

export interface Auditable {
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

// For tables that only track timestamps (not who created/updated)
export interface Timestamped {
  created_at: string;
  updated_at: string;
}

// ===== User Types =====

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Shop Types =====

export interface Shop extends Auditable {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  currency_code: string;
  image_url: string | null;
}

export interface ShopUser {
  shop_id: string;
  user_id: string;
  role: string;
}

export interface PaymentType {
  id: string;
  shop_id: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

// ===== Category Types =====

export interface ProductCategory {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  sequence: number;
}

export interface InventoryCategory {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  sequence: number;
}

// ===== Filter Types =====

export interface FilterOption {
  id: string;
  label: string;
  separator?: boolean;
}

// ===== Package Size Types =====

export interface PackageSize extends Auditable {
  id: string;
  shop_id: string;
  item_id: string;
  package_name: string;
  package_uom: string;
  units_per_package: number;
  cost_per_package: number | null;
  is_default: boolean;
  sequence: number;
}

// ===== Product Types =====

export interface Product extends Auditable {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  remarks: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
}

export interface ProductWithCategory extends Product {
  category: ProductCategory | null;
}

export interface ProductItem {
  id: string;
  product_id: string;
  inventory_item_id: string;
  item_name: string;
  unit_cost: number;
  quantity: number;
  uom: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  inventory_item_id: string | null;
  item_name: string | null;
  item_cost: number;
  quantity: number;
  price: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  options: string[];
}

// ===== Product Modifier Types =====

export interface ProductModifierGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  min_select: number;
  max_select: number | null;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface ProductModifier {
  id: string;
  modifier_group_id: string;
  name: string;
  price_adjustment: number;
  inventory_item_id: string | null;
  quantity: number;
  is_default: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface ProductModifierGroupWithModifiers extends ProductModifierGroup {
  modifiers: ProductModifier[];
}

// ===== Global Modifier Types (New System) =====

export interface ModifierGroup extends Timestamped {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  min_select: number;
  max_select: number | null;
  sequence: number;
}

export interface Modifier extends Timestamped {
  id: string;
  modifier_group_id: string;
  name: string;
  default_price_adjustment: number;
  inventory_item_id: string | null;
  quantity: number;
  is_default: boolean;
  sequence: number;
}

export interface ModifierGroupWithModifiers extends ModifierGroup {
  modifiers: Modifier[];
}

// Modifier with resolved price (used when fetched with product details)
// The service resolves price overrides and adds price_adjustment field
export interface ModifierWithResolvedPrice extends Modifier {
  price_adjustment: number; // Resolved from override or default_price_adjustment
}

export interface ModifierGroupWithResolvedPrices extends Omit<ModifierGroup, 'modifiers'> {
  modifiers: ModifierWithResolvedPrice[];
}

export interface ProductModifierGroupLink {
  id: string;
  product_id: string;
  modifier_group_id: string;
  sequence: number;
  created_at: string;
}

export interface ProductModifierPriceOverride extends Timestamped {
  id: string;
  product_id: string;
  modifier_id: string;
  price_adjustment: number;
}

// Update ProductWithCategory to include modifierGroups
export interface ProductWithDetails extends ProductWithCategory {
  items: ProductItem[];
  addons: ProductAddon[];
  /** @deprecated Use linkedModifierGroups instead */
  modifierGroups: ProductModifierGroupWithModifiers[];
  linkedModifierGroups?: ModifierGroupWithResolvedPrices[]; // Modifiers have price_adjustment resolved
  priceOverrides?: Record<string, number>;
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_group_id: string;
  modifier_group_name: string;
  modifier_id: string;
  modifier_name: string;
  price_adjustment: number;
  inventory_item_id: string | null;
  quantity: number;
}

// ===== Inventory Types =====

export interface InventoryItem extends Auditable {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  base_uom: string; // Unit of measure for inventory tracking and display (e.g., kg, liter, piece)
  unit_cost: number;
  current_count: number;
  reorder_level: number;
  notes: string | null;
  qty_received_to_date: number;
  cost_of_qty_received_to_date: number;
}

export interface InventoryItemWithCategory extends InventoryItem {
  category: InventoryCategory | null;
}

export interface InventoryTransaction extends Auditable {
  id: string;
  shop_id: string;
  transaction_type: string;
  item_id: string;
  item_name: string;
  user_id: string;
  transaction_on: string;
  quantity_in: number;
  quantity_out: number;
  package_size_id: string | null; // Reference to package size used (null for direct base unit receipts)
  package_quantity: number | null; // Number of packages received (e.g., 5 bags)
  package_cost_per_unit: number | null; // Cost per package at time of receipt
  reference: string | null;
  notes: string | null;
  adjustment_reason_code: string | null;
  adjustment_reason_other: string | null;
  unit_cost: number;
  supplier: string | null;
}

export interface InventoryCount extends Auditable {
  id: string;
  shop_id: string;
  count_date: string;
  count_type: string;
  status: string;
  notes: string | null;
}

export interface InventoryCountItem {
  id: string;
  count_id: string;
  item_id: string;
  item_name: string;
  expected_count: number;
  actual_count: number;
  variance: number;
  notes: string | null;
}

// ===== Order Types =====

export interface Order extends Auditable {
  id: string;
  shop_id: string;
  order_date: string;
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
}

export interface OrderWithDetails extends Order {
  payment_type: PaymentType | null;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_unit_price: number;
  product_category: string | null;
  quantity: number;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  name: string;
  quantity: number;
  price: number;
  item_id: string | null;
}

// ===== Cart Types (Client-side only) =====

export interface Cart {
  total: number;
  items: CartItem[];
}

export interface CartItem {
  cart_item_id: string; // Unique ID for this cart item (includes configuration)
  product_id: string;
  product: Product;
  quantity: number;
  amount: number;
  addons: CartItemAddon[];
  modifiers: CartItemModifier[];
  available: boolean;
}

export interface CartItemAddon {
  addon_id: string;
  name: string;
  quantity: number;
  price: number;
  item_id: string | null; // Link to inventory for auto-decrement
}

export interface CartItemModifier {
  modifier_group_id: string;
  modifier_group_name: string;
  modifier_id: string;
  modifier_name: string;
  price_adjustment: number;
  inventory_item_id: string | null; // Link to inventory for auto-decrement
  quantity: number; // Quantity per product (for inventory decrement)
}

// ===== Form Input Types =====

export type ProductInsert = Omit<
  Product,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type ProductUpdate = Partial<ProductInsert>;

export type ProductModifierGroupInsert = Omit<
  ProductModifierGroup,
  'id' | 'created_at' | 'updated_at'
>;
export type ProductModifierGroupUpdate = Partial<ProductModifierGroupInsert>;

export type ProductModifierInsert = Omit<ProductModifier, 'id' | 'created_at' | 'updated_at'>;
export type ProductModifierUpdate = Partial<ProductModifierInsert>;

// Global Modifier Form Types
export type ModifierGroupInsert = Omit<
  ModifierGroup,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type ModifierGroupUpdate = Partial<ModifierGroupInsert>;

export type ModifierInsert = Omit<
  Modifier,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type ModifierUpdate = Partial<ModifierInsert>;

export type InventoryItemInsert = Omit<
  InventoryItem,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type InventoryItemUpdate = Partial<InventoryItemInsert>;

export type PackageSizeInsert = Omit<
  PackageSize,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type PackageSizeUpdate = Partial<
  Omit<
    PackageSize,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'shop_id' | 'item_id'
  >
>;

export type OrderInsert = Omit<
  Order,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type OrderUpdate = Partial<OrderInsert>;

export type ShopInsert = Omit<
  Shop,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;
export type ShopUpdate = Partial<ShopInsert>;

// ===== Checkout Types =====

export interface CheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_type_id: string;
  cash_received: number | null;
}

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
  tax: number;
  discount: number;
  tip: number;
}

export interface OrderCreationResult {
  order: Order;
  inventoryAdjustments: Array<{
    item_id: string;
    quantity_adjusted: number;
  }>;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
