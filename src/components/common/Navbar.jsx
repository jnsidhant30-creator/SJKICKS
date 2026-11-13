import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, User, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { WishlistModal } from './WishlistModal';
import { MegaMenu } from './MegaMenu';
import { MobileDrawer } from './MobileDrawer';

export function Navbar() {
  const navigate = useNavigate();
  const { cartCount, wishlist } = useCart();
  const { user, isAdmin } = useAuth();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null); // 'men' | 'women' | 'shoes' | 'clothing' | 'watches' | 'accessories' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);

  // Scroll position listener for dynamic navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger bounce animation when cart count changes
  useEffect(() => {
    if (cartCount > 0) {
      setBadgeBump(true);
      const timer = setTimeout(() => setBadgeBump(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
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
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled ? 'shadow-md shadow-neutral-950/5' : 'shadow-2xs'
        }`}
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        {/* Top Announcement Bar */}
        <div className="w-full bg-neutral-950 text-white text-[10px] sm:text-[11px] font-medium py-1.5 sm:py-2 px-3 sm:px-4 text-center tracking-wider font-display uppercase border-b border-neutral-800 shrink-0 select-none relative overflow-hidden">
          {/* Subtle gradient shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5 leading-tight relative z-10">
            <span className="text-amber-400 font-bold inline-flex items-center gap-1">
              <span className="animate-pulse">⚡</span>
              <span className="hidden xs:inline sm:inline">ATELIER COUTURE & PERFORMANCE:</span>
              <span className="xs:hidden sm:hidden">ATELIER:</span>
            </span>
            <span className="text-neutral-200">Free Express Delivery on orders above ₹2,499</span>
            <span className="hidden md:inline text-neutral-600">•</span>
            <span className="hidden md:inline text-neutral-300">
              Use code{' '}
              <strong className="text-white bg-neutral-800 px-1.5 py-0.5 tracking-widest font-mono text-[10px] border border-neutral-700/80 hover:border-amber-400/60 transition-colors">
                SJFIRST
              </strong>{' '}
              for 10% off
            </span>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div
          className={`w-full transition-all duration-300 ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs'
              : 'bg-white/95 backdrop-blur-md border-b border-neutral-200/90'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`flex items-center justify-between transition-all duration-300 gap-2 sm:gap-4 ${
                isScrolled ? 'h-15 sm:h-16 lg:h-17' : 'h-16 md:h-18 lg:h-20'
              }`}
            >
              {/* Left: Mobile Toggle & Brand Logo */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="lg:hidden p-1.5 sm:p-2 -ml-1 text-neutral-900 hover:text-black focus:outline-none transition-transform active:scale-95"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <div className="transition-transform duration-300 hover:scale-[1.01]">
                  <Logo />
                </div>
              </div>

              {/* Center: Desktop Navigation Links with Mega Menu Triggers */}
              <nav className="hidden lg:flex items-center gap-2 xl:gap-3.5 2xl:gap-5 min-w-0" aria-label="Main Navigation">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `font-display text-[11px] xl:text-xs uppercase tracking-wider xl:tracking-widest font-bold transition-all py-2 whitespace-nowrap nav-underline hover:text-neutral-950 ${
                      isActive ? 'text-neutral-950 font-black active' : 'text-neutral-600'
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
                    className="relative py-2 flex items-center"
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `font-display text-[11px] xl:text-xs uppercase tracking-wider xl:tracking-widest font-bold transition-all block whitespace-nowrap nav-underline ${
                          item.isSale
                            ? 'text-amber-600 hover:text-amber-700 font-extrabold'
                            : isActive
                            ? 'text-neutral-950 font-black active'
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
              <div className="flex items-center gap-1 sm:gap-2 xl:gap-3 shrink-0">
                {/* Search Bar Desktop */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="hidden md:flex items-center relative group"
                  role="search"
                >
                  <input
                    type="text"
                    placeholder="Search store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-24 lg:w-28 xl:w-36 2xl:w-48 focus:w-48 focus:xl:w-56 transition-all duration-300 pl-8 pr-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-100/80 border border-transparent focus:border-neutral-900 text-xs focus:outline-none text-neutral-900 placeholder-neutral-500 rounded-none focus:bg-white focus:shadow-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 absolute left-2.5 pointer-events-none transition-colors" />
                </form>

                {/* Mobile Search Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="md:hidden p-2 text-neutral-700 hover:text-neutral-950 focus:outline-none transition-transform active:scale-95"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Account Link */}
                <Link
                  to="/account"
                  className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors relative hover:scale-105 active:scale-95"
                  aria-label="Customer Account"
                  title={user ? `Account: ${user.fullName}` : 'Sign In'}
                >
                  <User className="w-5 h-5" />
                  {user && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                  )}
                </Link>

                {/* Admin Portal Link (if admin) */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-neutral-950 text-amber-400 font-display text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors border border-amber-400/30"
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
                  className="p-2 text-neutral-700 hover:text-neutral-950 transition-all relative focus:outline-none hover:scale-105 active:scale-95 group"
                  aria-label="View Saved Items"
                >
                  <Heart className="w-5 h-5 group-hover:text-rose-600 transition-colors" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-1 right-1 bg-neutral-900 text-white font-display text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-bounce">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Shopping Bag Button */}
                <Link
                  to="/cart"
                  className="p-2 text-neutral-900 hover:text-black transition-all relative flex items-center hover:scale-105 active:scale-95"
                  aria-label="Shopping Bag"
                >
                  <div className="relative">
                    <ShoppingBag
                      className={`w-5 h-5 text-neutral-950 transition-transform ${
                        badgeBump ? 'scale-115 rotate-[-8deg]' : ''
                      }`}
                    />
                    {cartCount > 0 && (
                      <span
                        key={cartCount}
                        className={`absolute -top-1.5 -right-2 bg-neutral-950 text-amber-400 font-display text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs ${
                          badgeBump ? 'animate-scale-bounce' : ''
                        }`}
                      >
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
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
