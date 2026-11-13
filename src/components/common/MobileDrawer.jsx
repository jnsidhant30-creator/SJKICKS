import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, User, Heart, ShoppingBag, Search, Shield, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { CATEGORIES_DATA } from '../../data/categories';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BRAND_CONFIG } from '../../config/brand';

export function MobileDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { cartCount, wishlist } = useCart();
  const { user, isAdmin } = useAuth();

  const [activeAudience, setActiveAudience] = useState('All');
  const [openCategory, setOpenCategory] = useState(null);
  const [searchVal, setSearchVal] = useState('');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (slug) => {
    setOpenCategory((prev) => (prev === slug ? null : slug));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      onClose();
      setSearchVal('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs animate-fade-in lg:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-y-0 left-0 max-w-full flex pr-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-left">
          {/* Top Header */}
          <div>
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-950 focus:outline-none transition-transform active:scale-95"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-neutral-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search collections, sneakers, coats..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full bg-neutral-100 pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 placeholder-neutral-500 border border-transparent focus:border-neutral-900 focus:outline-none transition-colors"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </form>

            {/* Audience Segment Switcher */}
            <div className="grid grid-cols-3 border-b border-neutral-200 text-center font-display text-xs font-bold uppercase tracking-wider bg-neutral-100">
              {['All', 'Men', 'Women'].map((aud) => (
                <button
                  key={aud}
                  onClick={() => setActiveAudience(aud)}
                  className={`py-3 transition-all cursor-pointer ${
                    activeAudience === aud
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>

            {/* Navigation Category List */}
            <nav className="p-4 space-y-1" aria-label="Mobile Navigation">
              {/* Home */}
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:bg-neutral-100 font-display transition-colors"
              >
                <span>Home</span>
              </Link>

              {/* Audience Specific Direct Links */}
              <Link
                to="/men"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:bg-neutral-100 font-display transition-colors"
              >
                <span>Men's Atelier</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>

              <Link
                to="/women"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:bg-neutral-100 font-display transition-colors"
              >
                <span>Women's Atelier</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>

              {/* Major Categories Accordions */}
              {CATEGORIES_DATA.map((cat) => {
                const isOpen = openCategory === cat.slug;
                const audienceParam =
                  activeAudience !== 'All' ? `&gender=${activeAudience}` : '';

                return (
                  <div key={cat.id} className="border-b border-neutral-100">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className="w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:bg-neutral-100 font-display transition-colors cursor-pointer"
                    >
                      <span>{cat.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="bg-neutral-50 px-4 py-2 space-y-1 animate-fade-in">
                        <Link
                          to={`${cat.path}?${audienceParam.replace('&', '')}`}
                          onClick={onClose}
                          className="block py-1.5 text-xs font-bold text-neutral-950 font-display uppercase tracking-wider hover:text-amber-600 transition-colors"
                        >
                          All {cat.name} →
                        </Link>
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            to={`/shop?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(
                              sub.slug
                            )}${audienceParam}`}
                            onClick={onClose}
                            className="block py-1 text-xs text-neutral-600 hover:text-neutral-950 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Curated Campaign Edits */}
              <div className="pt-3 pb-1 border-t border-neutral-200">
                <Link
                  to="/shop?filter=new"
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 font-display transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>New Arrivals</span>
                </Link>

                <Link
                  to="/shop?filter=bestseller"
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 font-display transition-colors"
                >
                  <span>Bestsellers</span>
                </Link>

                <Link
                  to="/shop?filter=sale"
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 font-display transition-colors"
                >
                  <span>Seasonal Sale</span>
                </Link>
              </div>
            </nav>
          </div>

          {/* Bottom Utility Bar (Account, Wishlist, Bag, Admin) */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-neutral-200 text-neutral-900 font-display font-bold uppercase tracking-wider hover:border-neutral-900 transition-colors shadow-2xs"
              >
                <User className="w-4 h-4 text-neutral-500" />
                <span className="truncate">{user ? user.fullName.split(' ')[0] : 'Account'}</span>
              </Link>

              <Link
                to="/wishlist"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-neutral-200 text-neutral-900 font-display font-bold uppercase tracking-wider hover:border-neutral-900 transition-colors shadow-2xs relative"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Vault</span>
                {wishlist.length > 0 && (
                  <span className="bg-neutral-900 text-white text-[9px] px-1 font-bold rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-neutral-950 text-white font-display font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Bag ({cartCount})</span>
              </Link>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 text-amber-400 text-xs font-display font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Studio Portal</span>
              </Link>
            )}

            <div className="text-[10px] text-neutral-400 text-center uppercase tracking-widest pt-2">
              {BRAND_CONFIG.name} • {BRAND_CONFIG.originCity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileDrawer;
