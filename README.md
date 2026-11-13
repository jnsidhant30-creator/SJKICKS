
# ⚡ SJ KICKS — Built To Move
### Premium Nike-Inspired Sneaker Ecommerce Experience

Welcome to **SJ KICKS**, an original, high-performance athletic footwear and streetwear brand built from scratch with React, Vite, Tailwind CSS, React Router, and Lucide Icons. Designed with an editorial sportswear aesthetic, bold typography, high-impact photography, INR currency formatting, and zero external paid dependencies.

---

## 🚀 Quick Start (Windows PowerShell)

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on `v24.21.0`)
- **npm**: v9.0.0 or higher (Tested on `v11.19.0`)

> **Note on Windows PowerShell Execution Policy:**
> If you encounter `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled on this system`, use `npm.cmd` instead of `npm`, or run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### Run Locally

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd C:\Users\bhoom\OneDrive\Documents\SJKICKS
   ```

2. Install dependencies (if not already installed):
   ```powershell
   npm.cmd install
   ```

3. Start the local development server:
   ```powershell
   npm.cmd run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

5. To build for production and test bundles:
   ```powershell
   npm.cmd run build
   ```

---

## 👟 What Was Built & Features

### 1. Home Page (`/`)
- **Top Announcement Bar**: Express Pan-India delivery alert & promo coupon notice.
- **Editorial Navigation**: Monogram aerodynamic logo emblem, category links, live search, wishlist counter, and bag badge with real-time count.
- **Hero Section ("BUILT TO MOVE.")**: Athletic typography, dynamic subhead, quick action CTAs, and signature shoe showcase.
- **Collections Grid**: High-impact cards for Running (Carbon Series), Lifestyle, Heritage Court, and Above-The-Rim Basketball.
- **Featured Shoes Grid**: Bestseller silhouettes with live hover zoom and wishlist triggers.
- **Spotlight Banner**: "ENGINEERED WITHOUT COMPROMISE" tech breakdown of carbon propulsion plates.
- **New Arrivals**: The freshest drops off the design lab.
- **Brand Origin Story**: Indian sportswear engineering manifesto and craft philosophy.
- **Editorial Footer**: Newsletter signup with instant feedback toast, brand pillars, help links, simulated payment badges, and ₹0 budget notice.

### 2. Shop Page (`/shop`)
- **10 Sample Shoes**: Richly detailed sneakers spanning Running, Lifestyle, Basketball, Court, and Training.
- **Live Search**: Filters in real-time across name, technology, category, and descriptions.
- **Multi-Faceted Filters**:
  - Category (Running, Lifestyle, Basketball, Court, Training)
  - Gender (Men, Women, Unisex)
  - Size (UK 5 to UK 12)
  - Price tiers (Under ₹7,500, ₹7,500–₹12,000, Above ₹12,000)
- **Dynamic Sorting**: Featured, Price: Low to High, Price: High to Low, Newest, and Rating.
- **Active Filter Chips**: 1-click removal of individual filters or "Reset All".
- **Empty States**: Helpful message with reset button if zero matches are found.

### 3. Product Detail Page (`/product/:id`)
- **Multi-Angle Gallery**: Thumbnail previews for main profile, lateral sole, top view, and detail shots.
- **Broken Image Protection**: Custom SVG fallback so network failures never show broken icons.
- **Interactive Colorway Selector**: Visual hex color swatches with active selection.
- **Size Selector (UK / Indian Sizing)**: With stock indicators ("Only 2 left", "In Stock", or "Out of Stock").
- **Size Validation**: Highlights red and shows warning toast if user attempts to Add to Bag without choosing a size.
- **Quantity Stepper**: Limit controls (1 to 5).
- **Interactive Size Guide Modal**: UK, US, EU, and CM measurement conversion chart with fit tips.
- **Tech Specifications Accordion**: Biomechanical specs, material compositions, and cushioning details.
- **One-Click "Buy Now"**: Adds selected kick and navigates directly to checkout.
- **Related Kicks Carousel**: Suggests matching silhouettes from the same category.

### 4. Cart Page (`/cart`)
- **Persistent LocalStorage**: Cart items survive page refreshes and browser restarts.
- **Quantity Adjuster & Removal**: Instant recalculations for line items and subtotal.
- **Free Shipping Progress Meter**: Dynamic bar showing how much more to add to qualify for free shipping (Threshold: ₹2,499).
- **Promo Engine**:
  - `SJFIRST`: 10% off entire order
  - `FREESHIP`: 100% off standard shipping
  - `SJVIP500`: Flat ₹500 off orders above ₹5,000
