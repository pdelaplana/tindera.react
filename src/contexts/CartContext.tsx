// CartContext - Shopping cart state management for POS

import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { CartItem, CartItemAddon, CartItemModifier, Product } from '@/types';
import { generateCartItemId } from '@/utils/cartItemId';

// ===== State =====

interface CartState {
  items: CartItem[];
  customerName: string | null;
  notes: string | null;
}

const initialState: CartState = {
  items: [],
  customerName: null,
  notes: null,
};

// ===== Actions =====

type CartAction =
  | {
      type: 'ADD_ITEM';
      product: Product;
      quantity?: number;
      modifiers?: CartItemModifier[];
      addons?: CartItemAddon[];
    }
  | { type: 'REMOVE_ITEM'; cartItemId: string }
  | { type: 'UPDATE_QUANTITY'; cartItemId: string; quantity: number }
  | { type: 'ADD_ADDON'; cartItemId: string; addon: CartItemAddon }
  | { type: 'REMOVE_ADDON'; cartItemId: string; addonId: string }
  | { type: 'SET_MODIFIERS'; cartItemId: string; modifiers: CartItemModifier[] }
  | { type: 'SET_CUSTOMER'; name: string | null }
  | { type: 'SET_NOTES'; notes: string | null }
  | { type: 'CLEAR_CART' };

// ===== Reducer =====

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const modifiers = action.modifiers || [];
      const addons = action.addons || [];
      const quantity = action.quantity || 1;

      // Generate unique cart item ID based on product and configuration
      const cartItemId = generateCartItemId(action.product.id, modifiers, addons);

      // Check if exact same configuration already exists
      const existingIndex = state.items.findIndex((item) => item.cart_item_id === cartItemId);

      if (existingIndex >= 0) {
        // Update quantity of existing item with same configuration
        const newItems = [...state.items];
        const existingItem = newItems[existingIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Recalculate amount
        const modifierTotal = modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
        const addonTotal = addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
        const baseAmount = action.product.price * newQuantity;

        newItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          amount: baseAmount + addonTotal + modifierTotal * newQuantity,
        };
        return { ...state, items: newItems };
      }

      // Add new item with this configuration
      const modifierTotal = modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
      const addonTotal = addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
      const baseAmount = action.product.price * quantity;

      const newItem: CartItem = {
        cart_item_id: cartItemId,
        product_id: action.product.id,
        product: action.product,
        quantity,
        amount: baseAmount + addonTotal + modifierTotal * quantity,
        addons,
        modifiers,
        available: true,
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.cart_item_id !== action.cartItemId),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.cart_item_id !== action.cartItemId),
        };
      }

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.cart_item_id !== action.cartItemId) return item;

          // Calculate scaling ratio for addons
          const scalingRatio = action.quantity / item.quantity;

          // Scale addon quantities proportionally
          const scaledAddons = item.addons.map((addon) => ({
            ...addon,
            quantity: Math.round(addon.quantity * scalingRatio),
          }));

          // Modifiers scale per-item (like base price)
          const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
          const addonTotal = scaledAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
          const baseAmount = item.product.price * action.quantity;

          return {
            ...item,
            quantity: action.quantity,
            addons: scaledAddons,
            amount: baseAmount + addonTotal + modifierTotal * action.quantity,
          };
        }),
      };
    }

    case 'ADD_ADDON': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.cart_item_id !== action.cartItemId) return item;

          const existingAddonIndex = item.addons.findIndex(
            (a) => a.addon_id === action.addon.addon_id
          );

          let newAddons: CartItemAddon[];
          if (existingAddonIndex >= 0) {
            // Update existing addon quantity
            newAddons = [...item.addons];
            newAddons[existingAddonIndex] = {
              ...newAddons[existingAddonIndex],
              quantity: newAddons[existingAddonIndex].quantity + action.addon.quantity,
            };
          } else {
            // Add new addon
            newAddons = [...item.addons, action.addon];
          }

          // Recalculate item amount including addons and modifiers
          const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
          const addonTotal = newAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
          const baseAmount = item.product.price * item.quantity;

          return {
            ...item,
            addons: newAddons,
            amount: baseAmount + addonTotal + modifierTotal * item.quantity,
          };
        }),
      };
    }

    case 'REMOVE_ADDON': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.cart_item_id !== action.cartItemId) return item;

          const newAddons = item.addons.filter((a) => a.addon_id !== action.addonId);
          const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
          const addonTotal = newAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
          const baseAmount = item.product.price * item.quantity;

          return {
            ...item,
            addons: newAddons,
            amount: baseAmount + addonTotal + modifierTotal * item.quantity,
          };
        }),
      };
    }

    case 'SET_MODIFIERS': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.cart_item_id !== action.cartItemId) return item;

          const modifierTotal = action.modifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
          const addonTotal = item.addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
          const baseAmount = item.product.price * item.quantity;

          return {
            ...item,
            modifiers: action.modifiers,
            amount: baseAmount + addonTotal + modifierTotal * item.quantity,
          };
        }),
      };
    }

    case 'SET_CUSTOMER':
      return { ...state, customerName: action.name };

    case 'SET_NOTES':
      return { ...state, notes: action.notes };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

