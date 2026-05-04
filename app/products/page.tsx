// app/products/page.tsx
'use client';
import DashboardShell from '@/components/layout/dashboard-shell';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Product {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface ProductStats {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  mostExpensive: Product | null;
  cheapest: Product | null;
  categoriesCount: Record<string, number>;
  productsByMonth: Record<string, number>;
}

type SortField = 'product_name' | 'price' | 'created_at' | 'category';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | string;

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const CATEGORIES = [
  { value: 'electronics', label: '📱 Elektronikë', color: 'bg-blue-100 text-blue-800', icon: '💻' },
  { value: 'audio', label: '🎧 Audio', color: 'bg-purple-100 text-purple-800', icon: '🎵' },
  { value: 'wearables', label: '⌚ Veshje Inteligjente', color: 'bg-green-100 text-green-800', icon: '⌚' },
  { value: 'gaming', label: '🎮 Gaming', color: 'bg-red-100 text-red-800', icon: '🎮' },
  { value: 'accessories', label: '🔌 Aksesorë', color: 'bg-yellow-100 text-yellow-800', icon: '🔌' },
  { value: 'smart home', label: '🏠 Smart Home', color: 'bg-indigo-100 text-indigo-800', icon: '🏠' },
  { value: 'cameras', label: '📷 Kamera', color: 'bg-pink-100 text-pink-800', icon: '📷' },
  { value: 'home appliances', label: '🧹 Pajisje Shtëpiake', color: 'bg-orange-100 text-orange-800', icon: '🧹' },
];

const SORT_OPTIONS = [
  { field: 'product_name', label: 'Emri', icon: '📝' },
  { field: 'price', label: 'Çmimi', icon: '💰' },
  { field: 'created_at', label: 'Data', icon: '📅' },
  { field: 'category', label: 'Kategoria', icon: '🏷️' },
];

// ============================================
// CUSTOM HOOKS
// ============================================

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {}
  };
  return [storedValue, setValue] as const;
};

// ============================================
// COMPONENTS
// ============================================

const StatCard = ({ title, value, icon, color, trend }: any) => (
  <div className="glass-card rounded-2xl p-6 hover-lift transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% nga muaji i kaluar
          </p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </div>
);

