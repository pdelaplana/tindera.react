// Shop Service - Supabase Shop Operations

import type { ApiResponse, Shop, ShopInsert, ShopRole, ShopUpdate, ShopUser } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export interface ShopWithRole extends Shop {
  role: ShopRole;
}

/** Extract the error message from a Supabase FunctionsHttpError response body. */
async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  try {
    if (error.context) {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fall through to generic message
  }
  return error.message;
}

export const shopService = {
  /**
   * Get all shops for a user
   */
  async getShopsForUser(userId: string): Promise<ApiResponse<ShopWithRole[]>> {
    try {
      const { data, error } = await supabase
        .from('shop_users')
        .select(`
          role,
          shops (
            id,
            name,
            description,
            location,
            currency_code,
            image_url,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
        `)
        .eq('user_id', userId);

      if (error) {
        logger.error(new Error(error.message), { context: 'getShopsForUser', userId });
        return { data: null, error: new Error(error.message) };
      }

      // Transform the nested data structure
      const shops = (data || [])
        .filter((item) => item.shops)
        .map((item) => ({
          ...(item.shops as unknown as Shop),
          role: item.role,
        })) as ShopWithRole[];

      return { data: shops, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getShopsForUser', userId });
      return { data: null, error };
    }
  },

  /**
   * Get a single shop by ID
   */
  async getShop(shopId: string): Promise<ApiResponse<Shop>> {
    try {
      const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();

      if (error) {
        logger.error(new Error(error.message), { context: 'getShop', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getShop', shopId });
      return { data: null, error };
    }
  },

  /**
   * Create a new shop
   */
  async createShop(shopData: ShopInsert, userId: string): Promise<ApiResponse<Shop>> {
    try {
      // Insert the shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          ...shopData,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (shopError) {
        logger.error(new Error(shopError.message), { context: 'createShop', userId });
        return { data: null, error: new Error(shopError.message) };
      }

      // Add the creating user as owner
      const { error: userError } = await supabase.from('shop_users').insert({
        shop_id: shop.id,
        user_id: userId,
        role: 'owner',
      });

      if (userError) {
        logger.error(new Error(userError.message), { context: 'createShop.addOwner', userId });
        // Still return the shop even if user association fails
      }

      return { data: shop as Shop, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createShop', userId });
      return { data: null, error };
    }
  },

  /**
   * Update an existing shop
   */
  async updateShop(
    shopId: string,
    updates: ShopUpdate,
    userId: string
  ): Promise<ApiResponse<Shop>> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', shopId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateShop', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Shop, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateShop', shopId });
      return { data: null, error };
    }
  },

  /**
   * Delete a shop
   */
  async deleteShop(shopId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('shops').delete().eq('id', shopId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteShop', shopId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteShop', shopId });
      return { error };
    }
  },

  /**
   * Get users for a shop
   */
  async getShopUsers(shopId: string): Promise<ApiResponse<ShopUser[]>> {
    try {
      // Step 1: fetch shop_users rows
      const { data: shopUsersData, error: shopUsersError } = await supabase
        .from('shop_users')
        .select('shop_id, user_id, role')
        .eq('shop_id', shopId);

      if (shopUsersError) {
        logger.error(new Error(shopUsersError.message), { context: 'getShopUsers', shopId });
        return { data: null, error: new Error(shopUsersError.message) };
      }

      if (!shopUsersData || shopUsersData.length === 0) {
        return { data: [], error: null };
      }

      // Step 2: fetch display names from user_profiles
      // (requires "Users can view profiles of shop members" RLS policy)
      const userIds = shopUsersData.map((u) => u.user_id);
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

      const result: ShopUser[] = shopUsersData.map((u) => {
        const profile = profileMap.get(u.user_id);
        return {
          shop_id: u.shop_id,
          user_id: u.user_id,
          role: u.role as ShopUser['role'],
          user_profiles: profile ? { display_name: profile.display_name } : undefined,
        };
      });

      return { data: result, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getShopUsers', shopId });
      return { data: null, error };
    }
  },

  /**
   * Add a user to a shop
   */
  async addUserToShop(
    shopId: string,
    userId: string,
    role: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('shop_users').insert({
        shop_id: shopId,
        user_id: userId,
        role,
      });

      if (error) {
        logger.error(new Error(error.message), { context: 'addUserToShop', shopId, userId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'addUserToShop', shopId, userId });
      return { error };
    }
  },

  /**
   * Remove a user from a shop
   */
  async removeUserFromShop(shopId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('shop_users')
        .delete()
        .eq('shop_id', shopId)
        .eq('user_id', userId);

      if (error) {
        logger.error(new Error(error.message), { context: 'removeUserFromShop', shopId, userId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'removeUserFromShop', shopId, userId });
      return { error };
    }
  },

  /**
   * Update user role in a shop
   */
  async updateUserRole(
    shopId: string,
    userId: string,
    role: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('shop_users')
        .update({ role })
        .eq('shop_id', shopId)
        .eq('user_id', userId);

      if (error) {
        logger.error(new Error(error.message), { context: 'updateUserRole', shopId, userId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateUserRole', shopId, userId });
      return { error };
    }
  },

  /**
   * Get user's role in a shop
   */
  async getUserRole(shopId: string, userId: string): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase
        .from('shop_users')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'getUserRole', shopId, userId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data.role, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getUserRole', shopId, userId });
      return { data: null, error };
    }
  },

  /**
   * Create a new team member for a shop via Edge Function
   */
  async createTeamMember(
    shopId: string,
    data: { email: string; displayName: string; password: string; role: string }
  ): Promise<{ userId: string | null; error: Error | null }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('manage-shop-user', {
        body: { action: 'create', shopId, ...data },
      });

      if (error) {
        const message = await extractFunctionError(error);
        logger.error(new Error(message), { context: 'createTeamMember', shopId });
        return { userId: null, error: new Error(message) };
      }

      return { userId: result?.userId ?? null, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createTeamMember', shopId });
      return { userId: null, error };
    }
  },

  /**
   * Update a team member's display name and/or role via Edge Function
   */
  async updateTeamMember(
    shopId: string,
    userId: string,
    data: { displayName?: string; role?: string }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('manage-shop-user', {
        body: { action: 'update', shopId, userId, ...data },
      });

      if (error) {
        const message = await extractFunctionError(error);
        logger.error(new Error(message), { context: 'updateTeamMember', shopId, userId });
        return { error: new Error(message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateTeamMember', shopId, userId });
      return { error };
    }
  },

  /**
   * Reset a team member's password via Edge Function
   */
  async resetTeamMemberPassword(
    shopId: string,
    userId: string,
    password: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('manage-shop-user', {
        body: { action: 'reset-password', shopId, userId, password },
      });

      if (error) {
        const message = await extractFunctionError(error);
        logger.error(new Error(message), { context: 'resetTeamMemberPassword', shopId, userId });
        return { error: new Error(message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'resetTeamMemberPassword', shopId, userId });
      return { error };
    }
  },

  /**
   * Remove a team member via Edge Function
   */
  async removeTeamMember(
    shopId: string,
    userId: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('manage-shop-user', {
        body: { action: 'remove', shopId, userId },
      });

      if (error) {
        const message = await extractFunctionError(error);
        logger.error(new Error(message), { context: 'removeTeamMember', shopId, userId });
        return { error: new Error(message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'removeTeamMember', shopId, userId });
      return { error };
    }
  },
};
