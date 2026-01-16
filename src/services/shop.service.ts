// Shop Service - Supabase Shop Operations

import type { ApiResponse, Shop, ShopInsert, ShopUpdate, ShopUser } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export interface ShopWithRole extends Shop {
	role: string;
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
	async updateShop(shopId: string, updates: ShopUpdate, userId: string): Promise<ApiResponse<Shop>> {
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
			const { data, error } = await supabase.from('shop_users').select('*').eq('shop_id', shopId);

			if (error) {
				logger.error(new Error(error.message), { context: 'getShopUsers', shopId });
				return { data: null, error: new Error(error.message) };
			}

			return { data: data as ShopUser[], error: null };
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
};
