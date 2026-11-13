import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '../utils/storage';
import { calculateOrderTotals } from '../utils/formatters';
import { PROMO_CODES } from '../data/products';
import { useToast } from './ToastContext';
import { reconcileCart, getLocalCatalog } from '../utils/cartReconciliation';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { showToast } = useToast();

  // Load initial cart safely with catalog reconciliation
  const [cart, setCart] = useState(() => {
    const saved = getFromStorage(STORAGE_KEYS.CART, []);
    return reconcileCart(saved);
  });

  // Load wishlist safely
  const [wishlist, setWishlist] = useState(() => {
    const saved = getFromStorage(STORAGE_KEYS.WISHLIST, []);
    return Array.isArray(saved) ? saved : [];
  });

  // Active Promo Code
  const [activePromo, setActivePromo] = useState(() => {
    return getFromStorage(STORAGE_KEYS.PROMO, null);
  });

  // Persist cart changes
  useEffect(() => {
    setToStorage(STORAGE_KEYS.CART, cart);
  }, [cart]);

  // Persist wishlist changes
  useEffect(() => {
    setToStorage(STORAGE_KEYS.WISHLIST, wishlist);
  }, [wishlist]);

  // Persist promo changes
  useEffect(() => {
    if (activePromo) {
      setToStorage(STORAGE_KEYS.PROMO, activePromo);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROMO);
    }
  }, [activePromo]);

  // Calculate totals dynamically
  const totals = useMemo(() => {
    let discountPercent = 0;
    let promoDiscount = 0;

    if (activePromo) {
      if (activePromo.type === 'percentage') {
        discountPercent = activePromo.value;
      } else if (activePromo.type === 'flat') {
        promoDiscount = activePromo.value;
      }
    }

    const calculated = calculateOrderTotals(cart, discountPercent, promoDiscount);

    // If promo is free shipping
    if (activePromo?.type === 'shipping') {
      calculated.shipping = 0;
      calculated.total = Math.max(0, calculated.subtotal - calculated.discount);
      calculated.isFreeShipping = true;
    }

    return calculated;
  }, [cart, activePromo]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cart]);

  // Cart operations
  // Note: Client-side stock capping prevents accidental UI over-ordering,
  // but trusted server/database validation during checkout is required for atomic concurrency.
  const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
    if (!product) return false;

    // For accessories and watches with only One Size, auto-assign if not provided
    let finalSize = selectedSize;
    if (!finalSize) {
      if (
        product.category === 'Watches' ||
        product.category === 'Accessories' ||
        (product.sizes?.length === 1 && product.sizes[0].size.includes('One Size'))
      ) {
        finalSize = product.sizes?.[0]?.size || 'One Size (Standard)';
      } else if (product.category === 'Clothing') {
        showToast('Please select an apparel size (XS, S, M, L, XL)', 'error');
        return false;
      } else {
        showToast('Please select a shoe size (UK sizing)', 'error');
        return false;
      }
    }

    // Determine variant and available stock
    // Policy: missing variant or invalid stock count is treated as 0 (unavailable/safe boundary)
    const variant = product.sizes?.find((s) => s.size === finalSize);
    const availableStock =
      variant && typeof variant.stock === 'number' && !isNaN(variant.stock)
        ? Math.max(0, variant.stock)
        : 0;

    if (availableStock <= 0) {
      showToast(`${product.name} (${finalSize}) is currently out of stock`, 'error');
      return false;
    }

    const requestedQty = Math.floor(Number(quantity));
    if (isNaN(requestedQty) || requestedQty <= 0) {
      return false;
    }

    const finalColor = selectedColor || product.colors?.[0] || { name: 'Standard' };
    const cartItemId = `${product.id}__${finalSize}__${finalColor.name}`;

    const existingItem = cart.find((item) => item.cartItemId === cartItemId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (currentQtyInCart >= availableStock) {
      showToast(`Cannot add more. You have all ${availableStock} available units in your bag.`, 'error');
      return false;
    }

    const allowedAddQty = Math.min(requestedQty, availableStock - currentQtyInCart);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const prevQty = updated[existingIndex].quantity;
        const clampedQty = Math.min(availableStock, prevQty + allowedAddQty);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: clampedQty,
          maxStock: availableStock,
        };
        return updated;
      }

      // Add new item
      return [
        ...prevCart,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          tagline: product.tagline || '',
          price: Number(product.price) || 0,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
          image: product.images?.[0] || '',
          size: finalSize,
          color: finalColor,
          category: product.category,
          subcategory: product.subcategory || '',
          audience: product.audience || product.gender || 'Unisex',
          quantity: allowedAddQty,
          maxStock: availableStock,
        },
      ];
    });

    if (allowedAddQty < requestedQty) {
      showToast(`Added ${allowedAddQty} unit(s). Maximum available stock of ${availableStock} reached.`, 'info');
    } else {
      showToast(`Added ${product.name} (${finalSize}) to Bag`, 'success');
    }
    return true;
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    const requestedQty = Math.floor(Number(newQuantity));
    if (isNaN(requestedQty) || requestedQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    // Look up stock from current catalog
    const catalog = getLocalCatalog();
    const product = catalog.find((p) => p.id === item.productId);
    const variant = product?.sizes?.find((s) => s.size === item.size);
    const availableStock =
      variant && typeof variant.stock === 'number' && !isNaN(variant.stock)
        ? Math.max(0, variant.stock)
        : (typeof item.maxStock === 'number' ? item.maxStock : 0);

    if (availableStock <= 0) {
      removeFromCart(cartItemId);
      showToast(`${item.name} (${item.size}) is no longer in stock`, 'error');
      return;
    }

    const clampedQty = Math.min(requestedQty, availableStock);
    if (requestedQty > availableStock) {
      showToast(`Only ${availableStock} units available for ${item.name} (${item.size})`, 'info');
    }

    setCart((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: clampedQty, maxStock: availableStock }
          : i
      )
    );
  };

  // Pure state updater without cross-component state updates inside updater callbacks
  const removeFromCart = (cartItemId) => {
    const itemToRemove = cart.find((i) => i.cartItemId === cartItemId);
    if (!itemToRemove) return;

    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    showToast(`Removed ${itemToRemove.name} from Bag`, 'info');
  };

  const clearCart = () => {
    setCart([]);
    setActivePromo(null);
  };

  // Promo operations
  const applyPromoCode = (inputCode) => {
    const code = inputCode?.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a promo code', 'error');
      return { success: false, message: 'Code cannot be empty' };
    }

    const promo = PROMO_CODES[code];
    if (!promo) {
      showToast(`Promo code "${code}" is invalid`, 'error');
      return { success: false, message: 'Invalid coupon code' };
    }

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      const msg = `Code requires minimum order of ₹${promo.minSubtotal.toLocaleString('en-IN')}`;
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    setActivePromo(promo);
    showToast(`Coupon "${code}" applied: ${promo.description}`, 'success');
    return { success: true, message: promo.description };
  };

  const removePromoCode = () => {
    setActivePromo(null);
    showToast('Promo code removed', 'info');
  };

  // Wishlist operations
  const toggleWishlist = (product) => {
    if (!product) return;
    const exists = wishlist.some((p) => p.id === product.id);
    setWishlist((prev) =>
      exists ? prev.filter((p) => p.id !== product.id) : [...prev, product]
    );
    if (exists) {
      showToast('Removed from Wishlist', 'info');
    } else {
      showToast('Saved to Wishlist', 'success');
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => p.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        totals,
        activePromo,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyPromoCode,
        removePromoCode,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
