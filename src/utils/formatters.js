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
 * Monetary representation utilities using integer paise
 * 1 Rupee = 100 Paise. Eliminates IEEE 754 floating point precision drift.
 */
export function toPaise(rupees) {
  const num = Number(rupees);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function toRupees(paise) {
  const num = Number(paise);
  if (isNaN(num)) return 0;
  return Math.round(num) / 100;
}

/**
 * Calculates order subtotal, shipping, discounts, and final total
 */
export const FREE_SHIPPING_THRESHOLD = 2499;
export const STANDARD_SHIPPING_FEE = 199;
export const FREE_SHIPPING_THRESHOLD_PAISE = 249900;
export const STANDARD_SHIPPING_FEE_PAISE = 19900;

export function calculateOrderTotals(cartItems = [], discountPercent = 0, promoDiscount = 0) {
  // Compute subtotal in exact integer paise
  const subtotalPaise = cartItems.reduce((acc, item) => {
    const unitPricePaise = toPaise(item.price);
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 1));
    return acc + unitPricePaise * qty;
  }, 0);

  const percentageDiscountPaise = Math.round(subtotalPaise * (Number(discountPercent || 0) / 100));
  const promoDiscountPaise = toPaise(promoDiscount || 0);
  const totalDiscountPaise = Math.min(subtotalPaise, percentageDiscountPaise + promoDiscountPaise);

  const isFreeShipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE || cartItems.length === 0;
  const shippingPaise = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const amountToFreeShippingPaise = Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise);

  const totalPaise = Math.max(0, subtotalPaise - totalDiscountPaise + shippingPaise);

  return {
    subtotal: toRupees(subtotalPaise),
    discount: toRupees(totalDiscountPaise),
    shipping: toRupees(shippingPaise),
    total: toRupees(totalPaise),
    isFreeShipping,
    amountToFreeShipping: toRupees(amountToFreeShippingPaise),
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    // Integer paise values for exact backend/database verification
    subtotalPaise,
    discountPaise: totalDiscountPaise,
    shippingPaise,
    totalPaise,
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
