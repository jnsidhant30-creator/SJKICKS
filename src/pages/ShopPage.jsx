import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, RotateCcw, Frown, Check, ArrowDown } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES_DATA } from '../data/categories';
import { AUDIENCE_LIST, SORT_OPTIONS } from '../data/products';
import { ProductCard } from '../components/common/ProductCard';

export function ShopPage({ forcedCategory = null, forcedAudience = null }) {
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Check if slug matches a category or subcategory
  const slugResolvedCategory = useMemo(() => {
    if (!slug) return null;
    const cat = CATEGORIES_DATA.find((c) => c.slug === slug.toLowerCase());
    if (cat) return cat.name;
    return null;
  }, [slug]);

  // Initial values from props or URL
  const initialCategory = forcedCategory || slugResolvedCategory || searchParams.get('category') || 'All';
  const initialAudience = forcedAudience || searchParams.get('gender') || searchParams.get('audience') || 'All';
  const initialSubcategory = searchParams.get('subcategory') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sortBy') || 'featured';
  const initialFilterSpecial = searchParams.get('filter') || ''; // 'new' | 'bestseller' | 'sale'

  const {
    products,
    totalCount,
    filteredCount,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    subcategory,
    setSubcategory,
    audience,
    setAudience,
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
  } = useProducts({
    category: initialCategory,
    audience: initialAudience,
    subcategory: initialSubcategory,
    search: initialSearch,
    sortBy: initialSort,
    saleOnly: initialFilterSpecial === 'sale',
  });

  // Handle special query params (filter=new / bestseller / sale)
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'sale') {
      setSaleOnly(true);
    } else if (filterParam === 'new') {
      setSortBy('newest');
    }
  }, [searchParams, setSaleOnly, setSortBy]);

  // Sync category or audience changes if props change (e.g. navigating /men to /women)
  useEffect(() => {
    if (forcedCategory && forcedCategory !== category) {
      setCategory(forcedCategory);
    }
    if (forcedAudience && forcedAudience !== audience) {
      setAudience(forcedAudience);
    }
  }, [forcedCategory, forcedAudience]);

  // Find active category data to compute available subcategories and sizes
  const activeCategoryData = useMemo(() => {
    return CATEGORIES_DATA.find((c) => c.name.toLowerCase() === category.toLowerCase()) || null;
  }, [category]);

  // Category-specific size list
  const availableSizes = useMemo(() => {
    if (!activeCategoryData) {
      return ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'S', 'M', 'L', 'XL', 'One Size (Standard)'];
    }
    return activeCategoryData.sizes;
  }, [activeCategoryData]);

  // Color options
  const colorOptions = [
    { name: 'Black', hex: '#0a0a0a' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Grey', hex: '#71717a' },
    { name: 'Blue', hex: '#1e3a8a' },
    { name: 'Tan', hex: '#b45309' },
    { name: 'Olive', hex: '#3f6212' },
  ];

  // Paginated slice
  const displayedProducts = products.slice(0, visibleCount);

  // Compute page heading
  const pageTitle = useMemo(() => {
    if (forcedAudience) return `${forcedAudience}'s Atelier`;
    if (forcedCategory) return `${forcedCategory} Collection`;
    if (category !== 'All') return `${category} Collection`;
    if (audience !== 'All') return `${audience}'s Catalog`;
    return 'All Silhouettes';
  }, [forcedAudience, forcedCategory, category, audience]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
            The Complete Atelier
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mt-1">
            {pageTitle}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Showing <strong className="text-neutral-950">{filteredCount}</strong> of {totalCount} authentic silhouettes
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Search */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-300 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-950 text-neutral-900 rounded-none"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-950 rounded-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters ({hasActiveFilters ? '!' : '0'})</span>
          </button>
        </div>
      </div>

      {/* Subcategory Pills (when a specific category is active) */}
      {activeCategoryData && activeCategoryData.subcategories?.length > 0 && (
        <div className="py-4 border-b border-neutral-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubcategory('All')}
            className={`px-3 py-1 text-xs font-display font-bold uppercase tracking-wider rounded-none shrink-0 transition-colors ${
              subcategory === 'All'
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All {activeCategoryData.name}
          </button>
          {activeCategoryData.subcategories.map((sub) => {
            const isSelected =
              subcategory.toLowerCase().replace(/\s+/g, '-') ===
              sub.slug.toLowerCase().replace(/\s+/g, '-');

            return (
              <button
                key={sub.slug}
                onClick={() => setSubcategory(sub.slug)}
                className={`px-3 py-1 text-xs font-display font-bold uppercase tracking-wider rounded-none shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="py-3 flex flex-wrap items-center gap-2 border-b border-neutral-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-display">
            Active Filters:
          </span>

          {category !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              Cat: {category}
              <button onClick={() => setCategory('All')}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          {subcategory !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              Sub: {subcategory}
              <button onClick={() => setSubcategory('All')}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          {audience !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              Audience: {audience}
              <button onClick={() => setAudience('All')}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          {selectedSize && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              Size: {selectedSize}
              <button onClick={() => setSelectedSize(null)}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          {selectedColor && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              Color: {selectedColor}
              <button onClick={() => setSelectedColor(null)}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          {saleOnly && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-neutral-950 text-[10px] font-display font-bold uppercase px-2 py-0.5">
              On Sale
              <button onClick={() => setSaleOnly(false)}>
                <X className="w-3 h-3 hover:text-white" />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-display font-bold uppercase px-2 py-0.5">
              In Stock Only
              <button onClick={() => setInStockOnly(false)}>
                <X className="w-3 h-3 hover:text-amber-400" />
              </button>
            </span>
          )}

          <button
            onClick={resetFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider ml-2 underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-8 pr-6 border-r border-neutral-200">
          {/* Audience Filter */}
          <div>
            <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900 mb-3">
              Audience
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_LIST.map((aud) => (
                <button
                  key={aud}
                  onClick={() => setAudience(aud)}
                  className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                    audience === aud
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900 mb-3">
              Category
            </h3>
            <div className="space-y-1.5 text-xs">
              {['All', 'Shoes', 'Clothing', 'Watches', 'Accessories'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSubcategory('All');
                  }}
                  className={`w-full text-left py-1 px-2 font-display uppercase tracking-wider transition-colors flex items-center justify-between ${
                    category.toLowerCase() === cat.toLowerCase()
                      ? 'bg-neutral-950 text-white font-bold'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{cat}</span>
                  {category.toLowerCase() === cat.toLowerCase() && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sizing Filter (Category Aware) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900">
                Size
              </h3>
              {selectedSize && (
                <button
                  onClick={() => setSelectedSize(null)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-900"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                  className={`py-1.5 px-2 text-xs font-display font-bold uppercase text-center border transition-colors ${
                    selectedSize === sz
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900">
                Color
              </h3>
              {selectedColor && (
                <button
                  onClick={() => setSelectedColor(null)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-900"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(selectedColor === c.name ? null : c.name)}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                    selectedColor === c.name
                      ? 'ring-2 ring-neutral-950 ring-offset-2'
                      : 'border-neutral-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.name && (
                    <Check
                      className={`w-3.5 h-3.5 ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900 mb-3">
              Price Range
            </h3>
            <div className="space-y-1.5 text-xs">
              {[
                { label: 'All Prices', val: 'All' },
                { label: 'Under ₹5,000', val: 'under-5000' },
                { label: '₹5,000 - ₹10,000', val: '5000-10000' },
                { label: '₹10,000 - ₹18,000', val: '10000-18000' },
                { label: 'Above ₹18,000', val: 'above-18000' },
              ].map((p) => (
                <label key={p.val} className="flex items-center gap-2 cursor-pointer text-neutral-700">
                  <input
                    type="radio"
                    name="priceRange"
                    value={p.val}
                    checked={priceRange === p.val}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="accent-neutral-950"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability & Sale Toggles */}
          <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-800">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-neutral-950 w-4 h-4"
              />
              <span className="font-bold">In-Stock Silhouettes Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-800">
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(e) => setSaleOnly(e.target.checked)}
                className="accent-neutral-950 w-4 h-4"
              />
              <span className="font-bold text-amber-600">On Sale Only</span>
            </label>
          </div>
        </aside>

        {/* Product Cards Grid Area */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center border border-dashed border-neutral-300 p-8">
              <Frown className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold uppercase text-neutral-950">
                No Matching Silhouettes Found
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
                Try widening your search terms, clearing size selections, or selecting "All Categories".
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-neutral-800"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More Pagination */}
              {visibleCount < products.length && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-8 py-3.5 bg-white border border-neutral-900 text-neutral-950 font-display text-xs font-bold uppercase tracking-widest hover:bg-neutral-950 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    Load More Silhouettes ({products.length - visibleCount} remaining){' '}
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {isMobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-fade-in"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="font-display text-base font-black uppercase text-neutral-950">
                Filter & Refine
              </h3>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Mobile Audience */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase text-neutral-900 mb-2">Audience</h4>
              <div className="flex flex-wrap gap-1">
                {AUDIENCE_LIST.map((aud) => (
                  <button
                    key={aud}
                    onClick={() => setAudience(aud)}
                    className={`px-3 py-1 text-xs font-display font-bold uppercase ${
                      audience === aud ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Category */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase text-neutral-900 mb-2">Category</h4>
              <div className="space-y-1 text-xs">
                {['All', 'Shoes', 'Clothing', 'Watches', 'Accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left py-1 px-2 font-display uppercase ${
                      category.toLowerCase() === cat.toLowerCase()
                        ? 'bg-neutral-950 text-white font-bold'
                        : 'text-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Sizes */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase text-neutral-900 mb-2">Sizes</h4>
              <div className="grid grid-cols-3 gap-1">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                    className={`py-1 text-xs font-display font-bold uppercase border ${
                      selectedSize === sz ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider mt-6"
            >
              Apply Filters ({filteredCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopPage;
