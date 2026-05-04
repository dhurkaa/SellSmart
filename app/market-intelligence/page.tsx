'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/layout/AppShell';
import { PieLabelRenderProps } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ZAxis,
  ComposedChart,
} from 'recharts';

type MarketSignal = {
  id: string;
  category: string;
  subCategory: string;
  productName: string;
  brand: string;
  model: string;
  currentPrice: number;
  priceChange: number;
  priceChange7d: number;
  priceChange30d: number;
  volume: number;
  volumeTrend: 'up' | 'down' | 'stable';
  opportunityScore: number;
  marginPotential: number;
  marginAfterFees: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  competitorCount: number;
  sellThroughRate: number;
  shippingCost: number;
  vatImpact: number;
  platformFees: number;
  adCostEstimate: number;
  netProfit: number;
  roi: number;
  region: string;
  city: string;
  seasonality: 'High' | 'Medium' | 'Low';
  demandScore: number;
  supplyScore: number;
  priceElasticity: number;
  minimumAdvertisedPrice: number;
  recommendedAction: 'BUY' | 'HOLD' | 'SELL' | 'MONITOR';
  confidenceLevel: number;
  dataQuality: 'A' | 'B' | 'C';
  lastUpdated: string;
  sourceCount?: number;
  sourceNames?: string[];
  productUrl?: string | null;
  imageUrl?: string | null;
};

type CompetitorInsight = {
  id: string;
  name: string;
  region: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  stockLevel: 'High' | 'Medium' | 'Low' | 'Out of Stock';
  strategy: 'Aggressive' | 'Premium' | 'Balanced' | 'Discount';
  threatLevel: number;
  marketShare: number;
  pricePositioning: 'Leader' | 'Follower' | 'Challenger';
  responseTime: number;
  promotionalIntensity: number;
  customerRating: number;
  listingQuality: number;
};

type MarketPulse = {
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  signalStrength: number;
  keyDrivers: string[];
  recommendedAction: string;
  volatilityIndex: number;
  momentumScore: number;
  supportLevel: number;
  resistanceLevel: number;
};

type RegionalAnalysis = {
  region: string;
  avgPrice: number;
  priceVariance: number;
  demandIndex: number;
  supplyIndex: number;
  opportunityScore: number;
  topCategory: string;
  competitiveIntensity: number;
  growthRate: number;
  seasonalityFactor: number;
};

type RiskRewardData = {
  opportunityScore: number;
  riskScore: number;
  marginPotential: number;
  productName: string;
  category: string;
  volume: number;
  recommendedAction: string;
};

type CategoryDistribution = {
  name: string;
  value: number;
  opportunity: number;
  color: string;
};

type TrendPoint = {
  date: string;
  price: number;
  volume: number;
  listings: number;
  ma7: number;
  ma30: number;
};

type MarketApiResponse = {
  signals: MarketSignal[];
  competitors: CompetitorInsight[];
  regional: RegionalAnalysis[];
  riskReward: RiskRewardData[];
  categories: CategoryDistribution[];
  trends: TrendPoint[];
  refreshedAt: string;
  stats: {
    totalSignals: number;
    totalSources: number;
    totalCategories: number;
    totalRegions: number;
  };
};

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const EMPTY_RESPONSE: MarketApiResponse = {
  signals: [],
  competitors: [],
  regional: [],
  riskReward: [],
  categories: [],
  trends: [],
  refreshedAt: '',
  stats: {
    totalSignals: 0,
    totalSources: 0,
    totalCategories: 0,
    totalRegions: 0,
  },
};




