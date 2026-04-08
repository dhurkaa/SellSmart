// app/market-intelligence/page.tsx
'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { PieLabelRenderProps } from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie, ZAxis, ComposedChart
} from 'recharts';

// ---------- Types të Zgjeruara ----------
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

// ---------- Dataset të Zgjeruar (500+ rreshta) ----------
const CATEGORIES = [
  'Elektronikë', 'Modë', 'Shtëpi & Kopsht', 'Automjete', 'Koleksionistë', 'Pajisje Profesionale',
  'Lodra & Hobi', 'Sport & Outdoor', 'Instrumente Muzikore', 'Libra & Media', 'Art & Artizanat',
  'Shëndet & Bukuri', 'Ushqim & Pije', 'Pajisje Zyre', 'Materiale Ndërtimi', 'Bujqësi',
  'Pajisje Industriale', 'Bizhuteri & Orë', 'Antikitete', 'Veshje për Fëmijë'
];

const SUB_CATEGORIES: Record<string, string[]> = {
  'Elektronikë': ['Smartphone', 'Laptop', 'Tablet', 'TV', 'Audio', 'Kamera', 'Gaming', 'Wearables', 'Aksesorë', 'Smarthome'],
  'Modë': ['Veshje për Burra', 'Veshje për Gra', 'Këpucë', 'Çanta', 'Aksesorë', 'Veshje Sportive', 'Veshje Formale', 'Xhinse', 'Të brendshme', 'Sezonal'],
  'Shtëpi & Kopsht': ['Mobilje', 'Dekorime', 'Kuzhinë', 'Tekstile', 'Ndriçim', 'Kopshtari', 'Vegla', 'Organizim', 'Pastrim', 'Renovim'],
};

const BRANDS = [
  'PremiumBrand', 'ValueChoice', 'EcoFriendly', 'LuxuryLine', 'ProSeries', 'EssentialBasics',
  'SmartTech', 'HomeComfort', 'StyleStudio', 'PowerTools', 'GreenGarden', 'KidJoy',
  'SportMax', 'MusicPro', 'ArtisanCraft', 'HealthFirst', 'OfficeElite', 'BuildRight'
];

const LOCATIONS = ['Prishtinë', 'Tiranë', 'Shkup', 'Podgoricë', 'Sarajevë', 'Beograd', 'Zagreb', 'Lubjanë', 'Sofje', 'Bukuresht', 'Athinë', 'Selanik'];
const REGIONS = ['Kosovë', 'Shqipëri', 'Maqedoni e Veriut', 'Mali i Zi', 'Bosnjë', 'Serbi', 'Kroaci', 'Slloveni', 'Bullgari', 'Rumani', 'Greqi'];

