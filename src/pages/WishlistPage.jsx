import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/common/ProductCard';

export function WishlistPage() {
  const { wishlist } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-fade-in">
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Curated Vault
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mt-1">
          Saved Wishlist
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          You have <strong className="text-neutral-900">{wishlist.length}</strong> silhouettes saved to your private wishlist.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto animate-float-slow">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Keep track of coveted drops, seasonal jackets, and carbon runners by clicking the heart icon on any silhouette.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="px-8 py-3.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-neutral-800 transition-all btn-magnetic shadow-md group cursor-pointer"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