// ===== Context =====

interface CartContextValue {
  // State
  items: CartItem[];
  customerName: string | null;
  notes: string | null;

  // Computed
  itemCount: number;
  subtotal: number;
  isEmpty: boolean;

  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    modifiers?: CartItemModifier[],
    addons?: CartItemAddon[]
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  addAddon: (cartItemId: string, addon: CartItemAddon) => void;
  removeAddon: (cartItemId: string, addonId: string) => void;
  setModifiers: (cartItemId: string, modifiers: CartItemModifier[]) => void;
  setCustomer: (name: string | null) => void;
  setNotes: (notes: string | null) => void;
  clearCart: () => void;
  getItem: (cartItemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);

// ===== Provider =====

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Memoized computed values
  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.amount, 0),
    [state.items]
  );

  const isEmpty = state.items.length === 0;

  // Actions
  const addItem = useCallback(
    (
      product: Product,
      quantity?: number,
      modifiers?: CartItemModifier[],
      addons?: CartItemAddon[]
    ) => {
      dispatch({ type: 'ADD_ITEM', product, quantity, modifiers, addons });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', cartItemId });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', cartItemId, quantity });
  }, []);

  const addAddon = useCallback((cartItemId: string, addon: CartItemAddon) => {
    dispatch({ type: 'ADD_ADDON', cartItemId, addon });
  }, []);

  const removeAddon = useCallback((cartItemId: string, addonId: string) => {
    dispatch({ type: 'REMOVE_ADDON', cartItemId, addonId });
  }, []);

  const setModifiers = useCallback((cartItemId: string, modifiers: CartItemModifier[]) => {
    dispatch({ type: 'SET_MODIFIERS', cartItemId, modifiers });
  }, []);

  const setCustomer = useCallback((name: string | null) => {
    dispatch({ type: 'SET_CUSTOMER', name });
  }, []);

  const setNotes = useCallback((notes: string | null) => {
    dispatch({ type: 'SET_NOTES', notes });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const getItem = useCallback(
    (cartItemId: string) => state.items.find((item) => item.cart_item_id === cartItemId),
    [state.items]
  );

  const value = useMemo(
    () => ({
      // State
      items: state.items,
      customerName: state.customerName,
      notes: state.notes,

      // Computed
      itemCount,
      subtotal,
      isEmpty,

      // Actions
      addItem,
      removeItem,
      updateQuantity,
      addAddon,
      removeAddon,
      setModifiers,
      setCustomer,
      setNotes,
      clearCart,
      getItem,
    }),
    [
      state.items,
      state.customerName,
      state.notes,
      itemCount,
      subtotal,
      isEmpty,
      addItem,
      removeItem,
      updateQuantity,
      addAddon,
      removeAddon,
      setModifiers,
      setCustomer,
      setNotes,
      clearCart,
      getItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ===== Hook =====

export function useCartContext(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
