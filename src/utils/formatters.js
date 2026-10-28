/**
 * Formats a numeric price into the standard Indian Rupee format
 * Example: 12999 -> "₹12,999"
 */
export function formatINR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates order subtotal, shipping, discounts, and final total
 */
export const FREE_SHIPPING_THRESHOLD = 2499;
export const STANDARD_SHIPPING_FEE = 199;

export function calculateOrderTotals(cartItems = [], discountPercent = 0, promoDiscount = 0) {
  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return acc + price * qty;
  }, 0);

  const percentageDiscountAmount = Math.round(subtotal * (discountPercent / 100));
  const totalDiscount = Math.min(subtotal, percentageDiscountAmount + promoDiscount);

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || cartItems.length === 0;
  const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const total = Math.max(0, subtotal - totalDiscount + shipping);

  return {
    subtotal,
    discount: totalDiscount,
    shipping,
    total,
    isFreeShipping,
    amountToFreeShipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
}

/**
 * Generates an original unique demo order ID
 * Example: SJK-2026-8F42A1
 */
export function generateOrderId() {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SJK-${year}-${randomChars}`;
}

/**
 * Formats a Date object or timestamp into Indian readable format
 */
export function formatDate(dateInput = new Date()) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Calculates an estimated delivery date (3-5 business days)
 */
export function getEstimatedDeliveryDate(daysFromNow = 4) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return formatDate(d);
}
