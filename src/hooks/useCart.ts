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
	discount: number;
	discountPercent: number;
	tip: number;
	total: number;
}

interface UseCartOptions {
	shopTaxes?: ShopTax[]; // Active shop taxes
	discountPercent?: number; // Applied discount percentage
	discountAmount?: number; // Fixed discount amount (takes precedence)
	tipAmount?: number; // Tip amount
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

		// Calculate discount
		let discount = 0;
		let discountPercent = 0;
		if (options.discountAmount !== undefined && options.discountAmount > 0) {
			discount = Math.min(options.discountAmount, subtotal);
			discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
		} else if (options.discountPercent !== undefined && options.discountPercent > 0) {
			discountPercent = options.discountPercent;
			discount = subtotal * (discountPercent / 100);
		}

		// Calculate taxable amount (after discount)
		const taxableAmount = subtotal - discount;

		// Calculate tax breakdown (one entry per active shop tax)
		const shopTaxes = options.shopTaxes ?? [];
		const taxBreakdown = shopTaxes.map((shopTax) => ({
			shop_tax_id: shopTax.id,
			tax_name: shopTax.name,
			tax_rate: shopTax.rate,
			tax_amount: taxableAmount * (shopTax.rate / 100),
		}));

		// Calculate total tax
		const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.tax_amount, 0);

		// Tip
		const tip = options.tipAmount ?? 0;

		// Total
		const total = taxableAmount + totalTax + tip;

		return {
			subtotal,
			taxBreakdown,
			discount,
			discountPercent,
			tip,
			total,
		};
	}, [cart.subtotal, options.shopTaxes, options.discountAmount, options.discountPercent, options.tipAmount]);

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
