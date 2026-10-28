import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variantStyles = {
    bestseller: 'bg-neutral-950 text-amber-400 border border-neutral-800',
    new: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    limited: 'bg-rose-950 text-rose-300 border border-rose-800',
    popular: 'bg-blue-950 text-blue-300 border border-blue-800',
    sale: 'bg-neutral-900 text-neutral-100 border border-neutral-700',
    default: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
  };

  const selectedVariant = variantStyles[variant.toLowerCase()] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase font-display select-none ${selectedVariant} ${className}`}
    >
      {children}
    </span>
  );
}
