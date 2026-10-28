/**
 * Safe local storage wrapper that prevents app crashes on malformed data or disabled storage
 */

export const STORAGE_KEYS = {
  CART: 'sjkicks_cart_v1',
  WISHLIST: 'sjkicks_wishlist_v1',
  ORDERS: 'sjkicks_orders_history_v1',
  LAST_ORDER: 'sjkicks_latest_order_v1',
  PROMO: 'sjkicks_active_promo_v1',
};

export function getFromStorage(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[SJ KICKS Storage] Failed to parse key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[SJ KICKS Storage] Failed to save key "${key}" to localStorage:`, err);
    return false;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`[SJ KICKS Storage] Failed to remove key "${key}" from localStorage:`, err);
    return false;
  }
}
