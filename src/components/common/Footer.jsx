import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { BRAND_CONFIG } from '../../config/brand';

export function Footer({ onOpenSizeGuide }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubscribed(true);
    showToast('Welcome to the Studio Collective! 10% coupon: SJFIRST', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-900 mt-20">
      {/* Brand Values Ribbon */}
      <div className="border-b border-neutral-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold font-display uppercase tracking-wider text-white">PAN-INDIA DISPATCH</div>
              <div className="text-neutral-400">Complimentary express shipping on ₹2,499+</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold font-display uppercase tracking-wider text-white">14-DAY DOORSTEP EXCHANGES</div>
              <div className="text-neutral-400">Hassle-free sizing exchanges across India</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold font-display uppercase tracking-wider text-white">ATELIER CRAFTSMANSHIP</div>
              <div className="text-neutral-400">100% original silhouettes & bespoke materials</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold font-display uppercase tracking-wider text-white">SIMULATED CHECKOUT</div>
              <div className="text-neutral-400">Safe prototype environment — zero real billing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo inverted />
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mt-4">
              {BRAND_CONFIG.name} is an original multi-category design house uniting architectural streetwear, athletic propulsion footwear, precision timepieces, and hand-finished leather accessories. Engineered in {BRAND_CONFIG.originCity}.
            </p>
            {/* Newsletter Subscription */}
            <div className="pt-2">
              <span className="block font-display text-xs uppercase font-bold text-white tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                JOIN THE ATELIER DROP LIST
              </span>
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold py-2">
                  <CheckCircle2 className="w-4 h-4" /> You're subscribed to private runway drops.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    aria-label="Email for newsletter"
                    className="flex-1 bg-neutral-900 border border-neutral-700 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white rounded-none"
                  />
                  <button
                    type="submit"
                    className="bg-white text-neutral-950 font-display text-xs font-bold px-4 hover:bg-neutral-200 transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    Join <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Col 2: Footwear */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-white font-bold mb-4">
              Footwear
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/shoes" className="hover:text-white transition-colors">
                  All Footwear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Shoes&subcategory=running-shoes" className="hover:text-white transition-colors">
                  Carbon Running Shoes
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Shoes&subcategory=sneakers" className="hover:text-white transition-colors">
                  Streetwear Sneakers
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Shoes&subcategory=boots" className="hover:text-white transition-colors">
                  Lug Chelsea Boots
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Shoes&subcategory=formal-shoes" className="hover:text-white transition-colors">
                  Architect Derby Shoes
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Shoes&subcategory=sandals" className="hover:text-white transition-colors">
                  Molded Atelier Slides
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Apparel & Collections */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-white font-bold mb-4">
              Fashion & Apparel
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/clothing" className="hover:text-white transition-colors">
                  All Clothing
                </Link>
              </li>
              <li>
                <Link to="/men" className="hover:text-white transition-colors">
                  Men's Atelier
                </Link>
              </li>
              <li>
                <Link to="/women" className="hover:text-white transition-colors">
                  Women's Atelier
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Clothing&subcategory=jackets" className="hover:text-white transition-colors">
                  Coats & Outerwear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Clothing&subcategory=t-shirts" className="hover:text-white transition-colors">
                  Heavyweight Box Tees
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Clothing&subcategory=ethnic-wear" className="hover:text-white transition-colors">
                  Contemporary Kurtas
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Timepieces & Concierge */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-white font-bold mb-4">
              Timepieces & Help
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/watches" className="hover:text-white transition-colors">
                  Minimalist Watches
                </Link>
              </li>
              <li>
                <Link to="/accessories" className="hover:text-white transition-colors">
                  Bags & Travel Duffels
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="hover:text-white transition-colors text-left"
                >
                  Size Conversion Guide
                </button>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">
                  Client Profile & Orders
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=sale" className="text-amber-400 hover:text-amber-300 font-bold">
                  Seasonal Archive Sale
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} {BRAND_CONFIG.name} Collective. All original rights reserved.
          </div>
          <div className="flex gap-6 text-[11px]">
            <span>Currencies: INR (₹)</span>
            <span>Zero real payment tokens collected</span>
            <span>Pan-India Logistics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
