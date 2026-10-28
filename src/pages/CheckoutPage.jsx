import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  Lock,
  ArrowRight,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../hooks/useOrders';
import { formatINR } from '../utils/formatters';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useToast } from '../context/ToastContext';

// Indian States list for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi NCR',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { cart, totals, activePromo, clearCart } = useCart();
  const { createOrder } = useOrders();

  // Address Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    pincode: '',
    addressLine1: '',
    area: '',
    landmark: '',
    city: '',
    state: 'Karnataka',
  });

  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'COD' | 'CARD' | 'NETBANKING'
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold uppercase text-neutral-900 mb-2">
          Your Bag is Empty
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          Add at least one item or silhouette to your bag before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="px-6 py-3 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-block"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  // Address Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errors.fullName = 'Please enter your full legal name (at least 3 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address for delivery updates';
    }

    // 10-digit Indian phone number starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    // 6-digit Indian Postal PIN Code
    const pinRegex = /^\d{6}$/;
    if (!formData.pincode.trim() || !pinRegex.test(formData.pincode.trim())) {
      errors.pincode = 'Please enter a valid 6-digit postal PIN code';
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Please specify flat/house number, building, and street name';
    }

    if (!formData.area.trim()) {
      errors.area = 'Please provide locality or sector';
    }

    if (!formData.city.trim()) {
      errors.city = 'Please enter your city / district';
    }

    if (!formData.state.trim()) {
      errors.state = 'Please select your state';
    }

    // Payment validation
    if (paymentMethod === 'UPI' && !upiId.trim()) {
      errors.upi = 'Please enter a simulated UPI ID (e.g. athlete@okaxis)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    handleInputChange('pincode', cleaned);

    // Auto-fill mock city / state for demo convenience if user types standard PINs
    if (cleaned === '560001') {
      setFormData((prev) => ({ ...prev, pincode: cleaned, city: 'Bengaluru', state: 'Karnataka' }));
    } else if (cleaned === '400001') {
      setFormData((prev) => ({ ...prev, pincode: cleaned, city: 'Mumbai', state: 'Maharashtra' }));
    } else if (cleaned === '110001') {
      setFormData((prev) => ({ ...prev, pincode: cleaned, city: 'New Delhi', state: 'Delhi NCR' }));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please correct errors in the shipping form', 'error');
      // Scroll to top of form
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (isSubmitting) return; // Prevent duplicate submit
    setIsSubmitting(true);

    try {
      // Simulate network latency (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newOrder = createOrder({
        items: cart,
        shippingAddress: formData,
        paymentMethod: paymentMethod,
        totals: totals,
        activePromo: activePromo,
      });

      // Clear cart
      clearCart();

      showToast(`Order ${newOrder.orderId} placed successfully!`, 'success');
      navigate('/order-confirmation', { state: { orderId: newOrder.orderId } });
    } catch (err) {
      console.error('Order creation error:', err);
      showToast('Something went wrong placing the demo order.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Editorial Title & Demomode Warning Banner */}
      <div className="pb-6 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
          Step 2 of 2 • Secure Checkout
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mt-1">
          Finalize Order
        </h1>
      </div>

      {/* Safety Notice: Zero Real Payments */}
      <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold uppercase tracking-wider block font-display">
            SIMULATED DEMO CHECKOUT ONLY (₹0 PROTOTYPE)
          </strong>
          <span>
            This is an educational portfolio prototype for SJ KICKS. No real bank accounts, cards, or money are ever charged. <strong>Never enter actual credit card numbers, CVVs, or real banking passwords.</strong>
          </span>
        </div>
      </div>

      {/* 2-Column Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
        {/* Left Form: Address & Simulated Payment (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-8">
            {/* 1. SHIPPING ADDRESS */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Truck className="w-5 h-5 text-neutral-900" />
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-950">
                  1. Indian Delivery Address
                </h2>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="e.g. Arjun Sharma"
                    className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                      formErrors.fullName ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {formErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    Mobile Phone (+91) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className={`w-full pl-11 pr-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                        formErrors.phone ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                      }`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address for Tracking Updates *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g. arjun@example.com"
                  className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                    formErrors.email ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="addressLine1" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                  Flat, House No., Building, Street *
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  placeholder="e.g. 402, Apex Heights, 12th Main Road, Indiranagar"
                  className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                    formErrors.addressLine1 ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                  }`}
                />
                {formErrors.addressLine1 && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {formErrors.addressLine1}
                  </p>
                )}
              </div>

              {/* Area & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="area" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    Area / Locality / Sector *
                  </label>
                  <input
                    id="area"
                    type="text"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="e.g. Indiranagar Stage 2"
                    className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                      formErrors.area ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                    }`}
                  />
                  {formErrors.area && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {formErrors.area}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="landmark" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    placeholder="e.g. Near Metro Pillar 140"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* PIN Code, City, State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="pincode" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="560001"
                    className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-900 ${
                      formErrors.pincode ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                    }`}
                  />
                  {formErrors.pincode && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {formErrors.pincode}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    City / District *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Bengaluru"
                    className={`w-full px-3 py-2 bg-neutral-50 border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                      formErrors.city ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-300'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {formErrors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-xs font-bold font-display uppercase tracking-wider text-neutral-700 mb-1">
                    State *
                  </label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. SIMULATED PAYMENT METHOD */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Lock className="w-5 h-5 text-neutral-900" />
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-950">
                  2. Simulated Payment Options
                </h2>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 text-center border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'UPI'
                      ? 'border-neutral-950 bg-neutral-950 text-white font-bold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="font-display text-xs uppercase tracking-wider">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 text-center border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'COD'
                      ? 'border-neutral-950 bg-neutral-950 text-white font-bold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="font-display text-xs uppercase tracking-wider">Cash on Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 text-center border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'CARD'
                      ? 'border-neutral-950 bg-neutral-950 text-white font-bold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-display text-xs uppercase tracking-wider">Card (Simulated)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3 text-center border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-neutral-950 bg-neutral-950 text-white font-bold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="font-display text-xs uppercase tracking-wider">NetBanking</span>
                </button>
              </div>

              {/* Dynamic Payment Details Panel */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs">
                {paymentMethod === 'UPI' && (
                  <div className="space-y-3">
                    <div className="font-display font-bold uppercase text-neutral-900 tracking-wider">
                      Simulated UPI Fast Payment:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="athlete@okaxis or 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className={`flex-1 px-3 py-2 bg-white border text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 ${
                          formErrors.upi ? 'border-rose-500' : 'border-neutral-300'
                        }`}
                      />
                    </div>
                    {formErrors.upi && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {formErrors.upi}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-500">
                      Supports Google Pay, PhonePe, Paytm & BHIM. This is simulated; no actual UPI request will be dispatched.
                    </p>
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <div className="space-y-2">
                    <div className="font-display font-bold uppercase text-neutral-900 tracking-wider">
                      Cash on Delivery (Doorstep Verification)
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                      Pay <strong className="text-neutral-950">{formatINR(totals.total)}</strong> in cash or via delivery agent UPI QR code when your kicks arrive at your doorstep. ₹0 additional COD fee.
                    </p>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-amber-100/60 border border-amber-300 text-amber-900 font-semibold text-[11px]">
                      ⚠️ SAFETY NOTICE: DEMO MODE ONLY. Do NOT enter real card numbers or CVV. Use the mock values provided.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] uppercase font-bold text-neutral-600 mb-1">
                          Simulated Card Number
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="4111 •••• •••• 9928"
                          className="w-full px-3 py-2 bg-neutral-100 border border-neutral-300 font-mono text-neutral-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-bold text-neutral-600 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="12 / 29"
                          className="w-full px-3 py-2 bg-neutral-100 border border-neutral-300 font-mono text-neutral-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-bold text-neutral-600 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="•••"
                          className="w-full px-3 py-2 bg-neutral-100 border border-neutral-300 font-mono text-neutral-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'NETBANKING' && (
                  <div className="space-y-3">
                    <div className="font-display font-bold uppercase text-neutral-900 tracking-wider">
                      Select Simulated Bank:
                    </div>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-xs font-medium focus:outline-none focus:border-neutral-900"
                    >
                      <option value="HDFC Bank">HDFC Bank (Simulated)</option>
                      <option value="State Bank of India">State Bank of India (Simulated)</option>
                      <option value="ICICI Bank">ICICI Bank (Simulated)</option>
                      <option value="Axis Bank">Axis Bank (Simulated)</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank (Simulated)</option>
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      You will be simulated as authenticated via {selectedBank}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 text-white font-display text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all duration-200 ${
                isSubmitting
                  ? 'bg-neutral-600 cursor-wait'
                  : 'bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Simulated Order...</span>
                </>
              ) : (
                <>
                  <span>Place Demo Order • {formatINR(totals.total)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Summary: Items & Price Recap (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-950 border-b border-neutral-200 pb-3">
              Items in Order ({cart.length})
            </h2>

            {/* Items scroll */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 text-xs">
                  <div className="w-16 h-16 bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-display font-bold uppercase text-neutral-950 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-neutral-500 text-[11px]">
                        Size: {item.size} • Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-bold text-neutral-900">
                      {formatINR(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {totals.isFreeShipping ? (
                    <strong className="text-emerald-600 uppercase font-display font-bold">FREE</strong>
                  ) : (
                    <strong className="text-neutral-900">{formatINR(totals.shipping)}</strong>
                  )}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({activePromo?.code || 'Promo'})</span>
                  <span>-{formatINR(totals.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
                <span className="font-display uppercase tracking-wider">Amount Due</span>
                <span className="font-display text-xl">{formatINR(totals.total)}</span>
              </div>
            </div>

            {/* Security checklist */}
            <div className="pt-4 border-t border-neutral-200 space-y-2 text-[11px] text-neutral-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulated Order ID generated instantly upon completion</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saved locally to browser localStorage memory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
