/**
 * Supabase Data Service & Resilient Fallback Layer
 * Allows live database queries when Supabase keys are configured,
 * while providing flawless offline/mock CRUD capability during local development.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { PRODUCTS, PROMO_CODES } from '../data/products';
import { CATEGORIES_DATA } from '../data/categories';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '../utils/storage';
import {
  calculateOrderTotals,
  generateOrderId,
  formatDate,
  getEstimatedDeliveryDate,
} from '../utils/formatters';

const STORAGE_CUSTOM_PRODUCTS = 'sjstudio_custom_products_v1';
const STORAGE_INVENTORY_CHANGES = 'sjstudio_inventory_overrides_v1';

// Cryptographically secure 256-bit token generator (32 bytes = 64 hex characters)
function generate256BitToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return 'gst_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Cryptographic failure: Secure random byte generator is unavailable. Guest order creation aborted.');
}

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

const inflightIdempotencyLocks = new Map();

/**
 * Trusted Secure Order Creation
 * - In configured Supabase mode: delegates to atomic PostgreSQL create_order_secure RPC.
 *   DOES NOT trust client prices, totals, or user ID. Never silently falls back on error.
 * - In unconfigured demo mode: performs server-equivalent trusted validation,
 *   recalculates totals, decrements stock locally, and scopes to demo user.
 */
