import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Watch } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { CATEGORIES_DATA } from '../data/categories';
import { ProductCard } from '../components/common/ProductCard';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { BRAND_CONFIG } from '../config/brand';

export function HomePage() {
  const featuredWatchesAndAccessories = PRODUCTS.filter(
    (p) => p.category === 'Watches' || p.category === 'Accessories'
  ).slice(0, 4);
  const newArrivals = PRODUCTS.filter((p) => p.isNew).slice(0, 4);
  const bestsellers = PRODUCTS.filter((p) => p.isBestseller).slice(0, 4);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* 1. FASHION CAMPAIGN HERO */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        {/* Subtle radial ambient lighting */}
        <div className="absolute inset-0 bg-radial from-neutral-800/40 via-neutral-950 to-neutral-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Typography */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-700/80 text-amber-400 font-display text-xs uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2026 Runway & Athletic Collection</span>
              </div>

              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                THE MONOCHROME <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-amber-400">
                  ATELIER.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 max-w-xl font-normal leading-relaxed">
                {BRAND_CONFIG.name} unites architectural tailoring, carbon-plate athletic footwear, Swiss-calibre timepieces, and hand-finished Italian leather goods for men, women, and unisex aesthetics.
              </p>

              {/* Dual Primary CTAs */}
              <div className="pt-2 flex flex-wrap gap-4 items-center">
                <Link
                  to="/men"
                  className="px-7 py-4 bg-white text-neutral-950 font-display font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  Shop Men <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/women"
                  className="px-7 py-4 bg-neutral-900 border border-neutral-700 text-white font-display font-bold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  Shop Women <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/shop"
                  className="px-6 py-4 text-neutral-400 font-display font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  Explore All →
                </Link>
              </div>

              {/* Quick stats micro-bar */}
              <div className="pt-8 border-t border-neutral-800/80 grid grid-cols-3 gap-6 max-w-lg text-left">
                <div>
                  <div className="font-display text-2xl font-bold text-white">4 Verticals</div>
                  <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    Shoes • Apparel • Watches • Bags
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-white">100%</div>
                  <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    Original Architecture
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-amber-400">Pan-India</div>
                  <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    ₹0 Shipping Over ₹2.4K
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-4 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="relative bg-neutral-900 border border-neutral-800 p-4 shadow-2xl">
                  <div className="aspect-4/3 overflow-hidden bg-neutral-950">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80"
                      alt="SJ Studio Haute Couture Tailoring"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Floating Tag */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-display">
                        COLLECTION EDIT
                      </span>
                      <h4 className="font-display text-base font-bold text-white uppercase">
                        Virgin Wool Tailored Overcoat
                      </h4>
                    </div>
                    <Link
                      to="/product/sjk-sculpted-wool-overcoat"
                      className="px-3 py-1.5 bg-white text-neutral-950 font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                    >
                      View Piece
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEDICATED AUDIENCE PORTALS (MEN / WOMEN / UNISEX) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
              Curated Portals
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950">
              Shop By Audience
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Men's Portal */}
          <Link
            to="/men"
            className="group relative h-96 overflow-hidden bg-neutral-900 flex flex-col justify-end p-8 text-white border border-neutral-200"
          >
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
              alt="Men's Collection"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
                Tailored & Footwear
              </span>
              <h3 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                Men's Collection
              </h3>
              <p className="text-xs text-neutral-300">
                Heavyweight knits, selvedge denim, carbon runners & formal derbies.
              </p>
              <span className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors">
                Explore Men's Drop <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Women's Portal */}
          <Link
            to="/women"
            className="group relative h-96 overflow-hidden bg-neutral-900 flex flex-col justify-end p-8 text-white border border-neutral-200"
          >
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
              alt="Women's Collection"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
                Sculpted & Elegant
              </span>
              <h3 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                Women's Collection
              </h3>
              <p className="text-xs text-neutral-300">
                Sculpted trench coats, ribbed knit midi dresses, studio sneakers.
              </p>
              <span className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors">
                Explore Women's Drop <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Unisex Portal */}
          <Link
            to="/shop?gender=Unisex"
            className="group relative h-96 overflow-hidden bg-neutral-900 flex flex-col justify-end p-8 text-white border border-neutral-200"
          >
            <img
              src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
              alt="Unisex Atelier"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
                Universal Atelier
              </span>
              <h3 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                Unisex Atelier
              </h3>
              <p className="text-xs text-neutral-300">
                Box tees, loopback hoodies, minimalist timepieces & leather luggage.
              </p>
              <span className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors">
                Explore Unisex <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. FOUR MAJOR CATEGORY TILES (SHOES, CLOTHING, WATCHES, ACCESSORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
              Taxonomy
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950">
              Explore Collections
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 flex items-center gap-1 font-display"
          >
            All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.id}
              to={cat.path}
              className="group flex flex-col bg-white border border-neutral-200 hover:border-neutral-950 transition-all duration-300"
            >
              <div className="aspect-4/3 w-full bg-neutral-100 overflow-hidden relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-950 group-hover:text-neutral-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-display font-bold uppercase tracking-wider text-neutral-900">
                  <span>{cat.subcategories.length} Subcategories</span>
                  <span>View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. NEW ARRIVALS CAROUSEL / GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-amber-600 font-display">
              <Sparkles className="w-3 h-3" />
              <span>Direct From Studio</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop?filter=new"
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 flex items-center gap-1 font-display"
          >
            View All New <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. WATCHES & ACCESSORIES EDITORIAL SPOTLIGHT */}
      <section className="bg-neutral-950 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-amber-400 font-display text-xs uppercase tracking-widest">
                <Watch className="w-3.5 h-3.5" />
                <span>Horology & Leather Craft</span>
              </div>

              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                PRECISION INSTRUMENTS <br />
                <span className="text-neutral-400">& LUXURY TRAVEL GEAR.</span>
              </h2>

              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                Every timepiece is encased in surgical-grade 316L steel or Grade 5 aerospace titanium, paired with scratch-resistant sapphire crystal. Our travel holdalls and duffels are handcrafted from full-grain vegetable-tanned nappa leathers.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/watches"
                  className="px-6 py-3.5 bg-white text-neutral-950 font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  Explore Timepieces
                </Link>
                <Link
                  to="/accessories"
                  className="px-6 py-3.5 bg-neutral-900 border border-neutral-700 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  Explore Leather Goods
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuredWatchesAndAccessories.slice(0, 2).map((item) => (
                <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-4">
                  <div className="aspect-4/3 overflow-hidden bg-neutral-950">
                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="font-display text-base font-bold text-white line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    <Link
                      to={`/product/${item.id}`}
                      className="text-xs font-display font-bold uppercase tracking-wider text-amber-400 hover:text-white"
                    >
                      Inspect →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. BESTSELLERS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
              Iconic Pieces
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 mt-1">
              Bestsellers
            </h2>
          </div>
          <Link
            to="/shop?filter=bestseller"
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 flex items-center gap-1 font-display"
          >
            All Bestsellers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. BRAND STORY & PHILOSOPHY */}
      <section id="story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-100 p-8 sm:p-12 md:p-16 border border-neutral-200">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
              The Manifesto
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 leading-tight">
              ENGINEERED FOR MOTION. <br />
              SCULPTED FOR RUNWAY AND STREET.
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Founded in {BRAND_CONFIG.originYear}, {BRAND_CONFIG.name} was established to eliminate the boundary between athletic performance engineering and high-fashion minimalism. From marathon propulsion plates to Kurabo Japanese denim and Swiss-inspired automatics, every silhouette is tested rigorously before launch.
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="px-6 py-3 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-neutral-800 transition-colors"
              >
                Explore The Complete Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
