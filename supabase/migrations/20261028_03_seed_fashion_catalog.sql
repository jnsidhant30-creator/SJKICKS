-- ====================================================================
-- SJ STUDIO / SJ KICKS Seed Catalog Migration
-- Migration: 20261028_03_seed_fashion_catalog.sql
-- Seeds Categories, Subcategories, and initial flagship products
-- ====================================================================

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description, image_url, size_type)
VALUES
  ('shoes', 'Shoes', 'shoes', 'High-performance running silhouettes, hardwood court icons, and luxury footwear.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', 'numeric'),
  ('clothing', 'Clothing', 'clothing', 'Architectural tailoring, heavyweight organic cottons, and technical outerwear.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', 'apparel'),
  ('watches', 'Watches', 'watches', 'Precision minimalist timepieces, kinetic automatics, and titanium smartwatches.', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80', 'one-size'),
  ('accessories', 'Accessories', 'accessories', 'Hand-finished nappa leather luggage, acetate eyewear, and minimalist accents.', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80', 'one-size')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- 2. Insert Subcategories
INSERT INTO public.subcategories (category_id, name, slug)
VALUES
  -- Shoes
  ('shoes', 'Sneakers', 'sneakers'),
  ('shoes', 'Running Shoes', 'running-shoes'),
  ('shoes', 'Casual Shoes', 'casual-shoes'),
  ('shoes', 'Formal Shoes', 'formal-shoes'),
  ('shoes', 'Boots', 'boots'),
  ('shoes', 'Sandals', 'sandals'),

  -- Clothing
  ('clothing', 'T-Shirts', 't-shirts'),
  ('clothing', 'Shirts', 'shirts'),
  ('clothing', 'Tops', 'tops'),
  ('clothing', 'Hoodies', 'hoodies'),
  ('clothing', 'Sweatshirts', 'sweatshirts'),
  ('clothing', 'Jackets', 'jackets'),
  ('clothing', 'Jeans', 'jeans'),
  ('clothing', 'Trousers', 'trousers'),
  ('clothing', 'Cargo Pants', 'cargo-pants'),
  ('clothing', 'Shorts', 'shorts'),
  ('clothing', 'Dresses', 'dresses'),
  ('clothing', 'Ethnic Wear', 'ethnic-wear'),

  -- Watches
  ('watches', 'Analog', 'analog'),
  ('watches', 'Digital', 'digital'),
  ('watches', 'Smartwatches', 'smartwatches'),
  ('watches', 'Minimal Watches', 'minimal-watches'),

  -- Accessories
  ('accessories', 'Bags', 'bags'),
  ('accessories', 'Backpacks', 'backpacks'),
  ('accessories', 'Belts', 'belts'),
  ('accessories', 'Wallets', 'wallets'),
  ('accessories', 'Caps', 'caps'),
  ('accessories', 'Sunglasses', 'sunglasses'),
  ('accessories', 'Fashion Accessories', 'fashion-accessories')
ON CONFLICT (category_id, slug) DO NOTHING;

-- 3. Insert Flagship Multi-Category Products
INSERT INTO public.products (
  id, slug, name, tagline, category, subcategory, audience, price, original_price, badge,
  is_featured, is_new, is_bestseller, is_sale, rating, review_count, description, features, colors, images
)
VALUES
  (
    'sjk-horizon-pro', 'sj-horizon-pro-max', 'SJ Horizon Pro Max', 'Dual-Density Carbon Flight System',
    'Shoes', 'Running Shoes', 'Unisex', 13995, 16995, 'BESTSELLER',
    TRUE, FALSE, TRUE, TRUE, 4.9, 248,
    'Engineered for long-distance marathoners and urban runners who demand explosive propulsion.',
    '["KineticPlate curved full-length carbon propulsion plate", "SJ-AeroWeave breathable monofilament upper", "Dual-Density CloudStrata midsole cushioning"]'::jsonb,
    '[{"name": "Stealth Black / Cyber Lime", "hex": "#171717"}, {"name": "Pure Platinum / Hyper Crimson", "hex": "#e2e8f0"}]'::jsonb,
    '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80"]'::jsonb
  ),
  (
    'sjk-heavyweight-raw-tee', 'sj-320gsm-heavyweight-t-shirt', 'SJ Studio Heavyweight Box Tee', '320 GSM Organic Combed Cotton',
    'Clothing', 'T-Shirts', 'Unisex', 2495, 2995, 'BESTSELLER',
    TRUE, FALSE, TRUE, FALSE, 4.9, 340,
    'The quintessential luxury t-shirt. Cut from custom-knitted 320 GSM combed organic cotton with a relaxed drop-shoulder silhouette.',
    '["320 GSM heavyweight combed organic cotton", "Pre-shrunk vintage wash treatment", "Reinforced double-needle collar maintains structure"]'::jsonb,
    '[{"name": "Washed Vanta Black", "hex": "#1c1917"}, {"name": "Raw Bone Ecru", "hex": "#f5f5f0"}]'::jsonb,
    '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"]'::jsonb
  ),
  (
    'sjk-chrono-minimal-40', 'sj-chrono-minimalist-watch-40mm', 'SJ Chrono-Architect Minimalist 40mm', 'Surgical Grade 316L Steel & Sapphire Crystal',
    'Watches', 'Minimal Watches', 'Unisex', 18495, 21995, 'BESTSELLER',
    TRUE, FALSE, TRUE, FALSE, 5.0, 88,
    'Swiss movement precision meets Bauhaus reduction. Encased in a brushed 316L stainless steel housing with anti-reflective sapphire crystal glass.',
    '["Swiss Ronda quartz chronograph movement", "Scratch-resistant anti-reflective sapphire crystal", "5 ATM (50m) water resistance rating"]'::jsonb,
    '[{"name": "Silver / Matte Black Dial", "hex": "#0f172a"}, {"name": "PVD Rose Gold / Eggshell White", "hex": "#fecdd3"}]'::jsonb,
    '["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80"]'::jsonb
  ),
  (
    'sjk-nappa-weekend-duffel', 'sj-nappa-leather-weekend-duffel', 'SJ Nappa Leather Weekend Duffel', 'Hand-Crafted Full-Grain Leather 45L Holdall',
    'Accessories', 'Bags', 'Unisex', 14995, 17995, 'BESTSELLER',
    TRUE, FALSE, TRUE, FALSE, 4.9, 63,
    'The ultimate travel and studio companion. Constructed from supple full-grain drum-dyed nappa leather with solid brushed brass hardware.',
    '["Full-grain supple calfskin leather with water-repellent finish", "Separate ventilated shoe compartment", "45-Liter capacity meets airline carry-on standards"]'::jsonb,
    '[{"name": "Pitch Black", "hex": "#0f172a"}, {"name": "Rich Cognac", "hex": "#78350f"}]'::jsonb,
    '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Initial Variants
INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, stock)
VALUES
  ('sjk-horizon-pro', 'SJK-HP-08', 'UK 8', 'Stealth Black / Cyber Lime', '#171717', 10),
  ('sjk-horizon-pro', 'SJK-HP-09', 'UK 9', 'Stealth Black / Cyber Lime', '#171717', 15),
  ('sjk-heavyweight-raw-tee', 'SJK-HWT-M', 'M', 'Washed Vanta Black', '#1c1917', 25),
  ('sjk-heavyweight-raw-tee', 'SJK-HWT-L', 'L', 'Washed Vanta Black', '#1c1917', 20),
  ('sjk-chrono-minimal-40', 'SJK-W-CAM-01', 'One Size (Standard)', 'Silver / Matte Black Dial', '#0f172a', 18),
  ('sjk-nappa-weekend-duffel', 'SJK-A-NWD-01', 'One Size (Standard)', 'Pitch Black', '#0f172a', 14)
ON CONFLICT (sku) DO NOTHING;
