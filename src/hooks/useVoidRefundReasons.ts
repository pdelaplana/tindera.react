// useVoidRefundReasons - React Query hooks for void/refund reasons

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { voidRefundReasonService } from '@/services/voidRefundReason.service';

export const voidRefundReasonKeys = {
  all: ['void-refund-reasons'] as const,
  lists: () => [...voidRefundReasonKeys.all, 'list'] as const,
  list: (shopId: string) => [...voidRefundReasonKeys.lists(), shopId] as const,
};

export function useVoidRefundReasons(includeInactive = false) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: voidRefundReasonKeys.list(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) {
        throw new Error('No shop selected');
      }

      const result = includeInactive
        ? await voidRefundReasonService.getAllReasons(currentShop.id)
        : await voidRefundReasonService.getReasons(currentShop.id);

      if (result.error) {
        throw result.error;
      }

      return result.data || [];
    },
    enabled: !!currentShop,
  });
}

export function useCreateVoidRefundReason() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!currentShop || !user) {
        throw new Error('Missing shop or user');
      }

      const result = await voidRefundReasonService.createReason(currentShop.id, name, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voidRefundReasonKeys.all });
      showSuccess('Void/refund reason created successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create void/refund reason');
    },
  });
}

export function useUpdateVoidRefundReason() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async ({
      reasonId,
      updates,
    }: {
      reasonId: string;
      updates: { name?: string; is_active?: boolean };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await voidRefundReasonService.updateReason(reasonId, updates, user.id);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voidRefundReasonKeys.all });
      showSuccess('Void/refund reason updated successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update void/refund reason');
    },
  });
}

export function useDeleteVoidRefundReason() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useUI();

  return useMutation({
    mutationFn: async (reasonId: string) => {
      const result = await voidRefundReasonService.deleteReason(reasonId);

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voidRefundReasonKeys.all });
      showSuccess('Void/refund reason deleted successfully');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete void/refund reason');
    },
  });
}