export default function MarketIntelligencePage() {
  const router = useRouter();
  const supabase = createClient();

  const [marketData, setMarketData] = useState<MarketSignal[]>([]);
  const [filteredData, setFilteredData] = useState<MarketSignal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Të gjitha');
  const [selectedRegion, setSelectedRegion] = useState<string>('Të gjitha');
  const [selectedRisk, setSelectedRisk] = useState<string>('Të gjitha');
  const [selectedAction, setSelectedAction] = useState<string>('Të gjitha');
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorInsight[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalAnalysis[]>([]);
  const [riskRewardData, setRiskRewardData] = useState<RiskRewardData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'regional' | 'competitors' | 'opportunities'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('90d');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiData, setApiData] = useState<MarketApiResponse>(EMPTY_RESPONSE);

  const fetchMarketData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const res = await fetch(`/api/market-intelligence?range=${timeRange}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Nuk u arrit të lexohen të dhënat reale të tregut.');
      }

      const data: MarketApiResponse = await res.json();

      setApiData(data);
      setMarketData(data.signals || []);
      setTrendData(data.trends || []);
      setCompetitors(data.competitors || []);
      setRegionalData(data.regional || []);
      setRiskRewardData(data.riskReward || []);
      setCategoryDistribution(data.categories || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gabim gjatë ngarkimit të market intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData(false);
  }, [timeRange]);

  useEffect(() => {
    let filtered = [...marketData];

    if (selectedCategory !== 'Të gjitha') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (selectedRegion !== 'Të gjitha') {
      filtered = filtered.filter((item) => item.region === selectedRegion);
    }
    if (selectedRisk !== 'Të gjitha') {
      filtered = filtered.filter((item) => item.riskLevel === selectedRisk);
    }
    if (selectedAction !== 'Të gjitha') {
      filtered = filtered.filter((item) => item.recommendedAction === selectedAction);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        [item.productName, item.brand, item.model, item.category, item.subCategory, item.region, item.city]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    setFilteredData(filtered);
  }, [selectedCategory, selectedRegion, selectedRisk, selectedAction, marketData, searchTerm]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const availableCategories = useMemo(() => {
    return [...new Set(marketData.map((item) => item.category))].sort();
  }, [marketData]);

  const availableRegions = useMemo(() => {
    return [...new Set(marketData.map((item) => item.region))].sort();
  }, [marketData]);

  const marketPulse: MarketPulse = useMemo(() => {
    const avgChange = filteredData.reduce((acc, cur) => acc + cur.priceChange, 0) / (filteredData.length || 1);
    const avgOpportunity = filteredData.reduce((acc, cur) => acc + cur.opportunityScore, 0) / (filteredData.length || 1);
    const avgVolatility = filteredData.reduce((acc, cur) => acc + Math.abs(cur.priceChange30d), 0) / (filteredData.length || 1);
    const momentum = filteredData.reduce((acc, cur) => acc + cur.priceChange7d, 0) / (filteredData.length || 1);

    let trend: MarketPulse['trend'] = 'Neutral';
    if (avgChange > 2.5 && avgOpportunity > 60) trend = 'Bullish';
    else if (avgChange < -1.5 || avgOpportunity < 40) trend = 'Bearish';

    const prices = filteredData.map((d) => d.currentPrice).sort((a, b) => a - b);
    const support = prices.length > 0 ? prices[Math.floor(prices.length * 0.2)] : 0;
    const resistance = prices.length > 0 ? prices[Math.floor(prices.length * 0.8)] : 0;

    return {
      trend,
      signalStrength: Math.min(100, Math.abs(avgChange) * 8 + avgOpportunity * 0.5),
      keyDrivers: [
        `Produkte aktive në filtrin aktual: ${filteredData.length}`,
        `Lëvizja mesatare e çmimit: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}%`,
        `Burime reale të kombinuara: ${apiData.stats.totalSources}`,
      ],
      recommendedAction:
        trend === 'Bullish'
          ? 'Rrit ekspozimin te produktet me ofertë të ulët dhe marzhë të lartë.'
          : trend === 'Bearish'
          ? 'Fokusohu te ofertat konkurruese dhe mos mbaj stok të tepërt.'
          : 'Mbaj çmime të balancuara dhe monitoro trendin çdo ditë.',
      volatilityIndex: Math.round(avgVolatility * 10) / 10,
      momentumScore: Math.round(momentum * 10) / 10,
      supportLevel: Math.round(support * 100) / 100,
      resistanceLevel: Math.round(resistance * 100) / 100,
    };
  }, [filteredData, apiData.stats.totalSources]);

  const totalOpportunityValue = useMemo(() => {
    return filteredData.reduce((acc, cur) => acc + cur.currentPrice * cur.volume * (cur.marginPotential / 100), 0);
  }, [filteredData]);

  const topOpportunities = useMemo(() => {
    return [...filteredData].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 10);
  }, [filteredData]);

  const actionDistribution = useMemo(() => {
    const dist: Record<string, number> = { BUY: 0, HOLD: 0, SELL: 0, MONITOR: 0 };
    filteredData.forEach((d) => {
      if (d.recommendedAction) dist[d.recommendedAction]++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const regionalOpportunities = useMemo(() => {
    return [...regionalData].sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [regionalData]);

  const averageMargin = useMemo(() => {
    return Math.round(filteredData.reduce((a, b) => a + b.marginPotential, 0) / (filteredData.length || 1));
  }, [filteredData]);

  const averageRoi = useMemo(() => {
    return Math.round(filteredData.reduce((a, b) => a + b.roi, 0) / (filteredData.length || 1));
  }, [filteredData]);

  const totalVolume = useMemo(() => {
    return filteredData.reduce((a, b) => a + b.volume, 0);
  }, [filteredData]);

  const buySignalsCount = useMemo(() => {
    return filteredData.filter((d) => d.recommendedAction === 'BUY').length;
  }, [filteredData]);

  if (loading) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="glass-card-strong rounded-3xl p-8 text-center">
              <div className="mx-auto mb-4 h-11 w-11 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <p className="text-slate-600 font-medium">Duke ngarkuar të dhënat reale të tregut...</p>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 18px 45px -18px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 0 30px 70px -24px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .gradient-text {
          background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 50%, #0f172a 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .spinner {
          width: 42px; height: 42px; border: 3px solid rgba(79, 70, 229, 0.12);
          border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-active {
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          color: white;
          box-shadow: 0 18px 30px -10px rgba(79, 70, 229, 0.35);
        }
        .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 999px; }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #f59e0b; }
        .stat-card { transition: all .25s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 24px 44px -18px rgba(15,23,42,0.18); }
        .signal-buy { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(255,255,255,0.7)); border-left: 4px solid #10b981; }
        .signal-sell { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(255,255,255,0.7)); border-left: 4px solid #ef4444; }
        .signal-hold { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(255,255,255,0.7)); border-left: 4px solid #f59e0b; }
      `}</style>

      <AppShell>
          <section className="glass-card-strong rounded-[28px] p-6 md:p-8 mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div>
                <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
                  DASHBOARD I<br />
                  <span className="gradient-text">TREGUT REAL</span>
                </h1>
                <p className="mt-4 max-w-3xl text-slate-600 text-lg leading-8">
                  Çmime reale, konkurrentë realë, sinjale reale dhe mundësi reale për produktet e shtëpisë si perde,
                  kauqa, tavolina, karrige, ndriçim, dekor, tekstile dhe mobilje.
                </p>
              </div>

              <div className="glass-card rounded-3xl p-6 w-full xl:w-[460px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.18em]">Pulsi i Tregut</div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      marketPulse.trend === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-700'
                        : marketPulse.trend === 'Bearish'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {marketPulse.trend}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-4xl font-black text-slate-900">{Math.round(marketPulse.signalStrength)}%</div>
                    <div className="text-sm text-slate-500">Forca e sinjalit të tregut</div>
                  </div>
                  <button
                    onClick={() => fetchMarketData(true)}
                    disabled={refreshing}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-all disabled:opacity-60"
                  >
                    {refreshing ? 'Duke rifreskuar...' : 'Rifresko'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="rounded-2xl bg-white/60 p-3 text-center">
                    <div className="text-xs text-slate-500">Volatiliteti</div>
                    <div className="font-bold text-slate-900">{marketPulse.volatilityIndex}%</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 p-3 text-center">
                    <div className="text-xs text-slate-500">Momenti</div>
                    <div className={`font-bold ${marketPulse.momentumScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {marketPulse.momentumScore > 0 ? '+' : ''}
                      {marketPulse.momentumScore}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/60 p-3 text-center">
                    <div className="text-xs text-slate-500">Support</div>
                    <div className="font-bold text-slate-900">€{marketPulse.supportLevel}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-indigo-50/70 p-4 text-sm text-slate-700">
                  <span className="font-bold">Rekomandimi:</span> {marketPulse.recommendedAction}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {marketPulse.keyDrivers.map((driver, i) => (
                    <span key={i} className="text-xs bg-white/70 px-3 py-1 rounded-full text-slate-600">
                      • {driver}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Përditësuar: {apiData.refreshedAt ? new Date(apiData.refreshedAt).toLocaleString('sq-AL') : '—'}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
              <div className="font-semibold">Gabim gjatë ngarkimit</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Përmbledhje' },
                { id: 'regional', label: 'Rajonet' },
                { id: 'competitors', label: 'Konkurrentët' },
                { id: 'opportunities', label: 'Mundësitë' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'overview' | 'regional' | 'competitors' | 'opportunities')}
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                    selectedTab === tab.id ? 'tab-active text-white' : 'glass-card text-slate-700 hover:bg-white/90'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="xl:ml-auto flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Kërko produkt, kategori, brand, rajon..."
                className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none min-w-[280px]"
              />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none"
              >
                <option value="7d">7 Ditë</option>
                <option value="30d">30 Ditë</option>
                <option value="90d">90 Ditë</option>
                <option value="1y">1 Vit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="Të gjitha">Të gjitha Kategoritë ({availableCategories.length})</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="Të gjitha">Të gjitha Rajonet ({availableRegions.length})</option>
                {availableRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="Të gjitha">Të gjitha Risqet</option>
                <option value="Low">Risk i Ulët</option>
                <option value="Medium">Risk Mesatar</option>
                <option value="High">Risk i Lartë</option>
              </select>

              <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="glass-card rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="Të gjitha">Të gjitha Veprimet</option>
                <option value="BUY">BLEJ</option>
                <option value="HOLD">MBAJ</option>
                <option value="SELL">SHIT</option>
                <option value="MONITOR">MONITORO</option>
              </select>
            </div>

            <div className="glass-card rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
              <div>
                <div className="text-xs text-slate-500">Sinjale aktive</div>
                <div className="text-xl font-black text-indigo-600">{filteredData.length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Vlera e tregut</div>
                <div className="text-xl font-black text-emerald-600">€{(totalOpportunityValue / 1000000).toFixed(2)}M</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Burime</div>
                <div className="text-xl font-black text-slate-900">{apiData.stats.totalSources}</div>
              </div>
            </div>
          </div>

          {selectedTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
                {[
                  { label: 'Sinjale Aktive', value: filteredData.length, change: `${apiData.stats.totalSources} burime`, icon: '📡', trend: 'up' },
                  { label: 'Marzha Mesatare', value: `${averageMargin}%`, change: 'pas tarifave reale', icon: '📊', trend: 'up' },
                  { label: 'ROI Mesatar', value: `${averageRoi}%`, change: 'nga data reale', icon: '💰', trend: 'up' },
                  { label: 'Volumi Total', value: `${(totalVolume / 1000).toFixed(1)}K`, change: 'listime të krahasuara', icon: '📦', trend: 'stable' },
                  { label: 'Sinjale BLEJ', value: buySignalsCount, change: 'oportunitete aktive', icon: '🎯', trend: 'up' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-3xl p-5 stat-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">{stat.label}</div>
                        <div className="text-4xl font-black text-slate-900 mt-2">{stat.value}</div>
                      </div>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className={`text-sm font-medium mt-3 ${stat.trend === 'up' ? 'trend-up' : stat.trend === 'down' ? 'trend-down' : 'trend-stable'}`}>
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {[
                  {
                    label: 'Elasticiteti i Çmimit',
                    value: (filteredData.reduce((a, b) => a + b.priceElasticity, 0) / (filteredData.length || 1)).toFixed(2),
                    change: 'mesatare e tregut',
                    icon: '📈',
                  },
                  {
                    label: 'Dërgesa Mesatare',
                    value: `€${Math.round(filteredData.reduce((a, b) => a + b.shippingCost, 0) / (filteredData.length || 1)) || 0}`,
                    change: 'shipping real',
                    icon: '🚚',
                  },
                  {
                    label: 'TVSH Mesatare',
                    value: `€${Math.round(filteredData.reduce((a, b) => a + b.vatImpact, 0) / (filteredData.length || 1)) || 0}`,
                    change: 'llogaritje automatike',
                    icon: '🧾',
                  },
                  {
                    label: 'Tarifa Platforme',
                    value: `${Math.round(filteredData.reduce((a, b) => a + (b.currentPrice ? (b.platformFees / b.currentPrice) * 100 : 0), 0) / (filteredData.length || 1)) || 0}%`,
                    change: 'fee estimate',
                    icon: '🏪',
                  },
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-3xl p-5 stat-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">{stat.label}</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stat.value}</div>
                      </div>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-3">{stat.change}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 glass-card rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Tendenca e Çmimeve me Moving Averages</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Çmimi</span>
                      <span>MA7</span>
                      <span>MA30</span>
                      <span>Volumi</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={trendData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.96)', borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="price" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPrice)" name="Çmimi" />
                      <Line yAxisId="left" type="monotone" dataKey="ma7" stroke="#06b6d4" strokeWidth={2} dot={false} name="MA 7" />
                      <Line yAxisId="left" type="monotone" dataKey="ma30" stroke="#f59e0b" strokeWidth={2} dot={false} name="MA 30" />
                      <Bar yAxisId="right" dataKey="volume" fill="#10b981" opacity={0.28} name="Volumi" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-800">Shpërndarja e Kategorive</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: PieLabelRenderProps) => {
                          const { name, percent } = props;
                          const safeName = typeof name === 'string' ? name : '';
                          const safePercent = typeof percent === 'number' ? percent : 0;
                          return `${safeName} ${(safePercent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {categoryDistribution.slice(0, 5).map((cat, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          {cat.name}
                        </span>
                        <span className="font-semibold">{cat.opportunity}% oportunitet</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-800">Risk vs Reward</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="riskScore" name="Risk" unit="%" domain={[0, 100]} />
                      <YAxis type="number" dataKey="opportunityScore" name="Oportunitet" unit="%" domain={[0, 100]} />
                      <ZAxis type="number" dataKey="marginPotential" range={[20, 80]} name="Marzha" />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none' }} />
                      <Legend />
                      <Scatter name="Produkte" data={riskRewardData.slice(0, 100)} fill="#4f46e5">
                        {riskRewardData.slice(0, 100).map((entry, index) => (
                          <Cell
                            key={`risk-${index}`}
                            fill={
                              entry.recommendedAction === 'BUY'
                                ? '#10b981'
                                : entry.recommendedAction === 'SELL'
                                ? '#ef4444'
                                : entry.recommendedAction === 'HOLD'
                                ? '#f59e0b'
                                : '#6b7280'
                            }
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-800">Shpërndarja e Rekomandimeve</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={actionDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {actionDistribution.map((entry, index) => (
                          <Cell
                            key={`action-${index}`}
                            fill={
                              entry.name === 'BUY'
                                ? '#10b981'
                                : entry.name === 'SELL'
                                ? '#ef4444'
                                : entry.name === 'HOLD'
                                ? '#f59e0b'
                                : '#6b7280'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card-strong rounded-3xl p-6 overflow-hidden mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Sinjalet me Oportunitetin më të Lartë</h2>
                  <span className="text-sm text-slate-500">Top 10 nga {filteredData.length} sinjale reale</span>
                </div>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-white/40 rounded-lg">
                      <tr>
                        <th className="px-6 py-4">Produkti</th>
                        <th className="px-6 py-4">Kategoria</th>
                        <th className="px-6 py-4">Rajoni</th>
                        <th className="px-6 py-4">Çmimi</th>
                        <th className="px-6 py-4">Marzha</th>
                        <th className="px-6 py-4">ROI</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Risk</th>
                        <th className="px-6 py-4">Veprimi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {topOpportunities.map((signal) => (
                        <tr key={signal.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="font-semibold">{signal.productName}</div>
                            <div className="text-xs text-slate-500">{signal.brand} • {signal.model}</div>
                            {signal.productUrl && (
                              <a href={signal.productUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                                Hap listimin →
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>{signal.category}</div>
                            <div className="text-xs text-slate-500">{signal.subCategory}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{signal.region}</div>
                            <div className="text-xs text-slate-500">{signal.city}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            <div>€{signal.currentPrice}</div>
                            <div className={`text-xs ${signal.priceChange7d >= 0 ? 'trend-up' : 'trend-down'}`}>
                              {signal.priceChange7d > 0 ? '+' : ''}
                              {signal.priceChange7d}% (7d)
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-indigo-600">{signal.marginPotential}%</div>
                            <div className="text-xs text-slate-500">neto: {signal.marginAfterFees}%</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-bold ${signal.roi >= 20 ? 'trend-up' : signal.roi >= 10 ? 'trend-stable' : 'trend-down'}`}>
                              {signal.roi}%
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${signal.opportunityScore > 70 ? 'trend-up' : signal.opportunityScore > 40 ? 'trend-stable' : 'trend-down'}`}>
                                {signal.opportunityScore}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${signal.opportunityScore > 70 ? 'bg-emerald-500' : signal.opportunityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${signal.opportunityScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${signal.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700' : signal.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                              {signal.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${signal.recommendedAction === 'BUY' ? 'bg-emerald-100 text-emerald-700' : signal.recommendedAction === 'SELL' ? 'bg-rose-100 text-rose-700' : signal.recommendedAction === 'HOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {signal.recommendedAction}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {selectedTab === 'regional' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-card-strong rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Analiza Rajonale e Detajuar</h3>
                  <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500 uppercase bg-white/30">
                        <tr>
                          <th className="px-4 py-3">Rajoni</th>
                          <th className="px-4 py-3">Çmimi Mes.</th>
                          <th className="px-4 py-3">Kërkesa</th>
                          <th className="px-4 py-3">Oferta</th>
                          <th className="px-4 py-3">Intensiteti</th>
                          <th className="px-4 py-3">Rritja</th>
                          <th className="px-4 py-3">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50">
                        {regionalOpportunities.map((region) => (
                          <tr key={region.region} className="hover:bg-white/40">
                            <td className="px-4 py-3 font-medium">{region.region}</td>
                            <td className="px-4 py-3">€{region.avgPrice}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${region.demandIndex}%` }} />
                                </div>
                                {region.demandIndex}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${region.supplyIndex}%` }} />
                                </div>
                                {region.supplyIndex}
                              </div>
                            </td>
                            <td className="px-4 py-3">{region.competitiveIntensity}%</td>
                            <td className={`px-4 py-3 font-medium ${region.growthRate >= 0 ? 'trend-up' : 'trend-down'}`}>
                              {region.growthRate > 0 ? '+' : ''}
                              {region.growthRate}%
                            </td>
                            <td className="px-4 py-3 font-bold">{region.opportunityScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Kategoritë Kryesore sipas Rajonit</h3>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scroll">
                    {regionalData.map((region, idx) => (
  <div key={idx} className="bg-white/55 rounded-2xl p-4">
    <div className="flex justify-between items-center mb-2 gap-3">
      <span className="font-bold text-slate-800">{region.region}</span>
      <span className="text-xs text-slate-500">Faktor sezonal: {region.seasonalityFactor}</span>
    </div>
    <div className="text-lg font-semibold text-indigo-600 mb-2">{region.topCategory}</div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-white/50 rounded-xl p-3">
        <span className="text-slate-500">Varianca e Çmimit:</span>
        <span className="font-bold ml-1">±€{region.priceVariance}</span>
      </div>
      <div className="bg-white/50 rounded-xl p-3">
        <span className="text-slate-500">Oportuniteti:</span>
        <span className="font-bold ml-1">{region.opportunityScore}%</span>
      </div>
      <div className="bg-white/50 rounded-xl p-3">
        <span className="text-slate-500">Kërkesa:</span>
        <span className="font-bold ml-1">{region.demandIndex}</span>
      </div>
      <div className="bg-white/50 rounded-xl p-3">
        <span className="text-slate-500">Oferta:</span>
        <span className="font-bold ml-1">{region.supplyIndex}</span>
      </div>
    </div>
  </div>
))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'competitors' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 glass-card-strong rounded-3xl p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">Peizazhi i Konkurrentëve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto custom-scroll">
                  {competitors.map((comp) => (
                    <div key={comp.id} className="bg-white/55 rounded-2xl p-4 hover:bg-white/80 transition-all">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div>
                          <div className="font-bold text-slate-800">{comp.name}</div>
                          <div className="text-xs text-slate-500">{comp.region}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            comp.strategy === 'Aggressive'
                              ? 'bg-orange-100 text-orange-700'
                              : comp.strategy === 'Premium'
                              ? 'bg-purple-100 text-purple-700'
                              : comp.strategy === 'Discount'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {comp.strategy}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-slate-500 text-xs">Çmimi mesatar</div>
                          <div className="font-bold text-slate-900">€{comp.avgPrice}</div>
                          <div className="text-xs text-slate-400">
                            {Math.round(comp.minPrice)} - {Math.round(comp.maxPrice)}
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-slate-500 text-xs">Stoku</div>
                          <div
                            className={`font-bold ${
                              comp.stockLevel === 'High'
                                ? 'text-emerald-600'
                                : comp.stockLevel === 'Low' || comp.stockLevel === 'Out of Stock'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {comp.stockLevel}
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-slate-500 text-xs">Pjesa e tregut</div>
                          <div className="font-bold text-slate-900">{comp.marketShare}%</div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-slate-500 text-xs">Vlerësimi</div>
                          <div className="font-bold text-slate-900">{comp.customerRating.toFixed(1)}★</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Kërcënimi</span>
                          <span>{comp.threatLevel}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              comp.threatLevel > 70
                                ? 'bg-rose-500'
                                : comp.threatLevel > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${comp.threatLevel}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="bg-white/60 px-2.5 py-1 rounded-full">Pozicionimi: {comp.pricePositioning}</span>
                        <span className="bg-white/60 px-2.5 py-1 rounded-full">Promo: {comp.promotionalIntensity}%</span>
                        <span className="bg-white/60 px-2.5 py-1 rounded-full">Përgjigje: {comp.responseTime}h</span>
                        <span className="bg-white/60 px-2.5 py-1 rounded-full">Cilësia: {comp.listingQuality}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">Analiza e Kërcënimit</h3>
                <div className="space-y-4">
                  {[...competitors]
                    .sort((a, b) => b.threatLevel - a.threatLevel)
                    .slice(0, 8)
                    .map((comp, idx) => (
                      <div key={idx} className="bg-white/55 rounded-2xl p-4">
                        <div className="flex justify-between gap-3 mb-1">
                          <span className="font-semibold text-slate-800">{comp.name}</span>
                          <span
                            className={`font-bold ${
                              comp.threatLevel > 70
                                ? 'text-rose-600'
                                : comp.threatLevel > 40
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {comp.threatLevel}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">{comp.region}</div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${
                              comp.threatLevel > 70
                                ? 'bg-rose-500'
                                : comp.threatLevel > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${comp.threatLevel}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-white/60 px-2.5 py-1 rounded-full text-slate-600">
                            Koha e përgjigjes: {comp.responseTime}h
                          </span>
                          <span className="bg-white/60 px-2.5 py-1 rounded-full text-slate-600">
                            Market share: {comp.marketShare}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'opportunities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-card-strong rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Mundësitë më të Mira për BLEJ</h3>
                  <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll">
                    {filteredData
                      .filter((d) => d.recommendedAction === 'BUY')
                      .sort((a, b) => b.opportunityScore - a.opportunityScore)
                      .slice(0, 10)
                      .map((item) => (
                        <div key={item.id} className="signal-buy rounded-2xl p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                              <div className="text-xs text-slate-500">
                                {item.category} • {item.region}
                              </div>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">{item.opportunityScore}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">Çmimi:</span>
                              <span className="font-semibold ml-1">€{item.currentPrice}</span>
                            </div>
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">Marzha:</span>
                              <span className="font-semibold ml-1">{item.marginPotential}%</span>
                            </div>
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">ROI:</span>
                              <span className="font-semibold ml-1">{item.roi}%</span>
                            </div>
                          </div>

                          <div className="mt-3 text-xs bg-emerald-50 p-3 rounded-xl text-emerald-700">
                            <span className="font-semibold">Rekomandim:</span> BLEJ tani • Fitim i pritshëm €
                            {item.netProfit.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="glass-card-strong rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Sinjalet për SHIT</h3>
                  <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll">
                    {filteredData
                      .filter((d) => d.recommendedAction === 'SELL')
                      .sort((a, b) => a.opportunityScore - b.opportunityScore)
                      .slice(0, 10)
                      .map((item) => (
                        <div key={item.id} className="signal-sell rounded-2xl p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                              <div className="text-xs text-slate-500">
                                {item.category} • {item.region}
                              </div>
                            </div>
                            <span className="text-2xl font-black text-rose-600">{item.opportunityScore}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">Çmimi:</span>
                              <span className="font-semibold ml-1">€{item.currentPrice}</span>
                            </div>
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">Trend 30d:</span>
                              <span className={`font-semibold ml-1 ${item.priceChange30d >= 0 ? 'trend-up' : 'trend-down'}`}>
                                {item.priceChange30d > 0 ? '+' : ''}
                                {item.priceChange30d}%
                              </span>
                            </div>
                            <div className="bg-white/50 rounded-xl p-2.5">
                              <span className="text-slate-500">Konkurrentë:</span>
                              <span className="font-semibold ml-1">{item.competitorCount}</span>
                            </div>
                          </div>

                          <div className="mt-3 text-xs bg-rose-50 p-3 rounded-xl text-rose-700">
                            <span className="font-semibold">Rekomandim:</span> SHIT para rënies së mëtejshme
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400">
            SellSmart Market Intelligence • {filteredData.length} sinjale aktive • Të dhënat rifreskohen nga burime reale • Ekskluzive për llogarinë tënde të biznesit
          </div>
      </AppShell>
    </AuthGuard>
  );
}
