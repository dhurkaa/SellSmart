import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PriceStatus =
  | 'undervalued'
  | 'balanced'
  | 'overpriced'
  | 'margin_risk'
  | 'stock_clearance'
  | 'premium_opportunity';

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeText = (value: unknown) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const groupSignalsByProduct = (signals: any[]) => {
  const map = new Map<string, any[]>();

  for (const signal of signals) {
    const name = String(signal.product_name || '').trim();
    const domain = String(signal.source_domain || '').trim();

    if (!name || !domain) continue;

    const key = `${domain}:${normalizeText(name)}`;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)?.push(signal);
  }

  return Array.from(map.entries()).map(([key, group]) => {
    const first = group[0];

    const prices = group
      .map((item) => toNumber(item.detected_price))
      .filter((price) => price > 0);

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const average = prices.length
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;

    const confidence = group.length
      ? group.reduce((sum, item) => sum + toNumber(item.confidence), 0) / group.length
      : 0;

    return {
      key,
      source_domain: first.source_domain,
      source_url: first.source_url,
      product_name: first.product_name,
      currency: first.currency || 'EUR',
      prices,
      min,
      max,
      average,
      confidence,
      count: group.length,
      lastUpdated: first.created_at || null,
    };
  });
};

const getStatus = ({
  price,
  marketAverage,
  confidence,
}: {
  price: number;
  marketAverage: number;
  confidence: number;
}): PriceStatus => {
  if (confidence < 40 || marketAverage <= 0) return 'balanced';

  if (price < marketAverage * 0.9) return 'undervalued';
  if (price > marketAverage * 1.15) return 'overpriced';

  return 'balanced';
};

const buildSummary = (products: any[]) => {
  const totalProducts = products.length;

  const productsForReview = products.filter(
    (item) => item.status !== 'balanced'
  ).length;

  const undervalued = products.filter((item) => item.status === 'undervalued').length;
  const marginRisk = products.filter((item) => item.status === 'margin_risk').length;

  const pendingApprovals = products.filter(
    (item) => Math.abs(item.recommendedPrice - item.currentPrice) > 0.01
  ).length;

  const avgMargin =
    totalProducts > 0
      ? products.reduce((sum, item) => sum + item.marginPct, 0) / totalProducts
      : 0;

  const avgConfidence =
    totalProducts > 0
      ? products.reduce((sum, item) => sum + item.marketConfidence, 0) / totalProducts
      : 0;

  const totalStockValue = products.reduce(
    (sum, item) => sum + item.costPrice * item.stock,
    0
  );

  const potentialRevenueLift = products.reduce((sum, item) => {
    const delta = item.recommendedPrice - item.currentPrice;
    if (delta <= 0) return sum;
    return sum + delta * Math.max(item.stock, 1);
  }, 0);

  return {
    totalProducts,
    productsForReview,
    undervalued,
    marginRisk,
    pendingApprovals,
    avgMargin,
    avgConfidence,
    totalStockValue,
    potentialRevenueLift,
    lastUpdated: new Date().toISOString(),
  };
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 500), 1000);

    const { data: domains, error: domainsError } = await supabase
      .from('competitor_domains')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (domainsError) {
      return NextResponse.json({ error: domainsError.message }, { status: 500 });
    }

    if (!domains || domains.length === 0) {
      return NextResponse.json({
        products: [],
        summary: buildSummary([]),
        meta: {
          source: 'competitor_domains',
          needsCompetitorSetup: true,
          productCount: 0,
          warning: 'No competitor domains found. Add websites first.',
        },
      });
    }

    const { data: signals, error: signalsError } = await supabase
      .from('competitor_price_signals')
      .select('*')
      .eq('user_id', user.id)
      .not('product_name', 'is', null)
      .not('detected_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6000);

    if (signalsError) {
      return NextResponse.json(
        {
          error: signalsError.message,
          hint: 'Make sure competitor_price_signals exists and has product_name/detected_price.',
        },
        { status: 500 }
      );
    }

    const grouped = groupSignalsByProduct(signals || []).slice(0, limit);

    const allPrices = grouped
      .map((item) => item.average)
      .filter((price) => Number.isFinite(price) && price > 0);

    const globalMarketAverage =
      allPrices.length > 0
        ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
        : 0;

    const pricingProducts = grouped.map((item, index) => {
      const currentPrice = Number(item.average.toFixed(2));
      const marketAverage = globalMarketAverage || currentPrice;

      const recommendedPrice =
        item.confidence >= 70
          ? currentPrice < marketAverage * 0.9
            ? marketAverage * 0.95
            : currentPrice > marketAverage * 1.15
              ? marketAverage * 1.05
              : currentPrice
          : currentPrice;

      const estimatedCost = currentPrice * 0.65;

      const marginPct =
        recommendedPrice > 0
          ? ((recommendedPrice - estimatedCost) / recommendedPrice) * 100
          : 0;

      const status = getStatus({
        price: currentPrice,
        marketAverage,
        confidence: item.confidence,
      });

      return {
        id: `${item.source_domain}-${index}-${Buffer.from(item.product_name)
          .toString('base64')
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 12)}`,
        name: item.product_name,
        category: item.source_domain,
        sku: null,
        brand: item.source_domain,
        supplier: item.source_domain,
        sourceUrl: item.source_url,
        currentPrice,
        recommendedPrice: Number(recommendedPrice.toFixed(2)),
        floorPrice: Number((estimatedCost * 1.18).toFixed(2)),
        costPrice: Number(estimatedCost.toFixed(2)),
        marginPct: Number(marginPct.toFixed(2)),
        targetMarginPct: 25,
        stock: 1,
        soldLast30Days: null,
        marketAveragePrice: Number(marketAverage.toFixed(2)),
        competitorMinPrice: Number(item.min.toFixed(2)),
        competitorMaxPrice: Number(item.max.toFixed(2)),
        marketConfidence: Number(Math.min(95, item.confidence).toFixed(0)),
        status,
        lastUpdated: item.lastUpdated,
      };
    });

    return NextResponse.json({
      products: pricingProducts,
      summary: buildSummary(pricingProducts),
      meta: {
        source: 'competitor_price_signals',
        domains: domains.map((item) => item.start_url || item.domain),
        productCount: pricingProducts.length,
        competitorSignals: signals?.length || 0,
        globalMarketAverage,
        needsAnalysis: pricingProducts.length === 0,
        warning:
          pricingProducts.length === 0
            ? 'Competitor domains exist, but no website products have been extracted yet. Click Analyze Competitor Prices.'
            : pricingProducts.length < 100
              ? `Found ${pricingProducts.length} products from competitor websites. Add more domains or run deeper analysis for 100+ products.`
              : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load competitor website products.',
      },
      { status: 500 }
    );
  }
}