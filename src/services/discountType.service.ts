// Discount Type Service - Supabase Discount Type Operations

import type { ApiResponse, DiscountType, DiscountTypeUpdate } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export const discountTypeService = {
  async getDiscountTypes(shopId: string): Promise<ApiResponse<DiscountType[]>> {
    try {
      const { data, error } = await supabase
        .from('discount_types')
        .select('*')
        .or(`shop_id.is.null,shop_id.eq.${shopId}`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getDiscountTypes', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as DiscountType[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getDiscountTypes', shopId });
      return { data: null, error };
    }
  },

  async getAllDiscountTypes(shopId: string): Promise<ApiResponse<DiscountType[]>> {
    try {
      const { data, error } = await supabase
        .from('discount_types')
        .select('*')
        .or(`shop_id.is.null,shop_id.eq.${shopId}`)
        .order('is_system', { ascending: false })
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getAllDiscountTypes', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as DiscountType[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getAllDiscountTypes', shopId });
      return { data: null, error };
    }
  },

  async createDiscountType(shopId: string, name: string, userId: string): Promise<ApiResponse<DiscountType>> {
    try {
      const { data, error } = await supabase
        .from('discount_types')
        .insert({
          shop_id: shopId,
          name,
          is_system: false,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'createDiscountType', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as DiscountType, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createDiscountType', shopId });
      return { data: null, error };
    }
  },

  async updateDiscountType(typeId: string, updates: DiscountTypeUpdate, userId: string): Promise<ApiResponse<DiscountType>> {
    try {
      const { data, error } = await supabase
        .from('discount_types')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', typeId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateDiscountType', typeId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as DiscountType, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateDiscountType', typeId });
      return { data: null, error };
    }
  },

  async deleteDiscountType(typeId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('discount_types')
        .delete()
        .eq('id', typeId)
        .eq('is_system', false);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteDiscountType', typeId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteDiscountType', typeId });
      return { error };
    }
  },
};
