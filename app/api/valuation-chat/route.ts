import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

type BaseInfo = {
  category?: string;
  productName?: string;
  location?: string;
  condition?: string;
};

type FinanceControls = {
  landedCost?: string;
  shippingCost?: string;
  packagingCost?: string;
  platformFeePct?: string;
  vatPct?: string;
  adCostPct?: string;
  minimumMarginPct?: string;
  maximumDiscountPct?: string;
  targetRoiPct?: string;
};

type BusinessGoal =
  | 'balanced'
  | 'gross_margin'
  | 'cash_flow'
  | 'stock_clearance'
  | 'market_penetration'
  | 'premium_positioning';

type RequestBody = {
  baseInfo?: BaseInfo;
  businessGoal?: BusinessGoal;
  financeControls?: FinanceControls;
  messages?: ChatMessage[];
  images?: {
    name: string;
    role: string;
    type: string;
    size: number;
  }[];
};

type MarketResult = {
  title: string;
  source: string;
  price: number;
  priceText: string;
  link: string;
  snippet: string;
  locationSource: string;
};

type MarketStats = {
  count: number;
  min: number;
  max: number;
  average: number;
  median: number;
  filteredResults: MarketResult[];
  fallbackReason?: string;
};

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const money = (value: number) => {
  return `€${Math.max(0, value).toFixed(2)}`;
};

const normalizeText = (value: unknown) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanQueryText = (value: unknown) => {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s.\-+]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
};

const getGoalLabel = (goal: BusinessGoal) => {
  switch (goal) {
    case 'gross_margin':
      return 'marzhë bruto';
    case 'cash_flow':
      return 'cash flow';
    case 'stock_clearance':
      return 'pastrim stoku';
    case 'market_penetration':
      return 'depërtim në treg';
    case 'premium_positioning':
      return 'pozicionim premium';
    default:
      return 'balancë tregu';
  }
};

const calculateFinance = (financeControls: FinanceControls | undefined) => {
  const landedCost = toNumber(financeControls?.landedCost);
  const shippingCost = toNumber(financeControls?.shippingCost);
  const packagingCost = toNumber(financeControls?.packagingCost);
  const platformFeePct = toNumber(financeControls?.platformFeePct);
  const vatPct = toNumber(financeControls?.vatPct);
  const adCostPct = toNumber(financeControls?.adCostPct);
  const minimumMarginPct = toNumber(financeControls?.minimumMarginPct, 18);
  const maximumDiscountPct = toNumber(financeControls?.maximumDiscountPct, 15);
  const targetRoiPct = toNumber(financeControls?.targetRoiPct, 25);

  const baseCost = landedCost + shippingCost + packagingCost;
  const variablePct = platformFeePct + vatPct + adCostPct;

  const marginFloor = baseCost > 0 ? baseCost * (1 + minimumMarginPct / 100) : 0;
  const roiFloor = baseCost > 0 ? baseCost * (1 + targetRoiPct / 100) : 0;

  return {
    landedCost,
    shippingCost,
    packagingCost,
    platformFeePct,
    vatPct,
    adCostPct,
    minimumMarginPct,
    maximumDiscountPct,
    targetRoiPct,
    baseCost,
    variablePct,
    marginFloor,
    roiFloor,
  };
};

const userTextFromMessages = (messages: ChatMessage[] = []) => {
  return messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ')
    .trim();
};

const getLocationProfile = (location: string) => {
  const clean = normalizeText(location);

  if (
    clean.includes('prishtin') ||
    clean.includes('pristina') ||
    clean.includes('kosovo') ||
    clean.includes('kosova') ||
    clean.includes('xk') ||
    clean.includes('pej') ||
    clean.includes('prizren') ||
    clean.includes('ferizaj') ||
    clean.includes('gjilan') ||
    clean.includes('mitrovic')
  ) {
    return {
      countryCode: 'xk',
      countryName: 'Kosovo',
      primaryLocation: location || 'Prishtinë, Kosovo',
      nearbyMarkets: ['Prishtinë', 'Fushë Kosovë', 'Ferizaj', 'Prizren', 'Pejë', 'Gjilan'],
      currency: 'EUR',
    };
  }

  if (
    clean.includes('albania') ||
    clean.includes('shqiperi') ||
    clean.includes('shqipëri') ||
    clean.includes('tirana') ||
    clean.includes('tirane') ||
    clean.includes('tiranë') ||
    clean.includes('durres') ||
    clean.includes('durrës')
  ) {
    return {
      countryCode: 'al',
      countryName: 'Albania',
      primaryLocation: location || 'Tirana, Albania',
      nearbyMarkets: ['Tirana', 'Durres', 'Elbasan', 'Shkoder', 'Vlore'],
      currency: 'EUR',
    };
  }

  if (
    clean.includes('germany') ||
    clean.includes('deutschland') ||
    clean.includes('berlin') ||
    clean.includes('munich') ||
    clean.includes('hamburg')
  ) {
    return {
      countryCode: 'de',
      countryName: 'Germany',
      primaryLocation: location || 'Germany',
      nearbyMarkets: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
      currency: 'EUR',
    };
  }

  return {
    countryCode: 'xk',
    countryName: location || 'local market',
    primaryLocation: location || 'local market',
    nearbyMarkets: [location || 'local market'],
    currency: 'EUR',
  };
};

const isVehicleLike = (category: string, productName: string) => {
  const text = normalizeText(`${category} ${productName}`);

  return (
    text.includes('vehicle') ||
    text.includes('automjet') ||
    text.includes('car') ||
    text.includes('vetur') ||
    text.includes('audi') ||
    text.includes('bmw') ||
    text.includes('mercedes') ||
    text.includes('volkswagen') ||
    text.includes('vw') ||
    text.includes('toyota') ||
    text.includes('ford') ||
    text.includes('seat') ||
    text.includes('skoda') ||
    text.includes('porsche') ||
    text.includes('opel') ||
    text.includes('renault') ||
    text.includes('peugeot') ||
    text.includes('citroen') ||
    text.includes('hyundai') ||
    text.includes('kia')
  );
};

