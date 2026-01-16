// Shop Context - Shop State Management

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logger } from '@/services/sentry';
import { type ShopWithRole, shopService } from '@/services/shop.service';
import type { Shop, ShopInsert, ShopUpdate } from '@/types';
import { useAuthContext } from './AuthContext';

const SELECTED_SHOP_KEY = 'tindera_selected_shop';

interface ShopState {
	shops: ShopWithRole[];
	currentShop: ShopWithRole | null;
	currentRole: string | null;
	isLoading: boolean;
	error: string | null;
}

interface ShopContextValue extends ShopState {
	selectShop: (shopId: string) => void;
	createShop: (
		data: ShopInsert
	) => Promise<{ success: boolean; shop: Shop | null; error: string | null }>;
	updateShop: (
		shopId: string,
		data: ShopUpdate
	) => Promise<{ success: boolean; error: string | null }>;
	deleteShop: (shopId: string) => Promise<{ success: boolean; error: string | null }>;
	refreshShops: () => Promise<void>;
	hasPermission: (requiredRole: 'owner' | 'admin' | 'staff') => boolean;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

interface ShopProviderProps {
	children: React.ReactNode;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
	owner: 3,
	admin: 2,
	staff: 1,
};

export function ShopProvider({ children }: ShopProviderProps) {
	const { user, isAuthenticated, refreshShopIds } = useAuthContext();

	// Create stable reference to user.id to prevent infinite loops
	const userId = user?.id;

	const [state, setState] = useState<ShopState>({
		shops: [],
		currentShop: null,
		currentRole: null,
		isLoading: false,
		error: null,
	});

	// Load shops when user authenticates or shopIds change
	const loadShops = useCallback(async () => {
		if (!userId || !isAuthenticated) {
			setState({
				shops: [],
				currentShop: null,
				currentRole: null,
				isLoading: false,
				error: null,
			});
			return;
		}

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const { data: shops, error } = await shopService.getShopsForUser(userId);

			if (error) {
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: error.message,
				}));
				return;
			}

			const loadedShops = shops || [];

			// Try to restore previously selected shop
			const savedShopId = localStorage.getItem(SELECTED_SHOP_KEY);
			let currentShop: ShopWithRole | null = null;

			if (savedShopId) {
				currentShop = loadedShops.find((s) => s.id === savedShopId) || null;
			}

			// If no saved shop or saved shop not found, select first available shop
			if (!currentShop && loadedShops.length > 0) {
				currentShop = loadedShops[0];
				localStorage.setItem(SELECTED_SHOP_KEY, currentShop.id);
			}

			setState({
				shops: loadedShops,
				currentShop,
				currentRole: currentShop?.role || null,
				isLoading: false,
				error: null,
			});
		} catch (err) {
			logger.error(err as Error, { context: 'loadShops' });
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: 'Failed to load shops',
			}));
		}
	}, [userId, isAuthenticated]);

	// Load shops when user or auth status changes
	useEffect(() => {
		loadShops();
	}, [loadShops]);

	// Clear state when user logs out
	useEffect(() => {
		if (!isAuthenticated) {
			localStorage.removeItem(SELECTED_SHOP_KEY);
			setState({
				shops: [],
				currentShop: null,
				currentRole: null,
				isLoading: false,
				error: null,
			});
		}
	}, [isAuthenticated]);

	const selectShop = useCallback((shopId: string) => {
		setState((prev) => {
			const shop = prev.shops.find((s) => s.id === shopId);

			if (shop) {
				localStorage.setItem(SELECTED_SHOP_KEY, shopId);
				return {
					...prev,
					currentShop: shop,
					currentRole: shop.role,
				};
			}

			return prev;
		});
	}, []);

	const createShop = async (
		data: ShopInsert
	): Promise<{ success: boolean; shop: Shop | null; error: string | null }> => {
		if (!user) {
			return { success: false, shop: null, error: 'Not authenticated' };
		}

		setState((prev) => ({ ...prev, isLoading: true }));

		const { data: shop, error } = await shopService.createShop(data, user.id);

		if (error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, shop: null, error: error.message };
		}

		// Refresh shop IDs in auth context and reload shops
		await refreshShopIds();
		await loadShops();

		// Select the newly created shop
		if (shop) {
			localStorage.setItem(SELECTED_SHOP_KEY, shop.id);
		}

		return { success: true, shop, error: null };
	};

	const updateShop = async (
		shopId: string,
		data: ShopUpdate
	): Promise<{ success: boolean; error: string | null }> => {
		if (!user) {
			return { success: false, error: 'Not authenticated' };
		}

		setState((prev) => ({ ...prev, isLoading: true }));

		const { data: updatedShop, error } = await shopService.updateShop(shopId, data, user.id);

		if (error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: error.message };
		}

		// Update the shop in state
		setState((prev) => {
			const updatedShops = prev.shops.map((s) => (s.id === shopId ? { ...s, ...updatedShop } : s));

			return {
				...prev,
				shops: updatedShops,
				currentShop:
					prev.currentShop?.id === shopId ? { ...prev.currentShop, ...updatedShop } : prev.currentShop,
				isLoading: false,
			};
		});

		return { success: true, error: null };
	};

	const deleteShop = async (shopId: string): Promise<{ success: boolean; error: string | null }> => {
		setState((prev) => ({ ...prev, isLoading: true }));

		const { error } = await shopService.deleteShop(shopId);

		if (error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: error.message };
		}

		// Refresh shop IDs in auth context and reload shops
		await refreshShopIds();

		// If deleted shop was selected, clear selection
		if (state.currentShop?.id === shopId) {
			localStorage.removeItem(SELECTED_SHOP_KEY);
		}

		await loadShops();

		return { success: true, error: null };
	};

	const refreshShops = async (): Promise<void> => {
		await loadShops();
	};

	const hasPermission = useCallback(
		(requiredRole: 'owner' | 'admin' | 'staff'): boolean => {
			if (!state.currentRole) return false;

			const userLevel = ROLE_HIERARCHY[state.currentRole] || 0;
			const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

			return userLevel >= requiredLevel;
		},
		[state.currentRole]
	);

	const value: ShopContextValue = {
		...state,
		selectShop,
		createShop,
		updateShop,
		deleteShop,
		refreshShops,
		hasPermission,
	};

	return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopContext(): ShopContextValue {
	const context = useContext(ShopContext);
	if (context === undefined) {
		throw new Error('useShopContext must be used within a ShopProvider');
	}
	return context;
}

export { ShopContext };
