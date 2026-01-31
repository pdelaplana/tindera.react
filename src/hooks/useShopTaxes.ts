// useShopTaxes - React Query hooks for shop taxes

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { shopTaxService } from '@/services/shopTax.service';
import type { ShopTaxUpdate } from '@/types';

export const shopTaxKeys = {
  all: ['shop-taxes'] as const,
  lists: () => [...shopTaxKeys.all, 'list'] as const,
  list: (shopId: string) => [...shopTaxKeys.lists(), shopId] as const,
};

export function useShopTaxes(includeInactive = false) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: shopTaxKeys.list(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) {
        throw new Error('No shop selected');
      }

      const result = includeInactive
        ? await shopTaxService.getAllShopTaxes(currentShop.id)
        : await shopTaxService.getShopTaxes(currentShop.id);

      if (result.error) {
        throw result.error;
      }

      return result.data || [];
    },
    enabled: !!currentShop,
  });
}

export function useCreateShopTax() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ name, rate }: { name: string; rate: number }) => {
      if (!currentShop || !user) {
        throw new Error('Missing shop or user');
      }

      const result = await shopTaxService.createShopTax(currentShop.id, name, rate, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopTaxKeys.all });
      showSuccess('Tax created successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create tax');
    },
  });
}

export function useUpdateShopTax() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ taxId, updates }: { taxId: string; updates: ShopTaxUpdate }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await shopTaxService.updateShopTax(taxId, updates, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopTaxKeys.all });
      showSuccess('Tax updated successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update tax');
    },
  });
}

export function useDeleteShopTax() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async (taxId: string) => {
      const result = await shopTaxService.deleteShopTax(taxId);

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopTaxKeys.all });
      showSuccess('Tax deleted successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete tax');
    },
  });
}
