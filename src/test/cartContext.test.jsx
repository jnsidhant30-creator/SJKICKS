import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { PRODUCTS } from '../data/products';
import { STORAGE_KEYS, getFromStorage } from '../utils/storage';

const wrapper = ({ children }) => (
  <ToastProvider>
    <CartProvider>{children}</CartProvider>
  </ToastProvider>
);

describe('CartContext & CartProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const shoeProduct = PRODUCTS.find((p) => p.category === 'Shoes');
  const clothingProduct = PRODUCTS.find((p) => p.category === 'Clothing');
  const watchProduct = PRODUCTS.find((p) => p.category === 'Watches');

  it('initializes with empty cart and wishlist when storage is empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.wishlist).toEqual([]);
    expect(result.current.activePromo).toBeNull();
    expect(result.current.totals.subtotal).toBe(0);
  });

  it('successfully adds footwear to cart with selected size and color', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let success;
    act(() => {
      success = result.current.addToCart(
        shoeProduct,
        'UK 9',
        shoeProduct.colors[0],
        1
      );
    });

    expect(success).toBe(true);
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cart[0].productId).toBe(shoeProduct.id);
    expect(result.current.cart[0].size).toBe('UK 9');
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.totals.subtotal).toBe(shoeProduct.price);

    // Verify localStorage persistence
    const savedCart = getFromStorage(STORAGE_KEYS.CART, []);
    expect(savedCart.length).toBe(1);
    expect(savedCart[0].productId).toBe(shoeProduct.id);
  });

  it('increments quantity when adding the same product, size, and color', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
    });
    act(() => {
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 2);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].quantity).toBe(3);
    expect(result.current.cartCount).toBe(3);
    expect(result.current.totals.subtotal).toBe(shoeProduct.price * 3);
  });

  it('creates distinct cart lines for different sizes of the same product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(shoeProduct, 'UK 8', shoeProduct.colors[0], 1);
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
    });

    expect(result.current.cart.length).toBe(2);
    expect(result.current.cartCount).toBe(2);
  });

  it('auto-assigns "One Size (Standard)" for Watches when size is omitted', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let success;
    act(() => {
      success = result.current.addToCart(watchProduct, null, null, 1);
    });

    expect(success).toBe(true);
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].size).toMatch(/One Size/);
  });

  it('rejects adding apparel or footwear if size is omitted', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let shoeSuccess;
    let clothingSuccess;

    act(() => {
      shoeSuccess = result.current.addToCart(shoeProduct, null, null, 1);
      clothingSuccess = result.current.addToCart(clothingProduct, null, null, 1);
    });

    expect(shoeSuccess).toBe(false);
    expect(clothingSuccess).toBe(false);
    expect(result.current.cart.length).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('updates item quantity and removes item if quantity <= 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
    });

    const cartItemId = result.current.cart[0].cartItemId;

    act(() => {
      result.current.updateQuantity(cartItemId, 4);
    });
    expect(result.current.cart[0].quantity).toBe(4);
    expect(result.current.cartCount).toBe(4);

    // Update with 0 should remove the item
    act(() => {
      result.current.updateQuantity(cartItemId, 0);
    });
    expect(result.current.cart.length).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('removes item directly via removeFromCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 2);
    });

    const cartItemId = result.current.cart[0].cartItemId;

    act(() => {
      result.current.removeFromCart(cartItemId);
    });

    expect(result.current.cart.length).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('clears all cart items and resets active promo code via clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
      result.current.applyPromoCode('SJFIRST');
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.activePromo).not.toBeNull();

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.activePromo).toBeNull();
  });

  it('applies valid promo code and recalculates discount', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      // Add product (price e.g. 13995)
      result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
    });

    let promoResult;
    act(() => {
      promoResult = result.current.applyPromoCode('SJFIRST');
    });

    expect(promoResult.success).toBe(true);
    expect(result.current.activePromo).toBeDefined();
    expect(result.current.activePromo.code).toBe('SJFIRST');
    expect(result.current.totals.discount).toBeGreaterThan(0);
  });

  it('rejects invalid coupon codes', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let promoResult;
    act(() => {
      promoResult = result.current.applyPromoCode('FAKECODE999');
    });

    expect(promoResult.success).toBe(false);
    expect(result.current.activePromo).toBeNull();
  });

  it('toggles wishlist items properly and checks isInWishlist', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.isInWishlist(shoeProduct.id)).toBe(false);

    // Save to wishlist
    act(() => {
      result.current.toggleWishlist(shoeProduct);
    });

    expect(result.current.isInWishlist(shoeProduct.id)).toBe(true);
    expect(result.current.wishlist.length).toBe(1);

    // Remove from wishlist by toggling again
    act(() => {
      result.current.toggleWishlist(shoeProduct);
    });

    expect(result.current.isInWishlist(shoeProduct.id)).toBe(false);
    expect(result.current.wishlist.length).toBe(0);
  });

  describe('Stock-Aware Boundaries and Removal Regression', () => {
    it('rejects adding variant with 0 stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      let success;
      act(() => {
        // UK 11 has stock: 0 on shoeProduct
        success = result.current.addToCart(shoeProduct, 'UK 11', shoeProduct.colors[0], 1);
      });

      expect(success).toBe(false);
      expect(result.current.cart.length).toBe(0);
    });

    it('enforces exact stock limits across repeated additions', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // UK 8 has stock: 2 on shoeProduct
      let firstAdd;
      act(() => {
        firstAdd = result.current.addToCart(shoeProduct, 'UK 8', shoeProduct.colors[0], 2);
      });
      expect(firstAdd).toBe(true);
      expect(result.current.cart[0].quantity).toBe(2);

      // Attempting to add 1 more when cart already has all 2
      let secondAdd;
      act(() => {
        secondAdd = result.current.addToCart(shoeProduct, 'UK 8', shoeProduct.colors[0], 1);
      });
      expect(secondAdd).toBe(false);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('clamps quantity when requested addition exceeds remaining stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // UK 8 has stock: 2. Request 5 units directly
      let success;
      act(() => {
        success = result.current.addToCart(shoeProduct, 'UK 8', shoeProduct.colors[0], 5);
      });

      expect(success).toBe(true);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('clamps updateQuantity to actual available variant stock instead of hardcoded cap', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(shoeProduct, 'UK 8', shoeProduct.colors[0], 1);
      });

      const cartItemId = result.current.cart[0].cartItemId;

      // Try updating to 10 when stock is 2
      act(() => {
        result.current.updateQuantity(cartItemId, 10);
      });

      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('removes item without triggering React cross-component update warning', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(shoeProduct, 'UK 9', shoeProduct.colors[0], 1);
      });

      const cartItemId = result.current.cart[0].cartItemId;

      act(() => {
        result.current.removeFromCart(cartItemId);
      });

      expect(result.current.cart.length).toBe(0);

      // Verify no React warning was emitted
      const reactWarningCall = consoleErrorSpy.mock.calls.find((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Cannot update a component'))
      );
      expect(reactWarningCall).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });

    it('reconciles pre-existing localStorage cart items on initialization', () => {
      // Pre-seed localStorage with stale/oversized items
      const staleItems = [
        {
          productId: shoeProduct.id,
          size: 'UK 8', // Stock is 2
          quantity: 15, // Excessive
          price: 999, // Stale price
        },
        {
          productId: 'non-existent-product',
          size: 'M',
          quantity: 1,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(staleItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      // Deleted product dropped, excessive quantity clamped to stock (2), price updated
      expect(result.current.cart.length).toBe(1);
      expect(result.current.cart[0].productId).toBe(shoeProduct.id);
      expect(result.current.cart[0].quantity).toBe(2);
      expect(result.current.cart[0].price).toBe(shoeProduct.price);
    });
  });
});
