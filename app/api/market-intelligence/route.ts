import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

const COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function calculateMovingAverage(values: number[], period: number, index: number) {
  if (index + 1 < period) return 0;
  const slice = values.slice(index - period + 1, index + 1);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / period) * 100) / 100;
}

function calculatePriceChange(current: number, previous: number) {
  if (!previous || previous <= 0) return 0;
  return Math.round((((current - previous) / previous) * 100) * 10) / 10;
}

function normalizeRiskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score <= 35) return 'Low';
  if (score <= 65) return 'Medium';
  return 'High';
}

function normalizeVolumeTrend(value: number): 'up' | 'down' | 'stable' {
  if (value > 2) return 'up';
  if (value < -2) return 'down';
  return 'stable';
}

function normalizeSeasonality(category: string): 'High' | 'Medium' | 'Low' {
  const highSeason = ['Perde', 'Dekor', 'Ndriçim', 'Mobilje'];
  if (highSeason.some((x) => category.toLowerCase().includes(x.toLowerCase()))) return 'High';
  return 'Medium';
}

function pickRecommendedAction(
  opportunityScore: number,
  roi: number,
  priceChange30d: number,
  competitorCount: number
): 'BUY' | 'HOLD' | 'SELL' | 'MONITOR' {
  if (opportunityScore >= 75 && roi >= 18 && competitorCount <= 12) return 'BUY';
  if (priceChange30d <= -10 && competitorCount >= 18) return 'SELL';
  if (opportunityScore >= 45) return 'HOLD';
  return 'MONITOR';
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const range = req.nextUrl.searchParams.get('range') ?? '90d';

    const days =
      range === '7d' ? 7 :
      range === '30d' ? 30 :
      range === '1y' ? 365 :
      90;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromIso = fromDate.toISOString();

    const { data: offers, error: offersError } = await supabase
      .from('market_product_offers')
      .select(`
        id,
        source_name,
        source_type,
        source_url,
        external_id,
        product_title,
        normalized_category,
        sub_category,
        brand,
        model,
        region,
        city,
        currency,
        listed_price,
        shipping_price,
        total_price,
        availability,
        seller_name,
        image_url,
        material,
        color,
        dimensions,
        rating,
        review_count,
        captured_at
      `)
      .gte('captured_at', fromIso)
      .order('captured_at', { ascending: true });

    if (offersError) {
      throw offersError;
    }

    const rows = offers ?? [];

    const grouped = new Map<string, typeof rows>();

    for (const row of rows) {
      const key = [
        row.normalized_category || 'Të përgjithshme',
        row.brand || 'Generic',
        row.model || '',
        row.product_title || '',
        row.region || 'Kosovë',
      ].join('||');

      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }

    const signals: MarketSignal[] = [];
    const competitorsMap = new Map<string, any[]>();
    const regionMap = new Map<string, any[]>();
    const dailyBuckets = new Map<string, { totalPrice: number; totalVolume: number; listings: number }>();
    const categoryMap = new Map<string, { count: number; opportunitySum: number }>();

    for (const row of rows) {
      const sellerKey = `${row.seller_name || row.source_name || 'Unknown'}||${row.region || 'Kosovë'}`;
      if (!competitorsMap.has(sellerKey)) competitorsMap.set(sellerKey, []);
      competitorsMap.get(sellerKey)!.push(row);

      const regionKey = row.region || 'Kosovë';
      if (!regionMap.has(regionKey)) regionMap.set(regionKey, []);
      regionMap.get(regionKey)!.push(row);

      const day = new Date(row.captured_at).toLocaleDateString('sq-AL', {
        month: 'short',
        day: 'numeric',
      });

      if (!dailyBuckets.has(day)) {
        dailyBuckets.set(day, { totalPrice: 0, totalVolume: 0, listings: 0 });
      }

      const bucket = dailyBuckets.get(day)!;
      bucket.totalPrice += Number(row.total_price || row.listed_price || 0);
      bucket.totalVolume += 1;
      bucket.listings += 1;
    }

    for (const [groupKey, items] of grouped.entries()) {
      const sorted = [...items].sort(
        (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
      );

      const latest = sorted[sorted.length - 1];
      const currentPrice = Number(latest.total_price || latest.listed_price || 0);

      const prices = sorted.map((x) => Number(x.total_price || x.listed_price || 0)).filter((x) => x > 0);
      const firstPrice = prices[0] || currentPrice;
      const prev7 = prices.length > 7 ? prices[prices.length - 8] : firstPrice;
      const prev30 = prices.length > 30 ? prices[prices.length - 31] : firstPrice;

      const priceChange = calculatePriceChange(currentPrice, firstPrice);
      const priceChange7d = calculatePriceChange(currentPrice, prev7);
      const priceChange30d = calculatePriceChange(currentPrice, prev30);

      const avgPrice =
        prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice;

      const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
      const priceVariance = avgPrice > 0 ? ((maxPrice - minPrice) / avgPrice) * 100 : 0;

      const shippingCost = Number(latest.shipping_price || 0);
      const vatImpact = currentPrice * 0.18;
      const platformFees = currentPrice * 0.06;
      const adCostEstimate = currentPrice * 0.03;

      const competitorCount = new Set(
        sorted.map((x) => x.seller_name || x.source_name || x.external_id || x.id)
      ).size;

      const marginPotential = clamp(
        28 + (competitorCount < 8 ? 10 : 0) + (priceChange30d > 0 ? 6 : 0) - priceVariance * 0.15,
        8,
        65
      );

      const marginAfterFees = Math.max(0, marginPotential - 9);
      const netProfit = currentPrice * (marginAfterFees / 100) - shippingCost - adCostEstimate;
      const roi = currentPrice > 0 ? (netProfit / currentPrice) * 100 : 0;

      const demandScore = clamp(
        50 + (sorted.length * 2) + (priceChange7d > 0 ? 8 : 0) + (competitorCount < 10 ? 10 : -5),
        10,
        100
      );

      const supplyScore = clamp(competitorCount * 5, 5, 100);

      const opportunityScore = clamp(
        55 +
          (marginAfterFees * 0.6) +
          (roi * 0.5) +
          (demandScore * 0.15) -
          (supplyScore * 0.12) -
          Math.abs(priceVariance) * 0.18,
        1,
        100
      );

      const riskRaw =
        Math.abs(priceChange30d) * 1.2 +
        priceVariance * 0.5 +
        (competitorCount > 15 ? 20 : competitorCount > 8 ? 10 : 4);

      const riskLevel = normalizeRiskLevel(riskRaw);
      const sellThroughRate = clamp(100 - competitorCount * 3 + (priceChange7d > 0 ? 10 : 0), 5, 95);
      const priceElasticity = clamp(0.7 + competitorCount * 0.04 + priceVariance / 100, 0.5, 3);

      const recommendedAction = pickRecommendedAction(
        opportunityScore,
        roi,
        priceChange30d,
        competitorCount
      );

      const volumeTrend = normalizeVolumeTrend(priceChange7d);

      const sourceNames = [...new Set(sorted.map((x) => x.source_name).filter(Boolean))] as string[];
      const productName = latest.product_title || latest.model || latest.brand || groupKey.split('||')[0];
      const category = latest.normalized_category || 'Të përgjithshme';

      signals.push({
        id: latest.id,
        category,
        subCategory: latest.sub_category || 'Të përgjithshme',
        productName,
        brand: latest.brand || 'Generic',
        model: latest.model || 'Standard',
        currentPrice: Math.round(currentPrice * 100) / 100,
        priceChange,
        priceChange7d,
        priceChange30d,
        volume: sorted.length,
        volumeTrend,
        opportunityScore: Math.round(opportunityScore),
        marginPotential: Math.round(marginPotential),
        marginAfterFees: Math.round(marginAfterFees * 10) / 10,
        riskLevel,
        competitorCount,
        sellThroughRate: Math.round(sellThroughRate),
        shippingCost: Math.round(shippingCost * 100) / 100,
        vatImpact: Math.round(vatImpact * 100) / 100,
        platformFees: Math.round(platformFees * 100) / 100,
        adCostEstimate: Math.round(adCostEstimate * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        region: latest.region || 'Kosovë',
        city: latest.city || latest.region || 'Online',
        seasonality: normalizeSeasonality(category),
        demandScore: Math.round(demandScore),
        supplyScore: Math.round(supplyScore),
        priceElasticity: Math.round(priceElasticity * 100) / 100,
        minimumAdvertisedPrice: Math.round((avgPrice * 0.95) * 100) / 100,
        recommendedAction,
        confidenceLevel: clamp(65 + sourceNames.length * 6, 60, 98),
        dataQuality: sourceNames.length >= 3 ? 'A' : sourceNames.length === 2 ? 'B' : 'C',
        lastUpdated: latest.captured_at,
        sourceCount: sourceNames.length,
        sourceNames,
        productUrl: latest.source_url,
        imageUrl: latest.image_url,
      });

      const catStats = categoryMap.get(category) || { count: 0, opportunitySum: 0 };
      catStats.count += 1;
      catStats.opportunitySum += opportunityScore;
      categoryMap.set(category, catStats);
    }

    const competitors: CompetitorInsight[] = [...competitorsMap.entries()].map(([key, items], index) => {
      const [name, region] = key.split('||');
      const prices = items.map((x) => Number(x.total_price || x.listed_price || 0)).filter((x) => x > 0);
      const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const ratingAvg =
        items.reduce((acc, cur) => acc + Number(cur.rating || 4.2), 0) / (items.length || 1);

      const threatLevel = clamp(
        items.length * 4 + (ratingAvg * 10) + (avgPrice > 0 ? 12 : 0),
        10,
        100
      );

      return {
        id: `competitor-${index}`,
        name,
        region,
        avgPrice: Math.round(avgPrice * 100) / 100,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        stockLevel:
          items.length >= 20 ? 'High' :
          items.length >= 10 ? 'Medium' :
          items.length >= 3 ? 'Low' : 'Out of Stock',
        strategy:
          avgPrice > 500 ? 'Premium' :
          items.length > 15 ? 'Aggressive' :
          avgPrice < 120 ? 'Discount' : 'Balanced',
        threatLevel: Math.round(threatLevel),
        marketShare: clamp(Math.round((items.length / Math.max(rows.length, 1)) * 1000), 1, 100),
        pricePositioning:
          avgPrice > 500 ? 'Leader' :
          avgPrice > 200 ? 'Follower' : 'Challenger',
        responseTime: clamp(48 - items.length, 2, 48),
        promotionalIntensity: clamp(items.length * 5, 10, 100),
        customerRating: Math.round(ratingAvg * 10) / 10,
        listingQuality: clamp(Math.round(60 + ratingAvg * 8), 60, 100),
      };
    });

    const regional: RegionalAnalysis[] = [...regionMap.entries()].map(([region, items]) => {
      const prices = items.map((x) => Number(x.total_price || x.listed_price || 0)).filter((x) => x > 0);
      const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const min = prices.length ? Math.min(...prices) : 0;
      const max = prices.length ? Math.max(...prices) : 0;

      const categoryCount = new Map<string, number>();
      for (const item of items) {
        const cat = item.normalized_category || 'Të përgjithshme';
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
      }

      const topCategory =
        [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Të përgjithshme';

      const demandIndex = clamp(items.length * 3, 10, 100);
      const supplyIndex = clamp(new Set(items.map((x) => x.seller_name || x.source_name)).size * 7, 10, 100);
      const competitiveIntensity = clamp(supplyIndex + 10, 10, 100);
      const opportunityScore = clamp(demandIndex - supplyIndex * 0.2 + 45, 1, 100);

      return {
        region,
        avgPrice: Math.round(avgPrice * 100) / 100,
        priceVariance: avgPrice > 0 ? Math.round((((max - min) / avgPrice) * 100) * 10) / 10 : 0,
        demandIndex: Math.round(demandIndex),
        supplyIndex: Math.round(supplyIndex),
        opportunityScore: Math.round(opportunityScore),
        topCategory,
        competitiveIntensity: Math.round(competitiveIntensity),
        growthRate: Math.round(((demandIndex - supplyIndex) / 10) * 10) / 10,
        seasonalityFactor: Math.round((0.9 + (demandIndex / 200)) * 100) / 100,
      };
    });

    const riskReward: RiskRewardData[] = signals.slice(0, 200).map((signal) => {
      const riskScore =
        signal.riskLevel === 'Low' ? 25 :
        signal.riskLevel === 'Medium' ? 55 : 82;

      return {
        opportunityScore: signal.opportunityScore,
        riskScore,
        marginPotential: signal.marginPotential,
        productName: signal.productName,
        category: signal.category,
        volume: signal.volume,
        recommendedAction: signal.recommendedAction,
      };
    });

    const categories: CategoryDistribution[] = [...categoryMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, stats], index) => ({
        name,
        value: stats.count,
        opportunity: Math.round(stats.opportunitySum / stats.count),
        color: COLORS[index % COLORS.length],
      }));

    const sortedDays = [...dailyBuckets.entries()]
      .map(([date, value]) => ({
        date,
        price: value.listings ? Math.round((value.totalPrice / value.listings) * 100) / 100 : 0,
        volume: value.totalVolume,
        listings: value.listings,
      }));

    const priceSeries = sortedDays.map((x) => x.price);

    const trends: TrendPoint[] = sortedDays.map((point, index) => ({
      date: point.date,
      price: point.price,
      volume: point.volume,
      listings: point.listings,
      ma7: calculateMovingAverage(priceSeries, 7, index),
      ma30: calculateMovingAverage(priceSeries, 30, index),
    }));

    return NextResponse.json({
      signals: signals.sort((a, b) => b.opportunityScore - a.opportunityScore),
      competitors: competitors.sort((a, b) => b.threatLevel - a.threatLevel).slice(0, 50),
      regional: regional.sort((a, b) => b.opportunityScore - a.opportunityScore),
      riskReward,
      categories,
      trends,
      refreshedAt: new Date().toISOString(),
      stats: {
        totalSignals: signals.length,
        totalSources: new Set(rows.map((x) => x.source_name).filter(Boolean)).size,
        totalCategories: new Set(rows.map((x) => x.normalized_category).filter(Boolean)).size,
        totalRegions: new Set(rows.map((x) => x.region).filter(Boolean)).size,
      },
    });
  } catch (error) {
    console.error('market-intelligence GET error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 }
    );
  }
}