- **Empty State**: Editorial graphic and direct "Explore Collection" button.

### 5. Checkout Page (`/checkout`)
- **Validated Indian Delivery Address Form**:
  - Full Legal Name (min 3 chars)
  - Email (regex validated for order updates)
  - Mobile Phone (10-digit Indian standard starting with 6–9)
  - PIN Code (6-digit Indian postal code with automatic city/state prefill for demo codes like `560001`, `400001`, `110001`)
  - Address Line 1 (Flat, House No., Building, Street)
  - Area / Locality
  - Landmark (optional)
  - City & State dropdown (24+ Indian states)
- **Simulated Payment Options**:
  - **UPI / QR**: Supports mock Google Pay, PhonePe, Paytm, and BHIM UPI IDs.
  - **Cash on Delivery (COD)**: Doorstep cash or QR verification with ₹0 extra surcharge.
  - **NetBanking**: Simulated portal for HDFC, SBI, ICICI, Axis, Kotak.
  - **Card (Simulated)**: Pre-filled mock card with prominent safety disclaimers.
- **Duplicate Submit Guard**: Disables button and displays loading spinner while processing.
- **Demo Order ID Generation**: Unique reference formatted as `SJK-2026-XXXXXX`.

### 6. Order Confirmation Page (`/order-confirmation`)
- **Animated Success Badge**: High-contrast celebratory banner.
- **Unique Order ID**: With one-click "Copy Order ID" button.
- **Simulated Tracking Milestones**: Order Confirmed -> Quality Check -> Out for Delivery -> Delivered.
- **Delivery Destination Summary**: Shows the complete Indian shipping address.
- **Print Receipt**: Triggers standard browser print dialog for paper or PDF invoice.
- **Full Item Breakdown**: Thumbnails, quantities, sizes, and final INR totals.

### 7. Custom 404 Page (`*`)
- Editorial "LOST YOUR STRIDE?" screen with direct paths back home or to the footwear catalog.

---

## 🛠️ Project Structure

```
SJKICKS/
├── public/
│   ├── favicon.svg               # Original SJ KICKS geometric monogram
│   └── icons.svg
├── src/
│   ├── assets/                   # Static media assets
│   ├── components/
│   │   └── common/
│   │       ├── Badge.jsx         # Product tag pills (BESTSELLER, NEW, LIMITED)
│   │       ├── Footer.jsx        # Editorial sports footer with newsletter & links
│   │       ├── ImageWithFallback.jsx # Fallback SVG image handler
│   │       ├── Logo.jsx          # Original SJ KICKS monogram emblem
│   │       ├── Navbar.jsx        # Sticky navigation with announcement bar & mobile menu
│   │       ├── ProductCard.jsx   # Interactive shoe card with hover effects
│   │       ├── ScrollToTop.jsx   # Route transition scroll reset
│   │       ├── SizeGuideModal.jsx # UK/US/EU/CM size conversion modal
│   │       └── WishlistModal.jsx # Saved kicks slide-over drawer
│   ├── context/
│   │   ├── CartContext.jsx       # Cart & Wishlist state with localStorage sync
│   │   └── ToastContext.jsx      # Bottom-right animated alert notifications
│   ├── data/
│   │   ├── collections.js        # Featured home collections & brand values
│   │   └── products.js           # 10 rich sneaker models, colorways, sizes & stock
│   ├── hooks/
│   │   ├── useOrders.js          # Order creation and retrieval hook
│   │   └── useProducts.js        # Search, filter, and sorting hook
│   ├── pages/
│   │   ├── CartPage.jsx          # Shopping bag & promo code application
│   │   ├── CheckoutPage.jsx      # Indian address form & simulated payment
│   │   ├── HomePage.jsx          # "BUILT TO MOVE." landing experience
│   │   ├── NotFoundPage.jsx      # Editorial 404 screen
│   │   ├── OrderConfirmationPage.jsx # Receipt breakdown & tracking milestones
│   │   ├── ProductDetailPage.jsx # Multi-image gallery & size selection
│   │   └── ShopPage.jsx          # Filterable sneaker catalog
│   ├── utils/
│   │   ├── formatters.js         # INR currency, order calculations & ID generator
│   │   └── storage.js            # Safe localStorage wrapper
│   ├── App.jsx                   # Route declarations and layout tree
│   ├── index.css                 # Tailwind CSS v4 & custom typography
│   └── main.jsx                  # React 19 application entry point
├── index.html                    # SEO tags, Oswald & Plus Jakarta Sans typography
├── package.json                  # Dependencies & build scripts
├── vite.config.js                # Vite configuration with Tailwind CSS v4
└── README.md                     # Documentation
```

