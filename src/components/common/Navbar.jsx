import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, User, Shield, Sparkles, X } from 'lucide-react';
import { Logo } from './Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { WishlistModal } from './WishlistModal';
import { MegaMenu } from './MegaMenu';
import { MobileDrawer } from './MobileDrawer';
import { BRAND_CONFIG } from '../../config/brand';

export function Navbar() {
  const navigate = useNavigate();
  const { cartCount, wishlist } = useCart();
  const { user, isAdmin } = useAuth();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null); // 'men' | 'women' | 'shoes' | 'clothing' | 'watches' | 'accessories' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const navCategories = [
    { label: 'Men', key: 'men', path: '/men', hasMega: true },
    { label: 'Women', key: 'women', path: '/women', hasMega: true },
    { label: 'Shoes', key: 'shoes', path: '/shoes', hasMega: true },
    { label: 'Clothing', key: 'clothing', path: '/clothing', hasMega: true },
    { label: 'Watches', key: 'watches', path: '/watches', hasMega: true },
    { label: 'Accessories', key: 'accessories', path: '/accessories', hasMega: true },
    { label: 'New Arrivals', key: 'new', path: '/shop?filter=new', hasMega: false },
    { label: 'Bestsellers', key: 'bestsellers', path: '/shop?filter=bestseller', hasMega: false },
    { label: 'Sale', key: 'sale', path: '/shop?filter=sale', hasMega: false, isSale: true },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        {/* Top Announcement Bar */}
        <div className="bg-neutral-950 text-white text-[11px] font-medium py-2 px-4 text-center tracking-wider font-display uppercase border-b border-neutral-800">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <span className="text-amber-400 font-bold">⚡ ATELIER COUTURE & PERFORMANCE:</span>
            <span>Free Express Delivery on orders above ₹2,499</span>
            <span className="hidden md:inline text-neutral-500">•</span>
            <span className="hidden md:inline text-neutral-300">
              Use code <strong className="text-white bg-neutral-800 px-1.5 py-0.5 tracking-widest">SJFIRST</strong> for 10% off
            </span>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-2 text-neutral-900 hover:text-black focus:outline-none"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Logo />
            </div>

            {/* Center: Desktop Navigation Links with Mega Menu Triggers */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-7" aria-label="Main Navigation">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `font-display text-xs uppercase tracking-widest font-bold transition-colors py-2 hover:text-neutral-950 ${
                    isActive ? 'text-neutral-950 border-b-2 border-neutral-950' : 'text-neutral-600'
                  }`
                }
              >
                Home
              </NavLink>

              {navCategories.map((item) => (
                <div
                  key={item.key}
                  onMouseEnter={() => {
                    if (item.hasMega) setActiveMegaMenu(item.key);
                    else setActiveMegaMenu(null);
                  }}
                  className="relative py-2"
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `font-display text-xs uppercase tracking-widest font-bold transition-colors block ${
                        item.isSale
                          ? 'text-amber-600 hover:text-amber-700 font-extrabold'
                          : isActive
                          ? 'text-neutral-950 font-black'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </div>
              ))}
            </nav>

            {/* Right: Search, Account, Wishlist, Bag */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search Bar Desktop */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex items-center relative"
                role="search"
              >
                <input
                  type="text"
                  placeholder="Search store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 focus:w-60 transition-all duration-300 pl-8 pr-3 py-1.5 bg-neutral-100 border border-transparent focus:border-neutral-900 text-xs focus:outline-none text-neutral-900 placeholder-neutral-500 rounded-none"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
              </form>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="md:hidden p-2 text-neutral-700 hover:text-neutral-950 focus:outline-none"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account Link */}
              <Link
                to="/account"
                className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors relative"
                aria-label="Customer Account"
                title={user ? `Account: ${user.fullName}` : 'Sign In'}
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </Link>

              {/* Admin Portal Link (if admin) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1 px-2 py-1 bg-neutral-950 text-amber-400 font-display text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800"
                  title="Admin Control Center"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => setIsWishlistOpen(true)}
                className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors relative focus:outline-none"
                aria-label="View Saved Items"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-neutral-900 text-white font-display text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Shopping Bag Button */}
              <Link
                to="/cart"
                className="p-2 text-neutral-900 hover:text-black transition-colors relative flex items-center"
                aria-label="Shopping Bag"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-neutral-950" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-neutral-950 text-amber-400 font-display text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Mega Menu Dropdown */}
        <MegaMenu
          activeKey={activeMegaMenu}
          onClose={() => setActiveMegaMenu(null)}
        />
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Wishlist Slide-Over Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />
    </>
  );
}

export default Navbar;
