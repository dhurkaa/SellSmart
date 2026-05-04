import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

type NukaProduct = {
  external_id: string;
  product_title: string;
  normalized_category: string;
  sub_category: string;
  brand: string;
  model: string;
  size_text: string | null;
  color: string | null;
  material: string | null;
  current_price: number;
  old_price: number | null;
  currency: string;
  availability: string;
  product_url: string;
  image_url: string | null;
  captured_at: string;
};

const NUKA_CATEGORY_URLS = [
  'https://nukahome.com/shop-2/',
  'https://nukahome.com/product-category/tekstil/',
  'https://nukahome.com/product-category/tepih/',
  'https://nukahome.com/product-category/aksesor/',
  'https://nukahome.com/product-category/banje/',
  'https://nukahome.com/product-category/kuzhine/',
  'https://nukahome.com/product-category/mobilie/',
  'https://nukahome.com/product-category/dyshek/',
  'https://nukahome.com/product-category/perde/',
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

function cleanText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
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

function normalizeCategory(title: string, fallbackUrl: string): string {
  const text = `${title} ${fallbackUrl}`.toLowerCase();

  if (text.includes('tepih') || text.includes('tapet') || text.includes('rug')) return 'Tepih';
  if (text.includes('banj')) return 'Banjë';
  if (text.includes('kuzhin')) return 'Kuzhinë';
  if (text.includes('mobil')) return 'Mobilie';
  if (text.includes('dyshek') || text.includes('mattress')) return 'Dyshek';
  if (text.includes('perde') || text.includes('curtain')) return 'Perde';
  if (text.includes('aksesor')) return 'Aksesor';
  if (text.includes('tekstil') || text.includes('jast') || text.includes('jorgan') || text.includes('çarçaf')) return 'Tekstil';

  return 'Të përgjithshme';
}

function inferSubCategory(title: string): string {
  const text = title.toLowerCase();

  if (text.includes('jast')) return 'Pillow';
  if (text.includes('jorgan')) return 'Duvet';
  if (text.includes('çarçaf')) return 'Bedsheet Set';
  if (text.includes('dyshek')) return 'Mattress';
  if (text.includes('tepih')) return 'Rug';
  if (text.includes('perde')) return 'Curtains';

  return 'Të përgjithshme';
}

function inferMaterial(title: string): string | null {
  const text = title.toLowerCase();
  if (text.includes('cotton') || text.includes('pambuk')) return 'Cotton';
  if (text.includes('microfiber')) return 'Microfiber';
  if (text.includes('velvet')) return 'Velvet';
  if (text.includes('fabric') || text.includes('tekstil')) return 'Fabric';
  if (text.includes('wood') || text.includes('druri')) return 'Wood';
  return null;
}

function inferColor(title: string): string | null {
  const text = title.toLowerCase();
  if (text.includes('black') || text.includes('zez')) return 'Black';
  if (text.includes('white') || text.includes('bardh')) return 'White';
  if (text.includes('grey') || text.includes('gray') || text.includes('hiri')) return 'Grey';
  if (text.includes('brown') || text.includes('kafe')) return 'Brown';
  if (text.includes('beige')) return 'Beige';
  if (text.includes('pink') || text.includes('roz')) return 'Pink';
  return null;
}

function inferAvailability(text: string): string {
  const value = text.toLowerCase();
  if (value.includes('out of stock') || value.includes('unavailable') || value.includes('ska stok')) {
    return 'out_of_stock';
  }
  if (value.includes('in stock') || value.includes('available') || value.includes('në stok') || value.includes('ne stok')) {
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

function parseNukaListingPage(html: string, pageUrl: string): NukaProduct[] {
  const $ = cheerio.load(html);
  const results: NukaProduct[] = [];

  $('li.product, .products li, .type-product').each((_, el) => {
    const root = $(el);

    const title =
      cleanText(root.find('.woocommerce-loop-product__title').first().text()) ||
      cleanText(root.find('h2, h3').first().text());

    if (!title) return;

    const priceText = cleanText(root.find('.price').first().text());
    const currentPrice = parsePrice(priceText);
    if (!currentPrice) return;

    const oldPrice = parsePrice(root.find('del .woocommerce-Price-amount').first().text()) || null;

    const href = root.find('a').first().attr('href') || pageUrl;
    const fullUrl =
      href && href.startsWith('http')
        ? href
        : new URL(href, pageUrl).toString();

    const imageUrl =
      root.find('img').first().attr('src') ||
      root.find('img').first().attr('data-src') ||
      null;

    const externalId =
      root.attr('data-product-id') ||
      root.attr('class')?.match(/post-(\d+)/)?.[1] ||
      title.toLowerCase().replace(/\s+/g, '-');

    const normalizedCategory = normalizeCategory(title, pageUrl);

    results.push({
      external_id: String(externalId),
      product_title: title,
      normalized_category: normalizedCategory,
      sub_category: inferSubCategory(title),
      brand: 'Nuka Home',
      model: title,
      size_text: null,
      color: inferColor(title),
      material: inferMaterial(title),
      current_price: currentPrice,
      old_price: oldPrice,
      currency: 'EUR',
      availability: inferAvailability(root.text()),
      product_url: fullUrl,
      image_url: imageUrl,
      captured_at: new Date().toISOString(),
    });
  });

  return results;
}

function discoverNextPageUrls(html: string, currentUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $('.page-numbers a, nav.pagination a, a.next').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const full = href.startsWith('http') ? href : new URL(href, currentUrl).toString();
      links.add(full);
    } catch {}
  });

  return [...links];
}

