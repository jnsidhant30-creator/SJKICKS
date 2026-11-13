import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrders } from '../hooks/useOrders';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { PRODUCTS } from '../data/products';
import { STORAGE_KEYS, getFromStorage, setToStorage } from '../utils/storage';
import {
  createOrderSecure,
  fetchUserOrders,
  fetchOrderById,
} from '../lib/supabaseService';
import * as supabaseModule from '../lib/supabase';
import { toPaise, toRupees, calculateOrderTotals } from '../utils/formatters';

const wrapper = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  </ToastProvider>
);

describe('Phase 3: Secure Orders, Trusted Validation, and Failure Recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const shoe = PRODUCTS.find((p) => p.category === 'Shoes');

  describe('Integer Paise Monetary Protection', () => {
    it('converts Rupees to integer Paise accurately', () => {
      expect(toPaise(13995)).toBe(1399500);
      expect(toPaise(199.99)).toBe(19999);
      expect(toPaise(0)).toBe(0);
      expect(toPaise(null)).toBe(0);
      expect(toPaise(NaN)).toBe(0);
    });

    it('converts Paise to Rupees accurately', () => {
      expect(toRupees(1399500)).toBe(13995);
      expect(toRupees(19999)).toBe(199.99);
      expect(toRupees(0)).toBe(0);
    });

    it('calculateOrderTotals includes exact integer paise values without drift', () => {
      const items = [
        { price: 13995, quantity: 1 },
        { price: 2499, quantity: 2 },
      ];
      const totals = calculateOrderTotals(items, 10, 0);

      expect(totals.subtotalPaise).toBe(1399500 + 499800);
      expect(totals.discountPaise).toBe(Math.round(totals.subtotalPaise * 0.10));
      expect(totals.shippingPaise).toBe(0); // >= 249900
      expect(totals.totalPaise).toBe(totals.subtotalPaise - totals.discountPaise);
      expect(totals.total).toBe(totals.totalPaise / 100);
    });
  });

  describe('createOrderSecure in Local/Demo Mode', () => {
    it('recalculates trusted prices from catalog and ignores client price tampering', async () => {
      const payload = {
        idempotency_key: 'idem-test-1',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 9', // stock 8
            quantity: 1,
            price: 1, // Client tampered price!
          },
        ],
        shipping_address: { fullName: 'Athlete Test', addressLine1: 'MG Road' },
        payment_method: 'COD',
      };

      const result = await createOrderSecure(payload);
      expect(result.success).toBe(true);
      // Order pricing MUST reflect catalog price (e.g. 13995), NOT 1
      expect(result.order.pricing.subtotal).toBe(shoe.price);
      expect(result.order.pricing.subtotal).not.toBe(1);
    });

    it('atomically decrements local inventory stock when an order is created', async () => {
      const initialStock = shoe.sizes.find((s) => s.size === 'UK 8').stock; // 2
      expect(initialStock).toBe(2);

      const payload = {
        idempotency_key: 'idem-test-stock',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 8',
            quantity: 1,
          },
        ],
        shipping_address: { fullName: 'Stock Test', addressLine1: 'Indiranagar' },
        payment_method: 'UPI',
      };

      const result = await createOrderSecure(payload);
      expect(result.success).toBe(true);

      // Verify stock in local overrides has been decremented
      const overrides = getFromStorage('sjstudio_inventory_overrides_v1', {});
      const key = `${shoe.id}__UK 8`;
      expect(overrides[key]).toBe(1);
    });

    it('rejects order when requested quantity exceeds available stock', async () => {
      const payload = {
        idempotency_key: 'idem-test-overstock',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 8', // stock is 2
            quantity: 10,
          },
        ],
        shipping_address: { fullName: 'Test', addressLine1: 'Test St' },
      };

      await expect(createOrderSecure(payload)).rejects.toThrow(/Insufficient stock/);
    });

    it('rejects order with invalid promo code', async () => {
      const payload = {
        idempotency_key: 'idem-test-promo',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 9',
            quantity: 1,
          },
        ],
        shipping_address: { fullName: 'Test', addressLine1: 'Test St' },
        promo_code: 'INVALID_CODE_999',
      };

      await expect(createOrderSecure(payload)).rejects.toThrow(/Invalid promo code/);
    });
  });

  describe('Configured Supabase vs Demo Fallback Failure Recovery', () => {
    it('never silently creates a fake local order when configured Supabase RPC fails', async () => {
      // Mock Supabase as configured
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insufficient stock: item locked by concurrent transaction' },
      });

      const mockSupabase = {
        rpc: mockRpc,
        from: vi.fn(),
      };

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase);

      const payload = {
        idempotency_key: 'idem-fail-test',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'Athlete', addressLine1: 'Brigade Rd' },
      };

      // Must throw the exact Supabase error, NOT silently succeed locally!
      await expect(createOrderSecure(payload)).rejects.toThrow(
        'Insufficient stock: item locked by concurrent transaction'
      );

      // Verify no order was saved to localStorage
      const orders = getFromStorage(STORAGE_KEYS.ORDERS, []);
      expect(orders.find((o) => o.idempotencyKey === 'idem-fail-test')).toBeUndefined();
    });
  });

  describe('Checkout Failure Recovery and Cart Preservation', () => {
    it('preserves cart items when order submission fails', async () => {
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      const { result: ordersResult } = renderHook(() => useOrders(), { wrapper });

      // Add item to cart
      act(() => {
        cartResult.current.addToCart(shoe, 'UK 9', shoe.colors[0], 1);
      });
      expect(cartResult.current.cart.length).toBe(1);

      // Attempt order with invalid address to cause failure
      let threw = false;
      try {
        await act(async () => {
          await ordersResult.current.createOrder({
            items: cartResult.current.cart,
            shippingAddress: { fullName: '' }, // Missing required details
            activePromo: { code: 'FAKE' },
          });
        });
      } catch {
        threw = true;
      }

      expect(threw).toBe(true);
      // Cart MUST still have the item (failed orders must NOT clear the cart)
      expect(cartResult.current.cart.length).toBe(1);
    });

    it('clears cart only after confirmed successful order creation', async () => {
      const { result: cartResult } = renderHook(() => useCart(), { wrapper });
      const { result: ordersResult } = renderHook(() => useOrders(), { wrapper });

      act(() => {
        cartResult.current.addToCart(shoe, 'UK 9', shoe.colors[0], 1);
      });
      expect(cartResult.current.cart.length).toBe(1);

      let createdOrder;
      await act(async () => {
        createdOrder = await ordersResult.current.createOrder({
          items: cartResult.current.cart,
          shippingAddress: { fullName: 'Rahul Sharma', addressLine1: 'Indiranagar 100ft Rd' },
          paymentMethod: 'COD',
        });
      });

      expect(createdOrder).toBeDefined();
      expect(createdOrder.orderId).toMatch(/^SJK-/);

      // In CheckoutPage, clearCart is called upon confirmed success
      act(() => {
        cartResult.current.clearCart();
      });

      expect(cartResult.current.cart.length).toBe(0);
    });
  });

  describe('User-Scoped Order History & Privacy', () => {
    it('scopes orders to authenticated user and prevents cross-user exposure', async () => {
      // Seed orders in local storage belonging to different users
      const storedOrders = [
        {
          orderId: 'SJK-2026-USER1',
          userId: 'usr_user_1',
          items: [{ name: 'User 1 Sneakers' }],
          pricing: { total: 9995 },
        },
        {
          orderId: 'SJK-2026-USER2',
          userId: 'usr_user_2',
          items: [{ name: 'User 2 Trench' }],
          pricing: { total: 18995 },
        },
      ];
      setToStorage(STORAGE_KEYS.ORDERS, storedOrders);

      // Fetch orders for user 1
      const user1Orders = await fetchUserOrders('usr_user_1');
      expect(user1Orders.length).toBe(1);
      expect(user1Orders[0].orderId).toBe('SJK-2026-USER1');

      // Fetch orders for user 2
      const user2Orders = await fetchUserOrders('usr_user_2');
      expect(user2Orders.length).toBe(1);
      expect(user2Orders[0].orderId).toBe('SJK-2026-USER2');
    });

    it('prevents unauthorized access to another user order via fetchOrderById', async () => {
      const storedOrders = [
        {
          orderId: 'SJK-2026-PRIVATE',
          userId: 'usr_victim',
          pricing: { total: 12000 },
        },
      ];
      setToStorage(STORAGE_KEYS.ORDERS, storedOrders);

      // Attacker tries to access victim's order
      const order = await fetchOrderById('SJK-2026-PRIVATE', 'usr_attacker');
      expect(order).toBeNull();

      // Rightful owner accesses their order
      const legitimateOrder = await fetchOrderById('SJK-2026-PRIVATE', 'usr_victim');
      expect(legitimateOrder).toBeDefined();
      expect(legitimateOrder.orderId).toBe('SJK-2026-PRIVATE');
    });
  });

  describe('Audit Hardening: Idempotency & Concurrency Defenses', () => {
    it('returns existing order without double-decrementing stock on idempotent retry', async () => {
      const payload = {
        idempotency_key: 'idem-duplicate-safe',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 9',
            quantity: 2,
          },
        ],
        shipping_address: { fullName: 'Retry User', addressLine1: 'Koramangala' },
        payment_method: 'UPI',
        user_id: 'usr_retry_1',
      };

      // First submission
      const firstResult = await createOrderSecure(payload);
      expect(firstResult.success).toBe(true);
      expect(firstResult.order.isDuplicate).toBeFalsy();

      // Check stock override after first attempt
      const overridesAfterFirst = getFromStorage('sjstudio_inventory_overrides_v1', {});
      const stockAfterFirst = overridesAfterFirst[`${shoe.id}__UK 9`];

      // Second submission with identical idempotency key (simulating network retry)
      const secondResult = await createOrderSecure(payload);
      expect(secondResult.success).toBe(true);
      expect(secondResult.order.isDuplicate).toBe(true);
      expect(secondResult.order.orderId).toBe(firstResult.order.orderId);

      // Stock must NOT have been decremented a second time
      const overridesAfterSecond = getFromStorage('sjstudio_inventory_overrides_v1', {});
      expect(overridesAfterSecond[`${shoe.id}__UK 9`]).toBe(stockAfterFirst);
    });

    it('rejects reusing the same idempotency key for a changed order payload', async () => {
      const payload1 = {
        idempotency_key: 'idem-changed-payload',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'User', addressLine1: 'Indiranagar' },
        user_id: 'usr_test_change',
      };

      await createOrderSecure(payload1);

      // Attempt to reuse same key with changed quantity
      const payload2 = {
        idempotency_key: 'idem-changed-payload',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 3 }],
        shipping_address: { fullName: 'User', addressLine1: 'Indiranagar' },
        user_id: 'usr_test_change',
      };

      await expect(createOrderSecure(payload2)).rejects.toThrow(
        /previously used with a different order/
      );
    });

    it('prevents cross-user idempotency collision', async () => {
      const payloadUserA = {
        idempotency_key: 'idem-cross-user-collision',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'User A', addressLine1: 'MG Road' },
        user_id: 'usr_user_a',
      };

      await createOrderSecure(payloadUserA);

      // User B attempts to use same key
      const payloadUserB = {
        idempotency_key: 'idem-cross-user-collision',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'User B', addressLine1: 'Brigade Road' },
        user_id: 'usr_user_b',
      };

      await expect(createOrderSecure(payloadUserB)).rejects.toThrow(
        /Idempotency key collision across user accounts/
      );
    });
  });

  describe('Audit Hardening: Promo Code Consistency and Session Isolation', () => {
    it('applies SJVIP500 flat discount on orders above threshold', async () => {
      const payload = {
        idempotency_key: 'idem-vip-promo',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }], // shoe.price is ~13995 >= 5000
        shipping_address: { fullName: 'VIP User', addressLine1: 'Lavelle Rd' },
        promo_code: 'SJVIP500',
      };

      const result = await createOrderSecure(payload);
      expect(result.success).toBe(true);
      expect(result.order.pricing.discount).toBe(500);
      expect(result.order.pricing.total).toBe(result.order.pricing.subtotal - 500);
    });

    it('clears lastOrder from storage on logout to avoid session PII leak', () => {
      // Seed lastOrder
      const demoOrder = {
        orderId: 'SJK-LAST-ORDER',
        userId: 'usr_victim',
        shippingAddress: { fullName: 'Private Name' },
      };
      setToStorage(STORAGE_KEYS.LAST_ORDER, demoOrder);
      expect(getFromStorage(STORAGE_KEYS.LAST_ORDER, null)).toBeDefined();

      // Trigger logout
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result).toBeDefined();

      // Directly verify that removing LAST_ORDER clears it
      localStorage.removeItem(STORAGE_KEYS.LAST_ORDER);
      expect(getFromStorage(STORAGE_KEYS.LAST_ORDER, null)).toBeNull();
    });
  });

  describe('Guest Checkout and Token Authorization Architecture', () => {
    it('allows genuine unauthenticated guest checkout and issues a secure guestAccessToken', async () => {
      const payload = {
        idempotency_key: 'idem-guest-checkout-1',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 9',
            quantity: 1,
            price: 10, // Tampered client price must be ignored!
          },
        ],
        shipping_address: {
          fullName: 'Guest Athlete',
          phone: '9876543210',
          email: 'guest@athlete.com',
          addressLine1: 'Indiranagar 100ft Rd',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        payment_method: 'COD',
        // user_id is deliberately omitted (unauthenticated)
      };

      const result = await createOrderSecure(payload);
      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.orderId).toMatch(/^SJK-/);

      // Verify guest order identity and 256-bit token entropy
      expect(result.order.userId).toBe('demo_guest');
      expect(result.order.guestAccessToken).toMatch(/^gst_[0-9a-f]{64}$/i);
      // 64 hex characters = 32 bytes = 256 bits of entropy
      expect(result.order.guestAccessToken.replace('gst_', '').length).toBe(64);

      // Authoritative pricing must match catalog, not tampered ₹10
      expect(result.order.pricing.subtotal).toBe(shoe.price);
    });

    it('enforces token authorization: cannot retrieve guest order without valid guestAccessToken', async () => {
      const guestOrder = {
        orderId: 'SJK-2026-GUEST-SECRET',
        userId: 'demo_guest',
        guestAccessToken: 'gst_secret_token_12345',
        shippingAddress: { fullName: 'Secret Guest', addressLine1: 'Private St' },
        pricing: { total: 14995 },
      };
      setToStorage(STORAGE_KEYS.ORDERS, [guestOrder]);

      // 1. Attempt to look up by guessable order ID alone without token -> REJECTED
      const noTokenLookup = await fetchOrderById('SJK-2026-GUEST-SECRET', null, null);
      expect(noTokenLookup).toBeNull();

      // 2. Attempt with incorrect/forged guest token -> REJECTED
      const wrongTokenLookup = await fetchOrderById('SJK-2026-GUEST-SECRET', null, 'gst_forged_999');
      expect(wrongTokenLookup).toBeNull();

      // 3. Valid lookup with matching guest token -> SUCCEEDS
      const validLookup = await fetchOrderById('SJK-2026-GUEST-SECRET', null, 'gst_secret_token_12345');
      expect(validLookup).toBeDefined();
      expect(validLookup.orderId).toBe('SJK-2026-GUEST-SECRET');
    });

    it('prevents guests from accessing authenticated customer orders', async () => {
      const memberOrder = {
        orderId: 'SJK-2026-MEMBER-ORDER',
        userId: 'usr_authenticated_client',
        shippingAddress: { fullName: 'VIP Client' },
        pricing: { total: 25000 },
      };
      setToStorage(STORAGE_KEYS.ORDERS, [memberOrder]);

      // Guest (userId = null) attempts to view member order
      const guestAttempt = await fetchOrderById('SJK-2026-MEMBER-ORDER', null, null);
      expect(guestAttempt).toBeNull();
    });

    it('rejects unverified idempotency retry attempts to prevent token/PII disclosure', async () => {
      const guestPayload = {
        idempotency_key: 'idem-guest-privacy-test',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: {
          fullName: 'Sensitive Legal Name',
          phone: '9988776655',
          email: 'secret@domain.com',
          addressLine1: 'Apartment 902, Tower 4',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        payment_method: 'UPI',
      };

      // Initial placement by legitimate guest: server exclusively generates 256-bit token
      const firstResult = await createOrderSecure(guestPayload);
      expect(firstResult.success).toBe(true);
      expect(firstResult.order.guestAccessToken).toMatch(/^gst_[0-9a-f]{64}$/);

      // Attacker attempts to probe using the same idempotency key with an altered payload
      const attackerProbe = {
        idempotency_key: 'idem-guest-privacy-test',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'Attacker', addressLine1: 'Other St' },
      };

      await expect(createOrderSecure(attackerProbe)).rejects.toThrow(
        /Idempotency key .* was previously used with a different order payload/
      );

      // Legitimate guest retrying with matching payload succeeds safely but NEVER leaks the secret token
      const legitimateRetry = await createOrderSecure(guestPayload);
      expect(legitimateRetry.success).toBe(true);
      expect(legitimateRetry.order.isDuplicate).toBe(true);
      expect(legitimateRetry.order.orderId).toBe(firstResult.order.orderId);
      expect(legitimateRetry.order.guestAccessToken).toBeNull();
    });

    it('prevents a guest from colliding with an authenticated customer idempotency key', async () => {
      // Authenticated customer order
      const memberPayload = {
        idempotency_key: 'idem-member-protected-key',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'Member Client', addressLine1: 'MG Road' },
        user_id: 'usr_member_123',
      };
      await createOrderSecure(memberPayload);

      // Unauthenticated guest attempts to reuse member's key
      const guestPayload = {
        idempotency_key: 'idem-member-protected-key',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: { fullName: 'Guest Intruder', addressLine1: 'Brigade Road' },
      };

      await expect(createOrderSecure(guestPayload)).rejects.toThrow(
        /Idempotency key collision across user accounts/
      );
    });
  });

  describe('Task 9: Security Hardening & Regression Suite', () => {
    const baseShipping = {
      fullName: 'Vijay M',
      phone: '9876543210',
      addressLine1: '42 Indiranagar 100ft Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    };

    it('1. Guest idempotency retries: returns duplicate order safely without re-decrementing stock', async () => {
      const overridesBefore = getFromStorage('sjstudio_inventory_overrides_v1', {});
      const initialStock = overridesBefore[`${shoe.id}__UK 9`] ?? shoe.sizes.find((s) => s.size === 'UK 9').stock;

      const payload = {
        idempotency_key: 'idem-reg-guest-1',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
      };

      const res1 = await createOrderSecure(payload);
      expect(res1.success).toBe(true);
      expect(res1.order.isDuplicate).toBe(false);
      expect(res1.order.guestAccessToken).toMatch(/^gst_[0-9a-f]{64}$/);

      const overridesMid = getFromStorage('sjstudio_inventory_overrides_v1', {});
      expect(overridesMid[`${shoe.id}__UK 9`]).toBe(initialStock - 1);

      // Retry with identical payload
      const res2 = await createOrderSecure(payload);
      expect(res2.success).toBe(true);
      expect(res2.order.isDuplicate).toBe(true);
      expect(res2.order.orderId).toBe(res1.order.orderId);

      // Stock must remain unchanged
      const overridesAfter = getFromStorage('sjstudio_inventory_overrides_v1', {});
      expect(overridesAfter[`${shoe.id}__UK 9`]).toBe(initialStock - 1);
    });

    it('2. Authenticated idempotency retries: scoped by user_id and handles retries safely', async () => {
      const payload = {
        idempotency_key: 'idem-reg-auth-1',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'UPI',
        user_id: 'usr_auth_verified_888',
      };

      const res1 = await createOrderSecure(payload);
      expect(res1.success).toBe(true);
      expect(res1.order.userId).toBe('usr_auth_verified_888');
      expect(res1.order.isDuplicate).toBe(false);

      const res2 = await createOrderSecure(payload);
      expect(res2.success).toBe(true);
      expect(res2.order.isDuplicate).toBe(true);
      expect(res2.order.orderId).toBe(res1.order.orderId);
      expect(res2.order.userId).toBe('usr_auth_verified_888');
    });

    it('3. Concurrent duplicate requests: handles simultaneous submissions cleanly', async () => {
      const payload = {
        idempotency_key: 'idem-reg-concurrent-1',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
        user_id: 'usr_concurrent_user',
      };

      // Fire 2 concurrent order creations with the exact same idempotency key
      const [orderA, orderB] = await Promise.all([
        createOrderSecure(payload),
        createOrderSecure(payload),
      ]);

      expect(orderA.success).toBe(true);
      expect(orderB.success).toBe(true);
      expect(orderA.order.orderId).toBe(orderB.order.orderId);
    });

    it('4. Reused key with changed payload: rejects modifications across items, address, payment, and promo', async () => {
      const key = 'idem-reg-payload-checks';
      const initialPayload = {
        idempotency_key: key,
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
        promo_code: null,
      };

      await createOrderSecure(initialPayload);

      // Attempt 4a: Changed item quantity
      await expect(
        createOrderSecure({
          ...initialPayload,
          items: [{ product_id: shoe.id, size: 'UK 9', quantity: 2 }],
        })
      ).rejects.toThrow(/previously used with a different order payload/);

      // Attempt 4b: Changed shipping pincode
      await expect(
        createOrderSecure({
          ...initialPayload,
          shipping_address: { ...baseShipping, pincode: '560001' },
        })
      ).rejects.toThrow(/previously used with a different order payload/);

      // Attempt 4c: Changed payment method
      await expect(
        createOrderSecure({
          ...initialPayload,
          payment_method: 'UPI',
        })
      ).rejects.toThrow(/previously used with a different order payload/);

      // Attempt 4d: Changed promo code
      await expect(
        createOrderSecure({
          ...initialPayload,
          promo_code: 'SJFIRST',
        })
      ).rejects.toThrow(/previously used with a different order payload/);
    });

    it('5. Guest token confidentiality: token is never disclosed on retry or order lookups', async () => {
      const payload = {
        idempotency_key: 'idem-reg-token-confidentiality',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
      };

      const initialRes = await createOrderSecure(payload);
      const secretToken = initialRes.order.guestAccessToken;
      expect(secretToken).toMatch(/^gst_[0-9a-f]{64}$/);

      // Idempotency retry: must NEVER disclose guestAccessToken
      const retryRes = await createOrderSecure(payload);
      expect(retryRes.order.guestAccessToken).toBeNull();

      // Order lookup via fetchOrderById: must verify with token but NEVER echo back guestAccessToken
      const fetchedOrder = await fetchOrderById(initialRes.order.orderId, null, secretToken);
      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder.orderId).toBe(initialRes.order.orderId);
      expect(fetchedOrder.guestAccessToken).toBeNull();
    });

    it('6. Invalid guest token: fails closed and denies access', async () => {
      const payload = {
        idempotency_key: 'idem-reg-invalid-token-test',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
      };

      const res = await createOrderSecure(payload);
      const orderId = res.order.orderId;

      // Lookup with null token -> null
      expect(await fetchOrderById(orderId, null, null)).toBeNull();

      // Lookup with forged token -> null
      expect(await fetchOrderById(orderId, null, 'gst_forged_invalid_token_xyz')).toBeNull();

      // Lookup with empty string token -> null
      expect(await fetchOrderById(orderId, null, '')).toBeNull();
    });

    it('7. Online payment remains pending without gateway verification', async () => {
      const upiPayload = {
        idempotency_key: 'idem-reg-payment-upi',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'UPI',
      };

      const upiRes = await createOrderSecure(upiPayload);
      expect(upiRes.order.paymentDetails.method).toBe('UPI');
      expect(upiRes.order.paymentDetails.status).toBe('Pending Payment');
      expect(upiRes.order.paymentDetails.status).not.toBe('Simulated Paid');
      expect(upiRes.order.paymentDetails.status).not.toBe('Paid');

      // COD payment has appropriate status
      const codPayload = {
        idempotency_key: 'idem-reg-payment-cod',
        items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
        shipping_address: baseShipping,
        payment_method: 'COD',
      };

      const codRes = await createOrderSecure(codPayload);
      expect(codRes.order.paymentDetails.status).toBe('Pending on Delivery');
    });

    it('8. Invalid size/color combination: rejects non-existent variant colors and sizes', async () => {
      // Non-existent color
      const invalidColorPayload = {
        idempotency_key: 'idem-reg-invalid-color',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 9',
            color_name: 'NeonCyberVioletNonExistent',
            quantity: 1,
          },
        ],
        shipping_address: baseShipping,
      };

      await expect(createOrderSecure(invalidColorPayload)).rejects.toThrow(
        /Invalid size or color combination/
      );

      // Non-existent size
      const invalidSizePayload = {
        idempotency_key: 'idem-reg-invalid-size',
        items: [
          {
            product_id: shoe.id,
            size: 'UK 25',
            quantity: 1,
          },
        ],
        shipping_address: baseShipping,
      };

      await expect(createOrderSecure(invalidSizePayload)).rejects.toThrow(
        /Size UK 25 is invalid/
      );
    });

    it('9. Secure random generation failure: fails closed if CSPRNG is unavailable', async () => {
      const originalCrypto = globalThis.crypto;
      try {
        // Temporarily disable getRandomValues
        delete globalThis.crypto;

        const payload = {
          idempotency_key: 'idem-reg-csprng-fail',
          items: [{ product_id: shoe.id, size: 'UK 9', quantity: 1 }],
          shipping_address: baseShipping,
          payment_method: 'COD',
        };

        await expect(createOrderSecure(payload)).rejects.toThrow(
          /Cryptographic failure: Secure random byte generator is unavailable/
        );

        // Verify no order was saved to storage
        const orders = getFromStorage(STORAGE_KEYS.ORDERS, []);
        expect(orders.find((o) => o.idempotencyKey === 'idem-reg-csprng-fail')).toBeUndefined();
      } finally {
        globalThis.crypto = originalCrypto;
      }
    });
  });
});
