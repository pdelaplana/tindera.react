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
  allPaymentTypes: (shopId: string) => [...orderKeys.all, 'payment-types-all', shopId] as const,
  productSummary: (shopId: string, productId: string, period: string) =>
    [...orderKeys.all, 'product-summary', shopId, productId, period] as const,
  productOrders: (shopId: string, productId: string, period: string) =>
    [...orderKeys.all, 'product-orders', shopId, productId, period] as const,
};

export type SalesPeriod = 'today' | 'week' | 'month' | 'all';

function getDateRange(period: SalesPeriod): { startDate?: string; endDate?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00.000Z`;

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: toIso(start) };
  }
  if (period === 'week') {
    const day = now.getDay(); // 0 = Sunday
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    return { startDate: toIso(start) };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toIso(start) };
  }
  return {};
}

/**
 * Hook to fetch orders for current shop
 * Supports optional filtering by status, search, and date range
 */
export function useOrders(options?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
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
 * Hook to fetch all payment types (including inactive) for the current shop.
 * Used by the Payment Methods settings page.
 */
export function useAllPaymentTypes() {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: orderKeys.allPaymentTypes(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) return [];

      const { data, error } = await orderService.getAllPaymentTypes(currentShop.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentShop,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to upsert a payment type (create or toggle active status).
 * Invalidates both the active-only and all-payment-types queries on success.
 */
export function useUpsertPaymentType() {
  const { user } = useAuthContext();
  const { currentShop } = useShopContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      isActive,
      description,
    }: {
      code: string;
      isActive: boolean;
      description: string | null;
    }) => {
      if (!user) throw new Error('User not authenticated');
      if (!currentShop) throw new Error('No shop selected');

      const { data, error } = await orderService.upsertPaymentType(
        currentShop.id,
        code,
        isActive,
        description,
        user.id
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: orderKeys.paymentTypes(currentShop.id) });
        queryClient.invalidateQueries({ queryKey: orderKeys.allPaymentTypes(currentShop.id) });
      }
    },
  });
}

/**
 * Hook to create a pending e-wallet order (payment_received: false, no inventory deduction).
 * Used for GCash/Maya checkout flow before Xendit charge is created.
 */
export function useCreateEwalletOrder() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: import('@/types').CreateOrderData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await orderService.createEwalletOrder(orderData, user.id);
      if (error) throw error;
      if (!data) throw new Error('No data returned from e-wallet order creation');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Hook to invoke the create-xendit-charge Edge Function.
 */
export function useCreateXenditCharge() {
  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
      currency,
      paymentMethod,
    }: {
      orderId: string;
      amount: number;
      currency: string;
      paymentMethod: 'GCASH' | 'MAYA';
    }) => {
      const { data, error } = await orderService.createXenditCharge(
        orderId,
        amount,
        currency,
        paymentMethod
      );
      if (error) throw error;
      if (!data) throw new Error('No charge data returned from Xendit');

      return data;
    },
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
    mutationFn: async ({
      orderId,
      amount,
      reasonId,
    }: {
      orderId: string;
      amount: number;
      reasonId: string;
    }) => {
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

/**
 * Hook to fetch sales summary (total qty sold + total revenue) for a specific product
 */
export function useProductSalesSummary(productId: string | undefined, period: SalesPeriod) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: orderKeys.productSummary(currentShop?.id || '', productId || '', period),
    queryFn: async () => {
      if (!currentShop || !productId) return { totalQty: 0, totalAmount: 0 };
      const dateRange = getDateRange(period);
      const result = await orderService.getProductSalesSummary(
        currentShop.id,
        productId,
        dateRange
      );
      if (result.error) throw result.error;
      return result.data ?? { totalQty: 0, totalAmount: 0 };
    },
    enabled: !!currentShop && !!productId,
  });
}

/**
 * Hook to fetch all orders that contain a specific product
 */
export function useProductSalesOrders(productId: string | undefined, period: SalesPeriod) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: orderKeys.productOrders(currentShop?.id || '', productId || '', period),
    queryFn: async () => {
      if (!currentShop || !productId) return [];
      const dateRange = getDateRange(period);
      const result = await orderService.getProductSalesOrders(currentShop.id, productId, dateRange);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    enabled: !!currentShop && !!productId,
  });
}
