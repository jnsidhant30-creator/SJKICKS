import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Eye, ShoppingBag, Check } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { Badge } from './Badge';
import { formatINR } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

export function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist, addToCart } = useCart();
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [addedQuick, setAddedQuick] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const isSaved = isInWishlist(product.id);

  const displayImage = isHovered && product.images?.[1] ? product.images[1] : product.images?.[0];

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const audienceLabel = product.audience || product.gender || 'Unisex';

  const isOneSize =
    product.category === 'Watches' ||
    product.category === 'Accessories' ||
    (product.sizes?.length === 1 && product.sizes[0].size.includes('One Size'));

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartPulsing(true);
    toggleWishlist(product);
    setTimeout(() => setHeartPulsing(false), 600);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addedQuick) return;

    const size = product.sizes?.[0]?.size || 'One Size (Standard)';
    const color = product.colors?.[0] || { name: 'Standard' };
    const success = addToCart(product, size, color, 1);
    if (success) {
      setAddedQuick(true);
      setTimeout(() => setAddedQuick(false), 1600);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (typeof window === 'undefined') return;
    const isFinePointer =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
        : false;
    if (!isFinePointer || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    // Subtle 3D tilt: max 8 degrees on X & Y
    const rx = (y / rect.height - 0.5) * -12;
    const ry = (x / rect.width - 0.5) * 12;

    setTilt({ rx, ry });
    setGlare({ x: xPct, y: yPct, opacity: 0.3 });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="card-3d group flex flex-col bg-white border border-neutral-200 hover:border-neutral-950 relative shadow-3d-card hover:shadow-3d-card-hover will-change-transform"
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-6px) scale3d(1.015, 1.015, 1.015)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.3s ease',
      }}
    >
      {/* Dynamic Specular 3D Glare */}
      <div
        className="card-3d-glare absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Top Badges & Wishlist Trigger (elevated in 3D) */}
      <div
        className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none"
        style={{ transform: 'translateZ(20px)' }}
      >
        <div className="flex flex-col gap-1 items-start">
          {product.badge && (
            <div className="transition-transform duration-300 group-hover:scale-105">
              <Badge variant={product.badge}>{product.badge}</Badge>
            </div>
          )}
          {discountPercent && (
            <span className="bg-neutral-950 text-white font-display font-black text-[9px] px-2 py-0.5 tracking-wider uppercase shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlistClick}
          className={`pointer-events-auto p-2 rounded-full transition-all duration-300 cursor-pointer ${
            heartPulsing ? 'scale-125' : ''
          } ${
            isSaved
              ? 'bg-rose-50 text-rose-600 shadow-md ring-1 ring-rose-200'
              : 'bg-white/90 hover:bg-white text-neutral-700 hover:text-neutral-950 shadow-xs hover:scale-110 active:scale-90'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-300 ${
              isSaved ? 'fill-rose-600 scale-105' : ''
            } ${heartPulsing ? 'animate-heart-beat' : ''}`}
          />
        </button>
      </div>

      {/* Product Image Link */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-4/3 w-full bg-neutral-100 overflow-hidden"
      >
        <ImageWithFallback
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-108"
        />

        {/* Quick View / Quick Add Interactive Action Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/25 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none flex justify-center gap-2">
          {isOneSize ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`px-3.5 py-1.5 backdrop-blur-xs font-display text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 pointer-events-auto transition-all cursor-pointer ${
                addedQuick
                  ? 'bg-emerald-600 text-white scale-105'
                  : 'bg-white/95 text-neutral-950 hover:bg-white hover:scale-102 active:scale-95'
              }`}
            >
              {addedQuick ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Quick Add
                </>
              )}
            </button>
          ) : (
            <span className="px-3.5 py-1.5 bg-white/95 backdrop-blur-xs text-neutral-950 font-display text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 pointer-events-auto hover:bg-white hover:scale-102 transition-all">
              <Eye className="w-3.5 h-3.5" />
              Quick Inspect
            </span>
          )}
        </div>

        {/* Colorway preview swatches */}
        {product.colors?.length > 1 && (
          <div className="absolute top-3 right-12 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-sm border border-neutral-200 shadow-2xs group-hover:border-neutral-400 transition-colors">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-2xs hover:scale-125 transition-transform"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[9px] font-bold text-neutral-600 font-display">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Product Details (elevated in 3D) */}
      <div
        className="p-4 flex-1 flex flex-col justify-between"
        style={{ transform: 'translateZ(10px)' }}
      >
        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1">
            <span className="transition-colors group-hover:text-neutral-700">
              {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
            </span>
            <span className="text-neutral-900 font-bold">{audienceLabel}</span>
          </div>

          <Link
            to={`/product/${product.id}`}
            className="font-display text-base font-bold text-neutral-950 group-hover:text-amber-600 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
            {product.tagline}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-base font-bold text-neutral-950">
              {formatINR(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-sans text-xs text-neutral-400 line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>

          <span className="text-[11px] font-display uppercase font-bold tracking-wider text-neutral-900 group-hover:text-amber-600 transition-colors flex items-center gap-1 group-hover:underline">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
