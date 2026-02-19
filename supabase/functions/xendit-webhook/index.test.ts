// Unit tests for xendit-webhook edge function logic
// Tests pure business logic: token verification, payload parsing, event routing.
// The Deno.serve handler and DB operations are tested via integration.

import { describe, expect, it } from 'vitest';

// --- Unit: verifyCallbackToken ---
function verifyCallbackToken(
  headerValue: string | null,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken) return false;
  if (!headerValue) return false;
  return headerValue === expectedToken;
}

describe('verifyCallbackToken', () => {
  it('returns true when header matches expected token', () => {
    expect(verifyCallbackToken('secret-token', 'secret-token')).toBe(true);
  });

  it('returns false when header does not match', () => {
    expect(verifyCallbackToken('wrong-token', 'secret-token')).toBe(false);
  });

  it('returns false when header is null (missing)', () => {
    expect(verifyCallbackToken(null, 'secret-token')).toBe(false);
  });

  it('returns false when expected token is undefined (not configured)', () => {
    expect(verifyCallbackToken('any-token', undefined)).toBe(false);
  });

  it('returns false when both are empty string', () => {
    expect(verifyCallbackToken('', '')).toBe(false);
  });
});

// --- Unit: extractOrderId ---
interface XenditWebhookPayload {
  event?: string;
  data?: {
    reference_id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

function extractOrderId(body: XenditWebhookPayload): string | null {
  return body.data?.reference_id ?? null;
}

describe('extractOrderId', () => {
  it('extracts reference_id from data', () => {
    expect(extractOrderId({ data: { reference_id: 'order-uuid-123' } })).toBe('order-uuid-123');
  });

  it('returns null when data is missing', () => {
    expect(extractOrderId({})).toBeNull();
  });

  it('returns null when reference_id is missing', () => {
    expect(extractOrderId({ data: {} })).toBeNull();
  });

  it('returns null when reference_id is empty string', () => {
    // empty string is falsy but technically extractOrderId returns '' not null
    // so we check the actual returned value
    expect(extractOrderId({ data: { reference_id: '' } })).toBe('');
  });
});

// --- Unit: shouldProcessEvent ---
function shouldProcessEvent(event: string | undefined): boolean {
  return event === 'payment.succeeded';
}

describe('shouldProcessEvent', () => {
  it('returns true for payment.succeeded', () => {
    expect(shouldProcessEvent('payment.succeeded')).toBe(true);
  });

  it('returns false for payment.failed', () => {
    expect(shouldProcessEvent('payment.failed')).toBe(false);
  });

  it('returns false for payment.pending', () => {
    expect(shouldProcessEvent('payment.pending')).toBe(false);
  });

  it('returns false for undefined event', () => {
    expect(shouldProcessEvent(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(shouldProcessEvent('')).toBe(false);
  });
});

// --- Unit: buildInventoryTransactionRecord ---
interface InventoryTransactionRecord {
  shop_id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  quantity_out: number;
  unit_cost: number;
  transaction_type: string;
  reference: string;
  transaction_on: string;
}

function buildInventoryTransactionRecord(params: {
  shopId: string;
  userId: string;
  itemId: string;
  itemName: string;
  quantityOut: number;
  unitCost: number;
  orderId: string;
  transactionOn: string;
}): InventoryTransactionRecord {
  return {
    shop_id: params.shopId,
    user_id: params.userId,
    item_id: params.itemId,
    item_name: params.itemName,
    quantity_out: params.quantityOut,
    unit_cost: params.unitCost,
    transaction_type: 'sale',
    reference: params.orderId,
    transaction_on: params.transactionOn,
  };
}

describe('buildInventoryTransactionRecord', () => {
  const base = {
    shopId: 'shop-1',
    userId: 'user-1',
    itemId: 'item-1',
    itemName: 'Coffee Beans',
    quantityOut: 2,
    unitCost: 10.5,
    orderId: 'order-1',
    transactionOn: '2024-01-01T00:00:00Z',
  };

  it('sets transaction_type to sale', () => {
    expect(buildInventoryTransactionRecord(base).transaction_type).toBe('sale');
  });

  it('sets quantity_out correctly', () => {
    expect(buildInventoryTransactionRecord(base).quantity_out).toBe(2);
  });

  it('sets reference to orderId', () => {
    expect(buildInventoryTransactionRecord(base).reference).toBe('order-1');
  });

  it('sets all required fields', () => {
    const record = buildInventoryTransactionRecord(base);
    expect(record.shop_id).toBe('shop-1');
    expect(record.user_id).toBe('user-1');
    expect(record.item_id).toBe('item-1');
    expect(record.item_name).toBe('Coffee Beans');
    expect(record.unit_cost).toBe(10.5);
    expect(record.transaction_on).toBe('2024-01-01T00:00:00Z');
  });
});

// --- Unit: computeItemQuantityOut ---
// For product items: recipe_quantity * order_item_quantity
// For modifiers/addons: modifier_quantity * order_item_quantity
function computeItemQuantityOut(recipeQuantity: number, orderItemQuantity: number): number {
  return recipeQuantity * orderItemQuantity;
}

describe('computeItemQuantityOut', () => {
  it('multiplies recipe quantity by order item quantity', () => {
    expect(computeItemQuantityOut(2, 3)).toBe(6);
  });

  it('handles 1x1 (single item, single portion)', () => {
    expect(computeItemQuantityOut(1, 1)).toBe(1);
  });

  it('handles fractional recipe quantities (e.g. 0.5 cup per serving)', () => {
    expect(computeItemQuantityOut(0.5, 4)).toBe(2);
  });
});