const generateMarketData = (count: number = 500): MarketSignal[] => {
  const data: MarketSignal[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const subCategoryList = SUB_CATEGORIES[category] || ['Të përgjithshme'];
    const subCategory = subCategoryList[Math.floor(Math.random() * subCategoryList.length)];
    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const model = `${brand.substring(0, 3)}-${Math.floor(Math.random() * 1000) + 100}`;
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const city = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    const basePrice = Math.floor(Math.random() * 5000) + 50;
    const priceChange = (Math.random() * 40) - 20;
    const priceChange7d = (Math.random() * 30) - 15;
    const priceChange30d = (Math.random() * 50) - 25;
    const volume = Math.floor(Math.random() * 500) + 10;
    const volumeTrendOptions: ['up', 'down', 'stable'] = ['up', 'down', 'stable'];
    const volumeTrend = volumeTrendOptions[Math.floor(Math.random() * 3)];
    const opportunity = Math.floor(Math.random() * 100);
    const margin = Math.floor(Math.random() * 60) + 15;
    const marginAfterFees = margin * (1 - Math.random() * 0.3);
    const competitors = Math.floor(Math.random() * 25) + 1;
    const sellThrough = Math.floor(Math.random() * 95) + 5;
    const shipping = Math.floor(Math.random() * 50) + 5;
    const vat = basePrice * 0.18;
    const fees = basePrice * (0.05 + Math.random() * 0.1);
    const adCost = basePrice * (Math.random() * 0.08);
    const netProfit = (basePrice * margin / 100) - shipping - fees - adCost;
    const roi = (netProfit / basePrice) * 100;
    const seasonalityOptions: ['High', 'Medium', 'Low'] = ['High', 'Medium', 'Low'];
    const seasonality = seasonalityOptions[Math.floor(Math.random() * 3)];
    const demand = Math.floor(Math.random() * 100);
    const supply = Math.floor(Math.random() * 100);
    const elasticity = 0.5 + Math.random() * 2;
    const map = basePrice * (0.7 + Math.random() * 0.2);
    const actions: ['BUY', 'HOLD', 'SELL', 'MONITOR'] = ['BUY', 'HOLD', 'SELL', 'MONITOR'];
    const action = actions[Math.floor(Math.random() * 4)];
    const confidence = Math.floor(Math.random() * 40) + 60;
    const qualityOptions: ['A', 'B', 'C'] = ['A', 'B', 'C'];
    const quality = qualityOptions[Math.floor(Math.random() * 3)];
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    data.push({
      id: `sig-${i}-${Date.now()}-${Math.random()}`,
      category,
      subCategory,
      productName: `${brand} ${subCategory} ${model}`,
      brand,
      model,
      currentPrice: Math.round(basePrice * 100) / 100,
      priceChange: Math.round(priceChange * 10) / 10,
      priceChange7d: Math.round(priceChange7d * 10) / 10,
      priceChange30d: Math.round(priceChange30d * 10) / 10,
      volume,
      volumeTrend,
      opportunityScore: opportunity,
      marginPotential: margin,
      marginAfterFees: Math.round(marginAfterFees * 10) / 10,
      riskLevel: opportunity > 70 ? 'Low' : opportunity > 40 ? 'Medium' : 'High',
      competitorCount: competitors,
      sellThroughRate: sellThrough,
      shippingCost: shipping,
      vatImpact: Math.round(vat * 100) / 100,
      platformFees: Math.round(fees * 100) / 100,
      adCostEstimate: Math.round(adCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      region,
      city,
      seasonality,
      demandScore: demand,
      supplyScore: supply,
      priceElasticity: Math.round(elasticity * 100) / 100,
      minimumAdvertisedPrice: Math.round(map * 100) / 100,
      recommendedAction: action,
      confidenceLevel: confidence,
      dataQuality: quality,
      lastUpdated: date.toISOString().split('T')[0],
    });
  }
  return data;
};

const generateCompetitorInsights = (): CompetitorInsight[] => {
  const competitors: CompetitorInsight[] = [];
  const names = ['Mobishop', 'Neptun', 'GjirafaMall', 'PremiumShop', 'EuroGadgets', 'TechMaster', 'Bazaar', 'ElectroWorld', 'HomeStyle', 'FashionHub', 'SportZone', 'KidLand'];
  const regions = REGIONS;
  
  for (let i = 0; i < 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const avgPrice = Math.floor(Math.random() * 800) + 100;
    const strategyOptions: CompetitorInsight['strategy'][] = ['Aggressive', 'Premium', 'Balanced', 'Discount'];
    const strategy = strategyOptions[Math.floor(Math.random() * 4)];
    const positioningOptions: CompetitorInsight['pricePositioning'][] = ['Leader', 'Follower', 'Challenger'];
    const positioning = positioningOptions[Math.floor(Math.random() * 3)];
    const stockOptions: CompetitorInsight['stockLevel'][] = ['High', 'Medium', 'Low', 'Out of Stock'];
    const stock = stockOptions[Math.floor(Math.random() * 4)];
    
    competitors.push({
      id: `comp-${i}-${Date.now()}`,
      name: `${name} ${region}`,
      region,
      avgPrice,
      minPrice: avgPrice * (0.7 + Math.random() * 0.2),
      maxPrice: avgPrice * (1.1 + Math.random() * 0.3),
      stockLevel: stock,
      strategy,
      threatLevel: Math.floor(Math.random() * 60) + 30,
      marketShare: Math.floor(Math.random() * 25) + 5,
      pricePositioning: positioning,
      responseTime: Math.floor(Math.random() * 48) + 2,
      promotionalIntensity: Math.floor(Math.random() * 100),
      customerRating: 3.5 + Math.random() * 1.5,
      listingQuality: Math.floor(Math.random() * 40) + 60,
    });
  }
  return competitors;
};

const generateTrendData = (days: number = 120) => {
  const data = [];
  let basePrice = 240;
  let baseVolume = 150;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const volatility = Math.sin(i / 15) * 15 + Math.cos(i / 8) * 12;
    const randomWalk = (Math.random() * 8) - 3;
    basePrice = basePrice + volatility * 0.4 + randomWalk;
    baseVolume = Math.max(30, baseVolume + (Math.random() * 40) - 15);
    if (basePrice < 50) basePrice = 50;
    
    data.push({
      date: date.toLocaleDateString('sq-AL', { month: 'short', day: 'numeric' }),
      price: Math.round(basePrice * 100) / 100,
      volume: Math.round(baseVolume),
      listings: Math.floor(Math.random() * 100) + 40,
      ma7: 0,
      ma30: 0,
    });
  }
  
  // Llogarit moving averages
  for (let i = 0; i < data.length; i++) {
    if (i >= 6) {
      const sum7 = data.slice(i - 6, i + 1).reduce((acc, d) => acc + d.price, 0);
      data[i].ma7 = Math.round((sum7 / 7) * 100) / 100;
    }
    if (i >= 29) {
      const sum30 = data.slice(i - 29, i + 1).reduce((acc, d) => acc + d.price, 0);
      data[i].ma30 = Math.round((sum30 / 30) * 100) / 100;
    }
  }
  
  return data;
};

