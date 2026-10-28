import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Home, ShoppingBag } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 text-amber-400 font-display text-xs uppercase tracking-widest">
          <Compass className="w-3.5 h-3.5" />
          <span>Error 404 • Missing Track</span>
        </div>

        <h1 className="font-display text-6xl sm:text-8xl font-black uppercase tracking-tighter text-neutral-950 leading-none">
          LOST YOUR <br />
          <span className="text-neutral-400">STRIDE?</span>
        </h1>

        <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
          The silhouette or runway page you're searching for might have dropped off the schedule, moved to our archival vault, or never existed in the first place.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>

          <Link
            to="/shop"
            className="px-6 py-3.5 bg-neutral-100 border border-neutral-300 text-neutral-900 font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Browse All Kicks
          </Link>
        </div>

        <div className="pt-12 border-t border-neutral-200 text-xs text-neutral-400">
          SJ KICKS • BUILT TO MOVE
        </div>
      </div>
    </div>
  );
}
