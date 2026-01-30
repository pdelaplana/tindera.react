// useCart Hook - Cart operations with tax and discount calculations

import { useMemo } from 'react';
import { CartProvider, useCartContext } from '@/contexts/CartContext';
import { useShopContext } from '@/contexts/ShopContext';
import type { CartItemAddon, CartItemModifier, Product, ShopTax } from '@/types';

export interface CartTotals {
	subtotal: number;
	taxBreakdown: Array<{
		shop_tax_id: string;
		tax_name: string;
		tax_rate: number;
		tax_amount: number;
	}>;
	total: number;
}

interface UseCartOptions {
	shopTaxes?: ShopTax[]; // Active shop taxes
}

/**
 * Hook for cart operations with automatic tax/discount calculations.
 *
 * @example
 * ```tsx
 * function POSScreen() {
 *   const {
 *     items,
 *     addToCart,
 *     removeFromCart,
 *     updateQuantity,
 *     totals,
 *     clearCart,
 *   } = useCart({ shopTaxes: activeTaxes });
 *
 *   return (
 *     <div>
 *       <ProductGrid onSelect={addToCart} />
 *       <CartPanel
 *         items={items}
 *         subtotal={totals.subtotal}
 *         taxBreakdown={totals.taxBreakdown}
 *         total={totals.total}
 *         onQuantityChange={updateQuantity}
 *         onRemove={removeFromCart}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCart(options: UseCartOptions = {}) {
	const cart = useCartContext();
	const { currentShop } = useShopContext();

	// Calculate totals
	const totals: CartTotals = useMemo(() => {
		const { subtotal } = cart;

		// Calculate tax breakdown (one entry per active shop tax)
		// Taxes are calculated on the subtotal (before any discounts)
		const shopTaxes = options.shopTaxes ?? [];
		const taxBreakdown = shopTaxes.map((shopTax) => ({
			shop_tax_id: shopTax.id,
			tax_name: shopTax.name,
			tax_rate: shopTax.rate,
			tax_amount: subtotal * (shopTax.rate / 100),
		}));

		// Calculate total tax
		const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.tax_amount, 0);

		// Total (subtotal + taxes only, no discounts or tips)
		const total = subtotal + totalTax;

		return {
			subtotal,
			taxBreakdown,
			total,
		};
	}, [cart.subtotal, options.shopTaxes]);

	// Convenience methods with better names for POS context
	const addToCart = (
		product: Product,
		quantity?: number,
		modifiers?: CartItemModifier[],
		addons?: CartItemAddon[]
	) => {
		cart.addItem(product, quantity, modifiers, addons);
	};

	const removeFromCart = (cartItemId: string) => {
		cart.removeItem(cartItemId);
	};

	const addAddonToItem = (cartItemId: string, addon: CartItemAddon) => {
		cart.addAddon(cartItemId, addon);
	};

	const removeAddonFromItem = (cartItemId: string, addonId: string) => {
		cart.removeAddon(cartItemId, addonId);
	};

	const isInCart = (cartItemId: string): boolean => {
		return cart.getItem(cartItemId) !== undefined;
	};

	const getQuantityInCart = (cartItemId: string): number => {
		return cart.getItem(cartItemId)?.quantity ?? 0;
	};

	return {
		// State
		items: cart.items,
		customerName: cart.customerName,
		notes: cart.notes,
		itemCount: cart.itemCount,
		isEmpty: cart.isEmpty,

		// Totals
		subtotal: cart.subtotal,
		totals,
		currency: currentShop?.currency_code ?? 'USD',

		// Item actions
		addToCart,
		removeFromCart,
		updateQuantity: cart.updateQuantity,
		addAddonToItem,
		removeAddonFromItem,
		setModifiers: cart.setModifiers,

		// Cart utilities
		isInCart,
		getQuantityInCart,
		getItem: cart.getItem,

		// Customer/Notes
		setCustomer: cart.setCustomer,
		setNotes: cart.setNotes,

		// Clear
		clearCart: cart.clearCart,
	};
}

// Re-export CartProvider for convenience
export { CartProvider };

export default useCart;