const generateRegionalAnalysis = (): RegionalAnalysis[] => {
  return REGIONS.map(region => ({
    region,
    avgPrice: Math.floor(Math.random() * 500) + 150,
    priceVariance: Math.floor(Math.random() * 50) + 10,
    demandIndex: Math.floor(Math.random() * 100),
    supplyIndex: Math.floor(Math.random() * 100),
    opportunityScore: Math.floor(Math.random() * 100),
    topCategory: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    competitiveIntensity: Math.floor(Math.random() * 100),
    growthRate: Math.round((Math.random() * 30 - 5) * 10) / 10,
    seasonalityFactor: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
  }));
};

const generateRiskRewardData = (count: number = 200): RiskRewardData[] => {
  const data: RiskRewardData[] = [];
  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const opportunity = Math.floor(Math.random() * 100);
    const risk = Math.floor(Math.random() * 100);
    const margin = Math.floor(Math.random() * 70) + 10;
    const volume = Math.floor(Math.random() * 500) + 20;
    const actions: RiskRewardData['recommendedAction'][] = ['BUY', 'HOLD', 'SELL', 'MONITOR'];
    
    data.push({
      opportunityScore: opportunity,
      riskScore: risk,
      marginPotential: margin,
      productName: `${category.substring(0, 4)}-${Math.floor(Math.random() * 1000)}`,
      category,
      volume,
      recommendedAction: actions[Math.floor(Math.random() * 4)],
    });
  }
  return data;
};

