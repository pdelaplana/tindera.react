// useInventory Hook - TanStack Query hooks for inventory management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import {
	type InventoryFilters,
	type InventoryTransactionFilters,
	inventoryService,
} from '@/services/inventory.service';
import type {
	InventoryCategory,
	InventoryItemInsert,
	InventoryItemUpdate,
	PackageSizeInsert,
	PackageSizeUpdate,
} from '@/types';

// Query keys for cache management
export const inventoryKeys = {
	all: ['inventory'] as const,
	lists: () => [...inventoryKeys.all, 'list'] as const,
	list: (shopId: string, filters?: InventoryFilters) =>
		[...inventoryKeys.lists(), shopId, filters] as const,
	details: () => [...inventoryKeys.all, 'detail'] as const,
	detail: (itemId: string) => [...inventoryKeys.details(), itemId] as const,
	categories: (shopId: string) => [...inventoryKeys.all, 'categories', shopId] as const,
	packageSizes: (itemId: string) => [...inventoryKeys.all, 'packageSizes', itemId] as const,
	transactions: (itemId: string, filters?: InventoryTransactionFilters) =>
		[...inventoryKeys.all, 'transactions', itemId, filters] as const,
	transaction: (transactionId: string) =>
		[...inventoryKeys.all, 'transaction', transactionId] as const,
	counts: (shopId: string) => [...inventoryKeys.all, 'counts', shopId] as const,
};

/**
 * Hook to fetch inventory items with optional filters
 */
export function useInventoryItems(filters?: InventoryFilters) {
	const { currentShop } = useShopContext();

	return useQuery({
		queryKey: inventoryKeys.list(currentShop?.id || '', filters),
		queryFn: async () => {
			if (!currentShop?.id) return [];

			const { data, error } = await inventoryService.getInventoryItems(currentShop.id, filters);

			if (error) throw error;
			return data || [];
		},
		enabled: !!currentShop,
	});
}

/**
 * Hook to fetch a single inventory item by ID
 */
export function useInventoryItem(itemId: string | undefined) {
	return useQuery({
		queryKey: inventoryKeys.detail(itemId || ''),
		queryFn: async () => {
			if (!itemId) return null;

			const { data, error } = await inventoryService.getInventoryItem(itemId);

			if (error) throw error;
			return data;
		},
		enabled: !!itemId,
	});
}

/**
 * Hook to create a new inventory item
 */
export function useCreateInventoryItem() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async (itemData: Omit<InventoryItemInsert, 'shop_id'>) => {
			if (!currentShop?.id || !user?.id) {
				throw new Error('Shop or user not available');
			}

			const { data, error } = await inventoryService.createInventoryItem(
				{
					...itemData,
					shop_id: currentShop.id,
				},
				user.id
			);

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate and refetch inventory items list
			queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
		},
	});
}

/**
 * Hook to update an existing inventory item
 */
export function useUpdateInventoryItem() {
	const queryClient = useQueryClient();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async ({ itemId, data }: { itemId: string; data: InventoryItemUpdate }) => {
			if (!user?.id) {
				throw new Error('User not available');
			}

			const { data: updatedItem, error } = await inventoryService.updateInventoryItem(
				itemId,
				data,
				user.id
			);

			if (error) throw error;
			return updatedItem;
		},
		onSuccess: (_data, variables) => {
			// Invalidate the specific item and lists
			queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.itemId) });
			queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
		},
	});
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventoryItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (itemId: string) => {
			const { error } = await inventoryService.deleteInventoryItem(itemId);

			if (error) throw error;
		},
		onSuccess: () => {
			// Invalidate inventory items list
			queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
		},
	});
}

/**
 * Hook to fetch inventory categories for current shop
 */
export function useInventoryCategories() {
	const { currentShop } = useShopContext();

	return useQuery({
		queryKey: inventoryKeys.categories(currentShop?.id || ''),
		queryFn: async () => {
			if (!currentShop?.id) return [];

			const { data, error } = await inventoryService.getInventoryCategories(currentShop.id);

			if (error) throw error;
			return data || [];
		},
		enabled: !!currentShop,
	});
}

