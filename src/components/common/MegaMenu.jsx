import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CATEGORIES_DATA } from '../../data/categories';

export function MegaMenu({ activeKey, onClose }) {
  if (!activeKey) return null;

  // Determine category content
  let categoryInfo = null;

  if (activeKey === 'men') {
    categoryInfo = {
      title: "Men's Collection",
      tagline: 'High-Performance Tailoring & Footwear for Men',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
      ctaText: 'Shop All Men',
      ctaLink: '/men',
      groups: [
        {
          name: 'Footwear',
          links: [
            { label: 'Running Shoes', path: '/shop?category=Shoes&subcategory=running-shoes&gender=Men' },
            { label: 'Casual & Court Sneakers', path: '/shop?category=Shoes&subcategory=casual-shoes&gender=Men' },
            { label: 'Lug Chelsea Boots', path: '/shop?category=Shoes&subcategory=boots&gender=Men' },
            { label: 'Architect Derby Shoes', path: '/shop?category=Shoes&subcategory=formal-shoes&gender=Men' },
          ],
        },
        {
          name: 'Apparel',
          links: [
            { label: 'Wool Overcoats & Jackets', path: '/shop?category=Clothing&subcategory=jackets&gender=Men' },
            { label: 'Heavyweight Box Tees', path: '/shop?category=Clothing&subcategory=t-shirts&gender=Men' },
            { label: 'Selvedge Denim Jeans', path: '/shop?category=Clothing&subcategory=jeans&gender=Men' },
            { label: 'Raw Silk Atelier Kurtas', path: '/shop?category=Clothing&subcategory=ethnic-wear&gender=Men' },
          ],
        },
        {
          name: 'Watches & Gear',
          links: [
            { label: 'Sub-Heritage Diver Watches', path: '/shop?category=Watches&subcategory=analog&gender=Men' },
            { label: 'Titanium Smartwatches', path: '/shop?category=Watches&subcategory=smartwatches' },
            { label: 'Nappa Leather Duffels', path: '/shop?category=Accessories&subcategory=bags' },
            { label: 'Reversible Italian Belts', path: '/shop?category=Accessories&subcategory=belts' },
          ],
        },
      ],
    };
  } else if (activeKey === 'women') {
    categoryInfo = {
      title: "Women's Collection",
      tagline: 'Sculpted Silhouettes, Engineered Knits & Modern Accessories',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      ctaText: 'Shop All Women',
      ctaLink: '/women',
      groups: [
        {
          name: 'Footwear',
          links: [
            { label: 'Horizon Pro Runners', path: '/shop?category=Shoes&subcategory=running-shoes&gender=Women' },
            { label: 'CloudDrift Studio Elite', path: '/shop?category=Shoes&gender=Women' },
            { label: 'Molded Atelier Slides', path: '/shop?category=Shoes&subcategory=sandals&gender=Women' },
          ],
        },
        {
          name: 'Apparel',
          links: [
            { label: 'Sculpted Trench Coats', path: '/shop?category=Clothing&subcategory=jackets&gender=Women' },
            { label: 'Ribbed Knit Midi Dresses', path: '/shop?category=Clothing&subcategory=dresses&gender=Women' },
            { label: 'Pleated Wide Trousers', path: '/shop?category=Clothing&subcategory=trousers&gender=Women' },
            { label: 'Heavy French Terry Hoodies', path: '/shop?category=Clothing&subcategory=hoodies&gender=Women' },
          ],
        },
        {
          name: 'Accessories',
          links: [
            { label: 'Minimalist 40mm Watches', path: '/shop?category=Watches' },
            { label: 'Mazzucchelli Acetate Eyewear', path: '/shop?category=Accessories&subcategory=sunglasses' },
            { label: 'Sterling Silver 925 Cuff', path: '/shop?category=Accessories&subcategory=fashion-accessories' },
          ],
        },
      ],
    };
  } else {
    // Look up directly from CATEGORIES_DATA
    const found = CATEGORIES_DATA.find((c) => c.slug === activeKey || c.id === activeKey);
    if (found) {
      // Split subcategories into 2 columns
      const half = Math.ceil(found.subcategories.length / 2);
      const col1 = found.subcategories.slice(0, half);
      const col2 = found.subcategories.slice(half);

      categoryInfo = {
        title: found.name,
        tagline: found.description,
        image: found.image,
        ctaText: `Explore All ${found.name}`,
        ctaLink: found.path,
        groups: [
          {
            name: `${found.name} Categories`,
            links: col1.map((s) => ({
              label: s.name,
              path: `/shop?category=${encodeURIComponent(found.name)}&subcategory=${encodeURIComponent(s.slug)}`,
            })),
          },
          {
            name: 'More Categories',
            links: col2.map((s) => ({
              label: s.name,
              path: `/shop?category=${encodeURIComponent(found.name)}&subcategory=${encodeURIComponent(s.slug)}`,
            })),
          },
          {
            name: 'Curated Edits',
            links: [
              { label: 'New Arrivals', path: `/shop?category=${encodeURIComponent(found.name)}&filter=new` },
              { label: 'Bestseller Silhouettes', path: `/shop?category=${encodeURIComponent(found.name)}&filter=bestseller` },
              { label: 'Shop Men', path: `/shop?category=${encodeURIComponent(found.name)}&gender=Men` },
              { label: 'Shop Women', path: `/shop?category=${encodeURIComponent(found.name)}&gender=Women` },
            ],
          },
        ],
      };
    }
  }

  if (!categoryInfo) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-2xl z-50 animate-fade-in"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Columns for subcategories and links */}
          <div className="col-span-8 grid grid-cols-3 gap-6">
            {categoryInfo.groups.map((group) => (
              <div key={group.name} className="space-y-3">
                <h4 className="font-display text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-100 pb-2">
                  {group.name}
                </h4>
                <ul className="space-y-2 text-xs">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        onClick={onClose}
                        className="text-neutral-600 hover:text-neutral-950 font-medium transition-all block py-0.5 hover:translate-x-1"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right Editorial Campaign Banner */}
          <div className="col-span-4 border-l border-neutral-100 pl-8">
            <div className="relative group overflow-hidden bg-neutral-950 text-white p-5 aspect-4/3 flex flex-col justify-end">
              <img
                src={categoryInfo.image}
                alt={categoryInfo.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white text-neutral-950 font-display text-[9px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>EDITORIAL CAMPAIGN</span>
                </div>
                <h3 className="font-display text-xl font-black uppercase tracking-tight text-white leading-tight">
                  {categoryInfo.title}
                </h3>
                <p className="text-[11px] text-neutral-300 line-clamp-2">
                  {categoryInfo.tagline}
                </p>
                <Link
                  to={categoryInfo.ctaLink}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 pt-1 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors"
                >
                  {categoryInfo.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MegaMenu;
