'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

type PriceStatus =
  | 'undervalued'
  | 'balanced'
  | 'overpriced'
  | 'margin_risk'
  | 'stock_clearance'
  | 'premium_opportunity';

type PricingProduct = {
  id: string;
  name: string;
  category: string;
  sku?: string | null;
  brand?: string | null;
  supplier?: string | null;
  sourceUrl?: string | null;
  currentPrice: number;
  recommendedPrice: number;
  floorPrice: number;
  costPrice: number;
  marginPct: number;
  targetMarginPct: number;
  stock: number;
  soldLast30Days?: number | null;
  marketAveragePrice?: number | null;
  competitorMinPrice?: number | null;
  competitorMaxPrice?: number | null;
  marketConfidence: number;
  status: PriceStatus;
  lastUpdated?: string | null;
};

type PricingSummary = {
  totalProducts: number;
  productsForReview: number;
  undervalued: number;
  marginRisk: number;
  pendingApprovals: number;
  avgMargin: number;
  avgConfidence: number;
  totalStockValue: number;
  potentialRevenueLift: number;
  lastUpdated: string | null;
};

type PricingApiResponse = {
  products: PricingProduct[];
  summary: PricingSummary;
  meta?: {
    source?: string;
    domains?: string[];
    productCount?: number;
    competitorSignals?: number;
    globalMarketAverage?: number;
    needsAnalysis?: boolean;
    needsCompetitorSetup?: boolean;
    warning?: string | null;
  };
};

type ManualProductForm = {
  product_name: string;
  detected_price: string;
  source_domain: string;
  source_url: string;
};

const emptySummary: PricingSummary = {
  totalProducts: 0,
  productsForReview: 0,
  undervalued: 0,
  marginRisk: 0,
  pendingApprovals: 0,
  avgMargin: 0,
  avgConfidence: 0,
  totalStockValue: 0,
  potentialRevenueLift: 0,
  lastUpdated: null,
};

const statusLabels: Record<PriceStatus, string> = {
  undervalued: 'Nënvlerësuar',
  balanced: 'Balancuar',
  overpriced: 'Mbi treg',
  margin_risk: 'Risk marzhe',
  stock_clearance: 'Clearance',
  premium_opportunity: 'Premium opportunity',
};

