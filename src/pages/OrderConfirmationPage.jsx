import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Printer,
  Package,
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { formatINR } from '../utils/formatters';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useToast } from '../context/ToastContext';

export function OrderConfirmationPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const { lastOrder, getOrderById } = useOrders();
  const [copied, setCopied] = useState(false);

  // Get order from location state or fallback to lastOrder
  const passedOrderId = location.state?.orderId;
  const order = passedOrderId ? getOrderById(passedOrderId) : lastOrder;

  const handleCopyOrderId = () => {
    if (order?.orderId) {
      navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      showToast('Order ID copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase text-neutral-900 mb-2">
          No Recent Order Found
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          You don't have any recent order stored in this browser session. Browse our collection to make a purchase.
        </p>
        <Link
          to="/shop"
          className="px-6 py-3 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-block"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  const {
    orderId,
    orderDate,
    estimatedDelivery,
    shippingAddress,
    paymentDetails,
    pricing,
    items = [],
  } = order;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Success Celebration Banner */}
      <div className="text-center space-y-4 pb-8 border-b border-neutral-200">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-950 text-amber-400 font-display text-[11px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> Simulated Demo Order Confirmed
        </span>

        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950">
          Built For The Streets. <br /> Your Kicks Are On The Way.
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
          Thank you, <strong>{shippingAddress.fullName || 'Athlete'}</strong>! We've registered your order and allocated your silhouettes from our primary Bengaluru fulfillment center.
        </p>

        {/* Order ID Badge with Copy Button */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <div className="px-4 py-2 bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-900 flex items-center gap-3">
            <span>ORDER ID: <strong className="text-neutral-950 font-black">{orderId}</strong></span>
            <button
              onClick={handleCopyOrderId}
              className="text-neutral-500 hover:text-neutral-900 transition-colors p-1"
              title="Copy Order ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 hover:text-neutral-950 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Simulated Tracking Progress Bar */}
      <div className="mt-8 p-6 bg-white border border-neutral-200">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">
          Simulated Shipment Milestones
        </h2>

        <div className="relative">
          {/* Progress track */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-neutral-200 -z-0">
            <div className="h-full bg-emerald-500 w-1/4" />
          </div>

          <div className="grid grid-cols-4 text-center text-xs relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs mb-2">
                ✓
              </div>
              <div className="font-display font-bold uppercase text-neutral-900 text-[11px]">
                Order Confirmed
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{orderDate}</div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-400 text-neutral-600 flex items-center justify-center font-bold text-xs mb-2">
                2
              </div>
              <div className="font-display font-bold uppercase text-neutral-700 text-[11px]">
                Quality Check
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">In Progress</div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-300 text-neutral-400 flex items-center justify-center font-bold text-xs mb-2">
                3
              </div>
              <div className="font-display font-bold uppercase text-neutral-400 text-[11px]">
                Out for Delivery
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Exp: {estimatedDelivery}</div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-300 text-neutral-400 flex items-center justify-center font-bold text-xs mb-2">
                4
              </div>
              <div className="font-display font-bold uppercase text-neutral-400 text-[11px]">
                Delivered
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Doorstep</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Summary Cards: Details + Item Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Shipping & Payment Card */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <MapPin className="w-4 h-4 text-neutral-900" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-950">
              Delivery Destination
            </h3>
          </div>

          <div className="text-xs text-neutral-700 space-y-1 leading-relaxed">
            <div className="font-bold text-neutral-950 text-sm">{shippingAddress.fullName}</div>
            <div>{shippingAddress.addressLine1}</div>
            <div>{shippingAddress.area}</div>
            {shippingAddress.landmark && <div className="text-neutral-500">Near: {shippingAddress.landmark}</div>}
            <div>
              {shippingAddress.city}, {shippingAddress.state} -{' '}
              <strong className="font-mono text-neutral-900">{shippingAddress.pincode}</strong>
            </div>
            <div className="pt-2 text-neutral-500">
              Phone: +91 {shippingAddress.phone} • Email: {shippingAddress.email}
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-xs">
              <CreditCard className="w-4 h-4 text-neutral-900" />
              <span className="font-display font-bold uppercase tracking-wider text-neutral-950">
                Payment Mode:
              </span>
              <span className="bg-neutral-100 border border-neutral-300 px-2 py-0.5 font-bold text-neutral-900">
                {paymentDetails.method} ({paymentDetails.status})
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-1">
              Txn Reference: {paymentDetails.transactionId}
            </div>
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Calendar className="w-4 h-4 text-neutral-900" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-950">
              Billing Breakdown
            </h3>
          </div>

          <div className="space-y-2 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-bold text-neutral-900">{formatINR(pricing.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Express Delivery</span>
              <span>
                {pricing.shipping === 0 ? (
                  <strong className="text-emerald-600 uppercase font-display font-bold">FREE</strong>
                ) : (
                  <strong className="text-neutral-900">{formatINR(pricing.shipping)}</strong>
                )}
              </span>
            </div>

            {pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied</span>
                <span>-{formatINR(pricing.discount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
              <span className="font-display uppercase tracking-wider">Total Amount</span>
              <span className="font-display text-xl">{formatINR(pricing.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Order List */}
      <div className="mt-6 bg-white border border-neutral-200 p-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-950 mb-4 pb-3 border-b border-neutral-200">
          Purchased Silhouettes ({items.length})
        </h3>

        <div className="divide-y divide-neutral-200">
          {items.map((item) => (
            <div key={item.cartItemId} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-neutral-100 shrink-0 border border-neutral-200 overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold uppercase text-neutral-950">
                    {item.name}
                  </h4>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Size: <strong className="text-neutral-900">{item.size}</strong> • Color: {item.color?.name || 'Standard'}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Quantity: {item.quantity}
                  </div>
                </div>
              </div>

              <div className="font-display font-bold text-sm text-neutral-950 text-right">
                {formatINR(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return to Shop CTA */}
      <div className="mt-8 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-lg"
        >
          <span>Continue Exploring SJ KICKS</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
