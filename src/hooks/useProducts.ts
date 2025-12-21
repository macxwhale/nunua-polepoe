import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as productsApi from '@/api/products.api';
import type { TablesInsert, TablesUpdate, Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

/**
 * Get all products
 */
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: productsApi.getProducts,
  });
};

/**
 * Get a single product by ID
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.productById(id),
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
  });
};

/**
 * Search products by name
 */
export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productsApi.searchProducts(query),
    enabled: query.length > 0,
    staleTime: 10000, // 10 seconds for search results
  });
};

/**
 * Create a new product with optimistic update
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'products'>, 'tenant_id'>) =>
      productsApi.createProduct(data),
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });

      const previousProducts = queryClient.getQueryData(queryKeys.products);

      // Optimistically add the new product
      queryClient.setQueryData(queryKeys.products, (old: Product[] | undefined) => {
        if (!old) return old;
        const optimisticProduct: Product = {
          id: `temp-${Date.now()}`,
          name: newProduct.name,
          description: newProduct.description || null,
          price: newProduct.price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: '',
        };
        return [optimisticProduct, ...old];
      });

      return { previousProducts };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
      toast.error(`Failed to create product: ${error.message}`);
      console.error('Create product error:', error);
    },
    onSuccess: () => {
      toast.success('Product created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

/**
 * Update an existing product with optimistic update
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'products'> }) =>
      productsApi.updateProduct(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });

      const previousProducts = queryClient.getQueryData(queryKeys.products);

      // Optimistically update the product
      queryClient.setQueryData(queryKeys.products, (old: Product[] | undefined) => {
        if (!old) return old;
        return old.map((product) =>
          product.id === id ? { ...product, ...updates, updated_at: new Date().toISOString() } : product
        );
      });

      return { previousProducts };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
      toast.error(`Failed to update product: ${error.message}`);
      console.error('Update product error:', error);
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.productById(data.id) });
      }
    },
  });
};

/**
 * Delete a product with optimistic update
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      const previousProducts = queryClient.getQueryData(queryKeys.products);

      queryClient.setQueryData(queryKeys.products, (old: Product[] | undefined) => {
        if (!old) return old;
        return old.filter((product) => product.id !== productId);
      });

      return { previousProducts };
    },
    onError: (error: Error, productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
      toast.error(`Failed to delete product: ${error.message}`);
      console.error('Delete product error:', error);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};
