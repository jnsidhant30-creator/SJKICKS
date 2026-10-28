import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SizeGuideModal } from './components/common/SizeGuideModal';
import { ScrollToTop } from './components/common/ScrollToTop';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { WishlistPage } from './pages/WishlistPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideCategory, setSizeGuideCategory] = useState('Shoes');

  const openSizeGuideWithCategory = (cat = 'Shoes') => {
    setSizeGuideCategory(cat);
    setIsSizeGuideOpen(true);
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col justify-between bg-neutral-50 text-neutral-900 antialiased selection:bg-neutral-950 selection:text-white">
              <Navbar />

              <main className="flex-1 w-full">
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<HomePage />} />

                  {/* General Shop / Catalog */}
                  <Route path="/shop" element={<ShopPage />} />

                  {/* Dedicated Audience Routes */}
                  <Route path="/men" element={<ShopPage forcedAudience="Men" />} />
                  <Route path="/women" element={<ShopPage forcedAudience="Women" />} />

                  {/* Dedicated Vertical Category Routes */}
                  <Route path="/shoes" element={<ShopPage forcedCategory="Shoes" />} />
                  <Route path="/clothing" element={<ShopPage forcedCategory="Clothing" />} />
                  <Route path="/watches" element={<ShopPage forcedCategory="Watches" />} />
                  <Route path="/accessories" element={<ShopPage forcedCategory="Accessories" />} />

                  {/* Configurable Category Slug Route */}
                  <Route path="/category/:slug" element={<ShopPage />} />

                  {/* Product Detail Page */}
                  <Route
                    path="/product/:id"
                    element={
                      <ProductDetailPage
                        onOpenSizeGuide={() => openSizeGuideWithCategory('Shoes')}
                      />
                    }
                  />

                  {/* Cart / Bag Routes */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/bag" element={<CartPage />} />

                  {/* Checkout & Confirmation */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation" element={<OrderConfirmationPage />} />

                  {/* Customer Account & Wishlist */}
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />

                  {/* Admin Management Dashboard */}
                  <Route path="/admin" element={<AdminPage />} />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <Footer onOpenSizeGuide={() => openSizeGuideWithCategory('Shoes')} />

              {/* Dynamic Size Guide Modal */}
              <SizeGuideModal
                isOpen={isSizeGuideOpen}
                initialCategory={sizeGuideCategory}
                onClose={() => setIsSizeGuideOpen(false)}
              />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
