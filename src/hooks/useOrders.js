import { useState, useCallback, useEffect } from 'react';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import {
  createOrderSecure,
  fetchUserOrders,
  fetchOrderById as fetchOrderByIdFromService,
} from '../lib/supabaseService';

export function useOrders() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lastOrder, setLastOrder] = useState(() => {
    return getFromStorage(STORAGE_KEYS.LAST_ORDER, null);
  });

  // Re-fetch user-scoped orders on mount and whenever authenticated user changes
  useEffect(() => {
    let mounted = true;

    // Isolate lastOrder across user sessions
    setLastOrder((prev) => {
      if (prev && prev.userId && userId && prev.userId !== userId) {
        localStorage.removeItem(STORAGE_KEYS.LAST_ORDER);
        return null;
      }
      return prev;
    });

    fetchUserOrders(userId)
      .then((userOrders) => {
        if (mounted) {
          setOrders(Array.isArray(userOrders) ? userOrders : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[useOrders] Error fetching user orders:', err);
        if (mounted) {
          setOrders([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  /**
   * Trusted order submission: submits only item identifiers, quantities,
   * shipping, payment, and promo details. Prices and stock are validated server-side.
   */
  const createOrder = useCallback(
    async (orderData) => {
      if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Shopping bag is empty.');
      }

      const idempotencyKey =
        orderData.idempotencyKey ||
        `idem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        idempotency_key: idempotencyKey,
        items: orderData.items.map((i) => ({
          product_id: i.productId || i.id,
          size: i.size,
          color_name: i.color?.name || 'Standard',
          quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
        })),
        shipping_address: orderData.shippingAddress || {},
        payment_method: orderData.paymentMethod || 'COD',
        promo_code: orderData.activePromo?.code || null,
        user_id: userId,
      };

      const result = await createOrderSecure(payload);
      if (!result || !result.order) {
        throw new Error('Order creation did not return a valid order.');
      }

      const completedOrder = result.order;

      // Update state and storage
      setOrders((prev) => [completedOrder, ...prev.filter((o) => o.orderId !== completedOrder.orderId)]);
      setLastOrder(completedOrder);
      setToStorage(STORAGE_KEYS.LAST_ORDER, completedOrder);

      return completedOrder;
    },
    [userId]
  );

  const getOrderById = useCallback(
    async (id, guestAccessToken = null) => {
      if (!id) return null;
      if (lastOrder && lastOrder.orderId === id) {
        // Enforce ownership check: authenticated user must own it, or guest session
        if (userId) {
          if (lastOrder.userId === userId) return lastOrder;
        } else {
          // Guest session: only allow guest orders
          if (!lastOrder.userId || lastOrder.userId === 'demo_guest') {
            return lastOrder;
          }
        }
      }

      const inMemory = orders.find((o) => o.orderId === id);
      if (inMemory) return inMemory;

      // Query database/service with ownership/guest-token check
      return await fetchOrderByIdFromService(id, userId, guestAccessToken);
    },
    [orders, lastOrder, userId]
  );

  return {
    orders,
    loading,
    lastOrder,
    createOrder,
    getOrderById,
    refreshOrders: () => fetchUserOrders(userId).then(setOrders),
  };
}
