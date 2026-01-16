// Hooks - Central export for all custom hooks

// UI hooks (re-export from context)
export { useUI, useUIContext } from '@/contexts/UIContext';
// Auth hooks
export { default as useAuthDefault, useAuth } from './useAuth';
export type { Breakpoint } from './useBreakpoint';
// Responsive hooks
export {
  BREAKPOINTS,
  default as useBreakpointDefault,
  useBreakpoint,
  useIsMobile,
  useIsTabletOrLarger,
} from './useBreakpoint';
export type { CartTotals } from './useCart';
// Cart hooks
export { CartProvider, default as useCartDefault, useCart } from './useCart';
// Product hooks
export {
  productKeys,
  useAddProductAddon,
  useAddProductItem,
  useCreateModifierGroup,
  useCreateProduct,
  useCreateProductCategory,
  useDeleteModifierGroup,
  useDeleteProduct,
  useDeleteProductCategory,
  useProduct,
  useProductCategories,
  useProducts,
  useProductsInfinite,
  useRemoveProductAddon,
  useRemoveProductItem,
  useUpdateModifier,
  useUpdateModifierGroup,
  useUpdateProduct,
  useUpdateProductAddon,
  useUpdateProductCategory,
  useUpdateProductItem,
} from './useProduct';
// Modifier hooks (global modifiers)
export {
  modifierKeys,
  useAddModifier,
  useCreateModifierGroup as useCreateGlobalModifierGroup,
  useDeleteModifier,
  useDeleteModifierGroup as useDeleteGlobalModifierGroup,
  useLinkModifierGroup,
  useModifierGroup,
  useModifierGroups,
  useRemoveModifierPriceOverride,
  useSetModifierPriceOverride,
  useUnlinkModifierGroup,
  useUpdateLinkSequence,
  useUpdateModifier as useUpdateGlobalModifier,
  useUpdateModifierGroup as useUpdateGlobalModifierGroup,
} from './useModifier';
// Shop hooks
export {
  default as useShopDefault,
  shopKeys,
  useAddUserToShop,
  useCreateShop,
  useDeleteShop,
  useRemoveUserFromShop,
  useShop,
  useShopUsers,
  useUpdateShop,
  useUpdateUserRole,
} from './useShop';