/**
 * Hook to create a new inventory category
 */
export function useCreateInventoryCategory() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();

	return useMutation({
		mutationFn: async (categoryData: Omit<InventoryCategory, 'id' | 'shop_id'>) => {
			if (!currentShop?.id) {
				throw new Error('Shop not available');
			}

			const { data, error } = await inventoryService.createInventoryCategory({
				...categoryData,
				shop_id: currentShop.id,
			});

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate categories list
			queryClient.invalidateQueries({
				queryKey: inventoryKeys.categories(currentShop?.id || ''),
			});
		},
	});
}

/**
 * Hook to update an existing inventory category
 */
export function useUpdateInventoryCategory() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();

	return useMutation({
		mutationFn: async ({
			categoryId,
			updates,
		}: {
			categoryId: string;
			updates: Partial<InventoryCategory>;
		}) => {
			const { data, error } = await inventoryService.updateInventoryCategory(categoryId, updates);

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate categories list
			queryClient.invalidateQueries({
				queryKey: inventoryKeys.categories(currentShop?.id || ''),
			});
		},
	});
}

/**
 * Hook to delete an inventory category
 */
export function useDeleteInventoryCategory() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();

	return useMutation({
		mutationFn: async (categoryId: string) => {
			const { error } = await inventoryService.deleteInventoryCategory(categoryId);

			if (error) throw error;
		},
		onSuccess: () => {
			// Invalidate categories list
			queryClient.invalidateQueries({
				queryKey: inventoryKeys.categories(currentShop?.id || ''),
			});
		},
	});
}

// ===== Package Sizes Hooks =====

/**
 * Hook to fetch package sizes for an inventory item
 */
export function usePackageSizes(itemId: string | undefined) {
	return useQuery({
		queryKey: inventoryKeys.packageSizes(itemId || ''),
		queryFn: async () => {
			if (!itemId) return [];
			const { data, error } = await inventoryService.getPackageSizes(itemId);
			if (error) throw error;
			return data || [];
		},
		enabled: !!itemId,
	});
}

/**
 * Hook to create a new package size for an inventory item
 */
export function useCreatePackageSize() {
	const queryClient = useQueryClient();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async (packageData: PackageSizeInsert) => {
			if (!user?.id) throw new Error('User not available');
			const { data, error } = await inventoryService.createPackageSize(packageData, user.id);
			if (error) throw error;
			return data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: inventoryKeys.packageSizes(variables.item_id) });
		},
	});
}

/**
 * Hook to update an existing package size
 */
export function useUpdatePackageSize() {
	const queryClient = useQueryClient();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async ({
			packageId,
			itemId,
			updates,
		}: {
			packageId: string;
			itemId: string;
			updates: PackageSizeUpdate;
		}) => {
			if (!user?.id) throw new Error('User not available');
			const { data, error } = await inventoryService.updatePackageSize(packageId, updates, user.id);
			if (error) throw error;
			return data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: inventoryKeys.packageSizes(variables.itemId) });
		},
	});
}

/**
 * Hook to delete a package size
 */
export function useDeletePackageSize() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ packageId, itemId }: { packageId: string; itemId: string }) => {
			const { error } = await inventoryService.deletePackageSize(packageId);
			if (error) throw error;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: inventoryKeys.packageSizes(variables.itemId) });
		},
	});
}

// ===== Inventory Transactions Hooks =====

/**
 * Hook to fetch transactions for an inventory item with optional filters
 */
export function useInventoryTransactions(
	itemId: string | undefined,
	filters?: InventoryTransactionFilters
) {
	return useQuery({
		queryKey: inventoryKeys.transactions(itemId || '', filters),
		queryFn: async () => {
			if (!itemId) return [];

			const { data, error } = await inventoryService.getInventoryTransactions(itemId, filters);

			if (error) throw error;
			return data || [];
		},
		enabled: !!itemId,
	});
}