const extractUsefulDetailsForSearch = (messages: ChatMessage[] = []) => {
  const text = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const clean = normalizeText(text);

  const year = text.match(/\b(19|20)\d{2}\b/)?.[0] || '';

  const kmMatch =
    text.match(/\b\d{2,6}\s?(km|kilometra|k)\b/i)?.[0] ||
    text.match(/\b\d{5,6}\b/i)?.[0] ||
    '';

  const normalizedKm = kmMatch
    ? kmMatch.toLowerCase().includes('km')
      ? kmMatch
      : `${kmMatch} km`
    : '';

  const engine =
    text.match(/\b\d\.\d\s?(tdi|tsi|tfsi|hdi|cdi|dci|diesel|benzine|benzinë|hybrid)\b/i)?.[0] ||
    text.match(/\b(tdi|tsi|tfsi|diesel|nafte|naftë|benzinë|benzine|hybrid)\b/i)?.[0] ||
    '';

  const horsepower = text.match(/\b\d{2,4}\s?(hp|ks|ps|bhp)\b/i)?.[0] || '';

  const trim =
    clean.includes('s line') || clean.includes('sline')
      ? 'S line'
      : clean.includes('amg')
        ? 'AMG'
        : clean.includes('m paket') || clean.includes('m package')
          ? 'M package'
          : clean.includes('avant')
            ? 'Avant'
            : clean.includes('gti')
              ? 'GTI'
              : '';

  const drivetrain =
    clean.includes('quattro')
      ? 'quattro'
      : clean.includes('4x4') || clean.includes('awd')
        ? '4x4'
        : '';

  const transmission =
    clean.includes('automatik') ||
    clean.includes('automatic') ||
    clean.includes('stronic') ||
    clean.includes('s tronic') ||
    clean.includes('dsg')
      ? 'automatic'
      : clean.includes('manual')
        ? 'manual'
        : '';

  const conditionWords = [
    clean.includes('pa asnje aksident') || clean.includes('pa aksident') ? 'no accident' : '',
    clean.includes('pa asnje demtim') ||
    clean.includes('pa demtime') ||
    clean.includes('pa dëmtime')
      ? 'no damage'
      : '',
    clean.includes('servis') ? 'serviced' : '',
    clean.includes('bardhe') || clean.includes('bardhë') ? 'white' : '',
    clean.includes('zeze') || clean.includes('zezë') ? 'black' : '',
  ].filter(Boolean);

  const usefulNonVehicleWords = [
    year,
    engine,
    horsepower,
    trim,
    drivetrain,
    transmission,
    ...conditionWords,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    year,
    km: normalizedKm,
    engine,
    horsepower,
    trim,
    drivetrain,
    transmission,
    conditionWords,
    usefulNonVehicleWords,
  };
};