const CategoryBadge = ({ category }: { category: string }) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat?.color || 'bg-gray-100 text-gray-800'}`}>
      <span>{cat?.icon || '📦'}</span>
      <span>{cat?.label || category}</span>
    </span>
  );
};

const ProductCard = ({ product, onEdit, onDelete, viewMode }: { product: Product; onEdit: (p: Product) => void; onDelete: (id: string) => void; viewMode: ViewMode }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (viewMode === 'list') {
    return (
      <div className="glass-card rounded-xl p-4 hover-lift transition-all duration-300">
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 truncate">{product.product_name}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{product.description || 'Pa përshkrim'}</p>
          </div>
          <div className="flex items-center gap-4">
            <CategoryBadge category={product.category} />
            <span className="text-xl font-black text-indigo-600">{formatPrice(product.price)}</span>
            <span className="text-xs text-slate-400">{formatDate(product.created_at)}</span>
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-lg hover:bg-indigo-50 transition-all"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 rounded-lg hover:bg-red-50 transition-all"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover-lift transition-all duration-300 animate-slide-in group">
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="absolute top-3 right-3">
          <CategoryBadge category={product.category} />
        </div>
        <div className="flex items-center justify-center h-full">
          <span className="text-6xl opacity-50 group-hover:opacity-100 transition-opacity">
            {CATEGORIES.find(c => c.value === product.category)?.icon || '📦'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-1">{product.product_name}</h3>
        <p className="text-2xl font-black text-indigo-600 mb-3">
          {new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(product.price)}
        </p>
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{product.description || 'Pa përshkrim'}</p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
          <span className="text-xs text-slate-400">
            {new Date(product.created_at).toLocaleDateString('sq-AL')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-lg hover:bg-indigo-50 transition-all"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 rounded-lg hover:bg-red-50 transition-all"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-200" />
    <div className="p-5 space-y-3">
      <div className="h-6 bg-slate-200 rounded w-3/4" />
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  </div>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="glass-card rounded-3xl p-12 text-center">
    <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
      <span className="text-4xl">📦</span>
    </div>
    <h3 className="text-xl font-bold text-slate-700 mb-2">Nuk u gjetën produkte</h3>
    <p className="text-slate-500 mb-6">
        Provoni të ndryshoni filtrat ose shtoni produktin tuaj të parë
    </p>
    <Link
      href="/products/add"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all"
    >
      <span>➕</span>
      Shto Produkt të Ri
    </Link>
  </div>
);

const AddProductModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.product_name.trim()) {
      setError('Emri i produktit është i detyrueshëm');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Çmimi duhet të jetë më i madh se 0');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ju duhet të jeni të kyçur');

      const { error: insertError } = await supabase.from('products').insert([{
        user_id: user.id,
        product_name: formData.product_name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
      }]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setFormData({ product_name: '', price: '', description: '', category: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
      <div className="glass-card-strong rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200/60">
          <h2 className="text-2xl font-black text-slate-900">Shto Produkt të Ri</h2>
          <p className="text-slate-500 text-sm mt-1">Plotëso të dhënat e produktit për ta shtuar në inventar</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Emri i produktit *
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
              placeholder="p.sh. iPhone 15 Pro Max"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Çmimi (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="0.00"
                required
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
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
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

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Duke u ruajtur...
                </>
              ) : (
                'Shto Produktin'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/80 text-slate-700 font-semibold hover:bg-white transition-all"
            >
              Anulo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditProductModal = ({ isOpen, onClose, product, onSuccess }: { isOpen: boolean; onClose: () => void; product: Product | null; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        price: product.price.toString(),
        description: product.description || '',
        category: product.category || '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          product_name: formData.product_name,
          price: parseFloat(formData.price),
          description: formData.description,
          category: formData.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product?.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
      <div className="glass-card-strong rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200/60">
          <h2 className="text-2xl font-black text-slate-900">Modifiko Produktin</h2>
          <p className="text-slate-500 text-sm mt-1">Ndrysho të dhënat e produktit</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Emri i produktit *
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Çmimi (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                required
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
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
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
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Duke u ruajtur...
                </>
              ) : (
                'Ruaj Ndryshimet'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/80 text-slate-700 font-semibold hover:bg-white transition-all"
            >
              Anulo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, productName }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; productName: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
      <div className="glass-card-strong rounded-3xl max-w-md w-full">
        <div className="p-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-100 mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmo Fshirjen</h3>
          <p className="text-slate-500 mb-6">
            A jeni i sigurt që dëshironi ta fshini produktin "<strong>{productName}</strong>"?
            Ky veprim nuk mund të zhbëhet.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
            >
              Fshije
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl bg-white/80 text-slate-700 font-semibold hover:bg-white transition-all"
            >
              Anulo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ProductsPage() {
  const router = useRouter();
  const supabase = createClient();

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('products-view-mode', 'grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    totalValue: 0,
    averagePrice: 0,
    mostExpensive: null,
    cheapest: null,
    categoriesCount: {},
    productsByMonth: {},
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
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
  }, [supabase, router]);

  // Calculate Statistics
  const calculateStats = (productsData: Product[]) => {
    const totalValue = productsData.reduce((sum, p) => sum + p.price, 0);
    const averagePrice = productsData.length > 0 ? totalValue / productsData.length : 0;
    
    const categoriesCount: Record<string, number> = {};
    productsData.forEach(p => {
      if (p.category) {
        categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
      }
    });

    const productsByMonth: Record<string, number> = {};
    productsData.forEach(p => {
      const month = new Date(p.created_at).toLocaleDateString('sq-AL', { year: 'numeric', month: 'short' });
      productsByMonth[month] = (productsByMonth[month] || 0) + 1;
    });

    const sortedByPrice = [...productsData].sort((a, b) => a.price - b.price);
    
    setStats({
      totalProducts: productsData.length,
      totalValue,
      averagePrice,
      mostExpensive: sortedByPrice[sortedByPrice.length - 1] || null,
      cheapest: sortedByPrice[0] || null,
      categoriesCount,
      productsByMonth,
    });
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (debouncedSearch) {
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
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
  }, [products, debouncedSearch, selectedCategory, sortField, sortOrder]);

  // Handlers
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setProductToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      await fetchProducts();
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSuccess = () => {
    fetchProducts();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortField('created_at');
    setSortOrder('desc');
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Render
  return (
      <DashboardShell>
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.15);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div className="glass-card-strong rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600">
                  <span className="text-2xl">📦</span>
                </div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Menaxhimi i Produkteve
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Produktet
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Menaxho të gjithë inventarin, ndiq performancën dhe optimizo çmimet me inteligjencën artificiale.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5"
            >
              <span className="text-xl">➕</span>
              Shto Produkt të Ri
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Produkte" value={stats.totalProducts} icon="📦" color="bg-indigo-100" trend={12} />
          <StatCard title="Vlera Totale" value={`€${stats.totalValue.toFixed(2)}`} icon="💰" color="bg-emerald-100" trend={8} />
          <StatCard title="Çmimi Mesatar" value={`€${stats.averagePrice.toFixed(2)}`} icon="🏷️" color="bg-amber-100" trend={-3} />
          <StatCard title="Kategoritë" value={Object.keys(stats.categoriesCount).length || 0} icon="🏷️" color="bg-purple-100" />
        </div>

        {/* Filters and Search */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Kërko produktin me emër ose përshkrim..."
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
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 p-1 bg-white/50 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
              >
                📋 List
              </button>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-3 rounded-xl bg-white/80 text-slate-600 font-medium hover:bg-white transition-all"
              >
                ✖️ Pastro filtrat
              </button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rendit sipas:</span>
            {SORT_OPTIONS.map(({ field, label, icon }) => (
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sortField === field
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {sortField === field && (
                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-3"
          }>
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={(id) => handleDelete(id, product.product_name)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />

        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={confirmDelete}
          productName={productToDelete?.name || ''}
        />
      </div>
    </DashboardShell>
  );
}