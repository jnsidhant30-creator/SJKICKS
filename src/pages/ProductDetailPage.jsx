import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  Ruler,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { formatINR } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ProductCard } from '../components/common/ProductCard';
import { Badge } from '../components/common/Badge';
import { getProductById } from '../lib/supabaseService';

export function ProductDetailPage({ onOpenSizeGuide }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [product, setProduct] = useState(() => {
    return PRODUCTS.find((p) => p.id === id || p.slug === id) || PRODUCTS[0];
  });

  // Dynamic async lookup in case of newly created custom admin products
  useEffect(() => {
    let mounted = true;
    getProductById(id).then((res) => {
      if (mounted && res) {
        setProduct(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const activeProduct = product || PRODUCTS[0];

  const isOneSize =
    activeProduct.category === 'Watches' ||
    activeProduct.category === 'Accessories' ||
    (activeProduct.sizes?.length === 1 &&
      activeProduct.sizes[0].size.includes('One Size'));

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(activeProduct.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState(
    isOneSize ? 'One Size (Standard)' : null
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'materials' | 'shipping'
  const [pinCode, setPinCode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  // Reset state on ID change
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedColor(activeProduct.colors?.[0]);
    setSelectedSize(isOneSize ? 'One Size (Standard)' : null);
    setQuantity(1);
    setSizeError(false);
    setDeliveryEstimate(null);
    window.scrollTo(0, 0);
  }, [id, activeProduct, isOneSize]);

  const isSaved = isInWishlist(activeProduct.id);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  const handleAddToCart = () => {
    if (!selectedSize && !isOneSize) {
      setSizeError(true);
      return;
    }
    addToCart(activeProduct, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedSize && !isOneSize) {
      setSizeError(true);
      return;
    }
    const success = addToCart(activeProduct, selectedSize, selectedColor, quantity);
    if (success) {
      navigate('/checkout');
    }
  };

  // Check pin code estimate
  const handleCheckDelivery = (e) => {
    e.preventDefault();
    if (pinCode.length === 6 && /^\d+$/.test(pinCode)) {
      setDeliveryEstimate('Estimated delivery within 3 - 5 business days across Pan-India.');
    } else {
      setDeliveryEstimate('Please enter a valid 6-digit Indian PIN code.');
    }
  };

  // Related products from same category or audience
  const relatedProducts = useMemo(() => {
    return PRODUCTS.filter(
      (p) => p.id !== activeProduct.id && (p.category === activeProduct.category || p.audience === activeProduct.audience)
    ).slice(0, 4);
  }, [activeProduct]);

  const discountPercent =
    activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price
      ? Math.round(
          ((activeProduct.originalPrice - activeProduct.price) / activeProduct.originalPrice) * 100
        )
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-500 mb-8 overflow-x-auto">
        <Link to="/" className="hover:text-neutral-950 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-400" />
        <Link
          to={`/${activeProduct.category.toLowerCase()}`}
          className="hover:text-neutral-950 transition-colors"
        >
          {activeProduct.category}
        </Link>
        {activeProduct.subcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-600">{activeProduct.subcategory}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-neutral-400" />
        <span className="text-neutral-950 font-bold truncate max-w-xs">{activeProduct.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* Left Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Hero Image */}
          <div className="relative aspect-4/3 w-full bg-neutral-100 border border-neutral-200 overflow-hidden">
            <ImageWithFallback
              src={activeProduct.images?.[activeImageIndex] || activeProduct.images?.[0]}
              alt={activeProduct.name}
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
              {activeProduct.badge && (
                <Badge variant={activeProduct.badge}>{activeProduct.badge}</Badge>
              )}
              {discountPercent && (
                <span className="bg-neutral-950 text-white font-display font-black text-[10px] px-2 py-0.5 tracking-wider uppercase">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Multi-angle Thumbnail Strip */}
          {activeProduct.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {activeProduct.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-4/3 overflow-hidden border transition-all ${
                    activeImageIndex === idx
                      ? 'border-neutral-950 ring-2 ring-neutral-950 ring-offset-1'
                      : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${activeProduct.name} angle ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Product Details & Action Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs font-display font-bold uppercase tracking-widest text-neutral-500 mb-1">
              <span>{activeProduct.category} • {activeProduct.subcategory}</span>
              <span className="text-neutral-950">{activeProduct.audience || activeProduct.gender}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950">
              {activeProduct.name}
            </h1>

            <p className="text-sm text-neutral-600 mt-1 font-medium">
              {activeProduct.tagline}
            </p>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-neutral-100">
              <span className="font-display text-3xl font-black text-neutral-950">
                {formatINR(activeProduct.price)}
              </span>
              {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                <span className="text-base text-neutral-400 line-through">
                  {formatINR(activeProduct.originalPrice)}
                </span>
              )}
              <span className="text-xs text-neutral-500 font-medium">
                (Inclusive of all taxes)
              </span>
            </div>
          </div>

          {/* Colorway Selection */}
          {activeProduct.colors?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs font-display">
                <span className="font-bold uppercase tracking-wider text-neutral-900">
                  Colorway:
                </span>
                <span className="text-neutral-500 font-sans">
                  {selectedColor?.name || activeProduct.colors[0].name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeProduct.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      selectedColor?.name === c.name
                        ? 'ring-2 ring-neutral-950 ring-offset-2'
                        : 'border-neutral-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor?.name === c.name && (
                      <Check
                        className={`w-4 h-4 ${c.hex === '#ffffff' ? 'text-black' : 'text-white'}`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category-Specific Size Selection */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs font-display">
              <span className="font-bold uppercase tracking-wider text-neutral-900">
                {isOneSize ? 'Size & Specifications:' : 'Select Size:'}
              </span>
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="text-neutral-700 hover:text-neutral-950 underline flex items-center gap-1 font-bold tracking-wider uppercase"
              >
                <Ruler className="w-3.5 h-3.5" /> Size Guide
              </button>
            </div>

            {/* If One Size (Watches & Accessories), never show shoe sizes! */}
            {isOneSize ? (
              <div className="p-3 bg-neutral-100 border border-neutral-200 text-xs font-display uppercase tracking-wider font-bold text-neutral-900 flex items-center justify-between">
                <span>Standard One Size (Universal Fit)</span>
                <span className="text-emerald-700 font-sans font-semibold normal-case">
                  In Stock
                </span>
              </div>
            ) : (
              /* Footwear numeric sizes OR Apparel S/M/L/XL sizes */
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {activeProduct.sizes?.map((sizeObj) => {
                  const isOutOfStock = sizeObj.stock === 0;
                  const isSelected = selectedSize === sizeObj.size;

                  return (
                    <button
                      key={sizeObj.size}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSizeSelect(sizeObj.size)}
                      className={`py-2 px-2 text-xs font-display font-bold uppercase text-center border transition-all relative ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : isOutOfStock
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                          : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-950'
                      }`}
                    >
                      {sizeObj.size}
                      {sizeObj.stock > 0 && sizeObj.stock <= 2 && (
                        <span className="absolute -top-1.5 -right-1 bg-amber-500 text-neutral-950 text-[8px] px-1 font-black">
                          {sizeObj.stock} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {sizeError && !isOneSize && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please select a size before adding to bag
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(activeProduct)}
                className={`p-4 border transition-colors ${
                  isSaved
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-neutral-300 hover:border-neutral-950 text-neutral-700'
                }`}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-display text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 border border-neutral-300"
            >
              Express Checkout →
            </button>
          </div>

          {/* Pan-India Delivery Estimator */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="font-display font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" />
              Check Estimated Delivery
            </div>
            <form onSubmit={handleCheckDelivery} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pinCode}
                maxLength={6}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-white border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 rounded-none focus:outline-none focus:border-neutral-950"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider"
              >
                Check
              </button>
            </form>
            {deliveryEstimate && (
              <p className="text-[11px] text-neutral-700 mt-1 font-medium">{deliveryEstimate}</p>
            )}
          </div>

          {/* Accordion Specs / Materials / Shipping */}
          <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs">
            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider ${
                  activeTab === 'specs'
                    ? 'border-b-2 border-neutral-950 text-neutral-950'
                    : 'text-neutral-400'
                }`}
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider ${
                  activeTab === 'materials'
                    ? 'border-b-2 border-neutral-950 text-neutral-950'
                    : 'text-neutral-400'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider ${
                  activeTab === 'shipping'
                    ? 'border-b-2 border-neutral-950 text-neutral-950'
                    : 'text-neutral-400'
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            {activeTab === 'specs' && (
              <ul className="space-y-1.5 py-3 text-neutral-600 list-disc list-inside">
                {activeProduct.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            {activeTab === 'materials' && (
              <p className="py-3 text-neutral-700 leading-relaxed">
                {activeProduct.description}
              </p>
            )}

            {activeTab === 'shipping' && (
              <div className="py-3 space-y-2 text-neutral-600">
                <p>• <strong>Free Pan-India Delivery:</strong> On all orders above ₹2,499. Orders below threshold ship at flat ₹199.</p>
                <p>• <strong>14-Day Exchanges:</strong> Complimentary doorstep exchange pick-ups across 19,000+ PIN codes.</p>
                <p>• <strong>Simulated Safe Checkout:</strong> Prototype store running on ₹0 budget simulation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Recommendation Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-neutral-200">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
                Complementary Pieces
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 mt-1">
                You May Also Admire
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 font-display"
            >
              Browse Complete Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetailPage;
