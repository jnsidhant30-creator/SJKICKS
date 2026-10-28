/**
 * Configurable Brand & Store Settings
 * Allows seamless branding changes between SJ STUDIO, SJ KICKS, or future fashion labels.
 */

export const BRAND_CONFIG = {
  name: 'SJ STUDIO',
  shortName: 'SJ',
  tagline: 'HAUTE COUTURE & ATHLETIC PERFORMANCE',
  subTagline: 'Engineered for motion, sculpted for runway and street.',
  originYear: '2026',
  originCity: 'Bengaluru / Milan',
  currency: 'INR',
  currencySymbol: '₹',
  contactEmail: 'concierge@sjstudio.fashion',
  supportPhone: '+91 (080) 4920-8800',
  freeShippingThreshold: 2499,
  standardShippingFee: 199,
  returnDays: 14,
  
  // Navigation categories
  mainCategories: [
    { label: 'Men', path: '/men', audience: 'Men' },
    { label: 'Women', path: '/women', audience: 'Women' },
    { label: 'Shoes', path: '/shoes', category: 'Shoes' },
    { label: 'Clothing', path: '/clothing', category: 'Clothing' },
    { label: 'Watches', path: '/watches', category: 'Watches' },
    { label: 'Accessories', path: '/accessories', category: 'Accessories' },
    { label: 'New Arrivals', path: '/shop?filter=new', isSpecial: true },
    { label: 'Bestsellers', path: '/shop?filter=bestseller', isSpecial: true },
    { label: 'Sale', path: '/shop?filter=sale', isSale: true },
  ],
};

export default BRAND_CONFIG;
