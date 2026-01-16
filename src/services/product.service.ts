// Product Service - Supabase Product Operations

import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductAddon,
  ProductCategory,
  ProductInsert,
  ProductItem,
  ProductModifier,
  ProductModifierGroup,
  ProductModifierGroupInsert,
  ProductModifierGroupUpdate,
  ProductModifierGroupWithModifiers,
  ProductModifierInsert,
  ProductModifierUpdate,
  ProductUpdate,
  ProductWithCategory,
  ProductWithDetails,
} from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  tags?: string[];
}

export const productService = {
  /**
   * Get all products for a shop with optional filtering
   */
  async getProducts(
    shopId: string,
    filters?: ProductFilters
  ): Promise<ApiResponse<ProductWithCategory[]>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories (
            id,
            shop_id,
            name,
            description,
            sequence
          )
        `)
        .eq('shop_id', shopId)
        .order('name');

      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) {
        logger.error(new Error(error.message), { context: 'getProducts', shopId });
        return { data: null, error: new Error(error.message) };
      }

      // Transform the data to match our interface
      // Note: Cast through unknown due to Supabase's limited type inference for relations
      const products = (data || []).map((item) => ({
        ...item,
        category: item.category as unknown as ProductCategory | null,
      })) as ProductWithCategory[];

      return { data: products, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getProducts', shopId });
      return { data: null, error };
    }
  },

  /**
   * Get paginated products for a shop
   */
  async getProductsPaginated(
    shopId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: ProductFilters
  ): Promise<ApiResponse<PaginatedResponse<ProductWithCategory>>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select(
          `
          *,
          category:product_categories (
            id,
            shop_id,
            name,
            description,
            sequence
          )
        `,
          { count: 'exact' }
        )
        .eq('shop_id', shopId)
        .order('name')
        .range(from, to);

      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error(new Error(error.message), { context: 'getProductsPaginated', shopId });
        return { data: null, error: new Error(error.message) };
      }

      const products = (data || []).map((item) => ({
        ...item,
        category: item.category as unknown as ProductCategory | null,
      })) as ProductWithCategory[];

      const totalCount = count || 0;

      return {
        data: {
          data: products,
          count: totalCount,
          page,
          pageSize,
          hasMore: from + products.length < totalCount,
        },
        error: null,
      };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getProductsPaginated', shopId });
      return { data: null, error };
    }
  },

  /**
   * Get a single product by ID with full details
   */
  async getProduct(productId: string): Promise<ApiResponse<ProductWithDetails>> {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories (
            id,
            shop_id,
            name,
            description,
            sequence
          )
        `)
        .eq('id', productId)
        .single();

      if (productError) {
        logger.error(new Error(productError.message), { context: 'getProduct', productId });
        return { data: null, error: new Error(productError.message) };
      }

      // Fetch related items, addons, old modifiers, and new global modifiers
      const [
        itemsResult,
        addonsResult,
        modifierGroupsResult,
        linkedGroupsResult,
        priceOverridesResult,
      ] = await Promise.all([
        supabase.from('product_items').select('*').eq('product_id', productId),
        supabase.from('product_addons').select('*').eq('product_id', productId),
        this.getProductModifierGroups(productId), // Old system (deprecated)
        this.getLinkedModifierGroups(productId), // New global system
        supabase
          .from('product_modifier_price_overrides')
          .select('modifier_id, price_adjustment')
          .eq('product_id', productId),
      ]);

      // Build price overrides map
      const priceOverrides: Record<string, number> = {};
      if (priceOverridesResult.data) {
        for (const override of priceOverridesResult.data) {
          priceOverrides[override.modifier_id] = override.price_adjustment;
        }
      }

      // Resolve final prices for linked modifier groups
      const linkedModifierGroups = (linkedGroupsResult.data || []).map((group) => ({
        ...group,
        modifiers: group.modifiers.map((modifier) => ({
          ...modifier,
          // Use override price if exists, otherwise use default
          price_adjustment: priceOverrides[modifier.id] ?? modifier.default_price_adjustment,
        })),
      }));

      const productWithDetails = {
        ...product,
        category: product.category as unknown as ProductCategory | null,
        items: (itemsResult.data as ProductItem[]) || [],
        addons: (addonsResult.data as ProductAddon[]) || [],
        modifierGroups: modifierGroupsResult.data || [], // Old system (backward compat)
        linkedModifierGroups, // New global system
        priceOverrides,
      } as ProductWithDetails;

      return { data: productWithDetails, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getProduct', productId });
      return { data: null, error };
    }
  },

  /**
   * Get global modifier groups linked to a product
   */
  async getLinkedModifierGroups(
    productId: string
  ): Promise<ApiResponse<import('@/types').ModifierGroupWithModifiers[]>> {
    try {
      // Fetch product_modifier_group_links
      const { data: links, error: linksError } = await supabase
        .from('product_modifier_group_links')
        .select('modifier_group_id, sequence')
        .eq('product_id', productId)
        .order('sequence', { ascending: true });

      if (linksError) throw linksError;
      if (!links || links.length === 0) return { data: [], error: null };

      // Fetch the linked modifier groups with their modifiers
      const groupIds = links.map((link) => link.modifier_group_id);
      const { data: groups, error: groupsError } = await supabase
        .from('modifier_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;
      if (!groups) return { data: [], error: null };

      // Fetch modifiers for these groups
      const { data: modifiers, error: modifiersError } = await supabase
        .from('modifiers')
        .select('*')
        .in('modifier_group_id', groupIds)
        .order('sequence', { ascending: true });

      if (modifiersError) throw modifiersError;

      // Combine groups with their modifiers, maintaining link sequence order
      const groupsWithModifiers = links
        .map((link) => {
          const group = groups.find((g) => g.id === link.modifier_group_id);
          if (!group) return null;

          return {
            ...group,
            sequence: link.sequence, // Include sequence from link table
            modifiers: (modifiers || []).filter((m) => m.modifier_group_id === group.id),
          };
        })
        .filter((g): g is import('@/types').ModifierGroupWithModifiers => g !== null);

      return { data: groupsWithModifiers, error: null };
    } catch (error) {
      console.error('Error fetching linked modifier groups:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Create a new product
   */
  async createProduct(productData: ProductInsert, userId: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'createProduct' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Product, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createProduct' });
      return { data: null, error };
    }
  },

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    updates: ProductUpdate,
    userId: string
  ): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateProduct', productId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Product, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateProduct', productId });
      return { data: null, error };
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteProduct', productId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteProduct', productId });
      return { error };
    }
  },

  // ===== Product Items =====

  /**
   * Add an item to a product (ingredient/component)
   */
  async addProductItem(
    item: Omit<ProductItem, 'id' | 'created_at'>
  ): Promise<ApiResponse<ProductItem>> {
    try {
      const { data, error } = await supabase.from('product_items').insert(item).select().single();

      if (error) {
        logger.error(new Error(error.message), { context: 'addProductItem' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductItem, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'addProductItem' });
      return { data: null, error };
    }
  },

  /**
   * Update a product item
   */
  async updateProductItem(
    itemId: string,
    updates: Partial<ProductItem>
  ): Promise<ApiResponse<ProductItem>> {
    try {
      const { data, error } = await supabase
        .from('product_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateProductItem', itemId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductItem, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateProductItem', itemId });
      return { data: null, error };
    }
  },

  /**
   * Remove an item from a product
   */
  async removeProductItem(itemId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('product_items').delete().eq('id', itemId);

      if (error) {
        logger.error(new Error(error.message), { context: 'removeProductItem', itemId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'removeProductItem', itemId });
      return { error };
    }
  },

  // ===== Product Addons =====

  /**
   * Add an addon to a product
   */
  async addProductAddon(
    addon: Omit<ProductAddon, 'id' | 'created_at'>
  ): Promise<ApiResponse<ProductAddon>> {
    try {
      const { data, error } = await supabase.from('product_addons').insert(addon).select().single();

      if (error) {
        logger.error(new Error(error.message), { context: 'addProductAddon' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductAddon, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'addProductAddon' });
      return { data: null, error };
    }
  },

  /**
   * Update a product addon
   */
  async updateProductAddon(
    addonId: string,
    updates: Partial<ProductAddon>
  ): Promise<ApiResponse<ProductAddon>> {
    try {
      const { data, error } = await supabase
        .from('product_addons')
        .update(updates)
        .eq('id', addonId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateProductAddon', addonId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductAddon, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateProductAddon', addonId });
      return { data: null, error };
    }
  },

  /**
   * Remove an addon from a product
   */
  async removeProductAddon(addonId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('product_addons').delete().eq('id', addonId);

      if (error) {
        logger.error(new Error(error.message), { context: 'removeProductAddon', addonId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'removeProductAddon', addonId });
      return { error };
    }
  },

  // ===== Product Modifiers =====

  /**
   * Get all modifier groups for a product with their modifiers
   */
  async getProductModifierGroups(
    productId: string
  ): Promise<ApiResponse<ProductModifierGroupWithModifiers[]>> {
    try {
      // Fetch modifier groups
      const { data: groups, error: groupsError } = await supabase
        .from('product_modifier_groups')
        .select('*')
        .eq('product_id', productId)
        .order('sequence');

      if (groupsError) {
        logger.error(new Error(groupsError.message), {
          context: 'getProductModifierGroups',
          productId,
        });
        return { data: null, error: new Error(groupsError.message) };
      }

      // Fetch modifiers for all groups
      const { data: modifiers, error: modifiersError } = await supabase
        .from('product_modifiers')
        .select('*')
        .in(
          'modifier_group_id',
          (groups || []).map((g) => g.id)
        )
        .order('sequence');

      if (modifiersError) {
        logger.error(new Error(modifiersError.message), {
          context: 'getProductModifierGroups',
          productId,
        });
        return { data: null, error: new Error(modifiersError.message) };
      }

      // Combine groups with their modifiers
      const groupsWithModifiers = (groups || []).map((group) => ({
        ...group,
        modifiers: (modifiers || []).filter((m) => m.modifier_group_id === group.id),
      })) as ProductModifierGroupWithModifiers[];

      return { data: groupsWithModifiers, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getProductModifierGroups', productId });
      return { data: null, error };
    }
  },

  /**
   * Create a modifier group
   */
  async createModifierGroup(
    groupData: ProductModifierGroupInsert
  ): Promise<ApiResponse<ProductModifierGroup>> {
    try {
      const { data, error } = await supabase
        .from('product_modifier_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'createModifierGroup' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductModifierGroup, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createModifierGroup' });
      return { data: null, error };
    }
  },

  /**
   * Update a modifier group
   */
  async updateModifierGroup(
    groupId: string,
    updates: ProductModifierGroupUpdate
  ): Promise<ApiResponse<ProductModifierGroup>> {
    try {
      const { data, error } = await supabase
        .from('product_modifier_groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateModifierGroup', groupId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductModifierGroup, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateModifierGroup', groupId });
      return { data: null, error };
    }
  },

  /**
   * Delete a modifier group
   */
  async deleteModifierGroup(groupId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('product_modifier_groups').delete().eq('id', groupId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteModifierGroup', groupId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteModifierGroup', groupId });
      return { error };
    }
  },

  /**
   * Add a modifier to a modifier group
   */
  async addModifier(modifierData: ProductModifierInsert): Promise<ApiResponse<ProductModifier>> {
    try {
      const { data, error } = await supabase
        .from('product_modifiers')
        .insert(modifierData)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'addModifier' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductModifier, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'addModifier' });
      return { data: null, error };
    }
  },

  /**
   * Update a modifier
   */
  async updateModifier(
    modifierId: string,
    updates: ProductModifierUpdate
  ): Promise<ApiResponse<ProductModifier>> {
    try {
      const { data, error } = await supabase
        .from('product_modifiers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', modifierId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateModifier', modifierId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductModifier, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateModifier', modifierId });
      return { data: null, error };
    }
  },

  /**
   * Delete a modifier
   */
  async deleteModifier(modifierId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('product_modifiers').delete().eq('id', modifierId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteModifier', modifierId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteModifier', modifierId });
      return { error };
    }
  },

  // ===== Product Categories =====

  /**
   * Get all product categories for a shop
   */
  async getProductCategories(shopId: string): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('sequence');

      if (error) {
        logger.error(new Error(error.message), { context: 'getProductCategories', shopId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ProductCategory[], error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'getProductCategories', shopId });
      return { data: null, error };
    }
  },

  /**
   * Create a product category
   */
  async createProductCategory(
    category: Omit<ProductCategory, 'id' | 'created_at'>
  ): Promise<ApiResponse<ProductCategory>> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'createProductCategory' });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductCategory, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'createProductCategory' });
      return { data: null, error };
    }
  },

  /**
   * Update a product category
   */
  async updateProductCategory(
    categoryId: string,
    updates: Partial<ProductCategory>
  ): Promise<ApiResponse<ProductCategory>> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        logger.error(new Error(error.message), { context: 'updateProductCategory', categoryId });
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProductCategory, error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'updateProductCategory', categoryId });
      return { data: null, error };
    }
  },

  /**
   * Delete a product category
   */
  async deleteProductCategory(categoryId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('product_categories').delete().eq('id', categoryId);

      if (error) {
        logger.error(new Error(error.message), { context: 'deleteProductCategory', categoryId });
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      logger.error(error, { context: 'deleteProductCategory', categoryId });
      return { error };
    }
  },
};
