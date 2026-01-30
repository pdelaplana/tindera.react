// Shop Tax Service - Supabase Shop Tax Operations

import type { ApiResponse, ShopTax, ShopTaxUpdate } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export const shopTaxService = {
  async getShopTaxes(shopId: string): Promise<ApiResponse<ShopTax[]>> {
    try {
      const { data, error } = await supabase
        .from('shop_taxes')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getShopTaxes', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ShopTax[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getShopTaxes', shopId });
      return { data: null, error };
    }
  },

  async getAllShopTaxes(shopId: string): Promise<ApiResponse<ShopTax[]>> {
    try {
      const { data, error } = await supabase
        .from('shop_taxes')
        .select('*')
        .eq('shop_id', shopId)
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getAllShopTaxes', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ShopTax[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getAllShopTaxes', shopId });
      return { data: null, error };
    }
  },

  async createShopTax(shopId: string, name: string, rate: number, userId: string): Promise<ApiResponse<ShopTax>> {
    try {
      const { data, error } = await supabase
        .from('shop_taxes')
        .insert({
          shop_id: shopId,
          name,
          rate,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'createShopTax', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ShopTax, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createShopTax', shopId });
      return { data: null, error };
    }
  },

  async updateShopTax(taxId: string, updates: ShopTaxUpdate, userId: string): Promise<ApiResponse<ShopTax>> {
    try {
      const { data, error } = await supabase
        .from('shop_taxes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', taxId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateShopTax', taxId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ShopTax, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateShopTax', taxId });
      return { data: null, error };
    }
  },

  async deleteShopTax(taxId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('shop_taxes')
        .delete()
        .eq('id', taxId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteShopTax', taxId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteShopTax', taxId });
      return { error };
    }
  },
};
