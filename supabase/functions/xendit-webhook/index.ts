// Edge Function: xendit-webhook
// Receives Xendit payment event webhooks.
// On payment.succeeded: marks order as paid and deducts inventory.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Verify x-callback-token header against configured secret
function verifyCallbackToken(
  headerValue: string | null,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken) return false;
  if (!headerValue) return false;
  return headerValue === expectedToken;
}

// Extract our order ID from the Xendit payload (set as reference_id when creating the charge)
function extractOrderId(body: Record<string, unknown>): string | null {
  const data = body.data as Record<string, unknown> | undefined;
  return (data?.reference_id as string) ?? null;
}

// Only act on payment.succeeded events; acknowledge all others silently
function shouldProcessEvent(event: string | undefined): boolean {
  return event === 'payment.succeeded';
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
}) {
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

function computeItemQuantityOut(recipeQuantity: number, orderItemQuantity: number): number {
  return recipeQuantity * orderItemQuantity;
}

async function deductInventoryItem(
  supabase: SupabaseClient,
  params: {
    shopId: string;
    userId: string;
    itemId: string;
    itemName: string;
    unitCost: number;
    quantityOut: number;
    orderId: string;
    transactionOn: string;
  }
): Promise<void> {
  // Fetch current count to compute new value
  const { data: invItem } = await supabase
    .from('inventory_items')
    .select('current_count')
    .eq('id', params.itemId)
    .single();

  const currentCount = (invItem?.current_count as number) ?? 0;

  // Record the sale transaction for audit trail
  await supabase.from('inventory_transactions').insert(
    buildInventoryTransactionRecord(params)
  );

  // Decrement the current stock count
  await supabase
    .from('inventory_items')
    .update({ current_count: currentCount - params.quantityOut })
    .eq('id', params.itemId);
}

async function deductInventory(
  supabase: SupabaseClient,
  orderId: string,
  shopId: string,
  userId: string
): Promise<void> {
  const transactionOn = new Date().toISOString();

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, product_id, quantity')
    .eq('order_id', orderId);

  if (!orderItems?.length) return;

  for (const orderItem of orderItems) {
    const orderQty = (orderItem.quantity as number) ?? 1;

    // 1. Deduct product recipe components
    if (orderItem.product_id) {
      const { data: productItems } = await supabase
        .from('product_items')
        .select('inventory_item_id, quantity, inventory_item:inventory_items(name, unit_cost)')
        .eq('product_id', orderItem.product_id);

      for (const pi of productItems ?? []) {
        if (!pi.inventory_item_id) continue;
        const inv = pi.inventory_item as { name: string; unit_cost: number } | null;
        if (!inv) continue;

        await deductInventoryItem(supabase, {
          shopId,
          userId,
          itemId: pi.inventory_item_id,
          itemName: inv.name,
          unitCost: inv.unit_cost ?? 0,
          quantityOut: computeItemQuantityOut(pi.quantity ?? 1, orderQty),
          orderId,
          transactionOn,
        });
      }
    }

    // 2. Deduct modifiers that have inventory links
    const { data: modifiers } = await supabase
      .from('order_item_modifiers')
      .select('inventory_item_id, quantity, inventory_item:inventory_items(name, unit_cost)')
      .eq('order_item_id', orderItem.id)
      .not('inventory_item_id', 'is', null);

    for (const mod of modifiers ?? []) {
      if (!mod.inventory_item_id) continue;
      const inv = mod.inventory_item as { name: string; unit_cost: number } | null;
      if (!inv) continue;

      await deductInventoryItem(supabase, {
        shopId,
        userId,
        itemId: mod.inventory_item_id,
        itemName: inv.name,
        unitCost: inv.unit_cost ?? 0,
        quantityOut: computeItemQuantityOut(mod.quantity ?? 1, orderQty),
        orderId,
        transactionOn,
      });
    }

    // 3. Deduct addons that have inventory links
    const { data: addons } = await supabase
      .from('order_item_addons')
      .select('item_id, quantity, inventory_item:inventory_items!item_id(name, unit_cost)')
      .eq('order_item_id', orderItem.id)
      .not('item_id', 'is', null);

    for (const addon of addons ?? []) {
      if (!addon.item_id) continue;
      const inv = addon.inventory_item as { name: string; unit_cost: number } | null;
      if (!inv) continue;

      await deductInventoryItem(supabase, {
        shopId,
        userId,
        itemId: addon.item_id,
        itemName: inv.name,
        unitCost: inv.unit_cost ?? 0,
        quantityOut: computeItemQuantityOut(addon.quantity ?? 1, orderQty),
        orderId,
        transactionOn,
      });
    }
  }
}

Deno.serve(async (req) => {
  try {
    // Verify Xendit callback token (sent as x-callback-token header)
    const callbackToken = req.headers.get('x-callback-token');
    const expectedToken = Deno.env.get('XENDIT_WEBHOOK_VERIFICATION_TOKEN');

    if (!verifyCallbackToken(callbackToken, expectedToken)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: Record<string, unknown> = await req.json();

    // Acknowledge non-payment events silently (Xendit expects 200)
    if (!shouldProcessEvent(body.event as string | undefined)) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orderId = extractOrderId(body);
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing reference_id in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, shop_id, payment_received, created_by')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: if already paid, skip processing
    if (order.payment_received) {
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deduct inventory for the order's items
    await deductInventory(
      supabaseAdmin,
      orderId,
      order.shop_id as string,
      (order.created_by as string) ?? ''
    );

    // Mark order as paid — this triggers the Realtime subscription in the POS UI
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment_received: true })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order payment_received:', updateError.message);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Payment confirmed for order:', orderId);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Webhook handler error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
