// Void Refund Reason Service - Supabase Void Refund Reason Operations

import type { ApiResponse, VoidRefundReason, VoidRefundReasonInsert } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export const voidRefundReasonService = {
  async getReasons(shopId: string): Promise<ApiResponse<VoidRefundReason[]>> {
    try {
      const { data, error } = await supabase
        .from('void_refund_reasons')
        .select('*')
        .or(`shop_id.is.null,shop_id.eq.${shopId}`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getReasons', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as VoidRefundReason[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getReasons', shopId });
      return { data: null, error };
    }
  },

  async getAllReasons(shopId: string): Promise<ApiResponse<VoidRefundReason[]>> {
    try {
      const { data, error } = await supabase
        .from('void_refund_reasons')
        .select('*')
        .or(`shop_id.is.null,shop_id.eq.${shopId}`)
        .order('is_system', { ascending: false })
        .order('name');

      if (error) {
        logger.error(new Error(error.message), { context: 'getAllReasons', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as VoidRefundReason[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getAllReasons', shopId });
      return { data: null, error };
    }
  },

  async createReason(shopId: string, name: string, userId: string): Promise<ApiResponse<VoidRefundReason>> {
    try {
      const { data, error } = await supabase
        .from('void_refund_reasons')
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
        logger.error(new Error(error.message), { context: 'createReason', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as VoidRefundReason, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createReason', shopId });
      return { data: null, error };
    }
  },

  async updateReason(reasonId: string, updates: Partial<VoidRefundReasonInsert>, userId: string): Promise<ApiResponse<VoidRefundReason>> {
    try {
      const { data, error } = await supabase
        .from('void_refund_reasons')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', reasonId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateReason', reasonId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as VoidRefundReason, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateReason', reasonId });
      return { data: null, error };
    }
  },

  async deleteReason(reasonId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('void_refund_reasons')
        .delete()
        .eq('id', reasonId)
        .eq('is_system', false);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteReason', reasonId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteReason', reasonId });
      return { error };
    }
  },
};
