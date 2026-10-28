/**
 * Category & Taxonomy Architecture
 * Configurable multi-category system supporting Shoes, Clothing, Watches, and Accessories
 * across Men, Women, and Unisex audiences.
 */

export const AUDIENCES = [
  { id: 'all', label: 'All Shoppers', value: 'All', path: '/shop' },
  { id: 'men', label: 'Men', value: 'Men', path: '/men' },
  { id: 'women', label: 'Women', value: 'Women', path: '/women' },
  { id: 'unisex', label: 'Unisex', value: 'Unisex', path: '/shop?gender=Unisex' },
];

export const CATEGORIES_DATA = [
  {
    id: 'shoes',
    name: 'Shoes',
    slug: 'shoes',
    path: '/shoes',
    description: 'Performance propulsion runners, heritage hardwood low-tops, and sculpted luxury footwear.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      { name: 'Sneakers', slug: 'sneakers' },
      { name: 'Running Shoes', slug: 'running-shoes' },
      { name: 'Casual Shoes', slug: 'casual-shoes' },
      { name: 'Formal Shoes', slug: 'formal-shoes' },
      { name: 'Boots', slug: 'boots' },
      { name: 'Sandals', slug: 'sandals' },
    ],
    sizeType: 'numeric',
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'],
    featuredTags: ['Carbon Plate', 'Streetwear', 'Retro Court', 'Minimalist'],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    slug: 'clothing',
    path: '/clothing',
    description: 'Architectural tailoring, heavyweight organic cottons, and technical weatherproof outerwear.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      { name: 'T-Shirts', slug: 't-shirts' },
      { name: 'Shirts', slug: 'shirts' },
      { name: 'Tops', slug: 'tops' },
      { name: 'Hoodies', slug: 'hoodies' },
      { name: 'Sweatshirts', slug: 'sweatshirts' },
      { name: 'Jackets', slug: 'jackets' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Trousers', slug: 'trousers' },
      { name: 'Cargo Pants', slug: 'cargo-pants' },
      { name: 'Shorts', slug: 'shorts' },
      { name: 'Dresses', slug: 'dresses' },
      { name: 'Ethnic Wear', slug: 'ethnic-wear' },
    ],
    sizeType: 'apparel',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    featuredTags: ['Heavyweight 320GSM', 'Technical Twill', 'Japanese Denim', 'Sculpted Knits'],
  },
  {
    id: 'watches',
    name: 'Watches',
    slug: 'watches',
    path: '/watches',
    description: 'Precision Swiss-inspired minimal automatics, kinetic solar movements, and stealth smartwatches.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      { name: 'Analog', slug: 'analog' },
      { name: 'Digital', slug: 'digital' },
      { name: 'Smartwatches', slug: 'smartwatches' },
      { name: 'Minimal Watches', slug: 'minimal-watches' },
    ],
    sizeType: 'one-size',
    sizes: ['One Size (Standard)', '40mm', '44mm'],
    featuredTags: ['Sapphire Crystal', 'Titanium Case', '5ATM Water Resistance', 'Solar Drive'],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    path: '/accessories',
    description: 'Hand-finished nappa leather travel gear, structural caps, and Japanese acetate eyewear.',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      { name: 'Bags', slug: 'bags' },
      { name: 'Backpacks', slug: 'backpacks' },
      { name: 'Belts', slug: 'belts' },
      { name: 'Wallets', slug: 'wallets' },
      { name: 'Caps', slug: 'caps' },
      { name: 'Sunglasses', slug: 'sunglasses' },
      { name: 'Fashion Accessories', slug: 'fashion-accessories' },
    ],
    sizeType: 'one-size',
    sizes: ['One Size (Standard)'],
    featuredTags: ['Full-Grain Leather', 'Polarized UV400', 'Waterproof Ballistic Nylon'],
  },
];

// Helper to look up category by slug or name
export function getCategoryBySlugOrName(identifier) {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  return (
    CATEGORIES_DATA.find(
      (c) => c.slug.toLowerCase() === clean || c.name.toLowerCase() === clean
    ) || null
  );
}

// Helper to get available sizes for a given category
export function getSizesForCategory(categoryName) {
  const cat = getCategoryBySlugOrName(categoryName);
  if (!cat) return ['One Size (Standard)'];
  return cat.sizes;
}
