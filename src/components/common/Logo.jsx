import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../../config/brand';

export function Logo({ className = '', inverted = false }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 shrink-0 py-1 ${className}`}
      aria-label={`${BRAND_CONFIG.name} Home`}
    >
      {/* Editorial Luxury Monogram Emblem */}
      <div className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        >
          {/* Bevelled Luxury Block */}
          <rect
            width="36"
            height="36"
            rx="2"
            className={inverted ? 'fill-white' : 'fill-neutral-950'}
          />
          {/* High fashion 'S' curve */}
          <path
            d="M9 11H22C24.2091 11 26 12.7909 26 15C26 17.2091 24.2091 19 22 19H14V25H9V11Z"
            className={inverted ? 'fill-neutral-950' : 'fill-white'}
          />
          {/* Architectural 'J' hook */}
          <path
            d="M27 12H31V23C31 26.3137 28.3137 29 25 29H18V24H25C26.1046 24 27 23.1046 27 22V12Z"
            className={inverted ? 'fill-neutral-800' : 'fill-neutral-300'}
          />
          {/* Tonal Gold / Amber Accent Bar */}
          <rect
            x="9"
            y="26"
            width="6"
            height="3"
            className={inverted ? 'fill-amber-400' : 'fill-amber-500'}
          />
        </svg>
      </div>

      <div className="flex flex-col justify-center leading-none select-none min-w-0">
        <span
          className={`font-display text-lg sm:text-xl lg:text-2xl font-black tracking-widest leading-none ${
            inverted ? 'text-white' : 'text-neutral-950'
          }`}
        >
          {BRAND_CONFIG.name}
        </span>
        <span
          className={`text-[7px] sm:text-[7.5px] lg:text-[8px] font-bold tracking-[0.18em] sm:tracking-[0.22em] uppercase mt-1 leading-none whitespace-nowrap ${
            inverted ? 'text-neutral-400' : 'text-neutral-500'
          }`}
        >
          {BRAND_CONFIG.tagline}
        </span>
      </div>
    </Link>
  );
}

export default Logo;
