import { useState, useMemo, useEffect } from 'react';
import { PRODUCTS } from '../data/products';
import { getProducts } from '../lib/supabaseService';

export function useProducts(initialFilter = {}) {
  const [allProducts, setAllProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialFilter.search || '');
  const [category, setCategory] = useState(initialFilter.category || 'All');
  const [subcategory, setSubcategory] = useState(initialFilter.subcategory || 'All');
  const [audience, setAudience] = useState(
    initialFilter.audience || initialFilter.gender || 'All'
  );
  const [selectedSize, setSelectedSize] = useState(initialFilter.size || null);
  const [selectedColor, setSelectedColor] = useState(initialFilter.color || null);
  const [priceRange, setPriceRange] = useState(initialFilter.priceRange || 'All');
  const [inStockOnly, setInStockOnly] = useState(Boolean(initialFilter.inStockOnly));
  const [saleOnly, setSaleOnly] = useState(Boolean(initialFilter.saleOnly));
  const [sortBy, setSortBy] = useState(initialFilter.sortBy || 'featured');

  // Load from Supabase service (or local custom overrides)
  useEffect(() => {
    let mounted = true;
    getProducts().then((res) => {
      if (mounted && Array.isArray(res) && res.length > 0) {
        setAllProducts(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search query (matches name, tagline, description, category, subcategory, audience)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = product.name?.toLowerCase().includes(query);
          const matchesTag = product.tagline?.toLowerCase().includes(query);
          const matchesCat = product.category?.toLowerCase().includes(query);
          const matchesSub = product.subcategory?.toLowerCase().includes(query);
          const matchesAud = product.audience?.toLowerCase().includes(query);
          const matchesDesc = product.description?.toLowerCase().includes(query);
          if (
            !matchesName &&
            !matchesTag &&
            !matchesCat &&
            !matchesSub &&
            !matchesAud &&
            !matchesDesc
          ) {
            return false;
          }
        }

        // Category filter
        if (category !== 'All' && product.category?.toLowerCase() !== category.toLowerCase()) {
          return false;
        }

        // Subcategory filter
        if (
          subcategory !== 'All' &&
          product.subcategory?.toLowerCase().replace(/\s+/g, '-') !==
            subcategory.toLowerCase().replace(/\s+/g, '-')
        ) {
          return false;
        }

        // Audience / Gender filter
        if (audience !== 'All') {
          const pAud = product.audience || product.gender || 'Unisex';
          if (audience === 'Men' && pAud !== 'Men' && pAud !== 'Unisex') return false;
          if (audience === 'Women' && pAud !== 'Women' && pAud !== 'Unisex') return false;
          if (audience === 'Unisex' && pAud !== 'Unisex') return false;
        }

        // Size filter
        if (selectedSize) {
          const hasSize = product.sizes?.some(
            (s) => s.size === selectedSize && (s.stock === undefined || s.stock > 0)
          );
          if (!hasSize) return false;
        }

        // Color filter
        if (selectedColor) {
          const hasColor = product.colors?.some((c) =>
            c.name.toLowerCase().includes(selectedColor.toLowerCase())
          );
          if (!hasColor) return false;
        }

        // In-stock availability filter
        if (inStockOnly) {
          const totalStock = product.sizes?.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
          if (totalStock === 0) return false;
        }

        // Sale filter
        if (saleOnly) {
          if (!product.isSale && (!product.originalPrice || product.originalPrice <= product.price)) {
            return false;
          }
        }

        // Price range filter
        if (priceRange === 'under-5000' && product.price >= 5000) return false;
        if (priceRange === '5000-10000' && (product.price < 5000 || product.price > 10000)) return false;
        if (priceRange === '10000-18000' && (product.price < 10000 || product.price > 18000)) return false;
        if (priceRange === 'above-18000' && product.price <= 18000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        // Default: featured or bestseller first
        return (
          (b.isFeatured || b.isBestseller ? 1 : 0) - (a.isFeatured || a.isBestseller ? 1 : 0)
        );
      });
  }, [
    allProducts,
    searchQuery,
    category,
    subcategory,
    audience,
    selectedSize,
    selectedColor,
    priceRange,
    inStockOnly,
    saleOnly,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('All');
    setSubcategory('All');
    setAudience('All');
    setSelectedSize(null);
    setSelectedColor(null);
    setPriceRange('All');
    setInStockOnly(false);
    setSaleOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    category !== 'All' ||
    subcategory !== 'All' ||
    audience !== 'All' ||
    selectedSize !== null ||
    selectedColor !== null ||
    priceRange !== 'All' ||
    inStockOnly ||
    saleOnly ||
    sortBy !== 'featured';

  return {
    products: filteredProducts,
    totalCount: allProducts.length,
    filteredCount: filteredProducts.length,
    loading,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    subcategory,
    setSubcategory,
    audience,
    setAudience,
    gender: audience, // backwards compatibility
    setGender: setAudience, // backwards compatibility
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    priceRange,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    saleOnly,
    setSaleOnly,
    sortBy,
    setSortBy,
    resetFilters,
    hasActiveFilters,
    refreshProducts: () => getProducts().then(setAllProducts),
  };
}
