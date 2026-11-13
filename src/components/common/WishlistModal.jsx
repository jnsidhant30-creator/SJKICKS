import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ImageWithFallback } from './ImageWithFallback';
import { formatINR } from '../../utils/formatters';

export function WishlistModal({ isOpen, onClose }) {
  const { wishlist, toggleWishlist } = useCart();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-neutral-900 fill-neutral-900" />
              <h2 className="text-lg font-bold font-display uppercase tracking-tight text-neutral-900">
                Your Saved Kicks ({wishlist.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
              aria-label="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold uppercase text-neutral-800">
                  Your Wishlist is Empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mt-1 mb-6">
                  Save your favorite silhouettes to keep an eye on drops, stock levels, and special colorways.
                </p>
                <Link
                  to="/shop"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-black transition-all btn-magnetic shadow-md"
                >
                  Explore Collection <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              wishlist.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 border border-neutral-200 bg-neutral-50/50 hover:border-neutral-950 transition-all card-lift shadow-2xs"
                >
                  <Link
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="w-20 h-20 shrink-0 bg-neutral-100 block overflow-hidden"
                  >
                    <ImageWithFallback
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        {product.category}
                      </span>
                      <Link
                        to={`/product/${product.id}`}
                        onClick={onClose}
                        className="block font-display font-bold text-sm text-neutral-900 truncate hover:underline"
                      >
                        {product.name}
                      </Link>
                      <div className="text-xs font-bold text-neutral-900 mt-0.5">
                        {formatINR(product.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-neutral-200/60">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={onClose}
                        className="text-[11px] font-bold font-display uppercase tracking-wider text-neutral-900 hover:text-amber-600 flex items-center gap-1"
                      >
                        Select Size & Buy <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="text-[10px] text-neutral-400 hover:text-rose-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
