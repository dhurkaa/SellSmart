'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type ReportType = 'PDF' | 'Excel' | 'PDF / Excel';

type ReportTemplate = {
  id: string;
  title: string;
  desc: string;
  type: ReportType;
  category: 'profit' | 'margin' | 'pricing' | 'weak_products' | 'inventory' | 'market';
  endpoint: string;
};

type ReportSummary = {
  activeReports: number;
  exportedReports: number;
  trackedCost: number;
  monitoredProfit: number;
  monthlyGrossProfit: number;
  monthlyNetProfit: number;
  averageMargin: number;
  weakProductsCount: number;
  priceChangesCount: number;
  lastUpdated: string | null;
};

type RecentReport = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  status: 'ready' | 'processing' | 'failed';
  export_url?: string | null;
};

type ReportsApiResponse = {
  summary: ReportSummary;
  recentReports: RecentReport[];
};

const reportTemplates: ReportTemplate[] = [
  {
    id: 'monthly-profit',
    title: 'Raporti i Fitimit Mujor',
    desc: 'Shfaq fitimin bruto, fitimin neto, kostot, shitjet dhe ndikimin e ndryshimeve të çmimeve.',
    type: 'PDF / Excel',
    category: 'profit',
    endpoint: '/api/reports/monthly-profit',
  },
  {
    id: 'product-margin',
    title: 'Raporti i Marzhës sipas Produktit',
    desc: 'Krahason marzhën reale me marzhën e synuar për çdo produkt nga të dhënat reale.',
    type: 'Excel',
    category: 'margin',
    endpoint: '/api/reports/product-margin',
  },
  {
    id: 'pricing-performance',
    title: 'Raporti i Performancës së Çmimeve',
    desc: 'Tregon çfarë ndodhi pas rritjes ose uljes së çmimit dhe ndikimin në fitim.',
    type: 'PDF',
    category: 'pricing',
    endpoint: '/api/reports/pricing-performance',
  },
  {
    id: 'weak-products',
    title: 'Raporti i Produkteve të Dobëta',
    desc: 'Identifikon produktet me shitje të ulëta, fitim të dobët ose rrezik të lartë stoku.',
    type: 'PDF / Excel',
    category: 'weak_products',
    endpoint: '/api/reports/weak-products',
  },
  {
    id: 'inventory-capital',
    title: 'Raporti i Kapitalit në Inventar',
    desc: 'Analizon vlerën e stokut, kapitalin e bllokuar dhe produktet që kërkojnë veprim.',
    type: 'Excel',
    category: 'inventory',
    endpoint: '/api/reports/inventory-capital',
  },
  {
    id: 'market-position',
    title: 'Raporti i Pozicionimit në Treg',
    desc: 'Krahason çmimet e produkteve me sinjalet e tregut dhe konkurrentët.',
    type: 'PDF / Excel',
    category: 'market',
    endpoint: '/api/reports/market-position',
  },
];

