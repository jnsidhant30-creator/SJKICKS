import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, X, Check, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

export function CartPage() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    totals,
    updateQuantity,
    removeFromCart,
    activePromo,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoInput.trim()) {
      applyPromoCode(promoInput);
      setPromoInput('');
    }
  };

  const freeShippingPercent = Math.min(
    100,
    Math.round((totals.subtotal / totals.freeShippingThreshold) * 100)
  );

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 animate-float-slow">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-neutral-950">
            Your Bag is Empty
          </h1>

          <p className="text-sm text-neutral-500 leading-relaxed">
            There are no items in your shopping bag. Explore our latest footwear silhouettes, architectural apparel, timepieces, and travel gear.
          </p>

          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all btn-magnetic shadow-lg group cursor-pointer"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="pt-8 border-t border-neutral-200 text-xs text-neutral-400">
            Have a promo code? You can apply it once you add items to your bag.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
          Review Order
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mt-1">
          Shopping Bag ({cartCount})
        </h1>
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="mt-6 p-4 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-neutral-800">
        <div className="space-y-1.5 flex-1">
          <div className="text-xs font-display uppercase tracking-wider font-bold">
            {totals.isFreeShipping ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 animate-scale-bounce" /> You have unlocked FREE Express Shipping!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Add <strong className="text-amber-400">{formatINR(totals.amountToFreeShipping)}</strong> more to get FREE shipping
              </span>
            )}
          </div>
          <div className="w-full sm:w-80 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700 rounded-full shadow-xs"
              style={{ width: `${freeShippingPercent}%` }}
            />
          </div>
        </div>
        <div className="text-[11px] text-neutral-400 uppercase tracking-widest font-mono">
          Threshold: {formatINR(totals.freeShippingThreshold)}
        </div>
      </div>

      {/* 2-Column Cart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
        {/* Cart Items List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.cartItemId}
              className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-neutral-200 hover:border-neutral-300 transition-all card-lift shadow-2xs"
            >
              {/* Product Thumbnail */}
              <Link
                to={`/product/${item.productId}`}
                className="w-full sm:w-28 sm:h-28 aspect-square bg-neutral-100 overflow-hidden shrink-0 block group"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        {item.category}
                      </span>
                      <Link
                        to={`/product/${item.productId}`}
                        className="font-display text-lg font-bold uppercase text-neutral-950 hover:underline block"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <div className="text-right">
                      <div className="font-sans text-base font-bold text-neutral-950">
                        {formatINR(item.price * item.quantity)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="font-sans text-[11px] text-neutral-400">
                          {formatINR(item.price)} each
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attributes badge */}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-600 font-medium">
                    <span className="bg-neutral-100 px-2 py-0.5 border border-neutral-200 shadow-2xs">
                      Size: <strong className="text-neutral-900">{item.size}</strong>
                    </span>
                    <span className="bg-neutral-100 px-2 py-0.5 border border-neutral-200 shadow-2xs">
                      Color: <strong className="text-neutral-900">{item.color.name}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Controls: Quantity Stepper & Remove */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center border border-neutral-300 bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="px-2.5 py-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 text-xs font-bold font-display min-w-8 text-center text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="px-2.5 py-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-xs text-neutral-400 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-4">
            <Link
              to="/shop"
              className="text-xs font-display font-bold uppercase tracking-wider text-neutral-900 hover:underline flex items-center gap-1 group"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-200 p-6 space-y-5 shadow-xs card-lift">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-neutral-950 border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-bold text-neutral-900">{formatINR(totals.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span>
                  {totals.isFreeShipping ? (
                    <strong className="text-emerald-600 uppercase font-display font-bold">FREE</strong>
                  ) : (
                    <strong className="text-neutral-900">{formatINR(totals.shipping)}</strong>
                  )}
                </span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold animate-fade-in">
                  <span>Promo Discount</span>
                  <span>-{formatINR(totals.discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
                <span className="font-display uppercase tracking-wider">Total Due</span>
                <span className="font-sans font-bold text-xl">{formatINR(totals.total)}</span>
              </div>
              <div className="text-[10px] text-neutral-400 text-right">
                Includes all applicable GST & Pan-India taxes
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="pt-3 border-t border-neutral-200">
              {activePromo ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-scale-in">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <strong className="font-mono">{activePromo.code}</strong>: {activePromo.description}
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                    aria-label="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label htmlFor="promo-input" className="block text-[11px] font-display font-bold uppercase tracking-wider text-neutral-700">
                    Promo / Voucher Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-input"
                      type="text"
                      placeholder="e.g. SJFIRST"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 uppercase font-mono focus:border-neutral-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors btn-magnetic cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Tip: Try <button type="button" onClick={() => setPromoInput('SJFIRST')} className="bg-neutral-100 hover:bg-neutral-200 px-1 py-0.5 text-neutral-800 font-mono underline cursor-pointer">SJFIRST</button> for 10% off
                  </div>
                </form>
              )}
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-neutral-950 text-white font-display text-sm font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] btn-magnetic cursor-pointer group"
            >
              <span>Proceed To Checkout</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Trust Assurances */}
            <div className="pt-2 text-[11px] text-neutral-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0" />
                <span>Simulated zero-cost checkout with live mock tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Doorstep returns & exchanges supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
