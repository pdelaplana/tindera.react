// useShop Hook - Convenience hook for shop management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useShopContext } from '@/contexts/ShopContext';
import { shopService } from '@/services/shop.service';
import type { ShopInsert, ShopUpdate } from '@/types';

// Query keys for cache management
export const shopKeys = {
	all: ['shops'] as const,
	lists: () => [...shopKeys.all, 'list'] as const,
	list: (userId: string) => [...shopKeys.lists(), userId] as const,
	details: () => [...shopKeys.all, 'detail'] as const,
	detail: (shopId: string) => [...shopKeys.details(), shopId] as const,
	users: (shopId: string) => [...shopKeys.all, 'users', shopId] as const,
};

/**
 * Hook to access shop state and actions from context.
 *
 * @example
 * ```tsx
 * function ShopSelector() {
 *   const { shops, currentShop, selectShop, isLoading } = useShop();
 *
 *   if (isLoading) return <IonSpinner />;
 *
 *   return (
 *     <IonSelect value={currentShop?.id} onIonChange={(e) => selectShop(e.detail.value)}>
 *       {shops.map((shop) => (
 *         <IonSelectOption key={shop.id} value={shop.id}>
 *           {shop.name}
 *         </IonSelectOption>
 *       ))}
 *     </IonSelect>
 *   );
 * }
 * ```
 */
export function useShop() {
	return useShopContext();
}

/**
 * Hook to fetch shop users with TanStack Query.
 * Provides caching, background refetching, and loading states.
 *
 * @example
 * ```tsx
 * function ShopUsersList() {
 *   const { currentShop } = useShop();
 *   const { data: users, isLoading, error } = useShopUsers(currentShop?.id);
 *
 *   if (isLoading) return <IonSpinner />;
 *   if (error) return <p>Error loading users</p>;
 *
 *   return (
 *     <IonList>
 *       {users?.map((user) => (
 *         <IonItem key={user.user_id}>
 *           <IonLabel>{user.role}</IonLabel>
 *         </IonItem>
 *       ))}
 *     </IonList>
 *   );
 * }
 * ```
 */
export function useShopUsers(shopId: string | undefined) {
	return useQuery({
		queryKey: shopKeys.users(shopId || ''),
		queryFn: async () => {
			if (!shopId) return [];
			const { data, error } = await shopService.getShopUsers(shopId);
			if (error) throw error;
			return data || [];
		},
		enabled: !!shopId,
	});
}

/**
 * Hook to add a user to a shop.
 */
export function useAddUserToShop() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			shopId,
			userId,
			role,
		}: {
			shopId: string;
			userId: string;
			role: string;
		}) => {
			const { error } = await shopService.addUserToShop(shopId, userId, role);
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: shopKeys.users(variables.shopId) });
		},
	});
}

/**
 * Hook to remove a user from a shop.
 */
export function useRemoveUserFromShop() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ shopId, userId }: { shopId: string; userId: string }) => {
			const { error } = await shopService.removeUserFromShop(shopId, userId);
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: shopKeys.users(variables.shopId) });
		},
	});
}

/**
 * Hook to update a user's role in a shop.
 */
export function useUpdateUserRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			shopId,
			userId,
			role,
		}: {
			shopId: string;
			userId: string;
			role: string;
		}) => {
			const { error } = await shopService.updateUserRole(shopId, userId, role);
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: shopKeys.users(variables.shopId) });
		},
	});
}

/**
 * Hook to create a new shop using TanStack Query mutation.
 * Provides loading state and error handling.
 *
 * @example
 * ```tsx
 * function CreateShopForm() {
 *   const createShopMutation = useCreateShop();
 *
 *   const handleSubmit = async (data: ShopInsert) => {
 *     try {
 *       const shop = await createShopMutation.mutateAsync(data);
 *       console.log('Created shop:', shop);
 *     } catch (error) {
 *       console.error('Failed to create shop:', error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {createShopMutation.isPending && <IonSpinner />}
 *       ...
 *     </form>
 *   );
 * }
 * ```
 */
export function useCreateShop() {
	const { createShop } = useShopContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: ShopInsert) => {
			const { success, shop, error } = await createShop(data);
			if (!success || !shop) {
				console.log('Create shop error:', error);
				throw new Error(error || 'Failed to create shop');
			}
			return shop;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
		},
	});
}

/**
 * Hook to update an existing shop using TanStack Query mutation.
 */
export function useUpdateShop() {
	const { updateShop } = useShopContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ shopId, data }: { shopId: string; data: ShopUpdate }) => {
			const { success, error } = await updateShop(shopId, data);
			if (!success) throw new Error(error || 'Failed to update shop');
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: shopKeys.detail(variables.shopId) });
			queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
		},
	});
}

/**
 * Hook to delete a shop using TanStack Query mutation.
 */
export function useDeleteShop() {
	const { deleteShop } = useShopContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (shopId: string) => {
			const { success, error } = await deleteShop(shopId);
			if (!success) throw new Error(error || 'Failed to delete shop');
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
		},
	});
}

export default useShop;
