'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type InventoryStatus = 'healthy' | 'low' | 'overstock' | 'critical';

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  reorderPoint: number;
  unitCost: number;
  sellingPrice: number;
  supplier: string;
  lastUpdated: string;
  status: InventoryStatus;
};

const inventoryItems: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'Premium Curtain Collection',
    category: 'Home Goods',
    sku: 'CUR-PREM-001',
    stock: 42,
    reorderPoint: 15,
    unitCost: 18,
    sellingPrice: 49,
    supplier: 'Nuka Home',
    lastUpdated: 'Today',
    status: 'healthy',
  },
  {
    id: 'INV-002',
    name: 'Modern Sofa Set',
    category: 'Furniture',
    sku: 'SOF-MOD-204',
    stock: 6,
    reorderPoint: 10,
    unitCost: 220,
    sellingPrice: 399,
    supplier: 'Local Supplier',
    lastUpdated: 'Yesterday',
    status: 'low',
  },
  {
    id: 'INV-003',
    name: 'Bathroom Accessories Pack',
    category: 'Bathroom',
    sku: 'BTH-ACC-088',
    stock: 3,
    reorderPoint: 8,
    unitCost: 9,
    sellingPrice: 24,
    supplier: 'Regional Import',
    lastUpdated: '2 days ago',
    status: 'critical',
  },
  {
    id: 'INV-004',
    name: 'Luxury Carpet Large',
    category: 'Carpets',
    sku: 'CRP-LUX-441',
    stock: 78,
    reorderPoint: 20,
    unitCost: 35,
    sellingPrice: 79,
    supplier: 'Warehouse A',
    lastUpdated: '3 days ago',
    status: 'overstock',
  },
];

const statusStyle: Record<
  InventoryStatus,
  {
    label: string;
    badge: string;
    dot: string;
    card: string;
  }
> = {
  healthy: {
    label: 'Healthy',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    card: 'from-emerald-50 to-white border-emerald-100',
  },
  low: {
    label: 'Low Stock',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    card: 'from-amber-50 to-white border-amber-100',
  },
  overstock: {
    label: 'Overstock',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    card: 'from-sky-50 to-white border-sky-100',
  },
  critical: {
    label: 'Critical',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    card: 'from-red-50 to-white border-red-100',
  },
};

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | InventoryStatus>('all');

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [search, selectedStatus]);

  const inventoryStats = useMemo(() => {
    const totalStock = inventoryItems.reduce((sum, item) => sum + item.stock, 0);
    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + item.stock * item.unitCost,
      0
    );
    const potentialRevenue = inventoryItems.reduce(
      (sum, item) => sum + item.stock * item.sellingPrice,
      0
    );
    const lowOrCritical = inventoryItems.filter(
      (item) => item.status === 'low' || item.status === 'critical'
    ).length;

    return {
      totalStock,
      totalValue,
      potentialRevenue,
      lowOrCritical,
      marginPotential: potentialRevenue - totalValue,
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                  Inventory Command Center
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Stock Intelligence
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Inventory
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Track stock health, reorder risk, capital locked in inventory, and pricing
                opportunities from one premium SellSmart workspace.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[460px]">
              <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Total Stock
                </div>
                <div className="mt-2 text-4xl font-black text-slate-950">
                  {inventoryStats.totalStock}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-500">
                  Units available
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Margin Potential
                </div>
                <div className="mt-2 text-4xl font-black">
                  €{inventoryStats.marginPotential.toFixed(0)}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  If stock sells fully
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📦</span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                Stock
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-slate-950">
              {inventoryStats.totalStock}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Total units in inventory
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💶</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Capital
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-slate-950">
              €{inventoryStats.totalValue.toFixed(0)}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Money locked in stock
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📈</span>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                Revenue
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-slate-950">
              €{inventoryStats.potentialRevenue.toFixed(0)}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Potential selling value
            </div>
          </div>

          <div className="rounded-[28px] border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 shadow-[0_18px_60px_rgba(248,113,113,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚠️</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                Action
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-slate-950">
              {inventoryStats.lowOrCritical}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Items need attention
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                    Inventory List
                  </div>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Stock Health Overview
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item, SKU, supplier..."
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />

                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as 'all' | InventoryStatus)
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="all">All Status</option>
                    <option value="healthy">Healthy</option>
                    <option value="low">Low Stock</option>
                    <option value="critical">Critical</option>
                    <option value="overstock">Overstock</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const margin = item.sellingPrice - item.unitCost;
                  const marginPct =
                    item.sellingPrice > 0 ? (margin / item.sellingPrice) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                        statusStyle[item.status].card
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
                            📦
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-950">
                                {item.name}
                              </h3>
                              <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                                  statusStyle[item.status].badge
                                }`}
                              >
                                {statusStyle[item.status].label}
                              </span>
                            </div>

                            <div className="mt-1 text-sm font-medium text-slate-500">
                              {item.category} · {item.sku} · {item.supplier}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                          <div className="rounded-2xl bg-white/70 p-3">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              Stock
                            </div>
                            <div className="text-xl font-black text-slate-950">
                              {item.stock}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-white/70 p-3">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              Reorder
                            </div>
                            <div className="text-xl font-black text-slate-950">
                              {item.reorderPoint}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-white/70 p-3">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              Margin
                            </div>
                            <div className="text-xl font-black text-slate-950">
                              {marginPct.toFixed(0)}%
                            </div>
                          </div>

                          <div className="rounded-2xl bg-white/70 p-3">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              Value
                            </div>
                            <div className="text-xl font-black text-slate-950">
                              €{(item.stock * item.unitCost).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
                        <div
                          className={`h-full rounded-full ${statusStyle[item.status].dot}`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(8, (item.stock / Math.max(item.reorderPoint * 4, 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                        <span>Last updated: {item.lastUpdated}</span>
                        <span>
                          Cost €{item.unitCost} · Sale €{item.sellingPrice}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
                    <div className="text-4xl">🔍</div>
                    <div className="mt-3 text-xl font-black text-slate-900">
                      No inventory items found
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Try changing the search or status filter.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                AI Inventory Insight
              </div>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Smart stock actions
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Reorder Priority</div>
                  <div className="mt-1 text-sm leading-6 text-white/65">
                    Bathroom Accessories Pack is below reorder point and should be reviewed first.
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Capital Warning</div>
                  <div className="mt-1 text-sm leading-6 text-white/65">
                    Luxury Carpet Large has high stock volume. Consider promotion or bundle pricing.
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Pricing Opportunity</div>
                  <div className="mt-1 text-sm leading-6 text-white/65">
                    Products with healthy stock and strong margin can support premium positioning.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Stock Distribution
              </div>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Status Breakdown
              </h3>

              <div className="mt-6 space-y-4">
                {(['healthy', 'low', 'critical', 'overstock'] as InventoryStatus[]).map(
                  (status) => {
                    const count = inventoryItems.filter((item) => item.status === status).length;
                    const percentage = (count / inventoryItems.length) * 100;

                    return (
                      <div key={status}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-black text-slate-700">
                            {statusStyle[status].label}
                          </span>
                          <span className="font-bold text-slate-400">{count}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${statusStyle[status].dot}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 shadow-[0_22px_80px_rgba(79,70,229,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Next Upgrade
              </div>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Connect to Supabase
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The next version should load inventory from your database, support add/edit
                stock, supplier history, reorder alerts, and automatic pricing suggestions.
              </p>

              <button className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600">
                Prepare Database Upgrade
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}