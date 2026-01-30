// useOrder Hook - TanStack Query hooks for order management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { orderService } from '@/services/order.service';
import type { CreateOrderData } from '@/types';

// Query keys for order-related queries
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (shopId: string, filters?: Record<string, unknown>) =>
    [...orderKeys.lists(), shopId, filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
  paymentTypes: (shopId: string) => [...orderKeys.all, 'payment-types', shopId] as const,
};

/**
 * Hook to fetch orders for current shop
 * Supports optional filtering by status and search
 */
export function useOrders(options?: { status?: string; search?: string }) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: orderKeys.list(currentShop?.id || '', options),
    queryFn: async () => {
      if (!currentShop) {
        throw new Error('No shop selected');
      }

      const result = await orderService.getOrders(currentShop.id, options);

      if (result.error) {
        throw result.error;
      }

      return result.data || [];
    },
    enabled: !!currentShop,
  });
}

/**
 * Hook to fetch a single order by ID
 * Returns order with full details including items, taxes, discounts
 */
export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const result = await orderService.getOrder(orderId);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch payment types for current shop
 * Returns active payment types, cached for 5 minutes
 */
export function usePaymentTypes() {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: orderKeys.paymentTypes(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) return [];

      const { data, error } = await orderService.getPaymentTypes(currentShop.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentShop,
    staleTime: 5 * 60 * 1000, // 5 minutes - payment types rarely change
  });
}

/**
 * Hook to create an order
 * Automatically invalidates related queries on success
 */
export function useCreateOrder() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await orderService.createOrder(orderData, user.id);
      if (error) throw error;
      if (!data) throw new Error('No data returned from order creation');

      return data;
    },
    onSuccess: () => {
      // Invalidate orders list (for future order history feature)
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Hook to void an order
 * Requires a void reason ID and automatically invalidates order queries
 */
export function useVoidOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ orderId, reasonId }: { orderId: string; reasonId: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await orderService.voidOrder(orderId, reasonId, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      showSuccess('Order voided successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to void order');
    },
  });
}

/**
 * Hook to refund an order
 * Requires refund amount and reason ID
 */
export function useRefundOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ orderId, amount, reasonId }: { orderId: string; amount: number; reasonId: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await orderService.refundOrder(orderId, amount, reasonId, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      showSuccess('Order refunded successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to refund order');
    },
  });
}
