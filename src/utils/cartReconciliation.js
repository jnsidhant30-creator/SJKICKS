import { PRODUCTS } from '../data/products';
import { getFromStorage } from './storage';

const STORAGE_CUSTOM_PRODUCTS = 'sjstudio_custom_products_v1';
const STORAGE_INVENTORY_CHANGES = 'sjstudio_inventory_overrides_v1';

/**
 * Returns current combined catalog with local overrides applied synchronously
 */
export function getLocalCatalog() {
  const custom = getFromStorage(STORAGE_CUSTOM_PRODUCTS, []);
  const overrides = getFromStorage(STORAGE_INVENTORY_CHANGES, {});

  const safeCustom = Array.isArray(custom) ? custom : [];
  const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};

  return [...safeCustom, ...PRODUCTS].map((product) => {
    const updatedSizes = product.sizes?.map((s) => {
      const key = `${product.id}__${s.size}`;
      if (safeOverrides[key] !== undefined) {
        return { ...s, stock: Math.max(0, Number(safeOverrides[key]) || 0) };
      }
      return s;
    });
    return { ...product, sizes: updatedSizes };
  });
}

/**
 * Compares two cart arrays for functional equivalence
 */
export function isCartEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.cartItemId !== itemB.cartItemId ||
      itemA.productId !== itemB.productId ||
      itemA.size !== itemB.size ||
      itemA.quantity !== itemB.quantity ||
      itemA.price !== itemB.price
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Safely reconciles raw cart items against current catalog:
 * - Drops deleted products and invalid variants
 * - Drops zero-stock items
 * - Clamps quantities to available stock
 * - Normalizes quantities to positive integers
 * - Updates prices from catalog
 * - Merges accidental duplicate lines
 * - Returns original array reference if no changes were needed
 */
export function reconcileCart(rawCart, catalog = null) {
  if (!Array.isArray(rawCart) || rawCart.length === 0) {
    return [];
  }

  const activeCatalog = Array.isArray(catalog) ? catalog : getLocalCatalog();
  const reconciledMap = new Map();

  for (const item of rawCart) {
    if (!item || typeof item !== 'object') continue;

    const productId = item.productId || item.id;
    if (!productId) continue;

    const product = activeCatalog.find((p) => p.id === productId);
    if (!product || product.is_active === false) {
      // Product deleted or deactivated
      continue;
    }

    const size = item.size;
    if (!size) continue;

    const variant = product.sizes?.find((s) => s.size === size);
    if (!variant) {
      // Variant deleted or invalid
      continue;
    }

    const availableStock =
      typeof variant.stock === 'number' && !isNaN(variant.stock)
        ? Math.max(0, variant.stock)
        : 0;

    if (availableStock <= 0) {
      // Out of stock
      continue;
    }

    // Normalize quantity
    let qty = Math.floor(Number(item.quantity));
    if (isNaN(qty) || qty <= 0) {
      continue;
    }

    const color = item.color || product.colors?.[0] || { name: 'Standard' };
    const cartItemId = item.cartItemId || `${product.id}__${size}__${color.name}`;

    if (reconciledMap.has(cartItemId)) {
      // Duplicate item found in raw data - merge quantities
      const existing = reconciledMap.get(cartItemId);
      const mergedQty = Math.min(availableStock, existing.quantity + qty);
      existing.quantity = mergedQty;
    } else {
      const clampedQty = Math.min(availableStock, qty);
      reconciledMap.set(cartItemId, {
        cartItemId,
        productId: product.id,
        name: product.name,
        tagline: product.tagline || '',
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        image: product.images?.[0] || item.image || '',
        size: variant.size,
        color,
        category: product.category,
        subcategory: product.subcategory || '',
        audience: product.audience || product.gender || 'Unisex',
        quantity: clampedQty,
        maxStock: availableStock,
      });
    }
  }

  const reconciledList = Array.from(reconciledMap.values());

  // If reconciled list matches rawCart, preserve referential identity to avoid loops
  if (isCartEqual(rawCart, reconciledList)) {
    return rawCart;
  }

  return reconciledList;
}

