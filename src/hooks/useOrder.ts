// useOrder Hook - TanStack Query hooks for order management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { orderService } from '@/services/order.service';
import type { CreateOrderData } from '@/types';

// Query keys for order-related queries
export const orderKeys = {
  all: ['orders'] as const,
  paymentTypes: (shopId: string) => [...orderKeys.all, 'payment-types', shopId] as const,
};

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
