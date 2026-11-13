import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  Ruler,
  Check,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { formatINR } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ProductCard } from '../components/common/ProductCard';
import { Badge } from '../components/common/Badge';
import { getProductById } from '../lib/supabaseService';
import { ScrollReveal } from '../components/common/ScrollReveal';

export function ProductDetailPage({ onOpenSizeGuide }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const mainBuyButtonRef = useRef(null);

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const [imageTilt, setImageTilt] = useState({ x: 0, y: 0 });
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsPointerFine(media.matches);
      const listener = (e) => setIsPointerFine(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

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

  // Observer to show sticky bar on mobile when main button is scrolled past
  useEffect(() => {
    const btn = mainBuyButtonRef.current;
    if (!btn) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(btn);
    return () => observer.disconnect();
  }, []);

  const isSaved = isInWishlist(activeProduct.id);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });

    if (isPointerFine) {
      const tiltX = ((e.clientX - left) / width - 0.5) * 10;
      const tiltY = ((e.clientY - top) / height - 0.5) * -10;
      setImageTilt({ x: tiltX, y: tiltY });
    }
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
    setIsImageHovered(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setIsImageHovered(false);
    setImageTilt({ x: 0, y: 0 });
  };

  const handleAddToCart = () => {
    if (!selectedSize && !isOneSize) {
      setSizeError(true);
      return;
    }
    const success = addToCart(activeProduct, selectedSize, selectedColor, quantity);
    if (success) {
      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 1500);
    }
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
        <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
        <Link
          to={`/${activeProduct.category.toLowerCase()}`}
          className="hover:text-neutral-950 transition-colors"
        >
          {activeProduct.category}
        </Link>
        {activeProduct.subcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="text-neutral-600">{activeProduct.subcategory}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
        <span className="text-neutral-950 font-bold truncate max-w-xs">{activeProduct.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* Left Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Hero Image with Interactive 3D Perspective & Zoom */}
          <div className="perspective-1000">
            <div
              className="relative aspect-4/3 w-full bg-neutral-100 border border-neutral-200 overflow-hidden cursor-crosshair group card-lift shadow-3d-card"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              style={{
                transform:
                  isImageHovered && isPointerFine
                    ? `perspective(1000px) rotateX(${imageTilt.y}deg) rotateY(${imageTilt.x}deg) scale3d(1.015, 1.015, 1.015)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                transition: isImageHovered
                  ? 'transform 100ms ease-out'
                  : 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              {/* Dynamic specular glare tracking cursor */}
              {isImageHovered && isPointerFine && (
                <div
                  className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at ${zoomPos.x}% ${zoomPos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
                  }}
                />
              )}

              <div
                className="w-full h-full transition-transform duration-200 ease-out"
                style={{
                  transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              >
                <ImageWithFallback
                  src={activeProduct.images?.[activeImageIndex] || activeProduct.images?.[0]}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>

              {/* Badges with 3D elevation */}
              <div
                className="absolute top-4 left-4 flex flex-col gap-1.5 items-start pointer-events-none z-10"
                style={{ transform: 'translateZ(20px)' }}
              >
                {activeProduct.badge && (
                  <Badge variant={activeProduct.badge}>{activeProduct.badge}</Badge>
                )}
                {discountPercent && (
                  <span className="bg-neutral-950 text-white font-display font-black text-[10px] px-2 py-0.5 tracking-wider uppercase shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Zoom Hint */}
              <div
                className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-white text-[10px] font-display uppercase tracking-wider backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs"
                style={{ transform: 'translateZ(15px)' }}
              >
                Hover to Zoom & Pan
              </div>
            </div>
          </div>

          {/* Multi-angle Thumbnail Strip with active indicators */}
          {activeProduct.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3 pt-1">
              {activeProduct.images.map((imgUrl, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-4/3 overflow-hidden border transition-all duration-300 cursor-pointer group ${
                      isActive
                        ? 'border-neutral-950 ring-2 ring-neutral-950 ring-offset-2 scale-[1.03] shadow-md'
                        : 'border-neutral-200 opacity-65 hover:opacity-100 hover:border-neutral-400 hover:scale-[1.01]'
                    }`}
                    aria-label={`Select product image view ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeProduct.name} angle ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400 animate-fade-in" />
                    )}
                  </button>
                );
              })}
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
              <span className="font-sans text-3xl font-bold tracking-tight text-neutral-950">
                {formatINR(activeProduct.price)}
              </span>
              {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                <span className="font-sans text-base text-neutral-400 line-through">
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

              <div className="flex items-center gap-2.5">
                {activeProduct.colors.map((c) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-neutral-950 ring-offset-2 scale-110 shadow-md border-transparent'
                          : 'border-neutral-300 hover:scale-105 hover:border-neutral-500'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 transition-transform duration-300 scale-100 ${
                            c.hex === '#ffffff' ? 'text-black' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
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
                className="text-neutral-700 hover:text-neutral-950 underline flex items-center gap-1 font-bold tracking-wider uppercase cursor-pointer transition-colors"
              >
                <Ruler className="w-3.5 h-3.5" /> Size Guide
              </button>
            </div>

            {/* If One Size (Watches & Accessories), never show shoe sizes! */}
            {isOneSize ? (
              <div className="p-3 bg-neutral-100 border border-neutral-200 text-xs font-display uppercase tracking-wider font-bold text-neutral-900 flex items-center justify-between shadow-2xs">
                <span>Standard One Size (Universal Fit)</span>
                <span className="text-emerald-700 font-sans font-semibold normal-case">
                  In Stock
                </span>
              </div>
            ) : (
              /* Footwear numeric sizes OR Apparel S/M/L/XL sizes */
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {activeProduct.sizes?.map((sizeObj) => {
                  const isOutOfStock = sizeObj.stock === 0;
                  const isSelected = selectedSize === sizeObj.size;

                  return (
                    <button
                      key={sizeObj.size}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSizeSelect(sizeObj.size)}
                      className={`py-2.5 px-2 text-xs font-display font-bold uppercase text-center border transition-all duration-200 relative cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-md scale-[1.04] ring-1 ring-neutral-950'
                          : isOutOfStock
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through opacity-50'
                          : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-950 hover:bg-neutral-50 hover:shadow-2xs active:scale-95'
                      }`}
                    >
                      {sizeObj.size}
                      {sizeObj.stock > 0 && sizeObj.stock <= 2 && (
                        <span className="absolute -top-1.5 -right-1 bg-amber-500 text-neutral-950 text-[8px] px-1 font-black shadow-xs animate-pulse">
                          {sizeObj.stock} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {sizeError && !isOneSize && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" /> Please select a size before adding to bag
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div ref={mainBuyButtonRef} className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-4 font-display text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg btn-magnetic cursor-pointer active:scale-95 ${
                  isAddedFeedback
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-4 h-4 animate-scale-bounce" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(activeProduct)}
                className={`p-4 border transition-all duration-300 cursor-pointer ${
                  isSaved
                    ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-xs'
                    : 'border-neutral-300 hover:border-neutral-950 text-neutral-700 hover:scale-105 active:scale-95'
                }`}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isSaved ? 'fill-rose-600 scale-110 animate-heart-beat' : 'hover:scale-110'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-display text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 border border-neutral-300 btn-magnetic cursor-pointer"
            >
              Express Checkout →
            </button>
          </div>

          {/* Pan-India Delivery Estimator */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs space-y-2 card-lift">
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
                className="px-4 py-1.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors btn-magnetic cursor-pointer"
              >
                Check
              </button>
            </form>
            {deliveryEstimate && (
              <p className="text-[11px] text-neutral-700 mt-1 font-medium animate-fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{deliveryEstimate}</span>
              </p>
            )}
          </div>

          {/* Accordion Specs / Materials / Shipping */}
          <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs">
            <div className="flex border-b border-neutral-200 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeTab === 'specs'
                    ? 'text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Features
                {activeTab === 'specs' && (
                  <span className="absolute bottom-0 inset-x-1 h-0.5 bg-neutral-950 animate-fade-in" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeTab === 'materials'
                    ? 'text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Description
                {activeTab === 'materials' && (
                  <span className="absolute bottom-0 inset-x-1 h-0.5 bg-neutral-950 animate-fade-in" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeTab === 'shipping'
                    ? 'text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Shipping & Returns
                {activeTab === 'shipping' && (
                  <span className="absolute bottom-0 inset-x-1 h-0.5 bg-neutral-950 animate-fade-in" />
                )}
              </button>
            </div>

            {activeTab === 'specs' && (
              <ul className="space-y-1.5 py-3 text-neutral-600 list-disc list-inside animate-fade-in">
                {activeProduct.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            {activeTab === 'materials' && (
              <p className="py-3 text-neutral-700 leading-relaxed animate-fade-in">
                {activeProduct.description}
              </p>
            )}

            {activeTab === 'shipping' && (
              <div className="py-3 space-y-2 text-neutral-600 animate-fade-in">
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
        <ScrollReveal variant="fade-up" className="mt-20 pt-12 border-t border-neutral-200">
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
              className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 font-display group flex items-center gap-1"
            >
              <span>Browse Complete Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Mobile Sticky Add-to-Bag Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-30 lg:hidden flex items-center justify-between gap-3 shadow-2xl animate-slide-up">
          <div className="truncate min-w-0">
            <h4 className="font-display text-xs font-bold uppercase text-neutral-950 truncate">
              {activeProduct.name}
            </h4>
            <div className="text-xs font-display font-black text-neutral-950">
              {formatINR(activeProduct.price)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="px-5 py-2.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;