const buildSearchQueries = (body: RequestBody) => {
  const productName = cleanQueryText(body.baseInfo?.productName || '');
  const category = cleanQueryText(body.baseInfo?.category || '');
  const condition = cleanQueryText(body.baseInfo?.condition || '');
  const location = body.baseInfo?.location || '';
  const locationProfile = getLocationProfile(location);
  const details = extractUsefulDetailsForSearch(body.messages || []);

  const vehicle = isVehicleLike(category, productName);

  if (vehicle) {
    const productCore = [
      productName,
      details.year,
      details.engine,
      details.drivetrain,
      details.trim,
      details.horsepower,
      details.transmission,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const kmPart = details.km ? `${details.km}` : '';
    const conditionPart = details.conditionWords.slice(0, 2).join(' ');

    return Array.from(
      new Set(
        [
          `${productCore} ${kmPart} ${locationProfile.countryName} used price`,
          `${productCore} ${locationProfile.primaryLocation} price`,
          `${productCore} ${conditionPart} ${locationProfile.countryName}`,
          `${productCore} site:merrjep.com`,
          `${productCore} site:facebook.com/marketplace`,
          `${productCore} used car ${locationProfile.countryName} price`,
        ]
          .map((query) => query.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
      )
    ).slice(0, 6);
  }

  const normalizedProduct = normalizeText(productName);

  const isCurtain =
    normalizedProduct.includes('perde') ||
    normalizedProduct.includes('curtain') ||
    normalizedProduct.includes('curtains');

  if (isCurtain) {
    return Array.from(
      new Set(
        [
          `perde premium ${locationProfile.primaryLocation} çmimi`,
          `perde moderne ${locationProfile.countryName} çmimi`,
          `perde blackout ${locationProfile.primaryLocation} çmimi`,
          `perde linen premium ${locationProfile.countryName}`,
          `dyqan perde ${locationProfile.primaryLocation} çmime`,
          `premium curtains ${locationProfile.countryName} price`,
        ]
          .map((query) => query.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
      )
    ).slice(0, 6);
  }

  const isElectronics =
    normalizedProduct.includes('iphone') ||
    normalizedProduct.includes('samsung') ||
    normalizedProduct.includes('macbook') ||
    normalizedProduct.includes('ipad') ||
    normalizeText(category).includes('electronics');

  if (isElectronics) {
    const productCore = [productName, details.year, details.usefulNonVehicleWords]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return Array.from(
      new Set(
        [
          `${productCore} ${locationProfile.primaryLocation} çmimi`,
          `${productCore} ${locationProfile.countryName} price`,
          `${productCore} dyqan ${locationProfile.primaryLocation}`,
          `${productCore} marketplace ${locationProfile.countryName}`,
          `${productCore} site:merrjep.com`,
          `${productCore} site:gsmarena.com price`,
        ]
          .map((query) => query.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
      )
    ).slice(0, 6);
  }

  const cleanCategory = normalizeText(category).includes('home goods') ? '' : category;

  const baseProduct = [
    productName,
    cleanCategory,
    details.usefulNonVehicleWords,
    locationProfile.primaryLocation,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return Array.from(
    new Set(
      [
        `${baseProduct} çmimi`,
        `${baseProduct} ${locationProfile.countryName} price`,
        `${baseProduct} dyqan ${locationProfile.primaryLocation}`,
        `${baseProduct} marketplace ${locationProfile.countryName}`,
        `${productName} ${locationProfile.countryName} price`,
      ]
        .map((query) => query.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    )
  ).slice(0, 5);
};

const extractPriceFromString = (value: unknown) => {
  const raw = String(value || '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');

  const number = Number(raw);

  if (!Number.isFinite(number)) return null;
  if (number <= 0 || number > 500000) return null;

  return number;
};

const extractEuroPricesFromText = (text: string) => {
  const matches = Array.from(
    text.matchAll(
      /(?:€\s?([0-9]{2,6}(?:[.,][0-9]{1,2})?)|([0-9]{2,6}(?:[.,][0-9]{1,2})?)\s?€|eur\s?([0-9]{2,6}(?:[.,][0-9]{1,2})?)|([0-9]{2,6}(?:[.,][0-9]{1,2})?)\s?eur)/gi
    )
  );

  return matches
    .map((match) => extractPriceFromString(match[1] || match[2] || match[3] || match[4]))
    .filter((price): price is number => Boolean(price));
};

const extractAnyPricesFromText = (text: string) => {
  const normalized = String(text || '');

  const patterns = [
    /(?:€|eur)\s?([0-9]{2,6}(?:[.,][0-9]{1,2})?)/gi,
    /([0-9]{2,6}(?:[.,][0-9]{1,2})?)\s?(?:€|eur)/gi,
    /(?:price|çmimi|cmimi|çmim|cmim)\D{0,20}([0-9]{2,6}(?:[.,][0-9]{1,2})?)/gi,
    /"price"\s*:\s*"?([0-9]{2,6}(?:[.,][0-9]{1,2})?)"?/gi,
    /"lowPrice"\s*:\s*"?([0-9]{2,6}(?:[.,][0-9]{1,2})?)"?/gi,
    /"highPrice"\s*:\s*"?([0-9]{2,6}(?:[.,][0-9]{1,2})?)"?/gi,
    /property=["']product:price:amount["'][^>]*content=["']([0-9]{2,6}(?:[.,][0-9]{1,2})?)["']/gi,
    /content=["']([0-9]{2,6}(?:[.,][0-9]{1,2})?)["'][^>]*property=["']product:price:amount["']/gi,
  ];

  const prices: number[] = [];

  for (const pattern of patterns) {
    const matches = Array.from(normalized.matchAll(pattern));

    for (const match of matches) {
      const value = extractPriceFromString(match[1]);

      if (value && value > 0 && value < 500000) {
        prices.push(value);
      }
    }
  }

  return Array.from(new Set(prices));
};

const fetchResultPagePrices = async ({
  url,
  title,
  source,
  location,
}: {
  url: string;
  title: string;
  source: string;
  location: string;
}) => {
  if (!url || !url.startsWith('http')) return [];

  const locationProfile = getLocationProfile(location);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,sq;q=0.8',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const prices = extractAnyPricesFromText(html);

    return prices.slice(0, 5).map((price) => ({
      title,
      source,
      price,
      priceText: money(price),
      link: url,
      snippet: 'Price extracted from result page HTML/metadata',
      locationSource: locationProfile.primaryLocation,
    })) satisfies MarketResult[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
};

const getFallbackEstimate = ({
  body,
}: {
  body: RequestBody;
}) => {
  const productName = normalizeText(body.baseInfo?.productName || '');
  const category = normalizeText(body.baseInfo?.category || '');
  const details = normalizeText(userTextFromMessages(body.messages || []));
  const text = `${productName} ${category} ${details}`;

  if (
    text.includes('iphone') ||
    text.includes('samsung') ||
    text.includes('macbook') ||
    text.includes('ipad') ||
    text.includes('electronics')
  ) {
    if (text.includes('17') && text.includes('pro max')) {
      return {
        min: 1050,
        average: 1350,
        median: 1350,
        max: 1750,
        reason:
          'AI fallback benchmark for newest premium smartphone because web search did not return readable prices.',
      };
    }

    if (text.includes('pro max')) {
      return {
        min: 850,
        average: 1150,
        median: 1150,
        max: 1500,
        reason:
          'AI fallback electronics benchmark for premium smartphone because web search did not return readable prices.',
      };
    }

    return {
      min: 350,
      average: 750,
      median: 750,
      max: 1200,
      reason:
        'AI fallback electronics benchmark because web search did not return readable prices.',
    };
  }

  if (isVehicleLike(body.baseInfo?.category || '', body.baseInfo?.productName || '')) {
    return {
      min: 7500,
      average: 13500,
      median: 13500,
      max: 22000,
      reason:
        'AI fallback vehicle benchmark because classified pages did not expose readable prices.',
    };
  }

  if (text.includes('perde') || text.includes('curtain')) {
    return {
      min: 25,
      average: 55,
      median: 55,
      max: 95,
      reason:
        'AI fallback curtain/home-textile benchmark because web search did not return readable prices.',
    };
  }

  return {
    min: 15,
    average: 45,
    median: 45,
    max: 90,
    reason:
      'AI fallback general product benchmark because web search did not return readable prices.',
  };
};

const calculateFallbackStats = ({
  body,
}: {
  body: RequestBody;
}): MarketStats => {
  const fallback = getFallbackEstimate({ body });

  return {
    count: 1,
    min: fallback.min,
    max: fallback.max,
    average: fallback.average,
    median: fallback.median,
    filteredResults: [
      {
        title: `${body.baseInfo?.productName || 'Product'} fallback market benchmark`,
        source: 'AI fallback benchmark',
        price: fallback.median,
        priceText: money(fallback.median),
        link: '',
        snippet: fallback.reason,
        locationSource: body.baseInfo?.location || 'local market',
      },
    ],
    fallbackReason: fallback.reason,
  };
};

const searchGoogleShopping = async ({
  query,
  location,
}: {
  query: string;
  location: string;
}) => {
  const apiKey = process.env.SERPAPI_API_KEY;
  const locationProfile = getLocationProfile(location);

  if (!apiKey) {
    return {
      configured: false,
      results: [] as MarketResult[],
      error: 'SERPAPI_API_KEY is missing.',
    };
  }

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'en');
  url.searchParams.set('gl', locationProfile.countryCode);
  url.searchParams.set('location', locationProfile.primaryLocation);
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        configured: true,
        results: [] as MarketResult[],
        error: `SerpApi Shopping error ${res.status}`,
      };
    }

    const data = await res.json();

    const shoppingResults = Array.isArray(data.shopping_results)
      ? data.shopping_results
      : [];

    const inlineResults = Array.isArray(data.inline_shopping_results)
      ? data.inline_shopping_results
      : [];

    const rawResults = [...shoppingResults, ...inlineResults];

    const results: MarketResult[] = rawResults
      .map((item: any) => {
        const price =
          extractPriceFromString(item.extracted_price) ||
          extractPriceFromString(item.price) ||
          extractPriceFromString(item.old_price);

        if (!price) return null;

        return {
          title: String(item.title || '').trim(),
          source: String(item.source || item.merchant || 'Google Shopping').trim(),
          price,
          priceText: String(item.price || money(price)),
          link: String(item.product_link || item.link || ''),
          snippet: String(item.snippet || item.delivery || '').trim(),
          locationSource: locationProfile.primaryLocation,
        };
      })
      .filter(Boolean)
      .slice(0, 15) as MarketResult[];

    return {
      configured: true,
      results,
      error: null,
    };
  } catch (error: any) {
    return {
      configured: true,
      results: [] as MarketResult[],
      error:
        error?.name === 'AbortError'
          ? 'Shopping search timed out.'
          : error?.message || 'Shopping search failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
};

const searchGoogleOrganic = async ({
  query,
  location,
}: {
  query: string;
  location: string;
}) => {
  const apiKey = process.env.SERPAPI_API_KEY;
  const locationProfile = getLocationProfile(location);

  if (!apiKey) {
    return {
      configured: false,
      results: [] as MarketResult[],
      error: 'SERPAPI_API_KEY is missing.',
    };
  }

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'en');
  url.searchParams.set('gl', locationProfile.countryCode);
  url.searchParams.set('location', locationProfile.primaryLocation);
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        configured: true,
        results: [] as MarketResult[],
        error: `SerpApi Google error ${res.status}`,
      };
    }

    const data = await res.json();

    const organicResults = Array.isArray(data.organic_results)
      ? data.organic_results
      : [];

    const directResults: MarketResult[] = organicResults
      .flatMap((item: any) => {
        const title = String(item.title || '').trim();
        const snippet = String(item.snippet || '').trim();
        const link = String(item.link || '').trim();
        const source = String(item.source || item.displayed_link || 'Google Search').trim();

        const visibleText = `${title} ${snippet} ${JSON.stringify(item.rich_snippet || {})}`;
        const prices = extractAnyPricesFromText(visibleText);

        return prices
          .map((price) => {
            if (!price) return null;

            return {
              title,
              source,
              price,
              priceText: money(price),
              link,
              snippet,
              locationSource: locationProfile.primaryLocation,
            };
          })
          .filter(Boolean);
      })
      .filter(Boolean)
      .slice(0, 20) as MarketResult[];

    const pagesToFetch = organicResults
      .map((item: any) => ({
        title: String(item.title || '').trim(),
        source: String(item.source || item.displayed_link || 'Google Search').trim(),
        link: String(item.link || '').trim(),
      }))
      .filter((item: any) => item.link.startsWith('http'))
      .slice(0, 6);

    const pageExtractedResults = (
      await Promise.all(
        pagesToFetch.map((item: any) =>
          fetchResultPagePrices({
            url: item.link,
            title: item.title,
            source: item.source,
            location,
          })
        )
      )
    ).flat();

    const combined = [...directResults, ...pageExtractedResults];

    const unique = Array.from(
      new Map(
        combined.map((item) => [
          `${normalizeText(item.title)}:${normalizeText(item.source)}:${item.price}`,
          item,
        ])
      ).values()
    );

    return {
      configured: true,
      results: unique.slice(0, 30),
      error: null,
    };
  } catch (error: any) {
    return {
      configured: true,
      results: [] as MarketResult[],
      error:
        error?.name === 'AbortError'
          ? 'Google search timed out.'
          : error?.message || 'Google search failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
};

const runLocationBasedSearch = async (body: RequestBody) => {
  const location = body.baseInfo?.location || '';
  const queries = buildSearchQueries(body);
  const category = body.baseInfo?.category || '';
  const productName = body.baseInfo?.productName || '';

  const vehicle = isVehicleLike(category, productName);

  const responses = await Promise.all(
    queries.flatMap((query) => {
      if (vehicle) {
        return [
          searchGoogleOrganic({
            query,
            location,
          }),
        ];
      }

      return [
        searchGoogleShopping({
          query,
          location,
        }),
        searchGoogleOrganic({
          query,
          location,
        }),
      ];
    })
  );

  const configured = responses.some((response) => response.configured);
  const missingConfig = responses.every((response) => !response.configured);

  const results = responses.flatMap((response) => response.results);

  const unique = Array.from(
    new Map(
      results.map((item) => [
        `${normalizeText(item.title)}:${normalizeText(item.source)}:${item.price}`,
        item,
      ])
    ).values()
  );

  return {
    configured: configured && !missingConfig,
    queries,
    results: unique.slice(0, 40),
    errors: responses.map((response) => response.error).filter(Boolean) as string[],
  };
};

const loadStoredSignals = async ({
  supabase,
  userId,
  productName,
  location,
}: {
  supabase: any;
  userId: string;
  productName: string;
  location: string;
}) => {
  const { data, error } = await supabase
    .from('competitor_price_signals')
    .select('*')
    .eq('user_id', userId)
    .not('detected_price', 'is', null)
    .order('created_at', { ascending: false })
    .limit(600);

  if (error || !data) return [];

  const productWords = normalizeText(productName)
    .split(' ')
    .filter((word) => word.length >= 3)
    .slice(0, 10);

  const locationWords = normalizeText(location)
    .split(' ')
    .filter((word) => word.length >= 3)
    .slice(0, 5);

  return data
    .filter((signal: any) => {
      const text = normalizeText(
        `${signal.product_name || ''} ${signal.source_domain || ''} ${signal.raw_text || ''} ${signal.source_url || ''}`
      );

      const productMatches = productWords.filter((word) => text.includes(word)).length;
      const locationMatches = locationWords.filter((word) => text.includes(word)).length;

      const productOk = productMatches >= Math.min(2, productWords.length || 2);
      const locationOk = locationWords.length === 0 || locationMatches >= 1;

      return productOk || (productMatches >= 1 && locationOk);
    })
    .map((signal: any) => ({
      title: String(signal.product_name || ''),
      source: String(signal.source_domain || 'stored-signal'),
      price: toNumber(signal.detected_price),
      priceText: money(toNumber(signal.detected_price)),
      link: String(signal.source_url || ''),
      snippet: 'Stored competitor price signal',
      locationSource: location || 'stored market signal',
    }))
    .filter((item: MarketResult) => item.price > 0)
    .slice(0, 30);
};

const filterReasonablePrices = ({
  results,
  body,
}: {
  results: MarketResult[];
  body: RequestBody;
}) => {
  const category = body.baseInfo?.category || '';
  const productName = body.baseInfo?.productName || '';
  const vehicle = isVehicleLike(category, productName);

  if (!vehicle) {
    return results.filter((item) => item.price > 0 && item.price < 500000);
  }

  return results.filter((item) => {
    if (item.price < 1500 || item.price > 150000) return false;

    const text = normalizeText(`${item.title} ${item.snippet} ${item.source}`);
    const product = normalizeText(productName);

    const brandWords = [
      'audi',
      'bmw',
      'mercedes',
      'volkswagen',
      'toyota',
      'ford',
      'seat',
      'skoda',
      'porsche',
      'opel',
    ];
    const brand = brandWords.find((word) => product.includes(word));

    if (brand && !text.includes(brand)) return false;

    return true;
  });
};

const calculateMarketStats = ({
  results,
  body,
}: {
  results: MarketResult[];
  body: RequestBody;
}): MarketStats | null => {
  const filtered = filterReasonablePrices({
    results,
    body,
  });

  const prices = filtered.map((item) => item.price).sort((a, b) => a - b);

  if (prices.length === 0) {
    return null;
  }

  const trimCount = prices.length >= 8 ? 1 : 0;
  const trimmed =
    trimCount > 0 ? prices.slice(trimCount, prices.length - trimCount) : prices;

  const average =
    trimmed.reduce((sum, price) => sum + price, 0) / Math.max(trimmed.length, 1);

  const median = trimmed[Math.floor(trimmed.length / 2)];

  return {
    count: prices.length,
    min: prices[0],
    max: prices[prices.length - 1],
    average,
    median,
    filteredResults: filtered,
  };
};

const shouldAskForClarification = (body: RequestBody) => {
  const messages = body.messages || [];
  const userReplyCount = messages.filter((message) => message.role === 'user').length;
  const userText = normalizeText(userTextFromMessages(messages));
  const productText = normalizeText(body.baseInfo?.productName || '');

  const hasNumbers = /\d/.test(userText) || /\d/.test(productText);
  const hasLocation = Boolean(body.baseInfo?.location?.trim());

  const hasSpecificDetails =
    userText.length > 80 ||
    hasNumbers ||
    userText.includes('km') ||
    userText.includes('gb') ||
    userText.includes('cm') ||
    userText.includes('model') ||
    userText.includes('year') ||
    userText.includes('viti') ||
    userText.includes('material') ||
    userText.includes('condition') ||
    userText.includes('servis') ||
    userText.includes('garanci') ||
    userText.includes('stok') ||
    userText.includes('defekt') ||
    userText.includes('aksident') ||
    userText.includes('origjinal') ||
    userText.includes('s line') ||
    userText.includes('quattro');

  if (!hasLocation) return true;
  if (userReplyCount === 0) return true;
  if (!hasSpecificDetails && userReplyCount < 2) return true;

  return false;
};

const buildSmartQuestions = ({
  body,
  queries,
}: {
  body: RequestBody;
  queries: string[];
}) => {
  const productName = body.baseInfo?.productName || 'produktin';
  const location = body.baseInfo?.location || 'lokacionin';
  const userText = normalizeText(userTextFromMessages(body.messages || []));
  const vehicle = isVehicleLike(body.baseInfo?.category || '', productName);
  const curtain =
    normalizeText(productName).includes('perde') ||
    normalizeText(productName).includes('curtain') ||
    normalizeText(productName).includes('curtains');
  const electronics =
    normalizeText(productName).includes('iphone') ||
    normalizeText(productName).includes('samsung') ||
    normalizeText(productName).includes('macbook') ||
    normalizeText(productName).includes('ipad') ||
    normalizeText(body.baseInfo?.category || '').includes('electronics');

  const vehicleQuestions = [
    {
      question:
        'Cili është specifikimi i saktë? P.sh. viti, motori, kuajt, paketa, quattro/4x4, manual/automatik.',
      needed:
        !/\b(19|20)\d{2}\b/.test(userText) ||
        (!userText.includes('tdi') &&
          !userText.includes('tfsi') &&
          !userText.includes('diesel') &&
          !userText.includes('benzin')),
    },
    {
      question: 'Sa kilometra i ka?',
      needed: !userText.includes('km') && !userText.includes('kilometra'),
    },
    {
      question:
        'Si është gjendja reale? A ka aksident, dëmtime, servise të rregullta, regjistrim aktiv?',
      needed:
        !userText.includes('aksident') &&
        !userText.includes('demt') &&
        !userText.includes('dëmt') &&
        !userText.includes('servis'),
    },
    {
      question:
        'Çfarë pajisje ose ekstra ka? P.sh. S line, LED, kamera, lëkurë, panoramë, goma/fellne.',
      needed:
        !userText.includes('s line') &&
        !userText.includes('led') &&
        !userText.includes('kamera') &&
        !userText.includes('goma') &&
        !userText.includes('fellne'),
    },
    {
      question: 'A ta krahasoj vetëm në këtë qytet apo në gjithë Kosovën/rajonin?',
      needed:
        !userText.includes('kosov') &&
        !userText.includes('qytet') &&
        !userText.includes('rajon'),
    },
  ];

  const curtainQuestions = [
    {
      question: 'Cilat janë dimensionet? P.sh. 140x250 cm.',
      needed:
        !userText.includes('cm') &&
        !userText.includes('dimension') &&
        !/\d+\s?x\s?\d+/i.test(userText),
    },
    {
      question: 'Çfarë materiali janë? P.sh. linen, blackout, voile, polyester, pambuk.',
      needed:
        !userText.includes('linen') &&
        !userText.includes('blackout') &&
        !userText.includes('polyester') &&
        !userText.includes('pambuk') &&
        !userText.includes('material'),
    },
    {
      question: 'A është çmimi për 1 copë, 1 palë apo komplet/koleksion?',
      needed:
        !userText.includes('cope') &&
        !userText.includes('copë') &&
        !userText.includes('palë') &&
        !userText.includes('pale') &&
        !userText.includes('komplet') &&
        !userText.includes('koleksion') &&
        !userText.includes('set'),
    },
    {
      question: 'A përfshihet qepja, mekanizmi, unazat ose montimi?',
      needed:
        !userText.includes('qep') &&
        !userText.includes('mekaniz') &&
        !userText.includes('unaz') &&
        !userText.includes('montim'),
    },
    {
      question: 'A synon çmim premium apo shitje më të shpejtë?',
      needed:
        !userText.includes('premium') &&
        !userText.includes('shpejt') &&
        !userText.includes('marzh'),
    },
  ];

  const electronicsQuestions = [
    {
      question:
        'Cili është modeli i saktë, kapaciteti dhe versioni? P.sh. iPhone 17 Pro Max 256GB.',
      needed:
        !userText.includes('gb') &&
        !userText.includes('pro') &&
        !userText.includes('max') &&
        !userText.includes('version'),
    },
    {
      question:
        'A është i ri apo i përdorur? Nëse është i përdorur, si është bateria/gjendja?',
      needed:
        !userText.includes('ri') &&
        !userText.includes('perdor') &&
        !userText.includes('përdor') &&
        !userText.includes('bateri') &&
        !userText.includes('battery'),
    },
    {
      question:
        'A ka kuti, faturë, garanci, kabllo/mbushës ose aksesorë?',
      needed:
        !userText.includes('kuti') &&
        !userText.includes('garanci') &&
        !userText.includes('fatur') &&
        !userText.includes('mbush'),
    },
    {
      question:
        'A dëshiron çmim për shitje të shpejtë apo çmim premium?',
      needed:
        !userText.includes('shpejt') &&
        !userText.includes('premium') &&
        !userText.includes('marzh'),
    },
  ];

  const generalQuestions = [
    {
      question:
        'Cili është modeli/specifikimi më i saktë? Për shembull vit, version, kapacitet, madhësi, material ose dimension.',
      needed: !/\b(19|20)\d{2}\b/.test(userText) && !userText.includes('model'),
    },
    {
      question:
        'Si është gjendja reale? A ka dëmtime, përdorim, servis, garanci, paketim ose defekte?',
      needed:
        !userText.includes('gjend') &&
        !userText.includes('condition') &&
        !userText.includes('servis') &&
        !userText.includes('garanci') &&
        !userText.includes('demt') &&
        !userText.includes('dëmt'),
    },
    {
      question:
        'Çka përfshihet në ofertë? Është produkt i vetëm, set, koleksion, me aksesorë apo vetëm artikulli bazë?',
      needed:
        !userText.includes('set') &&
        !userText.includes('koleksion') &&
        !userText.includes('akses') &&
        !userText.includes('perfshi') &&
        !userText.includes('përfshi'),
    },
    {
      question:
        'A ke një çmim aktual, çmim blerjeje, ose minimum që nuk dëshiron ta kalosh?',
      needed:
        !userText.includes('cmim') &&
        !userText.includes('çmim') &&
        !userText.includes('euro') &&
        !userText.includes('eur') &&
        !/€\s?\d+|\d+\s?€/.test(userText),
    },
    {
      question:
        'A është prioritet shitje e shpejtë, marzhë më e lartë, apo pozicionim premium?',
      needed:
        !userText.includes('shpejt') &&
        !userText.includes('marzh') &&
        !userText.includes('premium') &&
        !userText.includes('fitim'),
    },
  ];

  const questionPool = vehicle
    ? vehicleQuestions
    : curtain
      ? curtainQuestions
      : electronics
        ? electronicsQuestions
        : generalQuestions;

  const questions = questionPool
    .filter((item) => item.needed)
    .slice(0, 4)
    .map((item, index) => `${index + 1}. ${item.question}`);

  return (
    `E kuptova produktin: ${productName}.\n\n` +
    `Lokacioni është shumë i rëndësishëm, prandaj analiza do të bazohet në tregun e: ${location}.\n\n` +
    `Do të përdor kërkime të pastra dhe më natyrale për tregun lokal:\n` +
    queries.map((query) => `- ${query}`).join('\n') +
    `\n\nPara se të jap çmim final, më duhen këto detaje që ndikojnë shumë në çmim:\n` +
    `${questions.join('\n')}\n\n` +
    `Përgjigju shkurt në një mesazh. Pastaj e bëj kërkimin online sipas lokacionit dhe jap rekomandimin final.`
  );
};

const buildValuation = ({
  body,
  marketResults,
  storedSignals,
  stats,
  queries,
  searchErrors,
}: {
  body: RequestBody;
  marketResults: MarketResult[];
  storedSignals: MarketResult[];
  stats: MarketStats;
  queries: string[];
  searchErrors: string[];
}) => {
  const productName = body.baseInfo?.productName || 'Produkti';
  const location = body.baseInfo?.location || 'tregu lokal';
  const condition = body.baseInfo?.condition || 'New';
  const businessGoal = body.businessGoal || 'balanced';
  const finance = calculateFinance(body.financeControls);
  const locationProfile = getLocationProfile(location);

  const costFloor = Math.max(finance.marginFloor, finance.roiFloor);
  const marketAnchor = stats.median || stats.average;
  const base = costFloor > 0 ? Math.max(marketAnchor, costFloor) : marketAnchor;

  let quickSale = base * 0.88;
  let balanced = base;
  let maxProfit = base * 1.18;

  if (businessGoal === 'gross_margin') {
    quickSale = base * 0.95;
    balanced = base * 1.08;
    maxProfit = base * 1.28;
  }

  if (businessGoal === 'cash_flow') {
    quickSale = base * 0.84;
    balanced = base * 0.96;
    maxProfit = base * 1.12;
  }

  if (businessGoal === 'stock_clearance') {
    quickSale = base * 0.78;
    balanced = base * 0.9;
    maxProfit = base * 1.05;
  }

  if (businessGoal === 'market_penetration') {
    quickSale = base * 0.82;
    balanced = base * 0.93;
    maxProfit = base * 1.1;
  }

  if (businessGoal === 'premium_positioning') {
    quickSale = base * 1.02;
    balanced = base * 1.15;
    maxProfit = base * 1.38;
  }

  if (costFloor > 0) {
    quickSale = Math.max(quickSale, costFloor * 0.98);
    balanced = Math.max(balanced, costFloor * 1.03);
    maxProfit = Math.max(maxProfit, costFloor * 1.15);
  }

  const evidenceCount = marketResults.length + storedSignals.length;

  const confidence =
    stats.fallbackReason
      ? 60
      : marketResults.length >= 8
        ? 90
        : marketResults.length >= 4
          ? 80
          : storedSignals.length >= 3
            ? 72
            : 62;

  const topSources = [...marketResults, ...storedSignals]
    .slice(0, 8)
    .map(
      (item) =>
        `- ${item.title} | ${item.source} | ${money(item.price)} | ${item.locationSource}`
    )
    .join('\n');

  const fallbackLine = stats.fallbackReason
    ? `Meqë web results nuk dhanë çmime të lexueshme, u përdor benchmark fallback: ${stats.fallbackReason}. `
    : '';

  const rationale =
    `Analiza u bazua në lokacionin "${location}". ` +
    `U përdorën kërkime online të pastra dhe të targetuara sipas lokacionit:\n${queries
      .map((query) => `- ${query}`)
      .join('\n')}\n\n` +
    `U përdorën ${marketResults.length} rezultate nga web/search dhe ${storedSignals.length} sinjale të ruajtura nga databaza. ` +
    fallbackLine +
    `Range i tregut për këtë lokacion/rajon është ${money(stats.min)} – ${money(
      stats.max
    )}, mesatarja është ${money(stats.average)}, ndërsa median është ${money(
      stats.median
    )}. ` +
    `Kostoja bazë e biznesit është ${money(finance.baseCost)}, pragu i marzhës është ${money(
      finance.marginFloor
    )}, dhe pragu i ROI është ${money(finance.roiFloor)}. ` +
    `Për qëllimin "${getGoalLabel(businessGoal)}", çmimi i balancuar është ${money(
      balanced
    )}. ` +
    `Tregjet e afërta të konsideruara: ${locationProfile.nearbyMarkets.join(', ')}. ` +
    `${searchErrors.length > 0 ? `Vërejtje teknike: ${searchErrors.join(' | ')}. ` : ''}` +
    `Burimet kryesore të krahasimit:\n${topSources || 'Nuk ka burime të mjaftueshme të listuara.'}`;

  return {
    assistantMessage:
      `Bëra kërkim online të bazuar në lokacion për ${productName} në ${location}.\n\n` +
      `Rekomandimi i balancuar: ${money(balanced)}\n` +
      `Shitje e shpejtë: ${money(quickSale)}\n` +
      `Fitim maksimal: ${money(maxProfit)}\n\n` +
      `Kam përdorur ${evidenceCount} sinjale çmimi nga web/search dhe databaza. Confidence: ${confidence}%.` +
      `${stats.fallbackReason ? `\n\nShënim: ${stats.fallbackReason}` : ''}`,
    valuation: {
      seoTitle: `${productName} ${condition === 'New' ? 'i ri' : 'në gjendje të mirë'} në ${location}`,
      description:
        `${productName} është analizuar për tregun e ${location}. ` +
        `Çmimi është ndërtuar duke krahasuar sinjale online të lokacionit, sinjale nga databaza dhe kontroll financiar. ` +
        `Për shitje më të mirë, përdor foto të qarta, specifika të sakta, gjendjen reale dhe arsyen pse produkti vlen më shumë se alternativat më të lira në të njëjtin rajon.`,
      quickSale: money(quickSale),
      marketBalanced: money(balanced),
      maxProfit: money(maxProfit),
      estimatedTime: {
        quickSale: '3–10 ditë nëse çmimi është agresiv për lokacionin dhe listing-u është i qartë',
        marketBalanced: '10–25 ditë me çmim të balancuar për tregun lokal',
        maxProfit: '20–45 ditë nëse synon blerës premium ose nuk ke urgjencë',
      },
      rationale,
      listingType:
        businessGoal === 'premium_positioning'
          ? 'Premium listing me argumentim të vlerës dhe foto profesionale'
          : businessGoal === 'stock_clearance'
            ? 'Listing promocional me fokus te shpejtësia e shitjes lokale'
            : 'Listing i balancuar me fokus te krahasimi i tregut lokal dhe marzha',
      confidence: `${confidence}%`,
    },
  };
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as RequestBody;

    const productName = body.baseInfo?.productName?.trim() || '';
    const category = body.baseInfo?.category?.trim() || '';
    const location = body.baseInfo?.location?.trim() || '';
    const condition = body.baseInfo?.condition?.trim() || '';

    const missingInfo: string[] = [];

    if (!category) missingInfo.push('category');
    if (!productName) missingInfo.push('productName');
    if (!location) missingInfo.push('location');
    if (!condition) missingInfo.push('condition');

    if (!productName || !category || !location || !condition) {
      return NextResponse.json({
        assistantMessage:
          'Për të nisur analizën më duhen minimumi kategoria, emri i produktit, lokacioni dhe gjendja.',
        collectedData: {
          category,
          productName,
          location,
          condition,
        },
        missingInfo,
        readyForValuation: false,
        valuation: null,
      });
    }

    const queries = buildSearchQueries(body);

    if (shouldAskForClarification(body)) {
      return NextResponse.json({
        assistantMessage: buildSmartQuestions({
          body,
          queries,
        }),
        collectedData: {
          category,
          productName,
          location,
          condition,
          searchQueries: queries.join(' | '),
          businessGoal: getGoalLabel(body.businessGoal || 'balanced'),
        },
        missingInfo: [
          'specifikim i saktë',
          'gjendja reale',
          'detaje të ofertës',
          'çmimi aktual/minimumi',
          'qëllimi i shitjes',
        ],
        readyForValuation: false,
        valuation: null,
      });
    }

    const [webSearch, storedSignals] = await Promise.all([
      runLocationBasedSearch(body),
      loadStoredSignals({
        supabase,
        userId: user.id,
        productName,
        location,
      }),
    ]);

    if (!webSearch.configured) {
      return NextResponse.json({
        assistantMessage:
          'AI është gati të kërkojë online sipas lokacionit, por mungon SERPAPI_API_KEY. Shto API key në .env.local dhe në Vercel Environment Variables që sistemi të japë çmime reale nga interneti.',
        collectedData: {
          category,
          productName,
          location,
          condition,
          searchQueries: queries.join(' | '),
          missingEnv: 'SERPAPI_API_KEY',
        },
        missingInfo: ['SERPAPI_API_KEY'],
        readyForValuation: false,
        valuation: null,
      });
    }

    const combinedResults = [...webSearch.results, ...storedSignals];

    const stats =
      calculateMarketStats({
        results: combinedResults,
        body,
      }) ||
      calculateFallbackStats({
        body,
      });

    const result = buildValuation({
      body,
      marketResults: stats.filteredResults,
      storedSignals,
      stats,
      queries,
      searchErrors: stats.fallbackReason
        ? [
            ...webSearch.errors,
            'No readable web prices found, so AI fallback benchmark was used.',
          ]
        : webSearch.errors,
    });

    const finance = calculateFinance(body.financeControls);

    return NextResponse.json({
      assistantMessage: result.assistantMessage,
      collectedData: {
        category,
        productName,
        location,
        condition,
        searchQueries: queries.join(' | '),
        businessGoal: getGoalLabel(body.businessGoal || 'balanced'),
        webResults: String(stats.filteredResults.length),
        storedSignals: String(storedSignals.length),
        marketMin: money(stats.min),
        marketAverage: money(stats.average),
        marketMedian: money(stats.median),
        marketMax: money(stats.max),
        usedFallback: stats.fallbackReason ? 'true' : 'false',
        locationBased: location,
        baseCost: money(finance.baseCost),
        marginFloor: money(finance.marginFloor),
        roiFloor: money(finance.roiFloor),
      },
      missingInfo: [],
      readyForValuation: true,
      valuation: result.valuation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate location-based valuation.',
      },
      { status: 500 }
    );
  }
}