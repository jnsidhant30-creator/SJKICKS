import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductCard } from '../components/common/ProductCard';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { PRODUCTS } from '../data/products';

const renderWithProviders = (component, route = '/') => {
  return render(
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[route]}>
            {component}
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

describe('Interactive 3D Effects, Animations & Micro-Interactions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('3D ProductCard Presentation', () => {
    const sampleProduct = PRODUCTS[0];

    it('renders with 3D perspective, depth shadows, and specular glare elements', () => {
      const { container } = renderWithProviders(<ProductCard product={sampleProduct} />);

      const cardBody = container.querySelector('.card-3d');
      expect(cardBody).toBeInTheDocument();
      expect(cardBody).toHaveClass('shadow-3d-card');
      expect(cardBody.style.transform).toContain('perspective(1000px)');

      // Glare sheen element exists
      const glare = container.querySelector('.card-3d-glare');
      expect(glare).toBeInTheDocument();
    });

    it('displays product name and price with luxury formatting', () => {
      renderWithProviders(<ProductCard product={sampleProduct} />);

      expect(screen.getByText(sampleProduct.name)).toBeInTheDocument();
      expect(screen.getByText(/View Details/i)).toBeInTheDocument();
    });

    it('triggers Quick Add for one-size items or Quick Inspect for multi-size', () => {
      const oneSizeProduct = PRODUCTS.find((p) => p.category === 'Watches') || sampleProduct;
      renderWithProviders(<ProductCard product={oneSizeProduct} />);

      const actionButton = screen.getByRole('button', { name: /Quick Add/i });
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(screen.getByText(/Added!/i)).toBeInTheDocument();
    });
  });

  describe('ProductDetailPage 3D Presentation & Variant Selectors', () => {
    const shoeProduct = PRODUCTS.find((p) => p.category === 'Shoes');
    const watchProduct = PRODUCTS.find((p) => p.category === 'Watches');

    it('renders 3D image gallery with perspective container and zoom hint', () => {
      const { container } = renderWithProviders(
        <Routes>
          <Route path="/product/:id" element={<ProductDetailPage onOpenSizeGuide={() => {}} />} />
        </Routes>,
        `/product/${shoeProduct.id}`
      );

      const perspectiveContainer = container.querySelector('.perspective-1000');
      expect(perspectiveContainer).toBeInTheDocument();

      expect(screen.getByText(/Hover to Zoom & Pan/i)).toBeInTheDocument();
    });

    it('renders size options for footwear and requires size selection', () => {
      renderWithProviders(
        <Routes>
          <Route path="/product/:id" element={<ProductDetailPage onOpenSizeGuide={() => {}} />} />
        </Routes>,
        `/product/${shoeProduct.id}`
      );

      // Add to bag without selecting size triggers error
      const addToBagBtn = screen.getByRole('button', { name: /Add to Bag/i });
      fireEvent.click(addToBagBtn);

      expect(screen.getByText(/Please select a size before adding to bag/i)).toBeInTheDocument();

      // Click a valid size (e.g. UK 8)
      const sizeBtn = screen.getByRole('button', { name: /UK 8/i });
      fireEvent.click(sizeBtn);

      // Now add to bag succeeds with animated feedback
      fireEvent.click(addToBagBtn);
      expect(screen.getByText(/Added to Bag!/i)).toBeInTheDocument();
    });

    it('displays standard one-size without shoe sizes for watches', () => {
      renderWithProviders(
        <Routes>
          <Route path="/product/:id" element={<ProductDetailPage onOpenSizeGuide={() => {}} />} />
        </Routes>,
        `/product/${watchProduct.id}`
      );

      expect(screen.getByText(/Standard One Size \(Universal Fit\)/i)).toBeInTheDocument();
      expect(screen.queryByText('UK 8')).not.toBeInTheDocument();
    });

    it('toggles wishlist state on heart button click', () => {
      renderWithProviders(
        <Routes>
          <Route path="/product/:id" element={<ProductDetailPage onOpenSizeGuide={() => {}} />} />
        </Routes>,
        `/product/${shoeProduct.id}`
      );

      const wishlistBtns = screen.getAllByRole('button', { name: /Save to wishlist/i });
      const mainWishlistBtn = wishlistBtns[0];
      expect(mainWishlistBtn).toBeInTheDocument();

      fireEvent.click(mainWishlistBtn);

      // Button now indicates item is saved
      expect(screen.getByRole('button', { name: /Remove from wishlist/i })).toBeInTheDocument();
    });
  });

  describe('ScrollReveal & Accessibility', () => {
    it('applies tilt-up perspective transform variant', () => {
      const { container } = render(
        <ScrollReveal variant="tilt-up">
          <div>Animated Content</div>
        </ScrollReveal>
      );

      expect(screen.getByText('Animated Content')).toBeInTheDocument();
      // Should have perspective styling applied
      const style = container.firstChild.style;
      expect(style.transform).toContain('perspective');
    });

    it('respects prefers-reduced-motion accessibility preference', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = render(
        <ScrollReveal variant="tilt-up">
          <div>Accessible Motion</div>
        </ScrollReveal>
      );

      // When reduced motion is preferred, transform is 'none'
      expect(container.firstChild.style.transform).toBe('none');

      window.matchMedia = originalMatchMedia;
    });
  });
});
