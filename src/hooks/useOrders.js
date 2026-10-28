import { useState, useCallback } from 'react';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '../utils/storage';
import { generateOrderId, getEstimatedDeliveryDate, formatDate } from '../utils/formatters';

export function useOrders() {
  const [orders, setOrders] = useState(() => {
    const saved = getFromStorage(STORAGE_KEYS.ORDERS, []);
    return Array.isArray(saved) ? saved : [];
  });

  const [lastOrder, setLastOrder] = useState(() => {
    return getFromStorage(STORAGE_KEYS.LAST_ORDER, null);
  });

  const createOrder = useCallback((orderData) => {
    const orderId = generateOrderId();
    const orderDate = formatDate(new Date());
    const estimatedDelivery = getEstimatedDeliveryDate(4);

    const completedOrder = {
      orderId,
      createdAt: new Date().toISOString(),
      orderDate,
      estimatedDelivery,
      status: 'Confirmed',
      items: orderData.items || [],
      shippingAddress: orderData.shippingAddress || {},
      paymentDetails: {
        method: orderData.paymentMethod || 'COD',
        status: orderData.paymentMethod === 'COD' ? 'Pending on Delivery' : 'Simulated Paid',
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
      pricing: {
        subtotal: orderData.totals?.subtotal || 0,
        discount: orderData.totals?.discount || 0,
        shipping: orderData.totals?.shipping || 0,
        total: orderData.totals?.total || 0,
        promoCode: orderData.activePromo?.code || null,
      },
    };

    // Update state and storage
    setOrders((prev) => {
      const updated = [completedOrder, ...prev];
      setToStorage(STORAGE_KEYS.ORDERS, updated);
      return updated;
    });

    setLastOrder(completedOrder);
    setToStorage(STORAGE_KEYS.LAST_ORDER, completedOrder);

    return completedOrder;
  }, []);

  const getOrderById = useCallback(
    (id) => {
      if (!id) return null;
      if (lastOrder && lastOrder.orderId === id) return lastOrder;
      return orders.find((o) => o.orderId === id) || null;
    },
    [orders, lastOrder]
  );

  return {
    orders,
    lastOrder,
    createOrder,
    getOrderById,
  };
}
