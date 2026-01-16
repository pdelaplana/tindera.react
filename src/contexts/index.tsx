// Contexts - Combined Provider Wrapper

import type React from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { ShopProvider } from './ShopContext';
import { UIProvider } from './UIContext';

interface AppProvidersProps {
	children: React.ReactNode;
}

/**
 * Combined provider wrapper for all app contexts.
 * Add additional providers here as they are created.
 *
 * Provider order matters:
 * 1. UIProvider - Must be first, provides toasts/loading that other providers might use
 * 2. AuthProvider - Provides user info
 * 3. ShopProvider - Depends on AuthProvider for user data
 * 4. CartProvider - Depends on ShopProvider for currency
 */
export function AppProviders({ children }: AppProvidersProps) {
	return (
		<UIProvider>
			<AuthProvider>
				<ShopProvider>
					<CartProvider>{children}</CartProvider>
				</ShopProvider>
			</AuthProvider>
		</UIProvider>
	);
}

// Re-export all contexts and hooks
export { AuthProvider, useAuthContext } from './AuthContext';
export { CartProvider, useCartContext } from './CartContext';
export { ShopProvider, useShopContext } from './ShopContext';
export { UIProvider, useUI, useUIContext } from './UIContext';
