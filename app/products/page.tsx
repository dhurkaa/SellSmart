// app/products/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TagIcon,
  ClockIcon,
  EyeIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

type Product = {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  description: string;
  category: string;
  condition: string;
  location: string;
  stock_quantity: number;
  sku: string;
  images: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  sales_count: number;
  rating: number;
  profit_margin: number;
  status: 'active' | 'draft' | 'archived';
};

type ProductStats = {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  topCategory: string;
  totalSales: number;
  averageRating: number;
  lowStockItems: number;
  archivedCount: number;
};

type SortField = 'product_name' | 'price' | 'created_at' | 'sales_count' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function ProductsPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    totalValue: 0,
    averagePrice: 0,
    topCategory: 'N/A',
    totalSales: 0,
    averageRating: 0,
    lowStockItems: 0,
    archivedCount: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    description: '',
    category: '',
    condition: '',
    location: '',
    stock_quantity: '',
    sku: '',
    tags: '',
    status: 'active' as 'active' | 'draft' | 'archived',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'price') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      
      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productsData: Product[]) => {
    const activeProducts = productsData.filter(p => p.status === 'active');
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
    const categoryCount: Record<string, number> = {};
    
    activeProducts.forEach(p => {
      if (p.category) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      }
    });
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    setStats({
      totalProducts: activeProducts.length,
      totalValue,
      averagePrice: activeProducts.length > 0 
        ? activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length 
        : 0,
      topCategory,
      totalSales: productsData.reduce((sum, p) => sum + (p.sales_count || 0), 0),
      averageRating: productsData.filter(p => p.rating > 0).length > 0
        ? productsData.reduce((sum, p) => sum + (p.rating || 0), 0) / productsData.filter(p => p.rating > 0).length
        : 0,
      lowStockItems: productsData.filter(p => (p.stock_quantity || 0) < 10 && p.status === 'active').length,
      archivedCount: productsData.filter(p => p.status === 'archived').length,
    });
  };

  // Create product
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const errors: Record<string, string> = {};
      if (!formData.product_name) errors.product_name = 'Product name is required';
      if (!formData.price) errors.price = 'Price is required';
      if (parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSubmitting(false);
        return;
      }

      const newProduct = {
        user_id: user.id,
        product_name: formData.product_name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        sku: formData.sku,
        tags: formData.tags.split(',').map(t => t.trim()),
        status: formData.status,
        sales_count: 0,
        rating: 0,
        profit_margin: 0,
      };

      const { error } = await supabase
        .from('products')
        .insert([newProduct]);

      if (error) throw error;

      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      setFormErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Update product
  const updateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setSubmitting(true);
    setFormErrors({});

    try {
      const updates = {
        product_name: formData.product_name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        sku: formData.sku,
        tags: formData.tags.split(',').map(t => t.trim()),
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      setFormErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Edit product handler
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || '',
      condition: product.condition || '',
      location: product.location || '',
      stock_quantity: (product.stock_quantity || 0).toString(),
      sku: product.sku || '',
      tags: (product.tags || []).join(', '),
      status: product.status || 'active',
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      product_name: '',
      price: '',
      description: '',
      category: '',
      condition: '',
      location: '',
      stock_quantity: '',
      sku: '',
      tags: '',
      status: 'active',
    });
    setFormErrors({});
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      active: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircleIcon, label: 'Aktiv' },
      draft: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: ClockIcon, label: 'Draft' },
      archived: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircleIcon, label: 'Arkivuar' },
    };
    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.draft;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  // Star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="glass-card-strong rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Menaxhimi i Produkteve
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Produktet
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Menaxho të gjithë produktet, ndiq performancën dhe optimizo çmimet me inteligjencën artificiale.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5" />
              Shto Produkt të Ri
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Produkte</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <CubeIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Vlera e Inventarit</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Çmimi Mesatar</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(stats.averagePrice)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Stok i Ulët</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.lowStockItems}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Kërko produktin me emër, SKU ose përshkrim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              <option value="all">Të gjitha kategoritë</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              <option value="all">Të gjitha statuset</option>
              <option value="active">Aktive</option>
              <option value="draft">Draft</option>
              <option value="archived">Arkivuar</option>
            </select>
          </div>

          {/* Sort Indicators */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rendit sipas:</span>
            {[
              { field: 'product_name', label: 'Emri' },
              { field: 'price', label: 'Çmimi' },
              { field: 'created_at', label: 'Data' },
              { field: 'sales_count', label: 'Shitjet' },
              { field: 'rating', label: 'Vlerësimi' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => {
                  if (sortField === field) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField(field as SortField);
                    setSortOrder('desc');
                  }
                }}
                className={`flex items-center gap-1 text-sm font-medium transition-all ${
                  sortField === field ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
                {sortField === field && (
                  sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="flex justify-center gap-2">
              <div className="pulse-dot" />
              <div className="pulse-dot" />
              <div className="pulse-dot" />
            </div>
            <p className="mt-4 text-slate-500">Duke ngarkuar produktet...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
              <CubeIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Nuk u gjetën produkte</h3>
            <p className="text-slate-500">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Provoni të ndryshoni filtrat e kërkimit'
                : 'Shtoni produktin tuaj të parë për të filluar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="glass-card rounded-2xl overflow-hidden hover-lift animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <CubeIcon className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={product.status} />
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                        {product.product_name}
                      </h3>
                      {product.sku && (
                        <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>
                      )}
                    </div>
                    <p className="text-2xl font-black text-indigo-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {product.description || 'Pa përshkrim'}
                  </p>

                  {/* Product Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.category && (
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium">
                        {product.category}
                      </span>
                    )}
                    {product.condition && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {product.condition}
                      </span>
                    )}
                    {product.location && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        📍 {product.location}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-slate-200/60">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Stoku</p>
                      <p className="font-bold text-slate-900">{product.stock_quantity || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Shitjet</p>
                      <p className="font-bold text-slate-900">{product.sales_count || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Vlerësimi</p>
                      <div className="flex justify-center mt-1">
                        <StarRating rating={product.rating || 0} />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs text-slate-400">#{tag}</span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{product.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/80 text-slate-700 font-medium hover:bg-white transition-all"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="text-sm">Modifiko</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-medium hover:bg-rose-100 transition-all"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="text-sm">Fshije</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Shtuar më {formatDate(product.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
          <div className="glass-card-strong rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="p-6 border-b border-slate-200/60">
              <h2 className="text-2xl font-black text-slate-900">
                {showAddModal ? 'Shto Produkt të Ri' : 'Modifiko Produktin'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {showAddModal 
                  ? 'Plotëso të dhënat e produktit për ta shtuar në inventar'
                  : 'Ndrysho të dhënat e produktit'}
              </p>
            </div>

            <form onSubmit={showAddModal ? createProduct : updateProduct} className="p-6 space-y-4">
              {formErrors.submit && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 text-sm">
                  {formErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Emri i produktit *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className={`w-full rounded-xl border ${formErrors.product_name ? 'border-rose-300' : 'border-slate-200'} bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all`}
                    required
                  />
                  {formErrors.product_name && (
                    <p className="text-rose-500 text-xs mt-1">{formErrors.product_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Çmimi (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full rounded-xl border ${formErrors.price ? 'border-rose-300' : 'border-slate-200'} bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all`}
                    required
                  />
                  {formErrors.price && (
                    <p className="text-rose-500 text-xs mt-1">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Kodi unik i produktit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Sasia në stok
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Kategoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">Zgjidh kategorinë</option>
                    <option value="vehicle">Automjet</option>
                    <option value="electronics">Elektronikë</option>
                    <option value="general product">Produkt i Përgjithshëm</option>
                    <option value="home goods">Produkte për Shtëpi</option>
                    <option value="fashion">Modë</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Gjendja
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">Zgjidh gjendjen</option>
                    <option value="Excellent">Shumë e mirë</option>
                    <option value="Good">E mirë</option>
                    <option value="Fair">Mesatare</option>
                    <option value="Used">E përdorur</option>
                    <option value="New">E re</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Lokacioni
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Tregu / qyteti"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Statusi
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="active">Aktiv</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Arkivuar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Përshkrimi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                  placeholder="Përshkrim i detajuar i produktit..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Tags (të ndara me presje)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="p.sh. premium, bestseller, limited"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="spinner" />
                      Duke u ruajtur...
                    </>
                  ) : (
                    showAddModal ? 'Shto Produktin' : 'Ruaj Ndryshimet'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-xl bg-white/80 text-slate-700 font-semibold hover:bg-white transition-all"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
          <div className="glass-card-strong rounded-3xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-rose-100 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmo Fshirjen</h3>
              <p className="text-slate-500 mb-6">
                A jeni i sigurt që dëshironi ta fshini këtë produkt? Ky veprim nuk mund të zhbëhet.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => deleteProduct(deleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all"
                >
                  Fshije
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/80 text-slate-700 font-semibold hover:bg-white transition-all"
                >
                  Anulo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}