/**
 * Supabase Data Service & Resilient Fallback Layer
 * Allows live database queries when Supabase keys are configured,
 * while providing flawless offline/mock CRUD capability during local development.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { PRODUCTS } from '../data/products';
import { CATEGORIES_DATA } from '../data/categories';
import { getFromStorage, setToStorage } from '../utils/storage';

const STORAGE_CUSTOM_PRODUCTS = 'sjstudio_custom_products_v1';
const STORAGE_INVENTORY_CHANGES = 'sjstudio_inventory_overrides_v1';

// In-memory / stored overrides for local development
function getLocalCustomProducts() {
  return getFromStorage(STORAGE_CUSTOM_PRODUCTS, []);
}

function getLocalInventoryOverrides() {
  return getFromStorage(STORAGE_INVENTORY_CHANGES, {});
}

/**
 * Fetch all active products
 */
export async function getProducts() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map Supabase rows to app format
        return data.map((item) => ({
          ...item,
          audience: item.audience || 'Unisex',
          gender: item.audience || 'Unisex',
          sizes: item.product_variants?.map((v) => ({
            size: v.size,
            stock: v.stock,
            sku: v.sku,
          })) || item.sizes,
        }));
      }
    } catch (err) {
      console.warn('[Supabase Service] Falling back to local catalog:', err);
    }
  }

  // Fallback: Combine static PRODUCTS with local custom products & stock overrides
  const custom = getLocalCustomProducts();
  const overrides = getLocalInventoryOverrides();

  const combined = [...custom, ...PRODUCTS].map((product) => {
    const updatedSizes = product.sizes?.map((s) => {
      const key = `${product.id}__${s.size}`;
      if (overrides[key] !== undefined) {
        return { ...s, stock: overrides[key] };
      }
      return s;
    });
    return { ...product, sizes: updatedSizes };
  });

  return combined;
}

/**
 * Fetch a single product by ID or Slug
 */
export async function getProductById(idOrSlug) {
  const all = await getProducts();
  return all.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

/**
 * Admin: Add or update a product
 */
export async function upsertProduct(product) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          slug: product.slug || product.id,
          name: product.name,
          tagline: product.tagline,
          category: product.category,
          subcategory: product.subcategory,
          audience: product.audience,
          price: Number(product.price),
          original_price: product.originalPrice ? Number(product.originalPrice) : null,
          badge: product.badge,
          is_featured: Boolean(product.isFeatured),
          is_new: Boolean(product.isNew),
          is_bestseller: Boolean(product.isBestseller),
          is_sale: Boolean(product.isSale),
          rating: product.rating || 4.8,
          review_count: product.reviewCount || 10,
          description: product.description,
          features: product.features,
          colors: product.colors,
          images: product.images,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[Supabase Service] Error upserting product to Supabase:', err);
    }
  }

  // Local fallback
  const custom = getLocalCustomProducts();
  const existingIdx = custom.findIndex((p) => p.id === product.id);

  if (existingIdx > -1) {
    custom[existingIdx] = { ...custom[existingIdx], ...product };
  } else {
    custom.unshift(product);
  }
  setToStorage(STORAGE_CUSTOM_PRODUCTS, custom);
  return { success: true, data: product };
}

/**
 * Admin: Delete a product
 */
export async function deleteProduct(productId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[Supabase Service] Error deleting from Supabase:', err);
    }
  }

  const custom = getLocalCustomProducts();
  const filtered = custom.filter((p) => p.id !== productId);
  setToStorage(STORAGE_CUSTOM_PRODUCTS, filtered);
  return { success: true };
}

/**
 * Admin: Update variant inventory stock
 */
export async function updateStock(productId, size, newStock) {
  const stockNum = Math.max(0, Number(newStock) || 0);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: stockNum })
        .eq('product_id', productId)
        .eq('size', size);
      if (!error) return { success: true, stock: stockNum };
    } catch (err) {
      console.warn('[Supabase Service] Error updating DB stock, saving locally:', err);
    }
  }

  const overrides = getLocalInventoryOverrides();
  overrides[`${productId}__${size}`] = stockNum;
  setToStorage(STORAGE_INVENTORY_CHANGES, overrides);
  return { success: true, stock: stockNum };
}

/**
 * Fetch categories structure
 */
export async function getCategories() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)');
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('[Supabase Service] Categories fallback:', err);
    }
  }
  return CATEGORIES_DATA;
}
