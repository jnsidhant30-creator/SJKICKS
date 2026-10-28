import React, { useState } from 'react';

/**
 * Handles sneaker images gracefully. If the network or remote URL fails,
 * displays a sleek, branded SVG graphic so the UI never displays broken image icons.
 */
export function ImageWithFallback({ src, alt, className = '', ...props }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        className={`bg-neutral-100 flex flex-col items-center justify-center p-6 text-neutral-400 select-none ${className}`}
        role="img"
        aria-label={alt || 'SJ KICKS Sneaker'}
      >
        <svg
          className="w-16 h-16 text-neutral-300 stroke-current mb-2"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 44C12 44 18 42 22 38L34 26C38 22 46 22 52 26L56 30V44H8Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 44H56V48C56 50.2 54.2 52 52 52H12C9.8 52 8 50.2 8 48V44Z"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="28" cy="34" r="2" fill="currentColor" />
          <circle cx="34" cy="30" r="2" fill="currentColor" />
          <path d="M18 36L22 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-bold tracking-widest uppercase text-neutral-500 font-display">
          SJ KICKS
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt || 'SJ KICKS'}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${props.imgClassName || ''}`}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
