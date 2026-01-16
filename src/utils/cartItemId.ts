// Utility functions for generating unique cart item IDs based on product configuration

import type { CartItemAddon, CartItemModifier } from '@/types';

/**
 * Generates a unique cart item ID based on product ID and configuration (modifiers + addons)
 * Items with different configurations will get different IDs, allowing them to exist as separate line items
 */
export function generateCartItemId(
  productId: string,
  modifiers: CartItemModifier[],
  addons: CartItemAddon[]
): string {
  // Sort modifiers by modifier_id to ensure consistent ordering
  const sortedModifiers = [...modifiers].sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));

  // Sort addons by addon_id to ensure consistent ordering
  const sortedAddons = [...addons].sort((a, b) => a.addon_id.localeCompare(b.addon_id));

  // Build configuration signature
  const modifierSignature = sortedModifiers.map((m) => m.modifier_id).join(',');
  const addonSignature = sortedAddons.map((a) => `${a.addon_id}:${a.quantity}`).join(',');

  // Combine into unique ID
  return `${productId}|${modifierSignature}|${addonSignature}`;
}

/**
 * Checks if two cart items have the same configuration
 */
export function hasSameConfiguration(
  modifiers1: CartItemModifier[],
  addons1: CartItemAddon[],
  modifiers2: CartItemModifier[],
  addons2: CartItemAddon[]
): boolean {
  // Compare modifiers
  if (modifiers1.length !== modifiers2.length) return false;

  const sortedMods1 = [...modifiers1].sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));
  const sortedMods2 = [...modifiers2].sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));

  for (let i = 0; i < sortedMods1.length; i++) {
    if (sortedMods1[i].modifier_id !== sortedMods2[i].modifier_id) return false;
  }

  // Compare addons
  if (addons1.length !== addons2.length) return false;

  const sortedAddons1 = [...addons1].sort((a, b) => a.addon_id.localeCompare(b.addon_id));
  const sortedAddons2 = [...addons2].sort((a, b) => a.addon_id.localeCompare(b.addon_id));

  for (let i = 0; i < sortedAddons1.length; i++) {
    if (
      sortedAddons1[i].addon_id !== sortedAddons2[i].addon_id ||
      sortedAddons1[i].quantity !== sortedAddons2[i].quantity
    ) {
      return false;
    }
  }

  return true;
}
