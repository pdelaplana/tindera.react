// modifier.service.ts - Service layer for global modifier management

import type {
  ApiResponse,
  Modifier,
  ModifierGroup,
  ModifierGroupInsert,
  ModifierGroupUpdate,
  ModifierGroupWithModifiers,
  ModifierInsert,
  ModifierUpdate,
  ProductModifierPriceOverride,
} from '@/types';
import { supabase } from './supabase';

// ===== Modifier Group CRUD =====

/**
 * Fetch all modifier groups for a shop with their modifiers
 */
export async function getModifierGroups(
  shopId: string
): Promise<ApiResponse<ModifierGroupWithModifiers[]>> {
  try {
    // Fetch all modifier groups for the shop
    const { data: groups, error: groupsError } = await supabase
      .from('modifier_groups')
      .select('*')
      .eq('shop_id', shopId)
      .order('sequence', { ascending: true });

    if (groupsError) throw groupsError;
    if (!groups) return { data: [], error: null };

    // Fetch all modifiers for these groups
    const groupIds = groups.map((g) => g.id);
    const { data: modifiers, error: modifiersError } = await supabase
      .from('modifiers')
      .select('*')
      .in('modifier_group_id', groupIds)
      .order('sequence', { ascending: true });

    if (modifiersError) throw modifiersError;

    // Combine groups with their modifiers
    const groupsWithModifiers: ModifierGroupWithModifiers[] = groups.map((group) => ({
      ...group,
      modifiers: (modifiers || []).filter((m) => m.modifier_group_id === group.id),
    }));

    return { data: groupsWithModifiers, error: null };
  } catch (error) {
    console.error('Error fetching modifier groups:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a single modifier group with its modifiers
 */
export async function getModifierGroup(
  groupId: string
): Promise<ApiResponse<ModifierGroupWithModifiers>> {
  try {
    // Fetch the group
    const { data: group, error: groupError } = await supabase
      .from('modifier_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;
    if (!group) return { data: null, error: new Error('Modifier group not found') };

    // Fetch modifiers for this group
    const { data: modifiers, error: modifiersError } = await supabase
      .from('modifiers')
      .select('*')
      .eq('modifier_group_id', groupId)
      .order('sequence', { ascending: true });

    if (modifiersError) throw modifiersError;

    const groupWithModifiers: ModifierGroupWithModifiers = {
      ...group,
      modifiers: modifiers || [],
    };

    return { data: groupWithModifiers, error: null };
  } catch (error) {
    console.error('Error fetching modifier group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new modifier group
 * @param groupData - The modifier group data to insert
 * @param userId - The ID of the user creating the modifier group
 */
export async function createModifierGroup(
  groupData: ModifierGroupInsert,
  userId: string
): Promise<ApiResponse<ModifierGroup>> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('modifier_groups')
      .insert({
        ...groupData,
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating modifier group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a modifier group
 * @param groupId - The ID of the modifier group to update
 * @param updates - The fields to update
 * @param userId - The ID of the user updating the modifier group
 */
export async function updateModifierGroup(
  groupId: string,
  updates: ModifierGroupUpdate,
  userId: string
): Promise<ApiResponse<ModifierGroup>> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating modifier group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a modifier group
 */
export async function deleteModifierGroup(groupId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('modifier_groups').delete().eq('id', groupId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting modifier group:', error);
    return { error: error as Error };
  }
}

// ===== Modifier CRUD =====

/**
 * Add a modifier to a group
 * @param modifierData - The modifier data to insert
 * @param userId - The ID of the user creating the modifier
 */
export async function addModifier(
  modifierData: ModifierInsert,
  userId: string
): Promise<ApiResponse<Modifier>> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('modifiers')
      .insert({
        ...modifierData,
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding modifier:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a modifier
 * @param modifierId - The ID of the modifier to update
 * @param updates - The fields to update
 * @param userId - The ID of the user updating the modifier
 */
export async function updateModifier(
  modifierId: string,
  updates: ModifierUpdate,
  userId: string
): Promise<ApiResponse<Modifier>> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', modifierId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating modifier:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a modifier
 */
export async function deleteModifier(modifierId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('modifiers').delete().eq('id', modifierId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting modifier:', error);
    return { error: error as Error };
  }
}

// ===== Product Linking =====

/**
 * Link a modifier group to a product
 * @param productId - The ID of the product
 * @param groupId - The ID of the modifier group
 * @param sequence - The display sequence (default: 0)
 * @param userId - The ID of the user creating the link
 */
export async function linkModifierGroupToProduct(
  productId: string,
  groupId: string,
  sequence = 0,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from('product_modifier_group_links').insert({
      product_id: productId,
      modifier_group_id: groupId,
      sequence,
      created_at: now,
      created_by: userId,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error linking modifier group to product:', error);
    return { error: error as Error };
  }
}

/**
 * Unlink a modifier group from a product
 */
export async function unlinkModifierGroupFromProduct(
  productId: string,
  groupId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('product_modifier_group_links')
      .delete()
      .eq('product_id', productId)
      .eq('modifier_group_id', groupId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unlinking modifier group from product:', error);
    return { error: error as Error };
  }
}

/**
 * Update the sequence of a linked modifier group
 */
export async function updateLinkSequence(
  productId: string,
  groupId: string,
  sequence: number
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('product_modifier_group_links')
      .update({ sequence })
      .eq('product_id', productId)
      .eq('modifier_group_id', groupId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating link sequence:', error);
    return { error: error as Error };
  }
}

// ===== Price Overrides =====

/**
 * Set a product-specific price override for a modifier
 * @param productId - The ID of the product
 * @param modifierId - The ID of the modifier
 * @param priceAdjustment - The price adjustment amount
 * @param userId - The ID of the user setting the override
 */
export async function setModifierPriceOverride(
  productId: string,
  modifierId: string,
  priceAdjustment: number,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from('product_modifier_price_overrides').upsert({
      product_id: productId,
      modifier_id: modifierId,
      price_adjustment: priceAdjustment,
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error setting price override:', error);
    return { error: error as Error };
  }
}

/**
 * Remove a product-specific price override for a modifier
 */
export async function removeModifierPriceOverride(
  productId: string,
  modifierId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('product_modifier_price_overrides')
      .delete()
      .eq('product_id', productId)
      .eq('modifier_id', modifierId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing price override:', error);
    return { error: error as Error };
  }
}

/**
 * Get all price overrides for a product
 */
export async function getProductPriceOverrides(
  productId: string
): Promise<ApiResponse<ProductModifierPriceOverride[]>> {
  try {
    const { data, error } = await supabase
      .from('product_modifier_price_overrides')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching price overrides:', error);
    return { data: null, error: error as Error };
  }
}

// Export service object
export const modifierService = {
  getModifierGroups,
  getModifierGroup,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  addModifier,
  updateModifier,
  deleteModifier,
  linkModifierGroupToProduct,
  unlinkModifierGroupFromProduct,
  updateLinkSequence,
  setModifierPriceOverride,
  removeModifierPriceOverride,
  getProductPriceOverrides,
};
