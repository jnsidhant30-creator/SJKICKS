import { describe, it, expect } from 'vitest';
import { reconcileCart, isCartEqual } from '../utils/cartReconciliation';

describe('cartReconciliation utility', () => {
  const mockCatalog = [
    {
      id: 'prod-1',
      name: 'SJ Carbon Alpha',
      price: 12999,
      originalPrice: 15999,
      images: ['https://example.com/img1.jpg'],
      category: 'Shoes',
      subcategory: 'Running Shoes',
      audience: 'Unisex',
      colors: [{ name: 'Triple Black', hex: '#000000' }],
      sizes: [
        { size: 'UK 7', stock: 5 },
        { size: 'UK 8', stock: 2 },
        { size: 'UK 9', stock: 0 }, // Out of stock
      ],
    },
    {
      id: 'prod-2',
      name: 'SJ Box Tee',
      price: 2499,
      originalPrice: 2999,
      images: ['https://example.com/tee.jpg'],
      category: 'Clothing',
      subcategory: 'T-Shirts',
      audience: 'Men',
      colors: [{ name: 'White', hex: '#ffffff' }],
      sizes: [
        { size: 'M', stock: 10 },
        { size: 'L', stock: 0 },
      ],
    },
  ];

  it('handles null, undefined, strings, and non-array input safely', () => {
    expect(reconcileCart(null, mockCatalog)).toEqual([]);
    expect(reconcileCart(undefined, mockCatalog)).toEqual([]);
    expect(reconcileCart('invalid', mockCatalog)).toEqual([]);
    expect(reconcileCart({}, mockCatalog)).toEqual([]);
    expect(reconcileCart([], mockCatalog)).toEqual([]);
  });

  it('removes deleted products not present in catalog', () => {
    const rawCart = [
      {
        productId: 'deleted-product-99',
        size: 'UK 8',
        quantity: 1,
      },
      {
        productId: 'prod-1',
        size: 'UK 7',
        quantity: 2,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].productId).toBe('prod-1');
  });

  it('removes deleted or non-existent size variants', () => {
    const rawCart = [
      {
        productId: 'prod-1',
        size: 'UK 13', // Doesn't exist in prod-1 sizes
        quantity: 1,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(0);
  });

  it('removes items that are currently out of stock (stock: 0)', () => {
    const rawCart = [
      {
        productId: 'prod-1',
        size: 'UK 9', // stock is 0
        quantity: 1,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(0);
  });

  it('clamps stored quantity to available stock', () => {
    const rawCart = [
      {
        productId: 'prod-1',
        size: 'UK 8', // stock is 2
        quantity: 10, // Stored quantity is 10
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].quantity).toBe(2);
    expect(reconciled[0].maxStock).toBe(2);
  });

  it('normalizes fractional, negative, or string quantities safely', () => {
    const rawCart = [
      {
        productId: 'prod-1',
        size: 'UK 7',
        quantity: '3.7', // Should be normalized to Math.floor(3.7) = 3
      },
      {
        productId: 'prod-2',
        size: 'M',
        quantity: -5, // Should be dropped
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].productId).toBe('prod-1');
    expect(reconciled[0].quantity).toBe(3);
  });

  it('updates stale prices and originalPrices from catalog', () => {
    const rawCart = [
      {
        productId: 'prod-1',
        size: 'UK 7',
        quantity: 1,
        price: 999, // Stale outdated price
        originalPrice: 1200,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].price).toBe(12999); // Current catalog price
    expect(reconciled[0].originalPrice).toBe(15999);
  });

  it('merges duplicate cart lines for the same variant up to available stock', () => {
    const rawCart = [
      {
        cartItemId: 'prod-1__UK 8__Triple Black',
        productId: 'prod-1',
        size: 'UK 8', // stock: 2
        quantity: 1,
      },
      {
        cartItemId: 'prod-1__UK 8__Triple Black',
        productId: 'prod-1',
        size: 'UK 8',
        quantity: 3,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].quantity).toBe(2); // Clamped to available stock (2)
  });

  it('preserves referential equality when cart is already clean and unchanged', () => {
    const rawCart = [
      {
        cartItemId: 'prod-1__UK 7__Triple Black',
        productId: 'prod-1',
        size: 'UK 7',
        quantity: 2,
        price: 12999,
      },
    ];

    const reconciled = reconcileCart(rawCart, mockCatalog);
    expect(isCartEqual(rawCart, reconciled)).toBe(true);
    // reconcileCart returns the exact same array reference if equal
    expect(reconciled).toBe(rawCart);
  });
});