async function crawlCategory(baseUrl: string, maxPages = 8): Promise<NukaProduct[]> {
  const visited = new Set<string>();
  const queue = [baseUrl];
  const allProducts: NukaProduct[] = [];

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const html = await fetchHtml(url);
    const products = parseNukaListingPage(html, url);
    allProducts.push(...products);

    const nextPages = discoverNextPageUrls(html, url);
    for (const nextPage of nextPages) {
      if (!visited.has(nextPage) && queue.length < maxPages * 2) {
        queue.push(nextPage);
      }
    }
  }

  return allProducts;
}

async function logRefresh(supabase: any, payload: {
  job_type: 'nuka_catalog' | 'competitor_catalog' | 'matching_engine';
  total_inserted: number;
  sources_processed: number;
  status: string;
  message: string;
}) {
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

    const allProducts: NukaProduct[] = [];

    for (const url of NUKA_CATEGORY_URLS) {
      try {
        const products = await crawlCategory(url, 10);
        allProducts.push(...products);
      } catch (error) {
        console.error(`Failed Nuka category ${url}:`, error);
      }
    }

    const dedupedMap = new Map<string, NukaProduct>();
    for (const product of allProducts) {
      const key = [product.external_id, product.product_title, product.product_url].join('||');
      dedupedMap.set(key, product);
    }

    const dedupedProducts = [...dedupedMap.values()];

    if (!dedupedProducts.length) {
      await logRefresh(supabase, {
        job_type: 'nuka_catalog',
        total_inserted: 0,
        sources_processed: NUKA_CATEGORY_URLS.length,
        status: 'success',
        message: 'No Nuka products extracted.',
      });

      return NextResponse.json({
        success: true,
        inserted: 0,
        sourcesProcessed: NUKA_CATEGORY_URLS.length,
        message: 'No Nuka products extracted.',
      });
    }

    const { error: insertError } = await (supabase as any)
      .from('nuka_products')
      .insert(dedupedProducts as any[]);

    if (insertError) {
      throw insertError;
    }

    await logRefresh(supabase, {
      job_type: 'nuka_catalog',
      total_inserted: dedupedProducts.length,
      sources_processed: NUKA_CATEGORY_URLS.length,
      status: 'success',
      message: 'Nuka catalog synced successfully.',
    });

    return NextResponse.json({
      success: true,
      inserted: dedupedProducts.length,
      sourcesProcessed: NUKA_CATEGORY_URLS.length,
      message: 'Nuka catalog synced successfully.',
    });
  } catch (error) {
    console.error('sync-nuka error:', error);

    await logRefresh(supabase, {
      job_type: 'nuka_catalog',
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