import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Logo } from '../components/common/Logo';
import { HomePage } from '../pages/HomePage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { BRAND_CONFIG } from '../config/brand';

const renderWithProviders = (component) => {
  return render(
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            {component}
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

describe('UI Polish: Header, Announcement Bar, Logo, Navigation & Hero', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Announcement Bar & Header Layout', () => {
    it('renders the top announcement bar with brand notice and coupon code', () => {
      renderWithProviders(<Navbar />);
      
      const announcement = screen.getByText(/Free Express Delivery on orders above/i);
      expect(announcement).toBeInTheDocument();

      const coupon = screen.getByText(/SJFIRST/i);
      expect(coupon).toBeInTheDocument();
    });

    it('places the announcement bar at the top with consistent uppercase typography', () => {
      renderWithProviders(<Navbar />);
      
      const header = document.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header.className).toContain('sticky');
      expect(header.className).toContain('top-0');

      const announcementBar = header.firstElementChild;
      expect(announcementBar.className).toContain('bg-neutral-950');
      expect(announcementBar.className).toContain('font-display');
      expect(announcementBar.className).toContain('uppercase');
    });
  });

  describe('Logo Alignment and Tagline Retention', () => {
    it('renders the complete brand name and complete tagline inside the logo', () => {
      renderWithProviders(<Logo />);
      
      const brandName = screen.getByText(BRAND_CONFIG.name);
      expect(brandName).toBeInTheDocument();

      const tagline = screen.getByText(BRAND_CONFIG.tagline);
      expect(tagline).toBeInTheDocument();
      // Tagline should be fully retained without truncation
      expect(tagline.textContent).toBe('HAUTE COUTURE & ATHLETIC PERFORMANCE');
    });

    it('does not use destructive negative margins that clip the tagline', () => {
      renderWithProviders(<Logo />);
      
      const tagline = screen.getByText(BRAND_CONFIG.tagline);
      expect(tagline.className).not.toContain('-mt-');
      expect(tagline.className).toContain('whitespace-nowrap');
      expect(tagline.className).toContain('leading-none');
    });
  });

  describe('Desktop Navigation and Link Wrapping Prevention', () => {
    it('renders New Arrivals with whitespace-nowrap preventing awkward line breaks', () => {
      renderWithProviders(<Navbar />);
      
      const newArrivalsLink = screen.getByRole('link', { name: /new arrivals/i });
      expect(newArrivalsLink).toBeInTheDocument();
      expect(newArrivalsLink.className).toContain('whitespace-nowrap');
    });

    it('renders all key category routes in the desktop navigation', () => {
      renderWithProviders(<Navbar />);
      
      expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /^men$/i })).toHaveAttribute('href', '/men');
      expect(screen.getByRole('link', { name: /^women$/i })).toHaveAttribute('href', '/women');
      expect(screen.getByRole('link', { name: /^shoes$/i })).toHaveAttribute('href', '/shoes');
      expect(screen.getByRole('link', { name: /^clothing$/i })).toHaveAttribute('href', '/clothing');
      expect(screen.getByRole('link', { name: /^watches$/i })).toHaveAttribute('href', '/watches');
      expect(screen.getByRole('link', { name: /^accessories$/i })).toHaveAttribute('href', '/accessories');
      expect(screen.getByRole('link', { name: /sale/i })).toHaveAttribute('href', '/shop?filter=sale');
    });

    it('provides accessible mobile menu trigger', () => {
      renderWithProviders(<Navbar />);
      
      const mobileButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(mobileButton).toBeInTheDocument();
    });
  });

  describe('Hero Section Spacing & Luxury Styling', () => {
    it('renders the luxury monochrome atelier campaign headline', () => {
      renderWithProviders(<HomePage />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toBeInTheDocument();
      expect(headline.textContent).toContain('THE MONOCHROME');
      expect(headline.textContent).toContain('ATELIER');

      // Responsive font sizing to prevent horizontal overflow on smaller screens
      expect(headline.className).toContain('text-4xl');
      expect(headline.className).toContain('font-display');
    });

    it('renders CTAs with luxury black, white, and gold aesthetic', () => {
      renderWithProviders(<HomePage />);
      
      const shopMenBtn = screen.getByRole('link', { name: /shop men/i });
      expect(shopMenBtn).toBeInTheDocument();
      expect(shopMenBtn.className).toContain('bg-white');
      expect(shopMenBtn.className).toContain('text-neutral-950');

      const shopWomenBtn = screen.getByRole('link', { name: /shop women/i });
      expect(shopWomenBtn).toBeInTheDocument();
      expect(shopWomenBtn.className).toContain('bg-neutral-900');
      expect(shopWomenBtn.className).toContain('text-white');
    });
  });
});