---

## 🔄 How to Customize / Replace Sample Products

All catalog products are centralized in:
📂 `src/data/products.js`

To add or modify a shoe, open `src/data/products.js` and add an object following this schema:

```javascript
{
  id: 'sjk-your-model-name',
  name: 'SJ Your Model Name',
  tagline: 'Short athletic punchline',
  category: 'Running', // Running, Lifestyle, Basketball, Court, Training
  gender: 'Unisex',    // Men, Women, Unisex
  price: 11995,        // Integer in INR
  originalPrice: 13995,// Crossed-out MRP (optional)
  badge: 'NEW',        // 'BESTSELLER', 'NEW', 'LIMITED', 'POPULAR', or null
  isFeatured: true,    // Displays on Homepage Featured section
  isNew: true,         // Displays on Homepage New Arrivals section
  rating: 4.9,
  reviewCount: 84,
  description: 'Detailed narrative description of the shoe.',
  features: [
    'Carbon propulsion plate',
    'Breathable monofilament upper',
  ],
  colors: [
    { name: 'Onyx Black', hex: '#111827' },
    { name: 'Bone White', hex: '#f3f4f6' },
  ],
  images: [
    'https://your-image-url-1.jpg',
    'https://your-image-url-2.jpg',
  ],
  sizes: [
    { size: 'UK 7', stock: 5 },
    { size: 'UK 8', stock: 2 }, // Low stock badge
    { size: 'UK 9', stock: 0 }, // Out of stock
    { size: 'UK 10', stock: 8 },
  ],
}
```

---

## 🔒 Limitations & Zero-Budget Simulation Notice

- **No Real Payments**: The checkout is purely simulated. No real payment gateways are connected, and no card/UPI credentials are collected.
- **LocalStorage Storage**: Cart items and orders are stored on the user's local machine (`localStorage`). Clearing browser history/cache will reset the demo data.
- **Images**: Sneaker imagery is sourced via high-reliability Unsplash footwear photography. If offline, the built-in `ImageWithFallback` SVG will display seamlessly.

---

## 🔮 Next Steps: Upgrading to Production Backend & Payments

When you are ready to transition SJ KICKS from a local prototype to a live commerce platform:

### 1. Database & Authentication with Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Install the Supabase JS SDK:
   ```powershell
   npm.cmd install @supabase/supabase-js
   ```
3. Create tables for:
   - `products` (id, title, category, price, images, sizes_stock)
   - `orders` (id, user_id, items, address, status, created_at)
   - `profiles` (user_id, saved_addresses, phone)
4. Replace `src/data/products.js` with live queries via `supabase.from('products').select('*')`.

### 2. Real Payments in India (Razorpay / Cashfree / Stripe)
1. Register for a Razorpay test account at [razorpay.com](https://razorpay.com).
2. Install Razorpay Checkout SDK:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
3. Set up a secure serverless backend (e.g. Supabase Edge Functions or Next.js API route) to create Razorpay Order IDs (`orders.create({ amount, currency: 'INR' })`).
4. Handle the client payment callback and verify payment signatures securely with your Razorpay Key Secret.

---

## 📊 Build & Verification Report

| Test Item | Command / Check | Result |
|---|---|---|
| Node.js Version | `node -v` | `v24.21.0` (Supported) |
| npm Version | `npm.cmd -v` | `11.19.0` (Supported) |
| Production Build | `npm.cmd run build` | **PASSED** (1969 modules transformed in 1.23s, 0 errors) |
| Dev Server Status | `Invoke-WebRequest http://localhost:5173/` | **200 OK** (Serving properly) |
| Local URL | `http://localhost:5173` | Accessible |
| Project Directory | `C:\Users\bhoom\OneDrive\Documents\SJKICKS` | Confirmed |
