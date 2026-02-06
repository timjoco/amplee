import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ProductRow } from '../types/subscriptionTypes';

type UseProductsResult = {
  products: ProductRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Hook to load all available products from the store.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      setProducts((data as ProductRow[]) || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { products, loading, error, reload };
}

/**
 * Hook to load a single product by slug.
 */
export function useProduct(slug: string) {
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!alive) return;

        if (queryError) {
          setError(queryError.message);
          return;
        }

        setProduct((data as ProductRow) || null);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Failed to load product';
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadProduct();

    return () => {
      alive = false;
    };
  }, [slug]);

  return { product, loading, error };
}