const generateCategoryDistribution = (): CategoryDistribution[] => {
  return CATEGORIES.slice(0, 8).map((cat, index) => ({
    name: cat,
    value: Math.floor(Math.random() * 5000) + 1000,
    opportunity: Math.floor(Math.random() * 100),
    color: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'][index],
  }));
};

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function MarketIntelligencePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [marketData, setMarketData] = useState<MarketSignal[]>([]);
  const [filteredData, setFilteredData] = useState<MarketSignal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Të gjitha');
  const [selectedRegion, setSelectedRegion] = useState<string>('Të gjitha');
  const [selectedRisk, setSelectedRisk] = useState<string>('Të gjitha');
  const [selectedAction, setSelectedAction] = useState<string>('Të gjitha');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorInsight[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalAnalysis[]>([]);
  const [riskRewardData, setRiskRewardData] = useState<RiskRewardData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'regional' | 'competitors' | 'opportunities'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('90d');

  const navItems = [
    { href: '/company', label: 'Kompania' },
    { href: '/pricing', label: 'Çmimet' },
    { href: '/sales', label: 'Shitjet' },
    { href: '/reports', label: 'Raportet' },
    { href: '/accounting', label: 'Kontabiliteti' },
    { href: '/imports', label: 'Importet' },
    { href: '/products', label: 'Produktet' },
    { href: '/inventory', label: 'Inventari' },
    { href: '/settings', label: 'Cilësimet' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setMarketData(generateMarketData(500));
      setTrendData(generateTrendData(120));
      setCompetitors(generateCompetitorInsights());
      setRegionalData(generateRegionalAnalysis());
      setRiskRewardData(generateRiskRewardData(200));
      setCategoryDistribution(generateCategoryDistribution());
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = marketData;
    
    if (selectedCategory !== 'Të gjitha') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (selectedRegion !== 'Të gjitha') {
      filtered = filtered.filter(item => item.region === selectedRegion);
    }
    if (selectedRisk !== 'Të gjitha') {
      filtered = filtered.filter(item => item.riskLevel === selectedRisk);
    }
    if (selectedAction !== 'Të gjitha') {
      filtered = filtered.filter(item => item.recommendedAction === selectedAction);
    }
    
    setFilteredData(filtered);
  }, [selectedCategory, selectedRegion, selectedRisk, selectedAction, marketData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const marketPulse: MarketPulse = useMemo(() => {
    const avgChange = filteredData.reduce((acc, cur) => acc + cur.priceChange, 0) / (filteredData.length || 1);
    const avgOpportunity = filteredData.reduce((acc, cur) => acc + cur.opportunityScore, 0) / (filteredData.length || 1);
    const avgVolatility = filteredData.reduce((acc, cur) => acc + Math.abs(cur.priceChange30d), 0) / (filteredData.length || 1);
    const momentum = filteredData.reduce((acc, cur) => acc + cur.priceChange7d, 0) / (filteredData.length || 1);
    
    let trend: MarketPulse['trend'] = 'Neutral';
    if (avgChange > 2.5 && avgOpportunity > 60) trend = 'Bullish';
    else if (avgChange < -1.5 || avgOpportunity < 40) trend = 'Bearish';
    
    const prices = filteredData.map(d => d.currentPrice).sort((a, b) => a - b);
    const support = prices.length > 0 ? prices[Math.floor(prices.length * 0.2)] : 0;
    const resistance = prices.length > 0 ? prices[Math.floor(prices.length * 0.8)] : 0;
    
    return {
      trend,
      signalStrength: Math.min(100, Math.abs(avgChange) * 8 + avgOpportunity * 0.5),
      keyDrivers: [
        `Kërkesa për "${selectedCategory === 'Të gjitha' ? 'produkte të përgjithshme' : selectedCategory}" është në rritje`,
        `Konkurrenca ka ndryshuar çmimet mesatarisht ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}%`,
        `Sezonaliteti aktual: ${new Date().getMonth() > 9 ? 'I lartë (fundviti)' : 'Normal'}`
      ],
      recommendedAction: trend === 'Bullish' ? 'Rrit çmimet me 5-8% dhe rrit inventarin' : 
                       trend === 'Bearish' ? 'Aktivizo zbritje të kufizuara dhe redukto ekspozimin' : 
                       'Mbaj pozicionin aktual dhe monitoro tregun',
      volatilityIndex: Math.round(avgVolatility * 10) / 10,
      momentumScore: Math.round(momentum * 10) / 10,
      supportLevel: Math.round(support * 100) / 100,
      resistanceLevel: Math.round(resistance * 100) / 100,
    };
  }, [filteredData, selectedCategory]);

  const totalOpportunityValue = useMemo(() => {
    return filteredData.reduce((acc, cur) => acc + (cur.currentPrice * cur.volume * (cur.marginPotential / 100)), 0);
  }, [filteredData]);

  const topOpportunities = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);
  }, [filteredData]);

  const actionDistribution = useMemo(() => {
    const dist: Record<string, number> = { BUY: 0, HOLD: 0, SELL: 0, MONITOR: 0 };
    filteredData.forEach(d => { if (d.recommendedAction) dist[d.recommendedAction]++; });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const regionalOpportunities = useMemo(() => {
    return regionalData.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [regionalData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Duke ngarkuar Inteligjencën e Tregut...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.2); } 50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.4); } }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        .gradient-text {
          background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .progress-bar {
          background: linear-gradient(90deg, #4f46e5, #06b6d4);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.15); }
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 999px; }
        .spinner {
          width: 40px; height: 40px; border: 3px solid rgba(79, 70, 229, 0.1);
          border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-active {
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          color: white;
          box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.3);
        }
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 40px -15px rgba(0, 0, 0, 0.15);
        }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #f59e0b; }
        .buy-signal { background: linear-gradient(135deg, #10b98120, #10b98105); border-left: 4px solid #10b981; }
        .sell-signal { background: linear-gradient(135deg, #ef444420, #ef444405); border-left: 4px solid #ef4444; }
        .hold-signal { background: linear-gradient(135deg, #f59e0b20, #f59e0b05); border-left: 4px solid #f59e0b; }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto">
          
          {/* Header */}
          <section className="glass-card-strong rounded-3xl p-6 md:p-8 mb-8 transition-all hover:shadow-xl">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm border border-indigo-200/50">
                    Inteligjencë Tregu • Ekskluzive për Biznes
                  </span>
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-white/80 hover:text-indigo-600 transition-all">
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-red-50 hover:text-red-600 transition-all">
                    DALJE
                  </button>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  INTELEGJENCA E<br />
                  <span className="gradient-text">TREGUT 2.0</span>
                </h1>
                <p className="mt-4 max-w-2xl text-slate-600 text-lg">
                  Analiza e thellë e konkurrencës, sinjaleve të çmimeve dhe mundësive të fshehura të marzhës. 
                  Mbi 500 sinjale aktive të monitoruara në kohë reale.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6 w-full xl:w-[450px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-indigo-600 uppercase">Pulsi i Tregut</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    marketPulse.trend === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 
                    marketPulse.trend === 'Bearish' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {marketPulse.trend}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-4xl font-black ${
                    marketPulse.trend === 'Bullish' ? 'text-emerald-600' : 
                    marketPulse.trend === 'Bearish' ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    {marketPulse.signalStrength}%
                  </span>
                  <span className="text-sm bg-slate-100 px-3 py-1 rounded-full font-semibold">Forca e Sinjalit</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Volatiliteti</div>
                    <div className="font-bold text-slate-800">{marketPulse.volatilityIndex}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Momenti</div>
                    <div className={`font-bold ${marketPulse.momentumScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {marketPulse.momentumScore > 0 ? '+' : ''}{marketPulse.momentumScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Support</div>
                    <div className="font-bold text-slate-800">€{marketPulse.supportLevel}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-700 font-medium bg-indigo-50/50 p-3 rounded-xl">
                  <span className="font-bold">Rekomandim:</span> {marketPulse.recommendedAction}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {marketPulse.keyDrivers.map((d, i) => (
                    <span key={i} className="text-xs bg-white/60 px-2 py-1 rounded-full text-slate-600">• {d}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'overview', label: 'Përmbledhje' },
              { id: 'regional', label: 'Analiza Rajonale' },
              { id: 'competitors', label: 'Konkurrentët' },
              { id: 'opportunities', label: 'Mundësitë' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedTab === tab.id ? 'tab-active text-white' : 'glass-card text-slate-600 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <select className="glass-card rounded-xl px-4 py-2 text-sm font-medium outline-none border-0">
                <option>7 Ditë</option>
                <option>30 Ditë</option>
                <option selected>90 Ditë</option>
                <option>1 Vit</option>
              </select>
            </div>
          </div>

          {/* Filtra të Avancuar */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="glass-card rounded-xl px-4 py-3 text-sm font-medium outline-none border-0">
              <option value="Të gjitha">Të gjitha Kategoritë ({CATEGORIES.length})</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="glass-card rounded-xl px-4 py-3 text-sm font-medium outline-none border-0">
              <option value="Të gjitha">Të gjitha Rajonet ({REGIONS.length})</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="glass-card rounded-xl px-4 py-3 text-sm font-medium outline-none border-0">
              <option value="Të gjitha">Të gjitha Risqet</option>
              <option value="Low">Risk i Ulët</option>
              <option value="Medium">Risk Mesatar</option>
              <option value="High">Risk i Lartë</option>
            </select>
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="glass-card rounded-xl px-4 py-3 text-sm font-medium outline-none border-0">
              <option value="Të gjitha">Të gjitha Veprimet</option>
              <option value="BUY">BLEJ</option>
              <option value="HOLD">MBAJ</option>
              <option value="SELL">SHIT</option>
              <option value="MONITOR">MONITORO</option>
            </select>
            <div className="ml-auto glass-card rounded-xl px-4 py-2 flex items-center gap-3">
              <span className="text-sm text-slate-500">Sinjale Aktive:</span>
              <span className="text-xl font-black text-indigo-600">{filteredData.length}</span>
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-slate-500">Vlera e Tregut:</span>
              <span className="text-xl font-black text-emerald-600">€{(totalOpportunityValue / 1000000).toFixed(2)}M</span>
            </div>
          </div>

          {/* Përmbajtja sipas Tab-it */}
          {selectedTab === 'overview' && (
            <>
              {/* KPI Cards - Rreshti 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
                {[
                  { label: 'Sinjale Aktive', value: filteredData.length, change: '+12.3%', icon: '📡', trend: 'up' },
                  { label: 'Marzha Mesatare', value: `${Math.round(filteredData.reduce((a,b) => a+b.marginPotential,0)/(filteredData.length||1))}%`, change: '+2.4%', icon: '📊', trend: 'up' },
                  { label: 'ROI Mesatar', value: `${Math.round(filteredData.reduce((a,b) => a+b.roi,0)/(filteredData.length||1))}%`, change: '+1.8%', icon: '💰', trend: 'up' },
                  { label: 'Volumi Total', value: `${(filteredData.reduce((a,b) => a+b.volume,0)/1000).toFixed(1)}K`, change: '-3.2%', icon: '📦', trend: 'down' },
                  { label: 'Sinjale BLEJ', value: filteredData.filter(d => d.recommendedAction === 'BUY').length, change: '+8', icon: '🎯', trend: 'up' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-2xl p-5 stat-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">{stat.label}</div>
                        <div className="text-4xl font-black text-slate-900 mt-1">{stat.value}</div>
                      </div>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className={`text-sm font-medium mt-2 ${stat.trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                      {stat.change} vs periudha e mëparshme
                    </div>
                  </div>
                ))}
              </div>

              {/* KPI Cards - Rreshti 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  { label: 'Elasticiteti i Çmimit', value: (filteredData.reduce((a,b) => a+b.priceElasticity,0)/(filteredData.length||1)).toFixed(2), change: 'Elastik', icon: '📈' },
                  { label: 'Dërgesa Mesatare', value: `€${Math.round(filteredData.reduce((a,b) => a+b.shippingCost,0)/(filteredData.length||1))}`, change: '+€2.3', icon: '🚚' },
                  { label: 'TVSH Mesatare', value: `€${Math.round(filteredData.reduce((a,b) => a+b.vatImpact,0)/(filteredData.length||1))}`, change: '18% normë', icon: '🧾' },
                  { label: 'Tarifa Platforme', value: `${Math.round(filteredData.reduce((a,b) => a+b.platformFees/b.currentPrice*100,0)/(filteredData.length||1))}%`, change: 'Mesatare', icon: '🏪' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-2xl p-5 stat-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">{stat.label}</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stat.value}</div>
                      </div>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-2">{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Grafikët - Rreshti 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 glass-card rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Tendenca e Çmimeve me Moving Averages</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500"></span> Çmimi</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-500"></span> MA7</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500"></span> MA30</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400" style={{opacity: 0.5}}></span> Volumi</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={trendData.slice(-90)}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="price" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPrice)" name="Çmimi" />
                      <Line yAxisId="left" type="monotone" dataKey="ma7" stroke="#06b6d4" strokeWidth={2} dot={false} name="MA 7" />
                      <Line yAxisId="left" type="monotone" dataKey="ma30" stroke="#f59e0b" strokeWidth={2} dot={false} name="MA 30" />
                      <Bar yAxisId="right" dataKey="volume" fill="#10b981" opacity={0.3} name="Volumi" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart - Category Distribution */}
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
                          <span className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></span>
                          {cat.name}
                        </span>
                        <span className="font-semibold">{cat.opportunity}% oportunitet</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grafikët - Rreshti 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Scatter Chart - Risk vs Reward */}
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-800">Risk vs Reward (Scatter Plot)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="riskScore" name="Risk" unit="%" domain={[0, 100]} />
                      <YAxis type="number" dataKey="opportunityScore" name="Oportunitet" unit="%" domain={[0, 100]} />
                      <ZAxis type="number" dataKey="marginPotential" range={[20, 80]} name="Marzha" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none' }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend />
                      <Scatter name="Produkte" data={riskRewardData.slice(0, 100)} fill="#4f46e5">
                        {riskRewardData.slice(0, 100).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.recommendedAction === 'BUY' ? '#10b981' :
                              entry.recommendedAction === 'SELL' ? '#ef4444' :
                              entry.recommendedAction === 'HOLD' ? '#f59e0b' : '#6b7280'
                            } 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> BLEJ</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> MBAJ</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span> SHIT</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-500"></span> MONITORO</span>
                  </div>
                </div>

                {/* Bar Chart - Veprimet e Rekomanduara */}
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
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'BUY' ? '#10b981' :
                              entry.name === 'SELL' ? '#ef4444' :
                              entry.name === 'HOLD' ? '#f59e0b' : '#6b7280'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela e Sinjaleve Kryesore */}
              <div className="glass-card-strong rounded-3xl p-6 overflow-hidden mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Sinjalet me Oportunitetin më të Lartë</h2>
                  <span className="text-sm text-slate-500">Top 10 nga {filteredData.length} sinjale</span>
                </div>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-white/30 rounded-lg">
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
                            <div>{signal.productName}</div>
                            <div className="text-xs text-slate-500">{signal.brand} • {signal.model}</div>
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
                              {signal.priceChange7d > 0 ? '+' : ''}{signal.priceChange7d}% (7d)
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
                              <span className={`font-bold ${
                                signal.opportunityScore > 70 ? 'trend-up' : 
                                signal.opportunityScore > 40 ? 'trend-stable' : 'trend-down'
                              }`}>
                                {signal.opportunityScore}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    signal.opportunityScore > 70 ? 'bg-emerald-500' : 
                                    signal.opportunityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${signal.opportunityScore}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              signal.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700' : 
                              signal.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {signal.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              signal.recommendedAction === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                              signal.recommendedAction === 'SELL' ? 'bg-rose-100 text-rose-700' :
                              signal.recommendedAction === 'HOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabela e Analizës Rajonale */}
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
                              <div className="flex items-center gap-1">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{width: `${region.demandIndex}%`}} />
                                </div>
                                {region.demandIndex}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{width: `${region.supplyIndex}%`}} />
                                </div>
                                {region.supplyIndex}
                              </div>
                            </td>
                            <td className="px-4 py-3">{region.competitiveIntensity}%</td>
                            <td className={`px-4 py-3 font-medium ${region.growthRate >= 0 ? 'trend-up' : 'trend-down'}`}>
                              {region.growthRate > 0 ? '+' : ''}{region.growthRate}%
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${
                                region.opportunityScore > 70 ? 'trend-up' : 
                                region.opportunityScore > 40 ? 'trend-stable' : 'trend-down'
                              }`}>
                                {region.opportunityScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kategoritë Kryesore për Secilin Rajon */}
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Kategoritë Kryesore sipas Rajonit</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
                    {regionalData.map((region, idx) => (
                      <div key={idx} className="bg-white/50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800">{region.region}</span>
                          <span className="text-sm text-slate-500">Faktor sezonal: {region.seasonalityFactor}</span>
                        </div>
                        <div className="text-lg font-semibold text-indigo-600 mb-2">{region.topCategory}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/30 rounded-lg p-2">
                            <span className="text-slate-500">Varianca e Çmimit:</span>
                            <span className="font-bold ml-1">±€{region.priceVariance}</span>
                          </div>
                          <div className="bg-white/30 rounded-lg p-2">
                            <span className="text-slate-500">Oportuniteti:</span>
                            <span className="font-bold ml-1">{region.opportunityScore}%</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card-strong rounded-3xl p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">Peizazhi i Konkurrentëve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scroll">
                  {competitors.map((comp) => (
                    <div key={comp.id} className="bg-white/50 rounded-xl p-4 hover:bg-white/70 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-slate-800">{comp.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{comp.region}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          comp.strategy === 'Aggressive' ? 'bg-orange-100 text-orange-700' :
                          comp.strategy === 'Premium' ? 'bg-purple-100 text-purple-700' :
                          comp.strategy === 'Discount' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comp.strategy}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-slate-500">Çmimi:</span>
                          <span className="font-semibold ml-1">€{comp.avgPrice}</span>
                          <span className="text-xs text-slate-400 ml-1">({comp.minPrice}-{comp.maxPrice})</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Stoku:</span>
                          <span className={`font-semibold ml-1 ${
                            comp.stockLevel === 'High' ? 'trend-up' : 
                            comp.stockLevel === 'Low' ? 'trend-down' : 'trend-stable'
                          }`}>
                            {comp.stockLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Pjesa e Tregut:</span>
                          <span className="font-semibold ml-1">{comp.marketShare}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vlerësimi:</span>
                          <span className="font-semibold ml-1">{comp.customerRating.toFixed(1)}★</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Kërcënimi:</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              comp.threatLevel > 70 ? 'bg-rose-500' : comp.threatLevel > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${comp.threatLevel}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{comp.threatLevel}%</span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>Pozicionimi: {comp.pricePositioning}</span>
                        <span>Intensiteti promo: {comp.promotionalIntensity}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">Analiza e Kërcënimit</h3>
                <div className="space-y-4">
                  {competitors
                    .sort((a, b) => b.threatLevel - a.threatLevel)
                    .slice(0, 8)
                    .map((comp, idx) => (
                      <div key={idx} className="bg-white/50 rounded-xl p-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{comp.name}</span>
                          <span className={`font-bold ${
                            comp.threatLevel > 70 ? 'text-rose-600' : 
                            comp.threatLevel > 40 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            Niveli {comp.threatLevel}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">{comp.region}</div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full rounded-full ${
                              comp.threatLevel > 70 ? 'bg-rose-500' : 
                              comp.threatLevel > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${comp.threatLevel}%` }}
                          />
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-slate-100 px-2 py-1 rounded-full">Koha e përgjigjes: {comp.responseTime}h</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-full">Cilësia: {comp.listingQuality}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'opportunities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card-strong rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Mundësitë më të Mira për BLEJ</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
                    {filteredData
                      .filter(d => d.recommendedAction === 'BUY')
                      .sort((a, b) => b.opportunityScore - a.opportunityScore)
                      .slice(0, 10)
                      .map((item) => (
                        <div key={item.id} className="buy-signal rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                              <div className="text-xs text-slate-500">{item.category} • {item.region}</div>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">{item.opportunityScore}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-slate-500">Çmimi:</span>
                              <span className="font-semibold ml-1">€{item.currentPrice}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Marzha:</span>
                              <span className="font-semibold ml-1">{item.marginPotential}%</span>
                            </div>
                            <div>
                              <span className="text-slate-500">ROI:</span>
                              <span className="font-semibold ml-1">{item.roi}%</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs bg-emerald-50 p-2 rounded-lg">
                            <span className="font-medium">Rekomandim:</span> BLEJ tani • Fitim i pritshëm €{item.netProfit.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="glass-card-strong rounded-3xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Sinjalet për SHIT</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
                    {filteredData
                      .filter(d => d.recommendedAction === 'SELL')
                      .sort((a, b) => a.opportunityScore - b.opportunityScore)
                      .slice(0, 10)
                      .map((item) => (
                        <div key={item.id} className="sell-signal rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                              <div className="text-xs text-slate-500">{item.category} • {item.region}</div>
                            </div>
                            <span className="text-2xl font-black text-rose-600">{item.opportunityScore}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-slate-500">Çmimi:</span>
                              <span className="font-semibold ml-1">€{item.currentPrice}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Trend 30d:</span>
                              <span className={`font-semibold ml-1 ${item.priceChange30d >= 0 ? 'trend-up' : 'trend-down'}`}>
                                {item.priceChange30d > 0 ? '+' : ''}{item.priceChange30d}%
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Konkurrentë:</span>
                              <span className="font-semibold ml-1">{item.competitorCount}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs bg-rose-50 p-2 rounded-lg">
                            <span className="font-medium">Rekomandim:</span> SHIT para rënies së mëtejshme
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400">
            SellSmart Market Intelligence 2.0 • {filteredData.length} sinjale aktive • Të dhënat rifreskohen çdo 2 orë • Ekskluzive për Llogarinë tënde të Biznesit
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}