const statusStyles: Record<PriceStatus, string> = {
  undervalued: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  balanced: 'border-slate-200 bg-slate-50 text-slate-700',
  overpriced: 'border-red-200 bg-red-50 text-red-700',
  margin_risk: 'border-amber-200 bg-amber-50 text-amber-700',
  stock_clearance: 'border-sky-200 bg-sky-50 text-sky-700',
  premium_opportunity: 'border-violet-200 bg-violet-50 text-violet-700',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

const formatDate = (value?: string | null) => {
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

const safeNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getRecommendationReasons = (product: PricingProduct) => {
  const reasons: string[] = [];

  if (product.marketAveragePrice) {
    reasons.push(`Market average is ${formatCurrency(product.marketAveragePrice)}.`);
  }

  if (product.competitorMinPrice && product.competitorMaxPrice) {
    reasons.push(
      `Competitor range is ${formatCurrency(product.competitorMinPrice)} – ${formatCurrency(
        product.competitorMaxPrice
      )}.`
    );
  }

  reasons.push(`Confidence score is ${product.marketConfidence}%.`);

  if (product.recommendedPrice > product.currentPrice) {
    reasons.push(
      `Recommended price is ${formatCurrency(
        product.recommendedPrice - product.currentPrice
      )} higher than current detected price.`
    );
  } else if (product.recommendedPrice < product.currentPrice) {
    reasons.push(
      `Recommended price is ${formatCurrency(
        product.currentPrice - product.recommendedPrice
      )} lower to stay closer to the market.`
    );
  } else {
    reasons.push('Current detected price is already close to the recommended level.');
  }

  reasons.push(`Estimated margin after recommendation is ${product.marginPct.toFixed(1)}%.`);

  return reasons;
};

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [summary, setSummary] = useState<PricingSummary>(emptySummary);
  const [meta, setMeta] = useState<PricingApiResponse['meta']>({});

  const [loading, setLoading] = useState(true);
  const [checkingCompetitors, setCheckingCompetitors] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);

  const [error, setError] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PriceStatus>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [confidenceOnly, setConfidenceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    'name' | 'currentPrice' | 'recommendedPrice' | 'marginPct' | 'marketConfidence'
  >('marketConfidence');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);

  const [manualForm, setManualForm] = useState<ManualProductForm>({
    product_name: '',
    detected_price: '',
    source_domain: '',
    source_url: '',
  });

  const sourceOptions = useMemo(() => {
    const values = Array.from(
      new Set(products.map((item) => item.supplier || item.category).filter(Boolean))
    );

    return values.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const searchText = `${product.name} ${product.category} ${product.supplier || ''} ${
          product.brand || ''
        } ${product.sku || ''}`.toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
        const matchesSource =
          sourceFilter === 'all' ||
          product.supplier === sourceFilter ||
          product.category === sourceFilter;
        const matchesConfidence = !confidenceOnly || product.marketConfidence >= 70;

        return matchesSearch && matchesStatus && matchesSource && matchesConfidence;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return safeNumber(b[sortBy]) - safeNumber(a[sortBy]);
      });
  }, [products, search, statusFilter, sourceFilter, confidenceOnly, sortBy]);

  const pricingHealth = useMemo(() => {
    let score = 100;

    if (summary.totalProducts === 0) score -= 45;
    if (summary.avgConfidence < 40 && summary.totalProducts > 0) score -= 25;
    if (summary.marginRisk > 0) score -= Math.min(summary.marginRisk * 8, 25);
    if (summary.productsForReview > 0) score -= Math.min(summary.productsForReview * 3, 20);

    return Math.max(0, Math.min(100, score));
  }, [summary]);

  const loadPricingProducts = async () => {
    setLoading(true);
    setError('');
    setWarning(null);

    try {
      const res = await fetch('/api/pricing/products?limit=500', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      const data = (await res.json()) as Partial<PricingApiResponse> & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data?.error || `Pricing API error ${res.status}.`);
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
      setSummary({
        ...emptySummary,
        ...(data.summary || {}),
      });
      setMeta(data.meta || {});
      setWarning(data.meta?.warning || null);
    } catch (err: any) {
      setError(
        err?.message ||
          'Nuk mund të ngarkohen produktet e pricing. Kontrollo API-në dhe Supabase.'
      );
      setProducts([]);
      setSummary(emptySummary);
      setMeta({});
    } finally {
      setLoading(false);
    }
  };

  const checkCompetitorSetup = async () => {
    setCheckingCompetitors(true);

    try {
      const res = await fetch('/api/competitors/status', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok && !data.hasCompetitors) {
        router.push('/pricing/setup-competitors');
        return;
      }

      setCheckingCompetitors(false);
    } catch {
      setCheckingCompetitors(false);
    }
  };

  const analyzeCompetitors = async () => {
    setAnalyzing(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Competitor analysis failed.');
      }

      setSuccessMessage(
        data?.message ||
          `Analysis finished. Products inserted: ${data?.productsInserted || 0}.`
      );

      await loadPricingProducts();
    } catch (err: any) {
      setError(err?.message || 'Competitor analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    checkCompetitorSetup();
  }, []);

  useEffect(() => {
    if (checkingCompetitors) return;

    const shouldRefresh = searchParams.get('refreshCompetitors') === 'true';

    const run = async () => {
      if (shouldRefresh) {
        await analyzeCompetitors();
        router.replace('/pricing');
      } else {
        await loadPricingProducts();
      }
    };

    run();
  }, [checkingCompetitors]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredProducts.map((product) => product.id);

    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const exportCsv = () => {
    const headers = [
      'Product',
      'Source',
      'Current Price',
      'Recommended Price',
      'Floor Price',
      'Margin %',
      'Market Average',
      'Competitor Min',
      'Competitor Max',
      'Confidence',
      'Status',
      'Source URL',
    ];

    const rows = filteredProducts.map((product) => [
      product.name,
      product.supplier || product.category,
      product.currentPrice,
      product.recommendedPrice,
      product.floorPrice,
      product.marginPct,
      product.marketAveragePrice || '',
      product.competitorMinPrice || '',
      product.competitorMaxPrice || '',
      product.marketConfidence,
      product.status,
      product.sourceUrl || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `sellsmart-pricing-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const parseCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV must contain headers and at least one product row.');
    }

    const headers = lines[0]
      .split(',')
      .map((header) => header.replace(/"/g, '').trim().toLowerCase());

    const nameIndex = headers.findIndex((header) =>
      ['product', 'product_name', 'name', 'title'].includes(header)
    );
    const priceIndex = headers.findIndex((header) =>
      ['price', 'detected_price', 'current_price'].includes(header)
    );
    const domainIndex = headers.findIndex((header) =>
      ['domain', 'source_domain', 'website', 'source'].includes(header)
    );
    const urlIndex = headers.findIndex((header) =>
      ['url', 'source_url', 'link', 'product_url'].includes(header)
    );

    if (nameIndex === -1 || priceIndex === -1) {
      throw new Error('CSV must include product/name and price columns.');
    }

    return lines.slice(1).map((line) => {
      const values = line
        .split(',')
        .map((value) => value.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

      return {
        product_name: values[nameIndex] || '',
        detected_price: values[priceIndex] || '',
        source_domain: domainIndex >= 0 ? values[domainIndex] || 'manual-import' : 'manual-import',
        source_url: urlIndex >= 0 ? values[urlIndex] || '' : '',
      };
    });
  };

  const importCsv = async (file: File) => {
    setImportingCsv(true);
    setError('');
    setSuccessMessage('');

    try {
      const productsToImport = await parseCsvFile(file);

      const cleanProducts = productsToImport.filter(
        (item) => item.product_name && Number(item.detected_price) > 0
      );

      if (cleanProducts.length === 0) {
        throw new Error('No valid products found in CSV.');
      }

      const res = await fetch('/api/competitors/manual-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          products: cleanProducts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'CSV import failed.');
      }

      setSuccessMessage(`CSV import completed. ${data.inserted || 0} products added.`);
      await loadPricingProducts();
    } catch (err: any) {
      setError(err?.message || 'CSV import failed.');
    } finally {
      setImportingCsv(false);
    }
  };

  const saveManualProduct = async () => {
    setSavingManual(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!manualForm.product_name.trim()) {
        throw new Error('Product name is required.');
      }

      if (Number(manualForm.detected_price) <= 0) {
        throw new Error('Price must be greater than 0.');
      }

      const res = await fetch('/api/competitors/manual-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          products: [
            {
              product_name: manualForm.product_name,
              detected_price: manualForm.detected_price,
              source_domain: manualForm.source_domain || 'manual-entry',
              source_url: manualForm.source_url || '',
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Manual product save failed.');
      }

      setSuccessMessage('Manual competitor product added.');
      setShowManualModal(false);
      setManualForm({
        product_name: '',
        detected_price: '',
        source_domain: '',
        source_url: '',
      });

      await loadPricingProducts();
    } catch (err: any) {
      setError(err?.message || 'Manual product save failed.');
    } finally {
      setSavingManual(false);
    }
  };

  if (checkingCompetitors) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <h2 className="text-2xl font-black text-slate-950">
              Checking competitor setup
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              SellSmart is preparing your pricing intelligence workspace.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

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
                  Pricing Intelligence
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Competitor Products
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  CSV + Manual Fallback
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Pricing
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Scan competitor websites, import CSV data when crawling is blocked, add manual
                prices, and get explainable recommendations with confidence scores.
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-500">
                Last update: {formatDate(summary.lastUpdated)}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[520px]">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Pricing Health
                </div>
                <div className="mt-2 text-5xl font-black text-slate-950">
                  {loading ? '—' : `${pricingHealth}%`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    style={{ width: `${loading ? 0 : pricingHealth}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Products Found
                </div>
                <div className="mt-2 text-5xl font-black">
                  {loading ? '—' : summary.totalProducts}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  Signals: {meta?.competitorSignals || 0}
                </div>
              </div>
            </div>
          </div>
        </section>

        {(error || warning || successMessage) && (
          <section
            className={`rounded-[28px] border p-5 shadow-sm ${
              error
                ? 'border-amber-200 bg-amber-50'
                : successMessage
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-sky-200 bg-sky-50'
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div
                  className={`text-sm font-black ${
                    error
                      ? 'text-amber-800'
                      : successMessage
                        ? 'text-emerald-800'
                        : 'text-sky-800'
                  }`}
                >
                  {error
                    ? '⚠️ Pricing data issue'
                    : successMessage
                      ? '✅ Success'
                      : 'ℹ️ Pricing information'}
                </div>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    error
                      ? 'text-amber-700'
                      : successMessage
                        ? 'text-emerald-700'
                        : 'text-sky-700'
                  }`}
                >
                  {error || successMessage || warning}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/sync-logs"
                  className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-black text-slate-800 transition-all hover:bg-white"
                >
                  View Sync Logs
                </Link>

                <button
                  type="button"
                  onClick={loadPricingProducts}
                  className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-black text-slate-800 transition-all hover:bg-white"
                >
                  Refresh
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Products',
              value: loading ? '—' : summary.totalProducts,
              icon: '📦',
              note: 'From competitor signals',
            },
            {
              label: 'For Review',
              value: loading ? '—' : summary.productsForReview,
              icon: '🔍',
              note: 'Need price attention',
            },
            {
              label: 'Avg Confidence',
              value: loading ? '—' : `${summary.avgConfidence.toFixed(0)}%`,
              icon: '🧠',
              note: 'Market evidence score',
            },
            {
              label: 'Revenue Lift',
              value: loading ? '—' : formatCurrency(summary.potentialRevenueLift),
              icon: '📈',
              note: 'Potential increase',
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

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Actions
              </div>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Market data controls
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={analyzeCompetitors}
                disabled={analyzing}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Competitor Prices'}
              </button>

              <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700">
                {importingCsv ? 'Importing CSV...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={importingCsv}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      importCsv(file);
                    }
                    event.target.value = '';
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700"
              >
                Add Manual Product
              </button>

              <Link
                href="/pricing/setup-competitors"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700"
              >
                Manage Websites
              </Link>

              <Link
                href="/sync-logs"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700"
              >
                Sync Logs
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product/source..."
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 xl:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | PriceStatus)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">All status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">All sources</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as
                    | 'name'
                    | 'currentPrice'
                    | 'recommendedPrice'
                    | 'marginPct'
                    | 'marketConfidence'
                )
              }
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="marketConfidence">Sort confidence</option>
              <option value="recommendedPrice">Sort recommended</option>
              <option value="currentPrice">Sort price</option>
              <option value="marginPct">Sort margin</option>
              <option value="name">Sort name</option>
            </select>

            <button
              type="button"
              onClick={() => setConfidenceOnly((prev) => !prev)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                confidenceOnly
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-800'
              }`}
            >
              70%+ confidence
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Products
              </div>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Competitor pricing table
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Showing {filteredProducts.length} of {products.length} products.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={filteredProducts.length === 0}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
              >
                Select Visible
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredProducts.length === 0}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
              <div className="text-5xl">📭</div>
              <div className="mt-4 text-2xl font-black text-slate-950">
                No competitor products found
              </div>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Automatic scan may find 0 products if a website blocks crawling or loads products
                with JavaScript. For a reliable demo and real usage, import a CSV or add products
                manually.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={analyzeCompetitors}
                  disabled={analyzing}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-xl disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Retry Automatic Scan'}
                </button>

                <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700">
                  Import CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    disabled={importingCsv}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        importCsv(file);
                      }
                      event.target.value = '';
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700"
                >
                  Add Manual Product
                </button>

                <Link
                  href="/sync-logs"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700"
                >
                  Check Sync Logs
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] bg-white text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-4 text-left font-black">Select</th>
                      <th className="px-4 py-4 text-left font-black">Product</th>
                      <th className="px-4 py-4 text-left font-black">Source</th>
                      <th className="px-4 py-4 text-left font-black">Current</th>
                      <th className="px-4 py-4 text-left font-black">Recommended</th>
                      <th className="px-4 py-4 text-left font-black">Margin</th>
                      <th className="px-4 py-4 text-left font-black">Confidence</th>
                      <th className="px-4 py-4 text-left font-black">Market Range</th>
                      <th className="px-4 py-4 text-left font-black">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const reasons = getRecommendationReasons(product);
                      const delta = product.recommendedPrice - product.currentPrice;

                      return (
                        <tr key={product.id} className="border-t border-slate-100 align-top">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => toggleSelect(product.id)}
                              className="h-5 w-5 rounded border-slate-300"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-black text-slate-950">{product.name}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              {product.sku || 'No SKU'} · {product.category}
                            </div>

                            {product.sourceUrl && (
                              <a
                                href={product.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block text-xs font-black text-indigo-600 hover:text-indigo-800"
                              >
                                Open source
                              </a>
                            )}

                            <details className="mt-3 rounded-2xl bg-slate-50 p-3">
                              <summary className="cursor-pointer text-xs font-black text-slate-700">
                                Why this recommendation?
                              </summary>
                              <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
                                {reasons.map((reason) => (
                                  <li key={reason}>• {reason}</li>
                                ))}
                              </ul>
                            </details>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {product.supplier || product.category}
                          </td>

                          <td className="px-4 py-4 font-black text-slate-950">
                            {formatCurrency(product.currentPrice)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-black text-slate-950">
                              {formatCurrency(product.recommendedPrice)}
                            </div>
                            <div
                              className={`mt-1 text-xs font-black ${
                                delta > 0
                                  ? 'text-emerald-700'
                                  : delta < 0
                                    ? 'text-red-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              {delta >= 0 ? '+' : '-'}
                              {formatCurrency(Math.abs(delta))}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Floor {formatCurrency(product.floorPrice)}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-black text-slate-950">
                              {product.marginPct.toFixed(1)}%
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Target {product.targetMarginPct.toFixed(1)}%
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-black text-slate-950">
                              {product.marketConfidence}%
                            </div>
                            <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                                style={{ width: `${product.marketConfidence}%` }}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                            <div>
                              Avg{' '}
                              {product.marketAveragePrice
                                ? formatCurrency(product.marketAveragePrice)
                                : '—'}
                            </div>
                            <div>
                              Min{' '}
                              {product.competitorMinPrice
                                ? formatCurrency(product.competitorMinPrice)
                                : '—'}{' '}
                              · Max{' '}
                              {product.competitorMaxPrice
                                ? formatCurrency(product.competitorMaxPrice)
                                : '—'}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[product.status]}`}
                            >
                              {statusLabels[product.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {showManualModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                    Manual fallback
                  </div>
                  <h3 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Add competitor product
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use this when a website blocks automatic scanning.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Product name
                  </span>
                  <input
                    value={manualForm.product_name}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        product_name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Linen curtain premium"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Price
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.detected_price}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        detected_price: event.target.value,
                      }))
                    }
                    placeholder="49.99"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Source domain
                  </span>
                  <input
                    value={manualForm.source_domain}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        source_domain: event.target.value,
                      }))
                    }
                    placeholder="zarahome.com"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Source URL optional
                  </span>
                  <input
                    value={manualForm.source_url}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        source_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveManualProduct}
                  disabled={savingManual}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-xl disabled:opacity-50"
                >
                  {savingManual ? 'Saving...' : 'Save product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <h2 className="text-2xl font-black text-slate-950">
                Loading pricing workspace
              </h2>
            </div>
          </div>
        </AppShell>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}