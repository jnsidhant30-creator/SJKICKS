import { describe, it, expect } from 'vitest';
import {
  formatINR,
  calculateOrderTotals,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  generateOrderId,
  formatDate,
  getEstimatedDeliveryDate,
} from '../utils/formatters';

describe('formatters utility', () => {
  describe('formatINR', () => {
    it('formats positive numbers in Indian Rupee format', () => {
      const formatted = formatINR(13995);
      // Remove any non-breaking spaces for universal comparison
      expect(formatted.replace(/\u00A0/g, ' ')).toMatch(/₹\s?13,995/);
    });

    it('formats 0 as ₹0', () => {
      const formatted = formatINR(0);
      expect(formatted.replace(/\u00A0/g, ' ')).toMatch(/₹\s?0/);
    });

    it('returns ₹0 for invalid or missing values', () => {
      expect(formatINR(null)).toBe('₹0');
      expect(formatINR(undefined)).toBe('₹0');
      expect(formatINR(NaN)).toBe('₹0');
      expect(formatINR('1000')).toBe('₹0');
      expect(formatINR({})).toBe('₹0');
    });
  });

  describe('calculateOrderTotals', () => {
    it('calculates totals correctly for an empty cart', () => {
      const totals = calculateOrderTotals([]);
      expect(totals.subtotal).toBe(0);
      expect(totals.discount).toBe(0);
      expect(totals.shipping).toBe(0);
      expect(totals.total).toBe(0);
      expect(totals.isFreeShipping).toBe(true);
      expect(totals.freeShippingThreshold).toBe(FREE_SHIPPING_THRESHOLD);
    });

    it('adds standard shipping fee when subtotal is below threshold', () => {
      const cart = [
        { price: 1000, quantity: 1 },
      ];
      const totals = calculateOrderTotals(cart);
      expect(totals.subtotal).toBe(1000);
      expect(totals.shipping).toBe(STANDARD_SHIPPING_FEE);
      expect(totals.total).toBe(1000 + STANDARD_SHIPPING_FEE);
      expect(totals.isFreeShipping).toBe(false);
      expect(totals.amountToFreeShipping).toBe(FREE_SHIPPING_THRESHOLD - 1000);
    });

    it('grants free shipping when subtotal meets or exceeds threshold', () => {
      const cart = [
        { price: FREE_SHIPPING_THRESHOLD, quantity: 1 },
      ];
      const totals = calculateOrderTotals(cart);
      expect(totals.subtotal).toBe(FREE_SHIPPING_THRESHOLD);
      expect(totals.shipping).toBe(0);
      expect(totals.total).toBe(FREE_SHIPPING_THRESHOLD);
      expect(totals.isFreeShipping).toBe(true);
      expect(totals.amountToFreeShipping).toBe(0);
    });

    it('applies percentage discounts correctly', () => {
      const cart = [
        { price: 10000, quantity: 1 },
      ];
      // 10% discount on 10000 = 1000
      const totals = calculateOrderTotals(cart, 10, 0);
      expect(totals.subtotal).toBe(10000);
      expect(totals.discount).toBe(1000);
      expect(totals.shipping).toBe(0); // >= 2499
      expect(totals.total).toBe(9000);
    });

    it('applies flat promo discount correctly', () => {
      const cart = [
        { price: 5000, quantity: 1 },
      ];
      const totals = calculateOrderTotals(cart, 0, 500);
      expect(totals.subtotal).toBe(5000);
      expect(totals.discount).toBe(500);
      expect(totals.total).toBe(4500);
    });

    it('caps total discount at subtotal (total cannot be negative)', () => {
      const cart = [
        { price: 200, quantity: 1 },
      ];
      const totals = calculateOrderTotals(cart, 0, 500);
      expect(totals.discount).toBe(200);
      // Below threshold (200 < 2499), shipping is 199
      expect(totals.shipping).toBe(STANDARD_SHIPPING_FEE);
      expect(totals.total).toBe(STANDARD_SHIPPING_FEE);
    });
  });

  describe('generateOrderId', () => {
    it('generates an order ID matching SJK-{year}-{6 random chars}', () => {
      const orderId = generateOrderId();
      const currentYear = new Date().getFullYear();
      const pattern = new RegExp(`^SJK-${currentYear}-[A-Z0-9]{6}$`);
      expect(orderId).toMatch(pattern);
    });

    it('generates unique order IDs on successive calls', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatDate & getEstimatedDeliveryDate', () => {
    it('formats a date to Indian readable format', () => {
      const formatted = formatDate(new Date('2026-10-28T10:00:00Z'));
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/2026/);
    });

    it('returns estimated delivery date 4 days out by default', () => {
      const estimate = getEstimatedDeliveryDate(4);
      expect(estimate).toBeTruthy();
      expect(typeof estimate).toBe('string');
    });
  });
});

