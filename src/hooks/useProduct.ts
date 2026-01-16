// useProduct Hook - TanStack Query hooks for product management

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { type ProductFilters, productService } from '@/services/product.service';
import type {
  ProductAddon,
  ProductCategory,
  ProductInsert,
  ProductItem,
  ProductModifierUpdate,
  ProductUpdate,
} from '@/types';

// Query keys for cache management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (shopId: string, filters?: ProductFilters) =>
    [...productKeys.lists(), shopId, filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (productId: string) => [...productKeys.details(), productId] as const,
  categories: (shopId: string) => [...productKeys.all, 'categories', shopId] as const,
};

/**
 * Hook to fetch products for the current shop.
 *
 * @example
 * ```tsx
 * function ProductsList() {
 *   const { data: products, isLoading, error } = useProducts({ search: 'coffee' });
 *
 *   if (isLoading) return <IonSpinner />;
 *   if (error) return <p>Error loading products</p>;
 *
 *   return (
 *     <IonList>
 *       {products?.map((product) => (
 *         <IonItem key={product.id}>
 *           <IonLabel>{product.name}</IonLabel>
 *           <IonNote slot="end">${product.price.toFixed(2)}</IonNote>
 *         </IonItem>
 *       ))}
 *     </IonList>
 *   );
 * }
 * ```
 */
export function useProducts(filters?: ProductFilters) {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: productKeys.list(currentShop?.id || '', filters),
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await productService.getProducts(currentShop.id, filters);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentShop,
  });
}

/**
 * Hook to fetch products with infinite scroll/pagination.
 *
 * @example
 * ```tsx
 * function ProductsInfiniteList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useProductsInfinite({ pageSize: 20 });
 *
 *   const products = data?.pages.flatMap(page => page.data) ?? [];
 *
 *   return (
 *     <IonList>
 *       {products.map((product) => (
 *         <IonItem key={product.id}>
 *           <IonLabel>{product.name}</IonLabel>
 *         </IonItem>
 *       ))}
 *       <IonInfiniteScroll
 *         disabled={!hasNextPage}
 *         onIonInfinite={() => fetchNextPage()}
 *       >
 *         <IonInfiniteScrollContent />
 *       </IonInfiniteScroll>
 *     </IonList>
 *   );
 * }
 * ```
 */
export function useProductsInfinite(filters?: ProductFilters & { pageSize?: number }) {
  const { currentShop } = useShopContext();
  const pageSize = filters?.pageSize || 20;

  return useInfiniteQuery({
    queryKey: [...productKeys.list(currentShop?.id || '', filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      if (!currentShop) {
        return { data: [], count: 0, page: 1, pageSize, hasMore: false };
      }
      const { data, error } = await productService.getProductsPaginated(
        currentShop.id,
        pageParam,
        pageSize,
        filters
      );
      if (error) throw error;
      return data!;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
    enabled: !!currentShop,
  });
}

/**
 * Hook to fetch a single product with full details.
 *
 * @example
 * ```tsx
 * function ProductDetail({ productId }: { productId: string }) {
 *   const { data: product, isLoading } = useProduct(productId);
 *
 *   if (isLoading) return <IonSpinner />;
 *
 *   return (
 *     <div>
 *       <h1>{product?.name}</h1>
 *       <p>{product?.description}</p>
 *       <p>Items: {product?.items.length}</p>
 *       <p>Addons: {product?.addons.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(productId || ''),
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await productService.getProduct(productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook to create a new product.
 *
 * @example
 * ```tsx
 * function CreateProductForm() {
 *   const createProduct = useCreateProduct();
 *
 *   const handleSubmit = async (data: ProductInsert) => {
 *     try {
 *       const product = await createProduct.mutateAsync(data);
 *       console.log('Created:', product.id);
 *     } catch (error) {
 *       console.error('Failed:', error);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: Omit<ProductInsert, 'shop_id'>) => {
      if (!currentShop || !user) throw new Error('No shop selected or not authenticated');
      const productData: ProductInsert = { ...data, shop_id: currentShop.id };
      const { data: product, error } = await productService.createProduct(productData, user.id);
      if (error) throw error;
      return product!;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      }
    },
  });
}

/**
 * Hook to update an existing product.
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: ProductUpdate }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: product, error } = await productService.updateProduct(productId, data, user.id);
      if (error) throw error;
      return product!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to delete a product.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await productService.deleteProduct(productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// ===== Product Items Hooks =====

/**
 * Hook to add an item to a product.
 */
export function useAddProductItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ProductItem, 'id' | 'created_at'>) => {
      const { data, error } = await productService.addProductItem(item);
      if (error) throw error;
      return data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.product_id) });
    },
  });
}

/**
 * Hook to update a product item.
 */
export function useUpdateProductItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      productId,
      updates,
    }: {
      itemId: string;
      productId: string;
      updates: Partial<ProductItem>;
    }) => {
      const { data, error } = await productService.updateProductItem(itemId, updates);
      if (error) throw error;
      return data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}

/**
 * Hook to remove an item from a product.
 */
export function useRemoveProductItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, productId }: { itemId: string; productId: string }) => {
      const { error } = await productService.removeProductItem(itemId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}

// ===== Product Addons Hooks =====

/**
 * Hook to add an addon to a product.
 */
export function useAddProductAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addon: Omit<ProductAddon, 'id' | 'created_at'>) => {
      const { data, error } = await productService.addProductAddon(addon);
      if (error) throw error;
      return data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.product_id) });
    },
  });
}

