// useModifier.ts - React Query hooks for global modifier management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts';
import { useShopContext } from '@/contexts/ShopContext';
import { modifierService } from '@/services/modifier.service';
import type {
  ModifierGroupInsert,
  ModifierGroupUpdate,
  ModifierInsert,
  ModifierUpdate,
} from '@/types';

// ===== Query Keys =====

export const modifierKeys = {
  all: ['modifiers'] as const,
  groups: (shopId: string) => [...modifierKeys.all, 'groups', shopId] as const,
  group: (groupId: string) => [...modifierKeys.all, 'group', groupId] as const,
};

// ===== Query Hooks =====

/**
 * Fetch all modifier groups for the current shop
 */
export function useModifierGroups() {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: modifierKeys.groups(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await modifierService.getModifierGroups(currentShop.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentShop,
  });
}

/**
 * Fetch a single modifier group with its modifiers
 */
export function useModifierGroup(groupId: string) {
  return useQuery({
    queryKey: modifierKeys.group(groupId),
    queryFn: async () => {
      const { data, error } = await modifierService.getModifierGroup(groupId);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

// ===== Mutation Hooks - Modifier Groups =====

/**
 * Create a new modifier group
 */
export function useCreateModifierGroup() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (groupData: ModifierGroupInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await modifierService.createModifierGroup(groupData, user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
    },
  });
}

/**
 * Update a modifier group
 */
export function useUpdateModifierGroup() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ groupId, updates }: { groupId: string; updates: ModifierGroupUpdate }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await modifierService.updateModifierGroup(groupId, updates, user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
      queryClient.invalidateQueries({ queryKey: modifierKeys.group(variables.groupId) });
    },
  });
}

/**
 * Delete a modifier group
 */
export function useDeleteModifierGroup() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await modifierService.deleteModifierGroup(groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
    },
  });
}

// ===== Mutation Hooks - Modifiers =====

/**
 * Add a modifier to a group
 */
export function useAddModifier() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (modifierData: ModifierInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await modifierService.addModifier(modifierData, user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
      if (data) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.group(data.modifier_group_id) });
      }
    },
  });
}

/**
 * Update a modifier
 */
export function useUpdateModifier() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      modifierId,
      updates,
    }: {
      modifierId: string;
      updates: ModifierUpdate;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await modifierService.updateModifier(modifierId, updates, user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
      if (data) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.group(data.modifier_group_id) });
      }
    },
  });
}

/**
 * Delete a modifier
 */
export function useDeleteModifier() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: async ({ modifierId, groupId }: { modifierId: string; groupId: string }) => {
      const { error } = await modifierService.deleteModifier(modifierId);
      if (error) throw error;
      return { groupId };
    },
    onSuccess: (data) => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: modifierKeys.groups(currentShop.id) });
      }
      queryClient.invalidateQueries({ queryKey: modifierKeys.group(data.groupId) });
    },
  });
}

// ===== Mutation Hooks - Product Linking =====

/**
 * Link a modifier group to a product
 */
export function useLinkModifierGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      productId,
      groupId,
      sequence = 0,
    }: {
      productId: string;
      groupId: string;
      sequence?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await modifierService.linkModifierGroupToProduct(
        productId,
        groupId,
        sequence,
        user.id
      );
      if (error) throw error;
      return { productId };
    },
    onSuccess: (_data) => {
      // Invalidate product queries to refetch with new modifier groups
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Unlink a modifier group from a product
 */
export function useUnlinkModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, groupId }: { productId: string; groupId: string }) => {
      const { error } = await modifierService.unlinkModifierGroupFromProduct(productId, groupId);
      if (error) throw error;
      return { productId };
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Update the sequence (order) of a linked modifier group
 */
export function useUpdateLinkSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      groupId,
      sequence,
    }: {
      productId: string;
      groupId: string;
      sequence: number;
    }) => {
      const { error } = await modifierService.updateLinkSequence(productId, groupId, sequence);
      if (error) throw error;
      return { productId };
    },
    onSuccess: () => {
      // Invalidate product queries to refetch with new order
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ===== Mutation Hooks - Price Overrides =====

/**
 * Set a product-specific price override for a modifier
 */
export function useSetModifierPriceOverride() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      productId,
      modifierId,
      priceAdjustment,
    }: {
      productId: string;
      modifierId: string;
      priceAdjustment: number;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await modifierService.setModifierPriceOverride(
        productId,
        modifierId,
        priceAdjustment,
        user.id
      );
      if (error) throw error;
      return { productId };
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Remove a product-specific price override for a modifier
 */
export function useRemoveModifierPriceOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, modifierId }: { productId: string; modifierId: string }) => {
      const { error } = await modifierService.removeModifierPriceOverride(productId, modifierId);
      if (error) throw error;
      return { productId };
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
