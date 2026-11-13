import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// JSDOM matchMedia mock
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// JSDOM IntersectionObserver mock
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = MockIntersectionObserver;
  }
  if (!window.scrollTo) {
    window.scrollTo = vi.fn();
  }
}

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch {
    // In case localStorage is not available
  }
});