/**
 * Hook to fetch a single inventory transaction by ID
 */
export function useInventoryTransaction(transactionId: string | undefined) {
	return useQuery({
		queryKey: inventoryKeys.transaction(transactionId || ''),
		queryFn: async () => {
			if (!transactionId) return null;

			const { data, error } = await inventoryService.getInventoryTransaction(transactionId);

			if (error) throw error;
			return data;
		},
		enabled: !!transactionId,
	});
}

/**
 * Hook to create a receipt transaction (receiving inventory)
 * Supports both direct base unit receipts and package-based receipts
 */
export function useCreateReceipt() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async (transactionData: {
			item_id: string;
			item_name: string;
			// Option 1: Direct base unit receipt
			quantity_in?: number;
			unit_cost?: number;
			// Option 2: Package-based receipt
			package_size_id?: string | null;
			package_quantity?: number;
			package_cost_per_unit?: number;
			// Common fields
			supplier?: string | null;
			reference?: string | null;
			notes?: string | null;
			transaction_on: string;
		}) => {
			if (!currentShop?.id || !user?.id) {
				throw new Error('Shop or user not available');
			}

			const { data, error } = await inventoryService.createReceiptTransaction(
				{
					...transactionData,
					shop_id: currentShop.id,
				},
				user.id
			);

			if (error) throw error;
			return data;
		},
		onSuccess: (_data, variables) => {
			// Invalidate transactions, item detail, and list
			queryClient.invalidateQueries({
				queryKey: inventoryKeys.transactions(variables.item_id),
			});
			queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.item_id) });
			queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
		},
	});
}

/**
 * Hook to create an adjustment transaction
 */
export function useCreateAdjustment() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async (transactionData: {
			item_id: string;
			item_name: string;
			adjustment_type: 'increase' | 'decrease';
			quantity: number;
			adjustment_reason_code?: string | null;
			adjustment_reason_other?: string | null;
			notes?: string | null;
			transaction_on: string;
		}) => {
			if (!currentShop?.id || !user?.id) {
				throw new Error('Shop or user not available');
			}

			const { data, error } = await inventoryService.createAdjustmentTransaction(
				{
					...transactionData,
					shop_id: currentShop.id,
				},
				user.id
			);

			if (error) throw error;
			return data;
		},
		onSuccess: (_data, variables) => {
			// Invalidate transactions, item detail, and list
			queryClient.invalidateQueries({
				queryKey: inventoryKeys.transactions(variables.item_id),
			});
			queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.item_id) });
			queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
		},
	});
}

// ===== Inventory Counts Hooks =====

/**
 * Hook to fetch inventory counts for current shop
 */
export function useInventoryCounts() {
	const { currentShop } = useShopContext();

	return useQuery({
		queryKey: inventoryKeys.counts(currentShop?.id || ''),
		queryFn: async () => {
			if (!currentShop?.id) return [];

			const { data, error } = await inventoryService.getInventoryCounts(currentShop.id);

			if (error) throw error;
			return data || [];
		},
		enabled: !!currentShop,
	});
}

/**
 * Hook to create a new inventory count
 */
export function useCreateInventoryCount() {
	const queryClient = useQueryClient();
	const { currentShop } = useShopContext();
	const { user } = useAuthContext();

	return useMutation({
		mutationFn: async (countData: {
			count_date: string;
			count_type: string;
			notes?: string | null;
		}) => {
			if (!currentShop?.id || !user?.id) {
				throw new Error('Shop or user not available');
			}

			const { data, error } = await inventoryService.createInventoryCount(
				{
					...countData,
					shop_id: currentShop.id,
				},
				user.id
			);

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate counts list
			queryClient.invalidateQueries({ queryKey: inventoryKeys.counts(currentShop?.id || '') });
		},
	});
}
