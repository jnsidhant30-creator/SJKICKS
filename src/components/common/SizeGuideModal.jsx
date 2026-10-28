import React, { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

export function SizeGuideModal({ isOpen, onClose, initialCategory = 'Shoes' }) {
  const [activeTab, setActiveTab] = useState(
    initialCategory === 'Clothing' ? 'clothing' : initialCategory === 'Watches' ? 'watches' : 'shoes'
  );

  useEffect(() => {
    if (initialCategory) {
      if (initialCategory.toLowerCase().includes('cloth')) setActiveTab('clothing');
      else if (initialCategory.toLowerCase().includes('watch') || initialCategory.toLowerCase().includes('access'))
        setActiveTab('watches');
      else setActiveTab('shoes');
    }
  }, [initialCategory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shoeSizeTable = [
    { uk: 'UK 6', us: 'US 7', eu: 'EU 40.0', cm: '25.0 cm' },
    { uk: 'UK 7', us: 'US 8', eu: 'EU 41.0', cm: '26.0 cm' },
    { uk: 'UK 8', us: 'US 9', eu: 'EU 42.5', cm: '27.0 cm' },
    { uk: 'UK 9', us: 'US 10', eu: 'EU 44.0', cm: '28.0 cm' },
    { uk: 'UK 10', us: 'US 11', eu: 'EU 45.0', cm: '29.0 cm' },
    { uk: 'UK 11', us: 'US 12', eu: 'EU 46.5', cm: '30.0 cm' },
    { uk: 'UK 12', us: 'US 13', eu: 'EU 48.0', cm: '31.0 cm' },
  ];

  const apparelSizeTable = [
    { size: 'XS', chest: '34 - 36 in', waist: '28 - 30 in', shoulder: '17.0 in', length: '27 in' },
    { size: 'S', chest: '36 - 38 in', waist: '30 - 32 in', shoulder: '17.5 in', length: '28 in' },
    { size: 'M', chest: '38 - 40 in', waist: '32 - 34 in', shoulder: '18.2 in', length: '29 in' },
    { size: 'L', chest: '40 - 42 in', waist: '34 - 36 in', shoulder: '19.0 in', length: '30 in' },
    { size: 'XL', chest: '42 - 44 in', waist: '36 - 38 in', shoulder: '19.8 in', length: '31 in' },
    { size: 'XXL', chest: '44 - 46 in', waist: '38 - 40 in', shoulder: '20.5 in', length: '32 in' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
    >
      <div
        className="relative w-full max-w-xl bg-white p-6 md:p-8 shadow-2xl border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-neutral-900" />
            <h3 id="size-guide-title" className="text-xl font-bold font-display tracking-tight text-neutral-950">
              Studio Sizing & Measurement Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-neutral-200 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('shoes')}
            className={`py-2 px-4 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'shoes'
                ? 'border-b-2 border-neutral-950 text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
          >
            Footwear (UK)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clothing')}
            className={`py-2 px-4 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'clothing'
                ? 'border-b-2 border-neutral-950 text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
          >
            Clothing & Tailoring
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watches')}
            className={`py-2 px-4 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'watches'
                ? 'border-b-2 border-neutral-950 text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
          >
            Watches & Gear
          </button>
        </div>

        {/* Tab 1: Shoes */}
        {activeTab === 'shoes' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-neutral-500">
              All footwear is listed in standard <strong>Indian / UK sizing</strong>. Order true to size for lifestyle silhouettes, or half a size up for high-performance carbon plate runners.
            </p>
            <div className="overflow-x-auto border border-neutral-200 max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-950 text-white font-display uppercase tracking-wider text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">UK / India</th>
                    <th className="py-2.5 px-3">US Men</th>
                    <th className="py-2.5 px-3">EU</th>
                    <th className="py-2.5 px-3">Foot Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {shoeSizeTable.map((row, idx) => (
                    <tr key={row.uk} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{row.uk}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{row.us}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{row.eu}</td>
                      <td className="py-2.5 px-3 text-neutral-800">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Clothing */}
        {activeTab === 'clothing' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-neutral-500">
              Our garments are tailored with a modern relaxed drape. For an oversized runway fit, take your regular size. For a slimmer tailored fit, size down one step.
            </p>
            <div className="overflow-x-auto border border-neutral-200 max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-950 text-white font-display uppercase tracking-wider text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest</th>
                    <th className="py-2.5 px-3">Waist</th>
                    <th className="py-2.5 px-3">Shoulder</th>
                    <th className="py-2.5 px-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {apparelSizeTable.map((row, idx) => (
                    <tr key={row.size} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{row.size}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{row.chest}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{row.waist}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{row.shoulder}</td>
                      <td className="py-2.5 px-3 text-neutral-800">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Watches & Accessories */}
        {activeTab === 'watches' && (
          <div className="mt-4 space-y-3 text-xs text-neutral-600">
            <p className="text-neutral-500">
              Timepieces and travel luggage are engineered to universal standard proportions:
            </p>
            <div className="border border-neutral-200 p-4 space-y-2 bg-neutral-50">
              <div>
                <strong className="text-neutral-950 font-display uppercase tracking-wider">Watches:</strong> Case diameters range from 40mm to 44mm. Quick-release strap accommodates wrist circumferences from 150mm to 215mm.
              </div>
              <div>
                <strong className="text-neutral-950 font-display uppercase tracking-wider">Leather Belts:</strong> Width is 32mm. Length fits waist sizes 30 to 40 inches with 5 micro-adjust holes.
              </div>
              <div>
                <strong className="text-neutral-950 font-display uppercase tracking-wider">Luggage & Duffels:</strong> 45-Liter capacity (55 x 35 x 23 cm) tailored for airline overhead cabins with separate ventilated shoe vault.
              </div>
            </div>
          </div>
        )}

        {/* Fit tip banner */}
        <div className="mt-4 p-3 bg-neutral-100 text-neutral-700 text-xs flex gap-3 items-start">
          <div className="font-bold text-neutral-900 font-display shrink-0">EXCHANGE NOTE:</div>
          <div>
            Doorstep size exchanges are 100% complimentary across India within 14 days of delivery.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-neutral-950 text-white font-display text-xs font-bold tracking-wider uppercase hover:bg-black transition-colors"
        >
          Got It, Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default SizeGuideModal;
