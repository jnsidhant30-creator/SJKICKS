import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal Component
 * Smoothly animates children into view when scrolled onto screen
 *
 * Props:
 * - variant: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'fade' (default: 'fade-up')
 * - delay: number in ms (default: 0)
 * - duration: number in ms (default: 600)
 * - className: custom class names
 * - stagger: boolean (if true, staggers direct child animations)
 */
export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.1,
  once = true,
  stagger = false,
  as: Component = 'div',
  ...rest
}) {
  const [isVisible, setIsVisible] = useState(() => {
    // If running in SSR or environments without window/IntersectionObserver, default to visible
    return typeof window === 'undefined' || !('IntersectionObserver' in window);
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  // Determine transition styles according to variant
  const getVariantStyles = () => {
    if (prefersReducedMotion) {
      return { opacity: 1, transform: 'none', transition: 'none' };
    }

    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    switch (variant) {
      case 'fade-left':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
          transition: baseTransition,
        };
      case 'fade-right':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
          transition: baseTransition,
        };
      case 'scale':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.92)',
          transition: baseTransition,
        };
      case 'fade':
        return {
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        };
      case 'tilt-up':
      case 'perspective-up':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? 'perspective(1000px) rotateX(0deg) translateY(0)'
            : 'perspective(1000px) rotateX(8deg) translateY(36px)',
          transformOrigin: '50% 100%',
          transition: baseTransition,
        };
      case 'fade-up':
      default:
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
          transition: baseTransition,
        };
    }
  };

  return (
    <Component
      ref={elementRef}
      style={getVariantStyles()}
      className={`${className} ${stagger ? 'stagger-children' : ''}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default ScrollReveal;