export async function createOrderSecure(orderPayload) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_order_secure', {
      p_order_payload: orderPayload,
    });

    if (error) {
      console.error('[Supabase RPC Error in create_order_secure]:', error);
      throw new Error(error.message || 'Database error occurred while finalizing order.');
    }

    if (!data || !data.orderId) {
      throw new Error('Database transaction did not return a valid order confirmation.');
    }

    // Synchronize local stock overrides so UI reflects updated stock immediately
    if (Array.isArray(orderPayload.items)) {
      const overrides = getLocalInventoryOverrides();
      for (const item of orderPayload.items) {
        const key = `${item.product_id}__${item.size}`;
        if (overrides[key] !== undefined) {
          overrides[key] = Math.max(0, overrides[key] - item.quantity);
        }
      }
      setToStorage(STORAGE_INVENTORY_CHANGES, overrides);
    }

    return {
      success: true,
      order: {
        orderId: data.orderId,
        userId: data.userId,
        guestAccessToken: data.guestAccessToken || null,
        orderDate: data.orderDate,
        estimatedDelivery: data.estimatedDelivery,
        status: data.status,
        pricing: data.pricing,
        shippingAddress: data.shippingAddress,
        paymentDetails: data.paymentDetails,
        idempotencyKey: data.idempotencyKey,
        isDuplicate: Boolean(data.isDuplicate),
        items: orderPayload.items,
      },
    };
  }

  // Pure Local Demo Mode: Validate against local catalog
  // Safe concurrency lock for idempotency key
  const idemKey = orderPayload.idempotency_key
    ? `${orderPayload.user_id || 'guest'}__${orderPayload.idempotency_key}`
    : null;

  if (idemKey && inflightIdempotencyLocks.has(idemKey)) {
    try {
      await inflightIdempotencyLocks.get(idemKey);
    } catch {
      // Continue to idempotency verification
    }
  }

  let resolveLock = null;
  let ownsLock = false;

  if (idemKey && !inflightIdempotencyLocks.has(idemKey)) {
    const lockPromise = new Promise((resolve) => {
      resolveLock = resolve;
    });
    inflightIdempotencyLocks.set(idemKey, lockPromise);
    ownsLock = true;
  }

  try {
    // 1. Check for Idempotency in local storage history
    if (orderPayload.idempotency_key) {
      const savedOrders = getFromStorage(STORAGE_KEYS.ORDERS, []);
      if (Array.isArray(savedOrders)) {
        const existing = savedOrders.find((o) => o.idempotencyKey === orderPayload.idempotency_key);
        if (existing) {
          // Enforce user isolation: prevent cross-user key collision
          if (orderPayload.user_id && existing.userId && existing.userId !== orderPayload.user_id) {
            throw new Error('Idempotency key collision across user accounts.');
          }
          if (!orderPayload.user_id && existing.userId && existing.userId !== 'demo_guest') {
            throw new Error('Idempotency key collision across user accounts.');
          }

          // Verify complete normalized payload integrity: reject changed payload with same key
          const reqItems = orderPayload.items || [];
          const existItems = existing.items || [];
          const itemsMatch =
            reqItems.length === existItems.length &&
            reqItems.every((reqItem) => {
              return existItems.some((exItem) => {
                const pid = exItem.productId || exItem.product_id;
                const reqColor = reqItem.color_name || reqItem.color?.name || 'Standard';
                const exColor = exItem.color?.name || exItem.color_name || 'Standard';
                return (
                  pid === reqItem.product_id &&
                  exItem.size === reqItem.size &&
                  exColor === reqColor &&
                  Number(exItem.quantity) === Number(reqItem.quantity)
                );
              });
            });

          const reqShip = orderPayload.shipping_address || {};
          const exShip = existing.shippingAddress || {};
          const shipMatch =
            (exShip.fullName || '') === (reqShip.fullName || '') &&
            (exShip.addressLine1 || '') === (reqShip.addressLine1 || '') &&
            (exShip.phone || '') === (reqShip.phone || '') &&
            (exShip.pincode || '') === (reqShip.pincode || '');

          const reqPayMethod = orderPayload.payment_method || 'COD';
          const exPayMethod = existing.paymentDetails?.method || 'COD';
          const payMatch = reqPayMethod === exPayMethod;

          const reqPromo = orderPayload.promo_code ? orderPayload.promo_code.toUpperCase().trim() : null;
          const exPromo = existing.pricing?.promoCode ? existing.pricing.promoCode.toUpperCase().trim() : null;
          const promoMatch = reqPromo === exPromo;

          if (!itemsMatch || !shipMatch || !payMatch || !promoMatch) {
            throw new Error(`Idempotency key ${orderPayload.idempotency_key} was previously used with a different order payload.`);
          }

          // Return existing order safely for verified idempotency retry
          // Zero disclosure: never return guest access token on idempotency retry
          return {
            success: true,
            order: {
              ...existing,
              guestAccessToken: null,
              isDuplicate: true,
            },
          };
        }
      }
    }

    const catalog = await getProducts();
    const overrides = getLocalInventoryOverrides();
    const verifiedItems = [];

    for (const item of orderPayload.items || []) {
      const product = catalog.find((p) => p.id === item.product_id);
      if (!product || product.is_active === false) {
        throw new Error(`Product ${item.product_id} is no longer available.`);
      }

      const variant = product.sizes?.find((s) => s.size === item.size);
      if (!variant) {
        throw new Error(`Size ${item.size} is invalid for ${product.name}.`);
      }

      // Exact variant matching: ensure requested color matches product catalog
      const requestedColor = item.color_name || 'Standard';
      if (requestedColor !== 'Standard' && Array.isArray(product.colors) && product.colors.length > 0) {
        const colorFound = product.colors.some((c) => (c.name || c) === requestedColor);
        if (!colorFound) {
          throw new Error(`Invalid size or color combination for ${product.name}: Size ${item.size}, Color ${requestedColor}.`);
        }
      }

      const key = `${product.id}__${variant.size}`;
      const currentStock = overrides[key] !== undefined ? overrides[key] : (variant.stock ?? 0);

      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (${item.size}). Requested: ${item.quantity}, Available: ${currentStock}`);
      }

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory || '',
        size: variant.size,
        color: { name: item.color_name || 'Standard' },
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: item.quantity,
        image: product.images?.[0] || '',
      });
    }

    // Authoritatively recalculate totals
    let discountPercent = 0;
    let promoDiscount = 0;
    let promoType = null;
    const promoCode = orderPayload.promo_code ? orderPayload.promo_code.toUpperCase().trim() : null;

    if (promoCode) {
      const promo = PROMO_CODES[promoCode];
      if (!promo) {
        throw new Error(`Invalid promo code: ${promoCode}`);
      }
      promoType = promo.type;
      if (promo.type === 'percentage') discountPercent = promo.value;
      else if (promo.type === 'flat') promoDiscount = promo.value;
    }

    const totals = calculateOrderTotals(verifiedItems, discountPercent, promoDiscount);
    if (promoType === 'shipping') {
      totals.shipping = 0;
      totals.total = Math.max(0, totals.subtotal - totals.discount);
      totals.isFreeShipping = true;
    }

    // Atomically decrement stock in local storage
    for (const item of verifiedItems) {
      const key = `${item.productId}__${item.size}`;
      const product = catalog.find((p) => p.id === item.productId);
      const variant = product.sizes?.find((s) => s.size === item.size);
      const prevStock = overrides[key] !== undefined ? overrides[key] : (variant.stock ?? 0);
      overrides[key] = Math.max(0, prevStock - item.quantity);
    }
    setToStorage(STORAGE_INVENTORY_CHANGES, overrides);

    const orderId = generateOrderId();
    const orderDate = formatDate(new Date());
    const estimatedDelivery = getEstimatedDeliveryDate(4);

    const localOrder = {
      orderId,
      userId: orderPayload.user_id || 'demo_guest',
      guestAccessToken: !orderPayload.user_id || orderPayload.user_id === 'demo_guest'
        ? generate256BitToken()
        : null,
      createdAt: new Date().toISOString(),
      orderDate,
      estimatedDelivery,
      status: 'Confirmed',
      items: verifiedItems,
      shippingAddress: orderPayload.shipping_address,
      paymentDetails: {
        method: orderPayload.payment_method || 'COD',
        status: orderPayload.payment_method === 'COD' ? 'Pending on Delivery' : 'Pending Payment',
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
      pricing: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        promoCode,
      },
      idempotencyKey: orderPayload.idempotency_key,
      isDuplicate: false,
    };

    // Save to local storage orders history
    const savedOrders = getFromStorage(STORAGE_KEYS.ORDERS, []);
    const safeList = Array.isArray(savedOrders) ? savedOrders : [];
    setToStorage(STORAGE_KEYS.ORDERS, [localOrder, ...safeList]);

    return { success: true, order: localOrder };
  } finally {
    if (ownsLock) {
      inflightIdempotencyLocks.delete(idemKey);
      if (resolveLock) resolveLock();
    }
  }
}

/**
 * Fetch orders for authenticated user or demo guest
 */
export async function fetchUserOrders(userId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (Array.isArray(data)) {
        return data.map((o) => ({
          orderId: o.id,
          userId: o.user_id,
          createdAt: o.created_at,
          orderDate: o.order_date,
          estimatedDelivery: o.estimated_delivery,
          status: o.status,
          pricing: {
            subtotal: Number(o.subtotal),
            discount: Number(o.discount),
            shipping: Number(o.shipping),
            total: Number(o.total),
            promoCode: o.promo_code,
          },
          shippingAddress: o.shipping_address,
          paymentDetails: o.payment_details,
          idempotencyKey: o.idempotency_key,
          items: o.order_items?.map((item) => ({
            productId: item.product_id,
            name: item.name,
            category: item.category,
            size: item.size,
            color: { name: item.color_name || 'Standard' },
            price: Number(item.price),
            quantity: item.quantity,
            image: item.image,
          })) || [],
        }));
      }
    } catch (err) {
      console.error('[Supabase Service] Error fetching user orders:', err);
      throw err;
    }
  }

  // Local fallback: Filter orders by user ID
  const allOrders = getFromStorage(STORAGE_KEYS.ORDERS, []);
  if (!Array.isArray(allOrders)) return [];

  if (userId) {
    return allOrders.filter((o) => o.userId === userId);
  }
  return allOrders.filter((o) => o.userId === 'demo_guest' || !o.userId);
}

/**
 * Fetch a single order by ID with authorization boundary
 * Authenticated users: verified by RLS/userId.
 * Guest users: strictly requires matching guestAccessToken (guessable order ID alone rejected).
 */
export async function fetchOrderById(orderId, userId = null, guestAccessToken = null) {
  if (!orderId) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      if (userId) {
        // Authenticated lookup: protected by Postgres RLS (auth.uid() = user_id)
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (error || !data) return null;

        return {
          orderId: data.id,
          userId: data.user_id,
          guestAccessToken: data.guest_access_token || null,
          createdAt: data.created_at,
          orderDate: data.order_date,
          estimatedDelivery: data.estimated_delivery,
          status: data.status,
          pricing: {
            subtotal: Number(data.subtotal),
            discount: Number(data.discount),
            shipping: Number(data.shipping),
            total: Number(data.total),
            promoCode: data.promo_code,
          },
          shippingAddress: data.shipping_address,
          paymentDetails: data.payment_details,
          idempotencyKey: data.idempotency_key,
          items: data.order_items?.map((item) => ({
            productId: item.product_id,
            name: item.name,
            category: item.category,
            size: item.size,
            color: { name: item.color_name || 'Standard' },
            price: Number(item.price),
            quantity: item.quantity,
            image: item.image,
          })) || [],
        };
      } else {
        // Guest lookup: Requires matching 256-bit guest access token via get_guest_order RPC
        if (!guestAccessToken) {
          return null; // Guessable order ID alone cannot retrieve guest order
        }

        const { data, error } = await supabase.rpc('get_guest_order', {
          p_order_id: orderId,
          p_guest_access_token: guestAccessToken,
        });

        if (error || !data || !data.orderId) return null;
        return data;
      }
    } catch (err) {
      console.warn('[Supabase Service] Error fetching order by ID:', err);
      return null;
    }
  }

  // Local storage lookup with ownership boundary
  const allOrders = getFromStorage(STORAGE_KEYS.ORDERS, []);
  if (!Array.isArray(allOrders)) return null;

  const found = allOrders.find((o) => o.orderId === orderId);
  if (!found) return null;

  // If order belongs to an authenticated user
  if (found.userId && found.userId !== 'demo_guest') {
    if (!userId || found.userId !== userId) {
      // Cross-user or unauthenticated access to authenticated order denied
      return null;
    }
  } else {
    // Guest order: strictly require matching guest access token if order is protected with one
    if (found.guestAccessToken && (!guestAccessToken || found.guestAccessToken !== guestAccessToken)) {
      return null;
    }
    return {
      ...found,
      guestAccessToken: null,
    };
  }

  return found;
}
