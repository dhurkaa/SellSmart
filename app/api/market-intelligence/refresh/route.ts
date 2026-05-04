import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

type SourceRow = {
  id: string;
  name: string;
  source_type: 'website' | 'feed' | 'api';
  base_url: string;
  category_hint: string | null;
  region: string | null;
  city: string | null;
  is_active: boolean;
};

type ParsedOffer = {
  source_name: string;
  source_type: string;
  source_url: string;
  external_id: string;
  product_title: string;
  normalized_category: string;
  sub_category: string;
  brand: string;
  model: string;
  region: string;
  city: string;
  currency: string;
  listed_price: number;
  shipping_price: number;
  total_price: number;
  availability: string;
  seller_name: string;
  image_url: string | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  rating: number | null;
  review_count: number | null;
  captured_at: string;
};

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

function parsePrice(value: string | null | undefined): number {
  if (!value) return 0;

  const cleaned = value
    .replace(/&nbsp;/g, ' ')
    .replace(/€/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
    .trim();

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function cleanText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCategory(title: string, hint?: string | null): string {
  const text = `${title} ${hint || ''}`.toLowerCase();

  if (text.includes('perde')) return 'Perde';
  if (text.includes('kauq') || text.includes('sofa') || text.includes('couch')) return 'Kauqa';
  if (text.includes('tavolin')) return 'Tavolina';
  if (text.includes('karrig')) return 'Karrige';
  if (text.includes('bed') || text.includes('krevat') || text.includes('dyshek') || text.includes('mattress')) return 'Dyshek';
  if (text.includes('lamp') || text.includes('ndriç')) return 'Ndriçim';
  if (text.includes('carpet') || text.includes('rug') || text.includes('tapet') || text.includes('tepih')) return 'Tepih';
  if (text.includes('banj') || text.includes('bath')) return 'Banjë';
  if (text.includes('kuzhin') || text.includes('kitchen')) return 'Kuzhinë';
  if (text.includes('mobil')) return 'Mobilie';
  if (text.includes('aksesor') || text.includes('accessor')) return 'Aksesor';
  if (text.includes('tekstil') || text.includes('çarçaf') || text.includes('jast') || text.includes('jorgan')) return 'Tekstil';

  return hint || 'Të përgjithshme';
}

function inferSubCategory(title: string): string {
  const text = title.toLowerCase();

  if (text.includes('corner') || text.includes('kendore') || text.includes('këndore')) return 'Këndore';
  if (text.includes('coffee table')) return 'Coffee Table';
  if (text.includes('dining')) return 'Dining';
  if (text.includes('office chair')) return 'Office Chair';
  if (text.includes('curtain') || text.includes('perde')) return 'Curtains';
  if (text.includes('lamp')) return 'Lamps';
  if (text.includes('dyshek')) return 'Mattress';
  if (text.includes('tapet') || text.includes('tepih')) return 'Rug';
  if (text.includes('jast')) return 'Pillow';
  if (text.includes('jorgan')) return 'Duvet';

  return 'Të përgjithshme';
}

function inferBrand(title: string, sourceName?: string): string {
  const knownBrands = ['Nuka Home', 'IKEA', 'JYSK', 'Mondi', 'Bauhaus', 'Maison'];

  const found = knownBrands.find((brand) =>
    title.toLowerCase().includes(brand.toLowerCase())
  );

  if (found) return found;
  if (sourceName?.toLowerCase().includes('nuka')) return 'Nuka Home';

  return 'Generic';
}

function inferModel(title: string, brand: string): string {
  return cleanText(title.replace(new RegExp(brand, 'i'), '')).slice(0, 80) || 'Standard';
}

function inferMaterial(title: string): string | null {
  const text = title.toLowerCase();

  if (text.includes('wood') || text.includes('druri')) return 'Wood';
  if (text.includes('metal')) return 'Metal';
  if (text.includes('velvet')) return 'Velvet';
  if (text.includes('fabric') || text.includes('stof') || text.includes('tekstil')) return 'Fabric';
  if (text.includes('leather') || text.includes('lëkur')) return 'Leather';
  if (text.includes('cotton') || text.includes('pambuk')) return 'Cotton';
  if (text.includes('microfiber')) return 'Microfiber';
  if (text.includes('mdf')) return 'MDF';

  return null;
}

function inferColor(title: string): string | null {
  const text = title.toLowerCase();

  if (text.includes('black') || text.includes('zez')) return 'Black';
  if (text.includes('white') || text.includes('bardh')) return 'White';
  if (text.includes('grey') || text.includes('gray') || text.includes('hiri')) return 'Grey';
  if (text.includes('brown') || text.includes('kafe')) return 'Brown';
  if (text.includes('beige')) return 'Beige';
  if (text.includes('green') || text.includes('gjelb')) return 'Green';
  if (text.includes('blue') || text.includes('kalt')) return 'Blue';
  if (text.includes('pink') || text.includes('roz')) return 'Pink';

  return null;
}

function inferAvailability(text: string): string {
  const value = text.toLowerCase();

  if (
    value.includes('out of stock') ||
    value.includes('s’ka stok') ||
    value.includes('ska stok') ||
    value.includes('unavailable')
  ) {
    return 'out_of_stock';
  }

  if (
    value.includes('in stock') ||
    value.includes('available') ||
    value.includes('në stok') ||
    value.includes('ne stok')
  ) {
    return 'in_stock';
  }

  return 'unknown';
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 SellSmartBot/1.0',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'sq-AL,sq,en;q=0.9',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return await res.text();
}

function buildOffer(partial: Partial<ParsedOffer> & { product_title: string; listed_price: number }, source: SourceRow): ParsedOffer {
  const title = cleanText(partial.product_title);
  const brand = partial.brand || inferBrand(title, source.name);
  const listedPrice = partial.listed_price || 0;
  const shippingPrice = partial.shipping_price || 0;

  return {
    source_name: source.name,
    source_type: source.source_type,
    source_url: partial.source_url || source.base_url,
    external_id: partial.external_id || title.toLowerCase().replace(/\s+/g, '-'),
    product_title: title,
    normalized_category: partial.normalized_category || normalizeCategory(title, source.category_hint),
    sub_category: partial.sub_category || inferSubCategory(title),
    brand,
    model: partial.model || inferModel(title, brand),
    region: partial.region || source.region || 'Kosovë',
    city: partial.city || source.city || source.region || 'Online',
    currency: partial.currency || 'EUR',
    listed_price: listedPrice,
    shipping_price: shippingPrice,
    total_price: partial.total_price || listedPrice + shippingPrice,
    availability: partial.availability || 'unknown',
    seller_name: partial.seller_name || cleanText(source.name),
    image_url: partial.image_url || null,
    material: partial.material || inferMaterial(title),
    color: partial.color || inferColor(title),
    dimensions: partial.dimensions || null,
    rating: partial.rating ?? null,
    review_count: partial.review_count ?? null,
    captured_at: partial.captured_at || new Date().toISOString(),
  };
}

function parseJsonLdProducts(html: string, source: SourceRow): ParsedOffer[] {
  const $ = cheerio.load(html);
  const results: ParsedOffer[] = [];
  const scripts = $('script[type="application/ld+json"]');

  scripts.each((_, el) => {
    try {
      const raw = $(el).contents().text();
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const candidates = Array.isArray(item?.['@graph']) ? item['@graph'] : [item];

        for (const entry of candidates) {
          const product =
            entry?.['@type'] === 'Product'
              ? entry
              : entry?.mainEntity?.['@type'] === 'Product'
              ? entry.mainEntity
              : null;

          if (!product) continue;

          const offersRaw = Array.isArray(product.offers)
            ? product.offers[0]
            : product.offers || null;

          const title = cleanText(product.name);
          if (!title) continue;

          const listedPrice = parsePrice(
            String(offersRaw?.price ?? offersRaw?.lowPrice ?? '')
          );

          if (!listedPrice) continue;

          results.push(
            buildOffer(
              {
                source_url: source.base_url,
                external_id: cleanText(product.sku || product.productID || product.mpn || title),
                product_title: title,
                listed_price: listedPrice,
                shipping_price: 0,
                total_price: listedPrice,
                currency: cleanText(offersRaw?.priceCurrency || 'EUR') || 'EUR',
                availability: inferAvailability(String(offersRaw?.availability || product.availability || '')),
                seller_name: cleanText(source.name),
                image_url: Array.isArray(product.image) ? product.image[0] : product.image || null,
                dimensions: cleanText(product.size || product.description || '').slice(0, 120) || null,
                rating: product.aggregateRating?.ratingValue
                  ? Number(product.aggregateRating.ratingValue)
                  : null,
                review_count: product.aggregateRating?.reviewCount
                  ? Number(product.aggregateRating.reviewCount)
                  : null,
              },
              source
            )
          );
        }
      }
    } catch {
      // ignore invalid json-ld
    }
  });

  return results;
}

function parseWooCommerceProducts(html: string, source: SourceRow): ParsedOffer[] {
  const $ = cheerio.load(html);
  const results: ParsedOffer[] = [];

  const productSelectors = [
    'li.product',
    '.products li',
    '.woocommerce ul.products li.product',
    '.product-small',
    '.type-product',
    '.wc-block-grid__product',
  ];

  for (const selector of productSelectors) {
    const nodes = $(selector);
    if (!nodes.length) continue;

    nodes.each((_, el) => {
      const root = $(el);

      const title =
        cleanText(root.find('.woocommerce-loop-product__title').first().text()) ||
        cleanText(root.find('h2, h3, .product-title, .title, .name').first().text());

      if (!title) return;

      const priceText =
        cleanText(root.find('.price').first().text()) ||
        cleanText(root.find('.woocommerce-Price-amount').first().text());

      const listedPrice = parsePrice(priceText);
      if (!listedPrice) return;

      const href = root.find('a').first().attr('href') || source.base_url;
      const fullUrl =
        href && href.startsWith('http')
          ? href
          : href
          ? new URL(href, source.base_url).toString()
          : source.base_url;

      const image =
        root.find('img').first().attr('src') ||
        root.find('img').first().attr('data-src') ||
        root.find('img').first().attr('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
        null;

      const reviewCountText = cleanText(root.find('.count').first().text());
      const reviewCount = reviewCountText ? Number(reviewCountText.replace(/[^\d]/g, '')) : null;

      const ratingText =
        root.find('.star-rating').first().attr('aria-label') ||
        root.find('.star-rating span').first().text();
      const ratingMatch = ratingText?.match(/(\d+(\.\d+)?)/);
      const rating = ratingMatch ? Number(ratingMatch[1]) : null;

      const externalId =
        root.attr('data-product-id') ||
        root.attr('class')?.match(/post-(\d+)/)?.[1] ||
        title.toLowerCase().replace(/\s+/g, '-');

      results.push(
        buildOffer(
          {
            source_url: fullUrl,
            external_id: externalId,
            product_title: title,
            listed_price: listedPrice,
            shipping_price: 0,
            total_price: listedPrice,
            availability: inferAvailability(root.text()),
            seller_name: source.name,
            image_url: image,
            rating,
            review_count: review_count_or_null(reviewCount),
          },
          source
        )
      );
    });

    if (results.length > 0) break;
  }

  return results;
}

function review_count_or_null(value: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return value;
}

function parseSimpleHtmlCards(html: string, source: SourceRow): ParsedOffer[] {
  const $ = cheerio.load(html);
  const results: ParsedOffer[] = [];

  const selectors = [
    '.product',
    '.product-card',
    '.product-item',
    '.grid-product',
    '.item',
    '[data-product-id]',
  ];

  for (const selector of selectors) {
    const nodes = $(selector);
    if (!nodes.length) continue;

    nodes.each((_, el) => {
      const root = $(el);

      const title =
        cleanText(
          root.find('h2, h3, .product-title, .title, .name, [data-title]').first().text()
        ) || cleanText(root.attr('data-title'));

      if (!title) return;

      const priceText =
        cleanText(
          root.find('.price, .product-price, .amount, [data-price]').first().text()
        ) || cleanText(root.attr('data-price'));

      const listedPrice = parsePrice(priceText);
      if (!listedPrice) return;

      const href = root.find('a').first().attr('href') || source.base_url;
      const fullUrl =
        href && href.startsWith('http')
          ? href
          : href
          ? new URL(href, source.base_url).toString()
          : source.base_url;

      const image =
        root.find('img').first().attr('src') ||
        root.find('img').first().attr('data-src') ||
        null;

      const availabilityText = cleanText(root.text());

      results.push(
        buildOffer(
          {
            source_url: fullUrl,
            external_id:
              root.attr('data-product-id') ||
              cleanText(title).toLowerCase().replace(/\s+/g, '-') ||
              crypto.randomUUID(),
            product_title: title,
            listed_price: listedPrice,
            shipping_price: 0,
            total_price: listedPrice,
            availability: inferAvailability(availabilityText),
            seller_name: source.name,
            image_url: image,
          },
          source
        )
      );
    });

    if (results.length > 0) break;
  }

  return results;
}

async function extractOffersFromSource(source: SourceRow): Promise<ParsedOffer[]> {
  const html = await fetchHtml(source.base_url);

  let offers = parseJsonLdProducts(html, source);

  if (!offers.length) {
    offers = parseWooCommerceProducts(html, source);
  }

  if (!offers.length) {
    offers = parseSimpleHtmlCards(html, source);
  }

  return offers
    .filter((x) => x.product_title && x.total_price > 0)
    .slice(0, 100);
}

async function logRefresh(
  supabase: any,
  payload: {
    total_inserted: number;
    sources_processed: number;
    status: string;
    message: string;
  }
) {
  try {
    await supabase.from('market_refresh_logs').insert([payload]);
  } catch (err) {
    console.error('market_refresh_logs insert error:', err);
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.MARKET_REFRESH_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sources, error: sourceError } = await supabase
      .from('market_sources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (sourceError) {
      throw sourceError;
    }

    const activeSources = (sources || []) as SourceRow[];

    if (!activeSources.length) {
      await logRefresh(supabase, {
        total_inserted: 0,
        sources_processed: 0,
        status: 'success',
        message: 'No active sources found.',
      });

      return NextResponse.json({
        success: true,
        inserted: 0,
        sourcesProcessed: 0,
        message: 'No active sources found.',
      });
    }

    const allOffers: ParsedOffer[] = [];

    for (const source of activeSources) {
      try {
        const offers = await extractOffersFromSource(source);
        allOffers.push(...offers);
      } catch (error) {
        console.error(`Failed source ${source.name}:`, error);
      }
    }

    if (!allOffers.length) {
      await logRefresh(supabase, {
        total_inserted: 0,
        sources_processed: activeSources.length,
        status: 'success',
        message: 'No offers extracted.',
      });

      return NextResponse.json({
        success: true,
        inserted: 0,
        sourcesProcessed: activeSources.length,
        message: 'No offers extracted.',
      });
    }

    const dedupedMap = new Map<string, ParsedOffer>();

    for (const offer of allOffers) {
      const key = [
        offer.source_name,
        offer.external_id,
        offer.product_title,
        offer.total_price,
      ].join('||');

      dedupedMap.set(key, offer);
    }

    const dedupedOffers = [...dedupedMap.values()];

    const { error: insertError } = await supabase
      .from('market_product_offers')
      .insert(dedupedOffers);

    if (insertError) {
      throw insertError;
    }

    await logRefresh(supabase, {
      total_inserted: dedupedOffers.length,
      sources_processed: activeSources.length,
      status: 'success',
      message: 'Market data refreshed successfully.',
    });

    return NextResponse.json({
      success: true,
      inserted: dedupedOffers.length,
      sourcesProcessed: activeSources.length,
      message: 'Market data refreshed successfully.',
      sourceNames: activeSources.map((s) => s.name),
    });
  } catch (error) {
    console.error('refresh route error:', error);

    await logRefresh(supabase, {
      total_inserted: 0,
      sources_processed: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 }
    );
  }
}