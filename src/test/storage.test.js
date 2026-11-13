import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  removeFromStorage,
} from '../utils/storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines stable storage keys for cart, wishlist, orders, and promo', () => {
    expect(STORAGE_KEYS.CART).toBe('sjkicks_cart_v1');
    expect(STORAGE_KEYS.WISHLIST).toBe('sjkicks_wishlist_v1');
    expect(STORAGE_KEYS.ORDERS).toBe('sjkicks_orders_history_v1');
    expect(STORAGE_KEYS.LAST_ORDER).toBe('sjkicks_latest_order_v1');
    expect(STORAGE_KEYS.PROMO).toBe('sjkicks_active_promo_v1');
  });

  it('stores and retrieves JavaScript objects and arrays', () => {
    const payload = [{ id: 'item-1', name: 'SJ Horizon Pro', quantity: 2 }];
    const success = setToStorage(STORAGE_KEYS.CART, payload);
    expect(success).toBe(true);

    const retrieved = getFromStorage(STORAGE_KEYS.CART, []);
    expect(retrieved).toEqual(payload);
  });

  it('returns defaultValue when key is missing', () => {
    const result = getFromStorage('missing_key', { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('handles corrupted/malformed JSON in localStorage gracefully without throwing', () => {
    localStorage.setItem(STORAGE_KEYS.CART, '{invalid json: corrupted--');
    const result = getFromStorage(STORAGE_KEYS.CART, []);
    expect(result).toEqual([]);
  });

  it('removes keys from storage', () => {
    setToStorage('test_key', 'val');
    expect(getFromStorage('test_key')).toBe('val');

    removeFromStorage('test_key');
    expect(getFromStorage('test_key', null)).toBeNull();
  });
});

