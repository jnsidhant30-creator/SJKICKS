import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { Badge } from './Badge';
import { formatINR } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

export function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const isSaved = isInWishlist(product.id);

  const displayImage = isHovered && product.images?.[1] ? product.images[1] : product.images?.[0];

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const audienceLabel = product.audience || product.gender || 'Unisex';

  return (
    <div
      className="group flex flex-col bg-white border border-neutral-200 hover:border-neutral-950 transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Badges & Wishlist Trigger */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {product.badge && <Badge variant={product.badge}>{product.badge}</Badge>}
          {discountPercent && (
            <span className="bg-neutral-950 text-white font-display font-black text-[9px] px-2 py-0.5 tracking-wider uppercase">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`pointer-events-auto p-2 rounded-full transition-all duration-200 ${
            isSaved
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/90 hover:bg-white text-neutral-700 hover:text-neutral-950 shadow-xs'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
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
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Colorway preview swatches */}
        {product.colors?.length > 1 && (
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-sm border border-neutral-200">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-2xs"
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

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1">
            <span>
              {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
            </span>
            <span className="text-neutral-900 font-bold">{audienceLabel}</span>
          </div>

          <Link
            to={`/product/${product.id}`}
            className="font-display text-base font-bold text-neutral-950 group-hover:text-neutral-700 transition-colors line-clamp-1"
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
            <span className="font-display text-base font-black text-neutral-950">
              {formatINR(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>

          <span className="text-[11px] font-display uppercase font-bold tracking-wider text-neutral-900 group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
