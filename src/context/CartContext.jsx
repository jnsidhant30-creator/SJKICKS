import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '../utils/storage';
import { calculateOrderTotals } from '../utils/formatters';
import { PROMO_CODES } from '../data/products';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { showToast } = useToast();

  // Load initial cart safely
  const [cart, setCart] = useState(() => {
    const saved = getFromStorage(STORAGE_KEYS.CART, []);
    return Array.isArray(saved) ? saved : [];
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

    const finalColor = selectedColor || product.colors?.[0] || { name: 'Standard' };
    const cartItemId = `${product.id}__${finalSize}__${finalColor.name}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        // Increment quantity
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }

      // Add new item
      return [
        ...prevCart,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          tagline: product.tagline,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.images?.[0] || '',
          size: finalSize,
          color: finalColor,
          category: product.category,
          subcategory: product.subcategory,
          audience: product.audience || product.gender,
          quantity: Math.max(1, quantity),
        },
      ];
    });

    showToast(`Added ${product.name} (${finalSize}) to Bag`, 'success');
    return true;
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.min(10, newQuantity) } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => {
      const itemToRemove = prev.find((i) => i.cartItemId === cartItemId);
      if (itemToRemove) {
        showToast(`Removed ${itemToRemove.name} from Bag`, 'info');
      }
      return prev.filter((i) => i.cartItemId !== cartItemId);
    });
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
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed from Wishlist`, 'info');
        return prev.filter((p) => p.id !== product.id);
      } else {
        showToast(`Saved to Wishlist`, 'success');
        return [...prev, product];
      }
    });
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
