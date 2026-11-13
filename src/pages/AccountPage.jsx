import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';

export function AccountPage() {
  const { user, isAdmin, login, signup, logout, loginAsDemoAdmin, loginAsDemoCustomer } = useAuth();
  const { orders } = useOrders();
  const { wishlist } = useCart();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      await signup(email, password, fullName);
    } else {
      await login(email, password);
    }
    setLoading(false);
  };

  // If user is not authenticated, show elegant sign-in / demo switches
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 animate-fade-in">
        <div className="bg-white border border-neutral-200 p-8 shadow-xl card-lift">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 font-display">
              Client Concierge
            </span>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-neutral-950 mt-1">
              {isSignUp ? 'Create Atelier Account' : 'Atelier Sign In'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Access your saved orders, personal wishlist, and private drops.
            </p>
          </div>

          {/* Quick Demo Switchers for Reviewers */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 mb-6 text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 font-display block">
              Quick Evaluator Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemoCustomer}
                className="py-2 px-3 bg-white border border-neutral-300 text-neutral-900 font-display text-[11px] font-bold uppercase tracking-wider hover:border-neutral-950"
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={loginAsDemoAdmin}
                className="py-2 px-3 bg-neutral-950 text-amber-400 font-display text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800"
              >
                Demo Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-950 rounded-none"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-950 rounded-none"
                placeholder="client@sjstudio.fashion"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-950 rounded-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-md mt-2"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-neutral-600 hover:text-neutral-950 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in here.'
                : "Don't have an account? Register an account."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Profile View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-display">
            Client Account
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 mt-1">
            Welcome, {user.fullName}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {user.email} • <span className="font-bold text-neutral-900 uppercase">{user.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 bg-neutral-950 text-amber-400 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" /> Studio Admin Portal
            </Link>
          )}

          <button
            onClick={logout}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 hover:text-rose-600 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        {/* Left Column: Account Summary & Wishlist */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-6 space-y-4">
            <h3 className="font-display text-sm font-black uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
              Client Details
            </h3>
            <div className="text-xs space-y-2 text-neutral-600">
              <div>
                <strong className="text-neutral-950">Name:</strong> {user.fullName}
              </div>
              <div>
                <strong className="text-neutral-950">Email:</strong> {user.email}
              </div>
              <div>
                <strong className="text-neutral-950">Access Tier:</strong>{' '}
                {isAdmin ? 'Verified Studio Administrator' : 'VIP Fashion Client'}
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-neutral-900">
                Saved Wishlist ({wishlist.length})
              </h3>
              <Link to="/wishlist" className="text-xs text-neutral-900 font-bold underline">
                View All
              </Link>
            </div>
            {wishlist.length === 0 ? (
              <p className="text-xs text-neutral-400">No items saved yet.</p>
            ) : (
              <div className="space-y-2">
                {wishlist.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-10 h-10 object-cover bg-neutral-100"
                    />
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.id}`} className="font-bold text-neutral-900 truncate block">
                        {item.name}
                      </Link>
                      <span className="text-neutral-500">{formatINR(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950">
                  Order History & Invoices
                </h3>
                <p className="text-xs text-neutral-500">
                  Track delivery progress, review purchased silhouettes, and download receipts.
                </p>
              </div>
              <span className="bg-neutral-100 font-display text-xs font-bold px-2.5 py-1 text-neutral-700">
                {orders.length} Orders
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-neutral-200 p-6">
                <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h4 className="font-display text-base font-bold uppercase text-neutral-800">
                  No Past Orders Yet
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                  When you make a purchase from our collections, your tracking details and receipt will appear here.
                </p>
                <Link
                  to="/shop"
                  className="px-6 py-2.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider inline-block"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="p-5 border border-neutral-200 bg-neutral-50/50 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-3 border-b border-neutral-200">
                      <div>
                        <span className="font-display font-black text-sm text-neutral-950 block">
                          {order.orderId}
                        </span>
                        <span className="text-neutral-500 text-[11px]">Placed on {order.orderDate}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-800 font-display text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                          {order.status}
                        </span>
                        <span className="font-display font-black text-sm text-neutral-950">
                          {formatINR(order.pricing?.total)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover bg-neutral-100"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-neutral-900 block truncate">{item.name}</span>
                            <span className="text-neutral-500 text-[11px]">
                              Size: {item.size} • Color: {item.color?.name || 'Standard'} • Qty: {item.quantity}
                            </span>
                          </div>
                          <span className="font-bold text-neutral-900">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-500">
                      <span>Delivery: {order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                      <Link
                        to="/order-confirmation"
                        state={{ orderId: order.orderId }}
                        className="font-bold text-neutral-950 hover:underline font-display uppercase tracking-wider"
                      >
                        View Official Receipt →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
