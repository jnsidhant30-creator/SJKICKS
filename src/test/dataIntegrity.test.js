import { describe, it, expect } from 'vitest';
import { PRODUCTS, PROMO_CODES, AUDIENCE_LIST } from '../data/products';
import { CATEGORIES_DATA, AUDIENCES, getCategoryBySlugOrName } from '../data/categories';

describe('Data Catalog Integrity', () => {
  describe('CATEGORIES_DATA and Taxonomy', () => {
    it('contains all 4 core fashion verticals', () => {
      const categoryNames = CATEGORIES_DATA.map((c) => c.name);
      expect(categoryNames).toContain('Shoes');
      expect(categoryNames).toContain('Clothing');
      expect(categoryNames).toContain('Watches');
      expect(categoryNames).toContain('Accessories');
    });

    it('defines valid sizeType for each category', () => {
      const validSizeTypes = ['numeric', 'apparel', 'one-size'];
      CATEGORIES_DATA.forEach((cat) => {
        expect(validSizeTypes).toContain(cat.sizeType);
        expect(Array.isArray(cat.sizes)).toBe(true);
        expect(cat.sizes.length).toBeGreaterThan(0);
      });
    });

    it('each category has a non-empty subcategories list with unique slugs', () => {
      CATEGORIES_DATA.forEach((cat) => {
        expect(Array.isArray(cat.subcategories)).toBe(true);
        expect(cat.subcategories.length).toBeGreaterThan(0);
        const slugs = cat.subcategories.map((s) => s.slug);
        const uniqueSlugs = new Set(slugs);
        expect(uniqueSlugs.size).toBe(slugs.length);
      });
    });

    it('getCategoryBySlugOrName finds category by slug, name or lowercase', () => {
      expect(getCategoryBySlugOrName('shoes')?.name).toBe('Shoes');
      expect(getCategoryBySlugOrName('Shoes')?.id).toBe('shoes');
      expect(getCategoryBySlugOrName('clothing')?.name).toBe('Clothing');
      expect(getCategoryBySlugOrName('watches')?.name).toBe('Watches');
      expect(getCategoryBySlugOrName('accessories')?.name).toBe('Accessories');
      expect(getCategoryBySlugOrName('non-existent')).toBeNull();
      expect(getCategoryBySlugOrName(null)).toBeNull();
    });

    it('AUDIENCES list includes All, Men, Women, and Unisex', () => {
      const values = AUDIENCES.map((a) => a.value);
      expect(values).toContain('All');
      expect(values).toContain('Men');
      expect(values).toContain('Women');
      expect(values).toContain('Unisex');
    });
  });

  describe('PRODUCTS Catalog', () => {
    it('has a populated catalog of silhouettes', () => {
      expect(PRODUCTS.length).toBeGreaterThanOrEqual(20);
    });

    it('every product has unique id and unique slug', () => {
      const ids = PRODUCTS.map((p) => p.id);
      const slugs = PRODUCTS.map((p) => p.slug);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('every product has required fields and valid prices', () => {
      const validCategories = CATEGORIES_DATA.map((c) => c.name);
      const validAudiences = ['Men', 'Women', 'Unisex'];

      PRODUCTS.forEach((product) => {
        expect(product.id, `Product missing id`).toBeTruthy();
        expect(product.name, `Product ${product.id} missing name`).toBeTruthy();
        expect(validCategories, `Product ${product.id} invalid category ${product.category}`).toContain(product.category);
        expect(validAudiences, `Product ${product.id} invalid audience ${product.audience}`).toContain(product.audience || product.gender);
        expect(typeof product.price).toBe('number');
        expect(product.price).toBeGreaterThan(0);

        if (product.originalPrice) {
          expect(product.originalPrice).toBeGreaterThanOrEqual(product.price);
        }

        expect(Array.isArray(product.images)).toBe(true);
        expect(product.images.length).toBeGreaterThan(0);

        expect(Array.isArray(product.sizes)).toBe(true);
        expect(product.sizes.length).toBeGreaterThan(0);
      });
    });

    it('every variant has a size label and a non-negative stock count', () => {
      PRODUCTS.forEach((product) => {
        product.sizes.forEach((variant) => {
          expect(variant.size).toBeTruthy();
          expect(typeof variant.stock).toBe('number');
          expect(variant.stock).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('covers all 4 product categories in the catalog', () => {
      const shoes = PRODUCTS.filter((p) => p.category === 'Shoes');
      const clothing = PRODUCTS.filter((p) => p.category === 'Clothing');
      const watches = PRODUCTS.filter((p) => p.category === 'Watches');
      const accessories = PRODUCTS.filter((p) => p.category === 'Accessories');

      expect(shoes.length).toBeGreaterThan(0);
      expect(clothing.length).toBeGreaterThan(0);
      expect(watches.length).toBeGreaterThan(0);
      expect(accessories.length).toBeGreaterThan(0);
    });
    it('AUDIENCE_LIST contains standard audience options', () => {
      expect(AUDIENCE_LIST).toEqual(['All', 'Men', 'Women', 'Unisex']);
    });
  });

  describe('PROMO_CODES', () => {
    it('defines valid promo codes with discount type and value', () => {
      expect(PROMO_CODES).toBeDefined();
      expect(PROMO_CODES.SJFIRST).toBeDefined();
      expect(PROMO_CODES.SJFIRST.type).toBe('percentage');
      expect(PROMO_CODES.SJFIRST.value).toBe(10);

      Object.values(PROMO_CODES).forEach((promo) => {
        expect(['percentage', 'flat', 'shipping']).toContain(promo.type);
        expect(typeof promo.value).toBe('number');
        expect(promo.description).toBeTruthy();
      });
    });
  });
});
