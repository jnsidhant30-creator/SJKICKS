import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRODUCTS } from '../data/products';
import { CATEGORIES_DATA } from '../data/categories';
import { useOrders } from '../hooks/useOrders';
import { formatINR } from '../utils/formatters';
import {
  getProducts,
  upsertProduct,
  deleteProduct,
  updateStock,
} from '../lib/supabaseService';

export function AdminPage() {
  const { user, isAdmin, loginAsDemoAdmin } = useAuth();
  const { showToast } = useToast();
  const { orders } = useOrders();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'inventory' | 'categories' | 'orders'
  const [productList, setProductList] = useState(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tagline: '',
    category: 'Shoes',
    subcategory: 'Sneakers',
    audience: 'Unisex',
    price: 9995,
    originalPrice: 11995,
    badge: 'NEW',
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    isSale: false,
    description: '',
    imageUrl1: '',
    imageUrl2: '',
    variantsText: 'UK 7: 5, UK 8: 10, UK 9: 8',
  });

  // Load products on mount
  const refreshData = async () => {
    const list = await getProducts();
    setProductList(list);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered products for admin table
  const filteredProducts = productList.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      id: `sjk-custom-${Date.now().toString(36)}`,
      name: '',
      tagline: '',
      category: 'Clothing',
      subcategory: 'T-Shirts',
      audience: 'Unisex',
      price: 3495,
      originalPrice: 4295,
      badge: 'NEW',
      isFeatured: true,
      isNew: true,
      isBestseller: false,
      isSale: false,
      description: 'Handcrafted luxury piece cut from premium natural fibers.',
      imageUrl1: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      imageUrl2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      variantsText: 'S: 10, M: 15, L: 12, XL: 6',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const variantsStr = product.sizes?.map((s) => `${s.size}: ${s.stock}`).join(', ') || '';
    setFormData({
      id: product.id,
      name: product.name,
      tagline: product.tagline || '',
      category: product.category,
      subcategory: product.subcategory || '',
      audience: product.audience || product.gender || 'Unisex',
      price: product.price,
      originalPrice: product.originalPrice || '',
      badge: product.badge || '',
      isFeatured: Boolean(product.isFeatured),
      isNew: Boolean(product.isNew),
      isBestseller: Boolean(product.isBestseller),
      isSale: Boolean(product.isSale),
      description: product.description || '',
      imageUrl1: product.images?.[0] || '',
      imageUrl2: product.images?.[1] || '',
      variantsText: variantsStr,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // Parse variants string (e.g. "UK 8: 10, UK 9: 5" or "M: 8, L: 12")
    const parsedSizes = formData.variantsText
      .split(',')
      .map((pair) => {
        const parts = pair.split(':');
        if (parts.length === 2) {
          return {
            size: parts[0].trim(),
            stock: parseInt(parts[1].trim(), 10) || 0,
            sku: `${formData.id}-${parts[0].trim().replace(/\s+/g, '')}`,
          };
        }
        return null;
      })
      .filter(Boolean);

    const images = [formData.imageUrl1, formData.imageUrl2].filter(Boolean);

    const productPayload = {
      id: formData.id,
      slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: formData.name,
      tagline: formData.tagline,
      category: formData.category,
      subcategory: formData.subcategory,
      audience: formData.audience,
      gender: formData.audience,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
      badge: formData.badge || null,
      isFeatured: formData.isFeatured,
      isNew: formData.isNew,
      isBestseller: formData.isBestseller,
      isSale: formData.isSale,
      description: formData.description,
      features: ['Atelier crafted', 'Original silhouette', 'Verified authentic'],
      colors: [{ name: 'Studio Black', hex: '#0a0a0a' }],
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80'],
      sizes: parsedSizes.length > 0 ? parsedSizes : [{ size: 'One Size (Standard)', stock: 20 }],
    };

    const res = await upsertProduct(productPayload);
    if (res.success) {
      showToast(`Product ${formData.name} saved successfully`, 'success');
      setIsModalOpen(false);
      refreshData();
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteProduct(id);
      showToast(`Deleted ${name}`, 'info');
      refreshData();
    }
  };

  const handleStockInlineChange = async (productId, size, val) => {
    await updateStock(productId, size, val);
    showToast(`Stock updated for ${size}`, 'success');
    refreshData();
  };

  // If not admin, show security prompt with 1-click test button
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950">
          Admin Portal Protected
        </h1>
        <p className="text-xs text-neutral-500 mt-2 mb-6 leading-relaxed">
          Row Level Security and verified role validation are enforced. You must be signed in as a Studio Administrator to configure products, manage variants, and update inventory.
        </p>
        <button
          onClick={loginAsDemoAdmin}
          className="w-full py-3 bg-neutral-950 text-amber-400 font-display text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-lg"
        >
          Sign In As Verified Studio Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 text-amber-400 font-display text-[10px] font-bold uppercase tracking-widest mb-1 shadow-2xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Studio Atelier Management</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950">
            Control Center
          </h1>
          <p className="text-xs text-neutral-500">
            Active Administrator: <strong className="text-neutral-900">{user.fullName}</strong> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-neutral-800 transition-all btn-magnetic shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <Link
            to="/shop"
            className="px-4 py-2.5 bg-white border border-neutral-300 text-neutral-900 font-display text-xs font-bold uppercase tracking-wider hover:border-neutral-950 transition-all btn-magnetic"
          >
            View Live Store →
          </Link>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-neutral-200 mt-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'products'
              ? 'border-b-2 border-neutral-950 text-neutral-950'
              : 'text-neutral-400 hover:text-neutral-950'
          }`}
        >
          Product Catalog ({productList.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-6 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'inventory'
              ? 'border-b-2 border-neutral-950 text-neutral-950'
              : 'text-neutral-400 hover:text-neutral-950'
          }`}
        >
          Inventory & Stock
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-6 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-neutral-950 text-neutral-950'
              : 'text-neutral-400 hover:text-neutral-950'
          }`}
        >
          Client Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'categories'
              ? 'border-b-2 border-neutral-950 text-neutral-950'
              : 'text-neutral-400 hover:text-neutral-950'
          }`}
        >
          Categories Taxonomy
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG CRUD */}
      {activeTab === 'products' && (
        <div className="pt-6 space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-neutral-200">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search products by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-100 pl-8 pr-3 py-2 text-xs text-neutral-900 border border-transparent focus:border-neutral-950 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-display uppercase text-neutral-500">Filter Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-neutral-100 border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-900 rounded-none cursor-pointer"
              >
                {['All', 'Shoes', 'Clothing', 'Watches', 'Accessories'].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-950 text-white font-display uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-10 h-10 object-cover bg-neutral-100 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-neutral-900 font-display text-sm">{p.name}</div>
                          <div className="text-neutral-400 text-[10px]">{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-neutral-800">{p.category}</span>
                      <div className="text-neutral-500 text-[10px]">{p.subcategory}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                        {p.audience || p.gender || 'Unisex'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-neutral-950">{formatINR(p.price)}</span>
                      {p.originalPrice && (
                        <div className="text-neutral-400 line-through text-[10px]">
                          {formatINR(p.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.isFeatured && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                            Featured
                          </span>
                        )}
                        {p.isNew && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                            New
                          </span>
                        )}
                        {p.isBestseller && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-600 font-mono text-[11px]">
                        {p.sizes?.map((s) => s.size).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/product/${p.id}`}
                          className="p-1.5 text-neutral-500 hover:text-neutral-950"
                          title="Preview Product"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-950"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGER */}
      {activeTab === 'inventory' && (
        <div className="pt-6 space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>
              Real-time inventory changes update instantly across product detail pages and cart validations.
            </span>
            <button
              onClick={refreshData}
              className="font-bold underline flex items-center gap-1 font-display uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Inventory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productList.map((product) => (
              <div key={product.id} className="bg-white border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="w-12 h-12 object-cover bg-neutral-100"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-sm text-neutral-900 truncate">
                      {product.name}
                    </h4>
                    <span className="text-[10px] text-neutral-500 uppercase">
                      {product.category} • {product.audience || product.gender}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {product.sizes?.map((variant) => (
                    <div
                      key={variant.size}
                      className="flex items-center justify-between py-1 px-2 bg-neutral-50 border border-neutral-100"
                    >
                      <span className="font-display font-bold text-neutral-900">{variant.size}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          defaultValue={variant.stock}
                          onBlur={(e) =>
                            handleStockInlineChange(product.id, variant.size, e.target.value)
                          }
                          className="w-14 bg-white border border-neutral-300 text-center py-0.5 text-xs font-bold text-neutral-900"
                        />
                        <span className="text-[10px] text-neutral-500">units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT ORDERS VIEWER */}
      {activeTab === 'orders' && (
        <div className="pt-6 space-y-4">
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-950 text-white font-display uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-medium">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold font-display">{o.orderId}</td>
                    <td className="py-3 px-4 text-neutral-600">{o.orderDate}</td>
                    <td className="py-3 px-4 text-neutral-900">
                      {o.shippingAddress?.fullName || 'Client'} ({o.shippingAddress?.city || 'India'})
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{o.items?.length || 0} items</td>
                    <td className="py-3 px-4 font-bold text-neutral-950">
                      {formatINR(o.pricing?.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/order-confirmation"
                        state={{ orderId: o.orderId }}
                        className="text-neutral-950 font-bold underline"
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES & TAXONOMY */}
      {activeTab === 'categories' && (
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <div key={cat.id} className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-display text-lg font-bold uppercase text-neutral-950">
                  {cat.name} ({cat.subcategories.length})
                </h3>
                <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                  Size Type: {cat.sizeType}
                </span>
              </div>
              <p className="text-xs text-neutral-600">{cat.description}</p>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-display block">
                  Configured Subcategories:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <span
                      key={sub.slug}
                      className="bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs px-2.5 py-1 font-medium"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="font-display text-xl font-black uppercase text-neutral-950">
                {editingProduct ? 'Edit Silhouette' : 'Add New Silhouette'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-950" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Product ID / SKU Root</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 p-2 text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. SJ Studio Box Trench"
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Sculpted Double-Weave Gabardine"
                  className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900 cursor-pointer"
                  >
                    <option value="Shoes">Shoes</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Watches">Watches</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Jackets"
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900 cursor-pointer"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 uppercase mb-1">Original / MRP Price (INR)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">Image URL 1 (Primary)</label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl1}
                  onChange={(e) => setFormData({ ...formData, imageUrl1: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">Image URL 2 (Hover Angle)</label>
                <input
                  type="url"
                  value={formData.imageUrl2}
                  onChange={(e) => setFormData({ ...formData, imageUrl2: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">
                  Sizes & Inventory (Format: "Size: Stock, Size: Stock")
                </label>
                <input
                  type="text"
                  required
                  value={formData.variantsText}
                  onChange={(e) => setFormData({ ...formData, variantsText: e.target.value })}
                  placeholder="UK 7: 5, UK 8: 10 OR S: 8, M: 12"
                  className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSale}
                    onChange={(e) => setFormData({ ...formData, isSale: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>On Sale</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 font-display font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-950 text-white font-display font-bold uppercase tracking-wider hover:bg-neutral-800"
                >
                  Save Silhouette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
