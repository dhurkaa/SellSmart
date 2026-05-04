'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type AccountingRow = {
  id: string;
  productName: string;
  sku?: string | null;
  category?: string | null;
  revenue: number;
  cost: number;
  fees: number;
  ads: number;
  tax: number;
  grossProfit: number;
  netProfit: number;
  marginPct: number;
  status: 'healthy' | 'low_margin' | 'loss' | 'review';
};

type AccountingSummary = {
  totalRevenue: number;
  totalCost: number;
  totalFees: number;
  totalAds: number;
  totalTax: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPct: number;
  netMarginPct: number;
  productsTracked: number;
  productsAtRisk: number;
  lastUpdated: string | null;
};

type AccountingApiResponse = {
  summary: AccountingSummary;
  rows: AccountingRow[];
  meta?: {
    source?: string;
    rows?: number;
    warning?: string | null;
  };
};

const emptySummary: AccountingSummary = {
  totalRevenue: 0,
  totalCost: 0,
  totalFees: 0,
  totalAds: 0,
  totalTax: 0,
  grossProfit: 0,
  netProfit: 0,
  grossMarginPct: 0,
  netMarginPct: 0,
  productsTracked: 0,
  productsAtRisk: 0,
  lastUpdated: null,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
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

const getStatusStyle = (status: AccountingRow['status']) => {
  switch (status) {
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'low_margin':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'loss':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'review':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getStatusLabel = (status: AccountingRow['status']) => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'low_margin':
      return 'Low Margin';
    case 'loss':
      return 'Loss';
    case 'review':
      return 'Review';
    default:
      return status;
  }
};

export default function AccountingPage() {
  const [summary, setSummary] = useState<AccountingSummary>(emptySummary);
  const [rows, setRows] = useState<AccountingRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountingRow['status']>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'netProfit' | 'marginPct' | 'cost'>(
    'netProfit'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const financialHealth = useMemo(() => {
    let score = 100;

    if (summary.netProfit < 0) score -= 35;
    if (summary.netMarginPct < 10 && summary.totalRevenue > 0) score -= 25;
    if (summary.productsAtRisk > 0) score -= Math.min(summary.productsAtRisk * 8, 30);
    if (!summary.lastUpdated) score -= 10;

    return Math.max(0, Math.min(100, score));
  }, [summary]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const searchText = `${row.productName} ${row.sku || ''} ${row.category || ''}`.toLowerCase();
        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => Number(b[sortBy]) - Number(a[sortBy]));
  }, [rows, search, statusFilter, sortBy]);

  const loadAccounting = async () => {
    setLoading(true);
    setError('');
    setWarning(null);

    try {
      const res = await fetch('/api/accounting/summary', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      const data = (await res.json()) as Partial<AccountingApiResponse> & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(
          data?.error ||
            (res.status === 404
              ? 'API /api/accounting/summary nuk ekziston ende. Duhet ta krijojmë për kontabilitet real.'
              : `Accounting API error ${res.status}.`)
        );
      }

      setSummary({
        ...emptySummary,
        ...(data.summary || {}),
      });

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setWarning(data.meta?.warning || null);
    } catch (err: any) {
      setError(
        err?.message ||
          'Nuk mund të ngarkohen të dhënat e kontabilitetit. Kontrollo API-në ose Supabase.'
      );
      setSummary(emptySummary);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounting();
  }, []);

  const exportCsv = () => {
    const headers = [
      'Product',
      'SKU',
      'Category',
      'Revenue',
      'Cost',
      'Fees',
      'Ads',
      'Tax',
      'Gross Profit',
      'Net Profit',
      'Margin %',
      'Status',
    ];

    const csvRows = filteredRows.map((row) => [
      row.productName,
      row.sku || '',
      row.category || '',
      row.revenue,
      row.cost,
      row.fees,
      row.ads,
      row.tax,
      row.grossProfit,
      row.netProfit,
      row.marginPct,
      row.status,
    ]);

    const csv = [headers, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `sellsmart-accounting-${new Date().toISOString().slice(0, 10)}.csv`;
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
                  Kontroll financiar
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Live Accounting
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Sales Based
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Accounting
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Shiko të ardhurat, kostot, tarifat, reklamat, taksat dhe fitimin real sipas
                produktit. Kjo faqe lexon nga API live, jo nga numra fake.
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-500">
                Përditësimi i fundit: {formatDate(summary.lastUpdated)}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[520px]">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Financial Health
                </div>
                <div className="mt-2 text-5xl font-black text-slate-950">
                  {loading ? '—' : `${financialHealth}%`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    style={{ width: `${loading ? 0 : financialHealth}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Net Profit
                </div>
                <div className="mt-2 text-5xl font-black">
                  {loading ? '—' : formatCurrency(summary.netProfit)}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  Margin {loading ? '—' : `${summary.netMarginPct.toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {(error || warning) && (
          <section
            className={`rounded-[28px] border p-5 shadow-sm ${
              error ? 'border-amber-200 bg-amber-50' : 'border-sky-200 bg-sky-50'
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div
                  className={`text-sm font-black ${
                    error ? 'text-amber-800' : 'text-sky-800'
                  }`}
                >
                  {error
                    ? '⚠️ Të dhënat live nuk janë lidhur ende'
                    : 'ℹ️ Accounting API është lidhur'}
                </div>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    error ? 'text-amber-700' : 'text-sky-700'
                  }`}
                >
                  {error || warning}
                </p>
              </div>

              <button
                type="button"
                onClick={loadAccounting}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${
                  error
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                }`}
              >
                Rifresko
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Të ardhura totale',
              value: loading ? '—' : formatCurrency(summary.totalRevenue),
              icon: '💶',
              note: 'Nga shitjet reale',
            },
            {
              label: 'Kosto totale',
              value: loading ? '—' : formatCurrency(summary.totalCost),
              icon: '📦',
              note: 'Cost of goods',
            },
            {
              label: 'Tarifa + reklama',
              value: loading
                ? '—'
                : formatCurrency(summary.totalFees + summary.totalAds),
              icon: '🧾',
              note: 'Fees and ads',
            },
            {
              label: 'Fitimi neto',
              value: loading ? '—' : formatCurrency(summary.netProfit),
              icon: '📈',
              note: 'After costs',
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

              <div className="mt-2 text-4xl font-black text-slate-950">
                {item.value}
              </div>

              <div className="mt-1 text-sm font-medium text-slate-500">{item.note}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-6">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                    Financial Statement
                  </div>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Pasqyra financiare sipas produktit
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kërko produkt..."
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | AccountingRow['status'])
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="all">All status</option>
                    <option value="healthy">Healthy</option>
                    <option value="low_margin">Low margin</option>
                    <option value="loss">Loss</option>
                    <option value="review">Review</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'revenue' | 'netProfit' | 'marginPct' | 'cost')
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="netProfit">Sort by profit</option>
                    <option value="revenue">Sort by revenue</option>
                    <option value="marginPct">Sort by margin</option>
                    <option value="cost">Sort by cost</option>
                  </select>

                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={filteredRows.length === 0}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
                  <div className="text-4xl">📭</div>
                  <div className="mt-3 text-xl font-black text-slate-900">
                    Nuk ka të dhëna kontabiliteti
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Kur tabela `sales` ka rreshta realë, pasqyra financiare shfaqet këtu.
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-4 text-left font-black">Produkti</th>
                          <th className="px-4 py-4 text-left font-black">Të ardhura</th>
                          <th className="px-4 py-4 text-left font-black">Kosto</th>
                          <th className="px-4 py-4 text-left font-black">Tarifa</th>
                          <th className="px-4 py-4 text-left font-black">Reklama</th>
                          <th className="px-4 py-4 text-left font-black">Tax</th>
                          <th className="px-4 py-4 text-left font-black">Fitimi neto</th>
                          <th className="px-4 py-4 text-left font-black">Margin</th>
                          <th className="px-4 py-4 text-left font-black">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-4 py-4">
                              <div className="font-black text-slate-900">
                                {row.productName}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">
                                {row.sku || 'No SKU'} · {row.category || 'Uncategorized'}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              {formatCurrency(row.revenue)}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              {formatCurrency(row.cost)}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              {formatCurrency(row.fees)}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              {formatCurrency(row.ads)}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              {formatCurrency(row.tax)}
                            </td>
                            <td
                              className={`px-4 py-4 font-black ${
                                row.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {formatCurrency(row.netProfit)}
                            </td>
                            <td className="px-4 py-4 font-black text-slate-900">
                              {row.marginPct.toFixed(1)}%
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusStyle(
                                  row.status
                                )}`}
                              >
                                {getStatusLabel(row.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Executive Finance Snapshot
              </div>

              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Real profit picture
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Gross Profit</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : formatCurrency(summary.grossProfit)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Net Profit</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : formatCurrency(summary.netProfit)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Products at Risk</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : summary.productsAtRisk}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Tracked Products</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : summary.productsTracked}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Cost Breakdown
              </div>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Where money goes
              </h3>

              <div className="mt-6 space-y-4">
                {[
                  ['Product Cost', summary.totalCost, 'bg-indigo-600'],
                  ['Fees', summary.totalFees, 'bg-cyan-500'],
                  ['Ads', summary.totalAds, 'bg-amber-500'],
                  ['Tax', summary.totalTax, 'bg-red-500'],
                ].map(([label, value, color]) => {
                  const numeric = Number(value);
                  const total =
                    summary.totalCost +
                    summary.totalFees +
                    summary.totalAds +
                    summary.totalTax;

                  const percentage = total > 0 ? (numeric / total) * 100 : 0;

                  return (
                    <div key={label as string}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-black text-slate-700">{label}</span>
                        <span className="font-bold text-slate-400">
                          {formatCurrency(numeric)}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 shadow-[0_22px_80px_rgba(79,70,229,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Backend Required
              </div>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Për saktësi reale
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Kjo faqe pret të dhëna nga `/api/accounting/summary`. API duhet të
                llogarisë kontabilitetin nga tabela `sales`, plus fees, ads dhe tax.
              </p>

              <button
                type="button"
                onClick={loadAccounting}
                className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
              >
                Rifresko kontabilitetin
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}