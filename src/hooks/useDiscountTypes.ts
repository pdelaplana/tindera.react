// useDiscountTypes - React Query hooks for discount types

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { discountTypeService } from '@/services/discountType.service';
import type { DiscountTypeUpdate } from '@/types';

export const discountTypeKeys = {
  all: ['discount-types'] as const,
  lists: () => [...discountTypeKeys.all, 'list'] as const,
  list: (shopId: string) => [...discountTypeKeys.lists(), shopId] as const,
};

export function useDiscountTypes(includeInactive = false) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: discountTypeKeys.list(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) {
        throw new Error('No shop selected');
      }

      const result = includeInactive
        ? await discountTypeService.getAllDiscountTypes(currentShop.id)
        : await discountTypeService.getDiscountTypes(currentShop.id);

      if (result.error) {
        throw result.error;
      }

      return result.data || [];
    },
    enabled: !!currentShop,
  });
}

export function useCreateDiscountType() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!currentShop || !user) {
        throw new Error('Missing shop or user');
      }

      const result = await discountTypeService.createDiscountType(currentShop.id, name, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountTypeKeys.all });
      showSuccess('Discount type created successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create discount type');
    },
  });
}

export function useUpdateDiscountType() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ discountTypeId, updates }: { discountTypeId: string; updates: DiscountTypeUpdate }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await discountTypeService.updateDiscountType(discountTypeId, updates, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountTypeKeys.all });
      showSuccess('Discount type updated successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update discount type');
    },
  });
}

export function useDeleteDiscountType() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async (discountTypeId: string) => {
      const result = await discountTypeService.deleteDiscountType(discountTypeId);

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountTypeKeys.all });
      showSuccess('Discount type deleted successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete discount type');
    },
  });
}