const emptySummary: ReportSummary = {
  activeReports: 0,
  exportedReports: 0,
  trackedCost: 0,
  monitoredProfit: 0,
  monthlyGrossProfit: 0,
  monthlyNetProfit: 0,
  averageMargin: 0,
  weakProductsCount: 0,
  priceChangesCount: 0,
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

const getReportIcon = (category: ReportTemplate['category']) => {
  switch (category) {
    case 'profit':
      return '💶';
    case 'margin':
      return '📈';
    case 'pricing':
      return '🏷️';
    case 'weak_products':
      return '⚠️';
    case 'inventory':
      return '📦';
    case 'market':
      return '📡';
    default:
      return '📑';
  }
};

const getStatusStyle = (status: RecentReport['status']) => {
  switch (status) {
    case 'ready':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'processing':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ReportTemplate['category']>(
    'all'
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter((report) => {
      const matchesCategory =
        selectedCategory === 'all' || report.category === selectedCategory;

      const searchText = `${report.title} ${report.desc} ${report.type}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const healthScore = useMemo(() => {
    let score = 100;

    if (summary.weakProductsCount > 0) score -= Math.min(summary.weakProductsCount * 6, 30);
    if (summary.averageMargin > 0 && summary.averageMargin < 15) score -= 20;
    if (summary.monthlyNetProfit < 0) score -= 30;
    if (!summary.lastUpdated) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [summary]);

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reports/summary', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'API /api/reports/summary nuk ekziston ende. Duhet ta lidhim me Supabase për të marrë të dhëna reale.'
            : `Raportet nuk u ngarkuan. Server error ${res.status}.`
        );
      }

      const data = (await res.json()) as Partial<ReportsApiResponse>;

      setSummary({
        ...emptySummary,
        ...(data.summary || {}),
      });

      setRecentReports(Array.isArray(data.recentReports) ? data.recentReports : []);
    } catch (err: any) {
      setError(
        err?.message ||
          'Nuk mund të ngarkohen raportet reale. Kontrollo API-në ose lidhjen me databazë.'
      );
      setSummary(emptySummary);
      setRecentReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const exportReport = async (report: ReportTemplate, format: 'pdf' | 'excel') => {
    setExportingId(`${report.id}-${format}`);
    setError('');

    try {
      const res = await fetch(`${report.endpoint}?format=${format}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? `Endpoint ${report.endpoint} nuk ekziston ende. Krijoje API-në për eksport real.`
            : `Eksporti dështoi. Server error ${res.status}.`
        );
      }

      const data = (await res.json()) as { url?: string; downloadUrl?: string };

      const url = data.downloadUrl || data.url;

      if (!url) {
        throw new Error('API nuk ktheu link shkarkimi për raportin.');
      }

      window.open(url, '_blank');
      await loadReports();
    } catch (err: any) {
      setError(err?.message || 'Eksporti dështoi. Provo përsëri.');
    } finally {
      setExportingId(null);
    }
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
                  Raportim ekzekutiv
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Live Business Intelligence
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Jo Mock Data
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Reports
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Krijo raporte reale nga shitjet, çmimet, marzha, inventari dhe sinjalet e
                tregut. Kjo faqe nuk përdor numra fake — kërkon API live për të dhëna të
                sakta.
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-500">
                Përditësimi i fundit: {formatDate(summary.lastUpdated)}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[500px]">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Business Health
                </div>
                <div className="mt-2 text-5xl font-black text-slate-950">
                  {loading ? '—' : `${healthScore}%`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    style={{ width: `${loading ? 0 : healthScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Net Profit
                </div>
                <div className="mt-2 text-5xl font-black">
                  {loading ? '—' : formatCurrency(summary.monthlyNetProfit)}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  From live reports API
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
                onClick={loadReports}
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
              label: 'Raporte aktive',
              value: loading ? '—' : String(summary.activeReports),
              icon: '📑',
              note: 'Nga databaza',
            },
            {
              label: 'Eksporte totale',
              value: loading ? '—' : String(summary.exportedReports),
              icon: '📤',
              note: 'PDF / Excel',
            },
            {
              label: 'Kosto e ndjekur',
              value: loading ? '—' : formatCurrency(summary.trackedCost),
              icon: '💶',
              note: 'Nga produkte dhe inventar',
            },
            {
              label: 'Fitim i monitoruar',
              value: loading ? '—' : formatCurrency(summary.monitoredProfit),
              icon: '📈',
              note: 'Nga shitjet reale',
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
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                    Report Generator
                  </div>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Raporte të gatshme për biznes
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kërko raport..."
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />

                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value as 'all' | ReportTemplate['category'])
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="all">Të gjitha</option>
                    <option value="profit">Fitim</option>
                    <option value="margin">Marzhë</option>
                    <option value="pricing">Çmime</option>
                    <option value="weak_products">Produkte të dobëta</option>
                    <option value="inventory">Inventar</option>
                    <option value="market">Treg</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-56 animate-pulse rounded-[32px] border border-slate-100 bg-slate-100/70"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {filteredTemplates.map((report) => (
                    <div
                      key={report.id}
                      className="group rounded-[32px] border border-white/70 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(79,70,229,0.14)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                          {getReportIcon(report.category)}
                        </div>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                          {report.type}
                        </span>
                      </div>

                      <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
                        {report.title}
                      </h3>

                      <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                        {report.desc}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => exportReport(report, 'pdf')}
                          disabled={exportingId !== null}
                          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {exportingId === `${report.id}-pdf`
                            ? 'Duke eksportuar...'
                            : 'Eksporto PDF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => exportReport(report, 'excel')}
                          disabled={exportingId !== null}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {exportingId === `${report.id}-excel`
                            ? 'Duke eksportuar...'
                            : 'Eksporto Excel'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="xl:col-span-2 rounded-[32px] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
                      <div className="text-4xl">🔍</div>
                      <div className="mt-3 text-xl font-black text-slate-900">
                        Nuk u gjet asnjë raport
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        Ndrysho kërkimin ose filtrin.
                      </div>
                    </div>
                  )}
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
                Gjendja e biznesit
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Fitimi bruto mujor</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : formatCurrency(summary.monthlyGrossProfit)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Marzha mesatare</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : `${summary.averageMargin.toFixed(1)}%`}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Produkte të dobëta</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : summary.weakProductsCount}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-black">Ndryshime çmimesh</div>
                  <div className="mt-1 text-3xl font-black">
                    {loading ? '—' : summary.priceChangesCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Recent Reports
              </div>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Eksportet e fundit
              </h3>

              <div className="mt-5 space-y-3">
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))
                ) : recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-100 bg-white/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{report.title}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            {formatDate(report.created_at)}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusStyle(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </div>

                      {report.export_url && (
                        <button
                          type="button"
                          onClick={() => window.open(report.export_url || '', '_blank')}
                          className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                        >
                          Shkarko
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center">
                    <div className="text-3xl">📭</div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      Nuk ka eksporte ende
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Kur API lidhet me databazë, eksportet shfaqen këtu.
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
                Për saktësi reale
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Kjo faqe pret të dhëna nga API live. Hapi tjetër është të krijohen
                endpoint-et `/api/reports/summary` dhe `/api/reports/...` që lexojnë nga
                Supabase: shitjet, produktet, inventari, çmimet dhe market signals.
              </p>

              <button
                type="button"
                onClick={loadReports}
                className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
              >
                Rifresko të dhënat live
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}