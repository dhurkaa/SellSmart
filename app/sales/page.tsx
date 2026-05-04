'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type SalesPeriod = '7d' | '30d' | '90d' | '12m';
type SalesChannel = 'all' | 'store' | 'online' | 'b2b';
type TrendStatus = 'growth' | 'stable' | 'decline' | 'promotion' | 'unknown';

type SalesProduct = {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  units: number;
  revenue: number;
  grossProfit: number;
  margin: number;
  averagePrice: number;
  previousRevenue?: number | null;
  status: TrendStatus;
};

type SalesSummary = {
  unitsSold: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  averageMargin: number;
  averageOrderValue: number;
  ordersCount: number;
  refundRate: number;
  conversionRate: number;
  priceChangesCount: number;
  lastUpdated: string | null;
};

type SalesSignal = {
  id: string;
  title: string;
  description: string;
  severity: 'good' | 'info' | 'warning' | 'critical';
};

type RecommendedAction = {
  id: string;
  title: string;
  description: string;
  impact?: string | null;
  priority: 'low' | 'medium' | 'high';
};

type SalesApiResponse = {
  summary: SalesSummary;
  products: SalesProduct[];
  signals: SalesSignal[];
  recommendedActions: RecommendedAction[];
};

const emptySummary: SalesSummary = {
  unitsSold: 0,
  revenue: 0,
  grossProfit: 0,
  netProfit: 0,
  averageMargin: 0,
  averageOrderValue: 0,
  ordersCount: 0,
  refundRate: 0,
  conversionRate: 0,
  priceChangesCount: 0,
  lastUpdated: null,
};

const periodOptions: { value: SalesPeriod; label: string }[] = [
  { value: '7d', label: '7 ditë' },
  { value: '30d', label: '30 ditë' },
  { value: '90d', label: '90 ditë' },
  { value: '12m', label: '12 muaj' },
];

const channelOptions: { value: SalesChannel; label: string }[] = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'store', label: 'Dyqan' },
  { value: 'online', label: 'Online' },
  { value: 'b2b', label: 'B2B' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-IE').format(Number.isFinite(value) ? value : 0);
};