/**
 * Hook to update a product addon.
 */
export function useUpdateProductAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addonId,
      productId,
      updates,
    }: {
      addonId: string;
      productId: string;
      updates: Partial<ProductAddon>;
    }) => {
      const { data, error } = await productService.updateProductAddon(addonId, updates);
      if (error) throw error;
      return data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}

/**
 * Hook to remove an addon from a product.
 */
export function useRemoveProductAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addonId, productId }: { addonId: string; productId: string }) => {
      const { error } = await productService.removeProductAddon(addonId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}

// ===== Product Categories Hooks =====

/**
 * Hook to fetch product categories for the current shop.
 *
 * @example
 * ```tsx
 * function CategoryFilter() {
 *   const { data: categories } = useProductCategories();
 *
 *   return (
 *     <IonSelect>
 *       <IonSelectOption value="">All Categories</IonSelectOption>
 *       {categories?.map((cat) => (
 *         <IonSelectOption key={cat.id} value={cat.id}>
 *           {cat.code}
 *         </IonSelectOption>
 *       ))}
 *     </IonSelect>
 *   );
 * }
 * ```
 */
export function useProductCategories() {
  const { currentShop } = useShopContext();

  return useQuery({
    queryKey: productKeys.categories(currentShop?.id || ''),
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await productService.getProductCategories(currentShop.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentShop,
  });
}

/**
 * Hook to create a product category.
 */
export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: async (category: Omit<ProductCategory, 'id' | 'created_at' | 'shop_id'>) => {
      if (!currentShop) throw new Error('No shop selected');
      const { data, error } = await productService.createProductCategory({
        ...category,
        shop_id: currentShop.id,
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: productKeys.categories(currentShop.id) });
      }
    },
  });
}

/**
 * Hook to update a product category.
 */
export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: async ({
      categoryId,
      updates,
    }: {
      categoryId: string;
      updates: Partial<ProductCategory>;
    }) => {
      const { data, error } = await productService.updateProductCategory(categoryId, updates);
      if (error) throw error;
      return data!;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: productKeys.categories(currentShop.id) });
      }
    },
  });
}

/**
 * Hook to delete a product category.
 */
export function useDeleteProductCategory() {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await productService.deleteProductCategory(categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (currentShop) {
        queryClient.invalidateQueries({ queryKey: productKeys.categories(currentShop.id) });
      }
    },
  });
}

// ===== Product Modifier Groups Hooks =====

/**
 * Hook to create a new modifier group for a product.
 *
 * @example
 * ```tsx
 * function AddModifierGroup() {
 *   const createGroup = useCreateModifierGroup();
 *
 *   const handleSubmit = async (data) => {
 *     await createGroup.mutateAsync({
 *       product_id: productId,
 *       name: data.name,
 *       min_selections: data.min_selections,
 *       max_selections: data.max_selections,
 *       sequence: data.sequence,
 *     });
 *   };
 * }
 * ```
 */
export function useCreateModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      name: string;
      min_select: number;
      max_select: number | null;
      sequence: number;
    }) => {
      const { data: group, error } = await productService.createModifierGroup(data);
      if (error) throw error;
      return group!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.product_id) });
    },
  });
}

/**
 * Hook to update an existing modifier group.
 *
 * @example
 * ```tsx
 * function EditModifierGroup() {
 *   const updateGroup = useUpdateModifierGroup();
 *
 *   const handleSubmit = async (data) => {
 *     await updateGroup.mutateAsync({
 *       groupId: group.id,
 *       productId: group.product_id,
 *       updates: data,
 *     });
 *   };
 * }
 * ```
 */
export function useUpdateModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      productId,
      updates,
    }: {
      groupId: string;
      productId?: string;
      updates: {
        name?: string;
        min_select?: number;
        max_select?: number | null;
        sequence?: number;
      };
    }) => {
      const { data, error } = await productService.updateModifierGroup(groupId, updates);
      if (error) throw error;
      return { data, productId };
    },
    onSuccess: (result) => {
      if (result.productId) {
        queryClient.invalidateQueries({ queryKey: productKeys.detail(result.productId) });
      }
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to delete a modifier group.
 *
 * @example
 * ```tsx
 * function DeleteModifierGroup() {
 *   const deleteGroup = useDeleteModifierGroup();
 *
 *   const handleDelete = async () => {
 *     await deleteGroup.mutateAsync({
 *       groupId: group.id,
 *       productId: group.product_id,
 *     });
 *   };
 * }
 * ```
 */
export function useDeleteModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, productId }: { groupId: string; productId?: string }) => {
      const { error } = await productService.deleteModifierGroup(groupId);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      if (productId) {
        queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      }
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to update a modifier
 * Updates a modifier and invalidates product cache
 *
 * @example
 * ```tsx
 * function EditModifier() {
 *   const updateModifier = useUpdateModifier();
 *
 *   const handleUpdate = async (modifierId: string, updates: ProductModifierUpdate) => {
 *     await updateModifier.mutateAsync({
 *       modifierId,
 *       updates,
 *       productId: '123',
 *     });
 *   };
 * }
 * ```
 */
export function useUpdateModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modifierId,
      updates,
      productId,
    }: {
      modifierId: string;
      updates: ProductModifierUpdate;
      productId?: string;
    }) => {
      const { data, error } = await productService.updateModifier(modifierId, updates);
      if (error) throw error;
      return { data, productId };
    },
    onSuccess: ({ productId }) => {
      if (productId) {
        queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      }
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
