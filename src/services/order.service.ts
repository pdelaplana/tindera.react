// Order Service - Supabase Order Operations

import type {
  ApiResponse,
  CartItem,
  CreateOrderData,
  Order,
  OrderCreationResult,
  PaymentType,
} from '@/types';
import { inventoryService } from './inventory.service';
import { logger } from './sentry';
import { supabase } from './supabase';

export const orderService = {
  /**
   * Get all active payment types for a shop
   */
  async getPaymentTypes(shopId: string): Promise<ApiResponse<PaymentType[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('code');

      if (error) {
        logger.error(new Error(error.message), { context: 'getPaymentTypes', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as PaymentType[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getPaymentTypes', shopId });
      return { data: null, error };
    }
  },

  /**
   * Create a complete order with items, modifiers, addons, and inventory adjustments
   * Uses a rollback pattern for transaction safety
   */
  async createOrder(
    orderData: CreateOrderData,
    userId: string
  ): Promise<ApiResponse<OrderCreationResult>> {
    try {
      const now = new Date().toISOString();

      // STEP 1: Validate inventory availability before creating order
      const inventoryChecks = await this._validateInventoryAvailability(orderData.items);
      if (inventoryChecks.error) {
        return { data: null, error: inventoryChecks.error };
      }

      // STEP 2: Create the order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: orderData.shop_id,
          order_date: orderData.order_date,
          total_sale: orderData.total_sale,
          served_by_id: orderData.served_by_id,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          payment_type_id: orderData.payment_type_id,
          payment_received: orderData.payment_received,
          payment_amount_received: orderData.payment_amount_received,
          payment_change: orderData.payment_change,
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (orderError || !order) {
        logger.error(new Error(orderError?.message || 'Order creation failed'), {
          context: 'createOrder_orderInsert',
        });
        return { data: null, error: new Error(orderError?.message || 'Order creation failed') };
      }

      // STEP 3: Create order items with modifiers and addons
      const orderItemsResult = await this._createOrderItems(order.id, orderData.items, userId);

      if (orderItemsResult.error) {
        // Rollback: Delete the order (cascades to items/modifiers/addons)
        await supabase.from('orders').delete().eq('id', order.id);
        return { data: null, error: orderItemsResult.error };
      }

      // STEP 4: Decrement inventory
      const inventoryResult = await this._decrementInventory(
        orderData.shop_id,
        orderData.items,
        order.id,
        userId
      );

      if (inventoryResult.error) {
        // Rollback: Delete order items and order
        await supabase.from('orders').delete().eq('id', order.id);
        return { data: null, error: inventoryResult.error };
      }

      return {
        data: {
          order: order as Order,
          inventoryAdjustments: inventoryResult.data || [],
        },
        error: null,
      };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createOrder' });
      return { data: null, error };
    }
  },

  /**
   * Validate that all required inventory items have sufficient quantity
   * @private
   */
  async _validateInventoryAvailability(cartItems: CartItem[]): Promise<{ error: Error | null }> {
    try {
      // Check each cart item's inventory requirements
      for (const cartItem of cartItems) {
        // Get product_items links for this product
        const { data: productItems, error: productItemsError } = await supabase
          .from('product_items')
          .select(
            'inventory_item_id, quantity, inventory_item:inventory_items(name, current_count)'
          )
          .eq('product_id', cartItem.product_id);

        if (productItemsError) {
          return {
            error: new Error(`Failed to fetch product items: ${productItemsError.message}`),
          };
        }

        // Check each product item has sufficient inventory
        if (productItems && productItems.length > 0) {
          for (const productItem of productItems) {
            // Safely access inventory_item properties
            const invItem = productItem.inventory_item;
            if (!invItem || typeof invItem !== 'object') continue;

            const invItemTyped = invItem as { name: string; current_count: number };
            const requiredQty = (productItem.quantity || 0) * cartItem.quantity;

            if ((invItemTyped.current_count || 0) < requiredQty) {
              return {
                error: new Error(
                  `Insufficient inventory for ${invItemTyped.name}. Required: ${requiredQty}, Available: ${invItemTyped.current_count || 0}`
                ),
              };
            }
          }
        }

        // Check modifiers with inventory links
        for (const modifier of cartItem.modifiers) {
          // Skip modifiers without inventory links
          if (!modifier.inventory_item_id) continue;

          const { data: invItem, error: invError } = await supabase
            .from('inventory_items')
            .select('name, current_count')
            .eq('id', modifier.inventory_item_id)
            .single();

          if (invError || !invItem) continue;

          const requiredQty = (modifier.quantity || 0) * cartItem.quantity;
          if ((invItem.current_count || 0) < requiredQty) {
            return {
              error: new Error(
                `Insufficient inventory for ${invItem.name}. Required: ${requiredQty}, Available: ${invItem.current_count || 0}`
              ),
            };
          }
        }

        // Check addons with inventory links
        for (const addon of cartItem.addons) {
          // Skip addons without inventory links
          if (!addon.item_id) continue;

          const { data: invItem, error: invError } = await supabase
            .from('inventory_items')
            .select('name, current_count')
            .eq('id', addon.item_id)
            .single();

          if (invError || !invItem) continue;

          const requiredQty = addon.quantity * cartItem.quantity;
          if ((invItem.current_count || 0) < requiredQty) {
            return {
              error: new Error(
                `Insufficient inventory for ${invItem.name}. Required: ${requiredQty}, Available: ${invItem.current_count || 0}`
              ),
            };
          }
        }
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: '_validateInventoryAvailability' });
      return { error };
    }
  },

  /**
   * Create order items with their modifiers and addons (denormalized)
   * @private
   */
  async _createOrderItems(
    orderId: string,
    cartItems: CartItem[],
    userId: string
  ): Promise<{ error: Error | null }> {
    try {
      const now = new Date().toISOString();

      // Create order items for each cart item
      for (const cartItem of cartItems) {
        const product = cartItem.product;

        // Insert order item (denormalized product data)
        // Get category name from ProductWithCategory if available
        const categoryName =
          'category' in product &&
          product.category &&
          typeof product.category === 'object' &&
          'name' in product.category
            ? (product.category as { name: string }).name
            : null;

        const { data: orderItem, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_unit_price: product.price,
            product_category: categoryName,
            quantity: cartItem.quantity,
          })
          .select()
          .single();

        if (orderItemError || !orderItem) {
          return {
            error: new Error(
              `Failed to create order item: ${orderItemError?.message || 'Unknown error'}`
            ),
          };
        }

        // Insert order item modifiers (denormalized)
        if (cartItem.modifiers && cartItem.modifiers.length > 0) {
          const orderItemModifiers = cartItem.modifiers.map((modifier) => ({
            order_item_id: orderItem.id,
            modifier_group_id: modifier.modifier_group_id,
            modifier_group_name: modifier.modifier_group_name,
            modifier_id: modifier.modifier_id,
            modifier_name: modifier.modifier_name,
            price_adjustment: modifier.price_adjustment,
            inventory_item_id: modifier.inventory_item_id || null,
            quantity: modifier.quantity,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
          }));

          const { error: modifiersError } = await supabase
            .from('order_item_modifiers')
            .insert(orderItemModifiers);

          if (modifiersError) {
            return {
              error: new Error(`Failed to create order item modifiers: ${modifiersError.message}`),
            };
          }
        }

        // Insert order item addons (denormalized)
        if (cartItem.addons && cartItem.addons.length > 0) {
          const orderItemAddons = cartItem.addons.map((addon) => ({
            order_item_id: orderItem.id,
            name: addon.name,
            quantity: addon.quantity,
            price: addon.price,
            item_id: addon.item_id || null,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
          }));

          const { error: addonsError } = await supabase
            .from('order_item_addons')
            .insert(orderItemAddons);

          if (addonsError) {
            return {
              error: new Error(`Failed to create order item addons: ${addonsError.message}`),
            };
          }
        }
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: '_createOrderItems' });
      return { error };
    }
  },

  /**
   * Decrement inventory for all items, modifiers, and addons
   * Returns list of inventory adjustments made
   * @private
   */
  async _decrementInventory(
    shopId: string,
    cartItems: CartItem[],
    orderId: string,
    userId: string
  ): Promise<ApiResponse<Array<{ item_id: string; quantity_adjusted: number }>>> {
    try {
      const adjustments: Array<{ item_id: string; quantity_adjusted: number }> = [];

      // Process each cart item
      for (const cartItem of cartItems) {
        // 1. Decrement product items
        const { data: productItems, error: productItemsError } = await supabase
          .from('product_items')
          .select('inventory_item_id, quantity, inventory_item:inventory_items(name, unit_cost)')
          .eq('product_id', cartItem.product_id);

        if (productItemsError) {
          return {
            data: null,
            error: new Error(`Failed to fetch product items: ${productItemsError.message}`),
          };
        }

        if (productItems && productItems.length > 0) {
          for (const productItem of productItems) {
            // Safely access inventory_item properties
            const invItem = productItem.inventory_item;
            if (!invItem || typeof invItem !== 'object') continue;

            const invItemTyped = invItem as { name: string; unit_cost: number };
            const qtyToDecrement = (productItem.quantity || 0) * cartItem.quantity;

            // Skip if no inventory_item_id
            if (!productItem.inventory_item_id) continue;

            const saleResult = await inventoryService.createSaleTransaction(
              {
                shop_id: shopId,
                item_id: productItem.inventory_item_id,
                item_name: invItemTyped.name,
                quantity: qtyToDecrement,
                unit_cost: invItemTyped.unit_cost || 0,
                reference: orderId,
                notes: `Product: ${cartItem.product.name} (Qty: ${cartItem.quantity})`,
                transaction_on: new Date().toISOString(),
              },
              userId
            );

            if (saleResult.error) {
              return {
                data: null,
                error: new Error(`Failed to decrement inventory: ${saleResult.error.message}`),
              };
            }

            // Only push if item_id is not null
            if (productItem.inventory_item_id) {
              adjustments.push({
                item_id: productItem.inventory_item_id,
                quantity_adjusted: qtyToDecrement,
              });
            }
          }
        }

        // 2. Decrement modifiers with inventory links
        for (const modifier of cartItem.modifiers) {
          if (!modifier.inventory_item_id) continue;

          const { data: invItem, error: invError } = await supabase
            .from('inventory_items')
            .select('name, unit_cost')
            .eq('id', modifier.inventory_item_id)
            .single();

          if (invError || !invItem) continue;

          const qtyToDecrement = (modifier.quantity || 0) * cartItem.quantity;

          const saleResult = await inventoryService.createSaleTransaction(
            {
              shop_id: shopId,
              item_id: modifier.inventory_item_id || '',
              item_name: invItem.name,
              quantity: qtyToDecrement,
              unit_cost: invItem.unit_cost || 0,
              reference: orderId,
              notes: `Modifier: ${modifier.modifier_name} for ${cartItem.product.name}`,
              transaction_on: new Date().toISOString(),
            },
            userId
          );

          if (saleResult.error) {
            return {
              data: null,
              error: new Error(
                `Failed to decrement modifier inventory: ${saleResult.error.message}`
              ),
            };
          }

          adjustments.push({
            item_id: modifier.inventory_item_id || '',
            quantity_adjusted: qtyToDecrement,
          });
        }

        // 3. Decrement addons with inventory links
        for (const addon of cartItem.addons) {
          if (!addon.item_id) continue;

          const { data: invItem, error: invError } = await supabase
            .from('inventory_items')
            .select('name, unit_cost')
            .eq('id', addon.item_id)
            .single();

          if (invError || !invItem) continue;

          const qtyToDecrement = addon.quantity * cartItem.quantity;

          const saleResult = await inventoryService.createSaleTransaction(
            {
              shop_id: shopId,
              item_id: addon.item_id || '',
              item_name: invItem.name,
              quantity: qtyToDecrement,
              unit_cost: invItem.unit_cost || 0,
              reference: orderId,
              notes: `Addon: ${addon.name} (${addon.quantity}x) for ${cartItem.product.name}`,
              transaction_on: new Date().toISOString(),
            },
            userId
          );

          if (saleResult.error) {
            return {
              data: null,
              error: new Error(`Failed to decrement addon inventory: ${saleResult.error.message}`),
            };
          }

          adjustments.push({
            item_id: addon.item_id || '',
            quantity_adjusted: qtyToDecrement,
          });
        }
      }

      return { data: adjustments, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: '_decrementInventory' });
      return { data: null, error };
    }
  },
};