const formatDate = (value: string | null) => {
  if (!value) return 'Jo e sinkronizuar ende';

  try {
    return new Intl.DateTimeFormat('sq-AL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getTrendLabel = (status: TrendStatus) => {
  switch (status) {
    case 'growth':
      return 'Rritje';
    case 'stable':
      return 'Stabil';
    case 'decline':
      return 'Në rënie';
    case 'promotion':
      return 'Promocion';
    default:
      return 'Pa sinjal';
  }
};

const getTrendStyle = (status: TrendStatus) => {
  switch (status) {
    case 'growth':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'stable':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'decline':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'promotion':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getSignalStyle = (severity: SalesSignal['severity']) => {
  switch (severity) {
    case 'good':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-800';
    default:
      return 'border-sky-200 bg-sky-50 text-sky-800';
  }
};

const getPriorityStyle = (priority: RecommendedAction['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function SalesPage() {
  const [period, setPeriod] = useState<SalesPeriod>('30d');
  const [channel, setChannel] = useState<SalesChannel>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'profit'>('revenue');
  const [summary, setSummary] = useState<SalesSummary>(emptySummary);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [signals, setSignals] = useState<SalesSignal[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSales = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ period, channel });
      const res = await fetch(`/api/sales/summary?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'API /api/sales/summary nuk ekziston ende. Duhet ta lidhim me Supabase për shitje reale.'
            : `Shitjet nuk u ngarkuan. Server error ${res.status}.`
        );
      }

      const data = (await res.json()) as Partial<SalesApiResponse>;

      setSummary({
        ...emptySummary,
        ...(data.summary || {}),
      });
      setProducts(Array.isArray(data.products) ? data.products : []);
      setSignals(Array.isArray(data.signals) ? data.signals : []);
      setRecommendedActions(
        Array.isArray(data.recommendedActions) ? data.recommendedActions : []
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Nuk mund të ngarkohen shitjet reale. Kontrollo API-në ose lidhjen me databazë.'
      );
      setSummary(emptySummary);
      setProducts([]);
      setSignals([]);
      setRecommendedActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [period, channel]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return [...products]
      .filter((item) => {
        if (!normalizedSearch) return true;

        const text = `${item.name} ${item.sku || ''} ${item.category || ''}`.toLowerCase();
        return text.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortBy === 'units') return b.units - a.units;
        if (sortBy === 'margin') return b.margin - a.margin;
        if (sortBy === 'profit') return b.grossProfit - a.grossProfit;
        return b.revenue - a.revenue;
      });
  }, [products, search, sortBy]);

  const performanceScore = useMemo(() => {
    let score = 50;

    if (summary.revenue > 0) score += 12;
    if (summary.netProfit > 0) score += 18;
    if (summary.averageMargin >= 20) score += 14;
    if (summary.refundRate > 8) score -= 12;
    if (summary.conversionRate >= 3) score += 6;
    if (!summary.lastUpdated) score -= 10;

    return Math.max(0, Math.min(100, score));
  }, [summary]);

  const exportCsv = () => {
    if (filteredProducts.length === 0) return;

    const headers = [
      'Product',
      'SKU',
      'Category',
      'Units',
      'Revenue',
      'Gross Profit',
      'Margin %',
      'Average Price',
      'Status',
    ];

    const rows = filteredProducts.map((item) => [
      item.name,
      item.sku || '',
      item.category || '',
      item.units,
      item.revenue,
      item.grossProfit,
      item.margin,
      item.averagePrice,
      getTrendLabel(item.status),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sellsmart-sales-${period}-${channel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                  Performanca komerciale
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Live Sales Intelligence
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Jo Mock Data
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Shitjet
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Monitoro shitjet reale sipas periudhës, kanalit, produkteve, marzhës,
                fitimit dhe sinjaleve të performancës. Kjo faqe pret të dhëna live nga
                API, jo numra të shpikur.
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-500">
                Përditësimi i fundit: {formatDate(summary.lastUpdated)}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[520px]">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Sales Health
                </div>
                <div className="mt-2 text-5xl font-black text-slate-950">
                  {loading ? '—' : `${performanceScore}%`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    style={{ width: `${loading ? 0 : performanceScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Revenue
                </div>
                <div className="mt-2 text-5xl font-black">
                  {loading ? '—' : formatCurrency(summary.revenue)}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  From live sales API
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-amber-800">
                  ⚠️ Të dhënat live nuk janë lidhur ende
                </div>
                <p className="mt-1 text-sm leading-6 text-amber-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={loadSales}
                className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-black text-amber-800 transition-all hover:bg-amber-200"
              >
                Provo përsëri
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Njësi të shitura',
              value: loading ? '—' : formatNumber(summary.unitsSold),
              icon: '📦',
              note: 'Nga porositë reale',
            },
            {
              label: 'Të ardhura',
              value: loading ? '—' : formatCurrency(summary.revenue),
              icon: '💶',
              note: 'Shitje bruto',
            },
            {
              label: 'Fitim neto',
              value: loading ? '—' : formatCurrency(summary.netProfit),
              icon: '📈',
              note: 'Pas kostove kryesore',
            },
            {
              label: 'Marzha mesatare',
              value: loading ? '—' : `${summary.averageMargin.toFixed(1)}%`,
              icon: '🎯',
              note: 'Nga produktet e shitura',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                  Live
                </span>
              </div>
              <div className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </div>
              <div className="mt-2 text-4xl font-black text-slate-950">{item.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">{item.note}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-6">
              <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                    Product Performance
                  </div>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Produktet sipas shitjeve reale
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as SalesPeriod)}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    {periodOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as SalesChannel)}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    {channelOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="units">Units</option>
                    <option value="margin">Margin</option>
                    <option value="profit">Profit</option>
                  </select>

                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={filteredProducts.length === 0}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko produkt, SKU ose kategori..."
                className="mb-5 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-[28px] border border-slate-100 bg-slate-100/70"
                    />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-4">
                  {filteredProducts.map((item) => {
                    const maxRevenue = Math.max(...filteredProducts.map((product) => product.revenue), 1);
                    const revenueWidth = Math.min(100, Math.max(8, (item.revenue / maxRevenue) * 100));
                    const previousRevenue = item.previousRevenue || 0;
                    const revenueDelta = previousRevenue > 0 ? ((item.revenue - previousRevenue) / previousRevenue) * 100 : null;

                    return (
                      <div
                        key={item.id}
                        className="rounded-[28px] border border-white/70 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_14px_50px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(79,70,229,0.12)]"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                              🛒
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                                <span
                                  className={`rounded-full border px-3 py-1 text-[11px] font-black ${getTrendStyle(
                                    item.status
                                  )}`}
                                >
                                  {getTrendLabel(item.status)}
                                </span>
                              </div>

                              <div className="mt-1 text-sm font-medium text-slate-500">
                                {item.category || 'Pa kategori'} · {item.sku || 'Pa SKU'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                            <div className="rounded-2xl bg-white/80 p-3">
                              <div className="text-[10px] font-black uppercase text-slate-400">
                                Units
                              </div>
                              <div className="text-xl font-black text-slate-950">
                                {formatNumber(item.units)}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white/80 p-3">
                              <div className="text-[10px] font-black uppercase text-slate-400">
                                Revenue
                              </div>
                              <div className="text-xl font-black text-slate-950">
                                {formatCurrency(item.revenue)}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white/80 p-3">
                              <div className="text-[10px] font-black uppercase text-slate-400">
                                Profit
                              </div>
                              <div className="text-xl font-black text-slate-950">
                                {formatCurrency(item.grossProfit)}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white/80 p-3">
                              <div className="text-[10px] font-black uppercase text-slate-400">
                                Margin
                              </div>
                              <div className="text-xl font-black text-slate-950">
                                {item.margin.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                            style={{ width: `${revenueWidth}%` }}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                          <span>Average price: {formatCurrency(item.averagePrice)}</span>
                          <span>
                            {revenueDelta === null
                              ? 'No previous comparison'
                              : `Revenue change: ${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
                  <div className="text-4xl">📭</div>
                  <div className="mt-3 text-xl font-black text-slate-900">
                    Nuk ka shitje për këtë filtër
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Kur API lidhet me databazë, produktet e shitura shfaqen këtu.
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Executive Snapshot
              </div>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Gjendja e shitjeve
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Orders</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : formatNumber(summary.ordersCount)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Average Order Value</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : formatCurrency(summary.averageOrderValue)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Conversion Rate</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : `${summary.conversionRate.toFixed(2)}%`}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Refund Rate</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : `${summary.refundRate.toFixed(2)}%`}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Sinjale kryesore
              </div>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Sales Signals
              </h3>

              <div className="mt-5 space-y-3">
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  ))
                ) : signals.length > 0 ? (
                  signals.map((signal) => (
                    <div
                      key={signal.id}
                      className={`rounded-2xl border p-4 ${getSignalStyle(signal.severity)}`}
                    >
                      <div className="text-sm font-black">{signal.title}</div>
                      <div className="mt-1 text-sm leading-6 opacity-80">
                        {signal.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center">
                    <div className="text-3xl">📡</div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      Nuk ka sinjale ende
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Sinjalet shfaqen kur API analizon shitjet reale.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Veprime të sugjeruara
              </div>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Action Queue
              </h3>

              <div className="mt-5 space-y-3">
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))
                ) : recommendedActions.length > 0 ? (
                  recommendedActions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-black text-slate-950">{action.title}</div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getPriorityStyle(
                            action.priority
                          )}`}
                        >
                          {action.priority}
                        </span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">
                        {action.description}
                      </div>
                      {action.impact && (
                        <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-black text-indigo-700">
                          Impact: {action.impact}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center">
                    <div className="text-3xl">✅</div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      Nuk ka veprime ende
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Rekomandimet shfaqen pas lidhjes me të dhëna reale.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 shadow-[0_22px_80px_rgba(79,70,229,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Backend Required
              </div>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Për shitje të sakta
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Kjo faqe pret endpoint-in `/api/sales/summary`, i cili duhet të lexojë nga
                Supabase: orders, order_items, products, costs, channels dhe price history.
              </p>

              <button
                type="button"
                onClick={loadSales}
                className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
              >
                Rifresko shitjet live
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
