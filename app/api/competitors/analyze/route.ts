import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ExtractedProduct = {
  product_name: string;
  detected_price: number;
  currency: string;
  source_url: string;
  source_domain: string;
  confidence: number;
  raw_text: string;
};

const BLOCKED_PATH_PARTS = [
  'cart',
  'basket',
  'checkout',
  'account',
  'login',
  'register',
  'wishlist',
  'privacy',
  'terms',
  'conditions',
  'contact',
  'about',
  'blog',
  'news',
  'faq',
  'shipping',
  'returns',
  'cookie',
];

const PRODUCT_PATH_HINTS = [
  'product',
  'products',
  'produkt',
  'produkte',
  'shop',
  'store',
  'collections',
  'collection',
  'category',
  'categories',
  'item',
  'artikull',
  'catalog',
  'furniture',
  'decor',
  'home',
  'living',
  'bedroom',
  'bathroom',
  'kitchen',
  'rug',
  'carpet',
  'curtain',
  'textile',
];

const GENERIC_PRODUCT_NAMES = [
  'produkte',
  'products',
  'product',
  'shop',
  'store',
  'category',
  'categories',
  'catalog',
  'home',
  'homepage',
  'katalog',
  'artikuj',
  'items',
  'sale',
  'new',
  'offers',
  'collection',
  'collections',
];

const priceRegex =
  /(?:€|\bEUR\b)\s?([0-9]{1,6}(?:[.,][0-9]{1,2})?)|([0-9]{1,6}(?:[.,][0-9]{1,2})?)\s?(?:€|\bEUR\b)/gi;

const normalizeDomain = (domain: string) => {
  let value = String(domain || '').trim().toLowerCase();

  if (!value) return '';

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const normalizeUrl = (href: string, base: string) => {
  try {
    const url = new URL(href, base);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};

const cleanText = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanName = (value: unknown) => {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^\W+|\W+$/g, '')
    .trim()
    .slice(0, 180);
};

const isBadProductName = (name: string) => {
  const clean = name.toLowerCase().trim();

  if (!clean) return true;
  if (clean.length < 4) return true;
  if (GENERIC_PRODUCT_NAMES.includes(clean)) return true;
  if (/^\d+$/.test(clean)) return true;

  return false;
};

const parsePrice = (value: unknown) => {
  const raw = String(value || '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');

  const number = Number(raw);

  if (!Number.isFinite(number)) return null;
  if (number <= 0 || number > 100000) return null;

  return number;
};

const extractPrices = (text: string) => {
  const prices: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = priceRegex.exec(text)) !== null) {
    const raw = match[1] || match[2];
    const value = parsePrice(raw);

    if (value !== null) {
      prices.push(value);
    }
  }

  return Array.from(new Set(prices)).slice(0, 20);
};

const getPageTitle = (html: string) => {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];

  if (h1) {
    return cleanName(cleanText(h1));
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  if (title) {
    return cleanName(
      cleanText(title)
        .split('|')[0]
        .split(' - ')[0]
        .trim()
    );
  }

  return '';
};

const fetchHtml = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36 SellSmartBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,sq;q=0.8',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';

    if (
      !contentType.includes('text/html') &&
      !contentType.includes('xml') &&
      !contentType.includes('application/octet-stream')
    ) {
      return null;
    }

    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const isLikelyProductOrCategoryUrl = (path: string) => {
  const cleanPath = path.toLowerCase();

  if (
    cleanPath === '/' ||
    cleanPath === '/xk' ||
    cleanPath === '/xk/' ||
    cleanPath === '/xk/en'
  ) {
    return true;
  }

  if (cleanPath.startsWith('/xk')) return true;
  if (/\/-l\d+/i.test(cleanPath)) return true;
  if (/-l\d+/i.test(cleanPath) || /-n\d+/i.test(cleanPath)) return true;

  return PRODUCT_PATH_HINTS.some((hint) => cleanPath.includes(hint));
};

const shouldKeepUrl = (url: string, domain: string) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.toLowerCase();

    if (hostname !== domain) return false;

    if (BLOCKED_PATH_PARTS.some((part) => path.includes(part))) {
      return false;
    }

    return isLikelyProductOrCategoryUrl(path);
  } catch {
    return false;
  }
};

const extractLinks = (html: string, baseUrl: string, domain: string) => {
  const links = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;

  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    const normalized = normalizeUrl(href, baseUrl);

    if (normalized && shouldKeepUrl(normalized, domain)) {
      links.add(normalized);
    }
  }

  return Array.from(links);
};

const extractSitemapUrls = async (domain: string) => {
  const sitemapUrls = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/product-sitemap.xml`,
    `https://${domain}/products-sitemap.xml`,
    `https://${domain}/sitemap_products_1.xml`,
  ];

  const collected = new Set<string>();

  for (const sitemapUrl of sitemapUrls) {
    const xml = await fetchHtml(sitemapUrl);

    if (!xml) continue;

    const locMatches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/gi));

    for (const match of locMatches) {
      const url = match[1]?.trim();

      if (url && shouldKeepUrl(url, domain)) {
        collected.add(url);
      }
    }
  }

  return Array.from(collected);
};

const flattenJsonLd = (value: any): any[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (typeof value === 'object') {
    const graph = Array.isArray(value['@graph']) ? value['@graph'] : [];
    return [value, ...graph.flatMap(flattenJsonLd)];
  }

  return [];
};

const extractJsonLdProducts = ({
  html,
  sourceUrl,
  sourceDomain,
}: {
  html: string;
  sourceUrl: string;
  sourceDomain: string;
}) => {
  const products: ExtractedProduct[] = [];
  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const rawJson = match[1];

    try {
      const parsed = JSON.parse(rawJson);
      const nodes = flattenJsonLd(parsed);

      for (const node of nodes) {
        const type = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        const isProduct = type.some((item: string) =>
          String(item || '').toLowerCase().includes('product')
        );

        if (!isProduct) continue;

        const name = cleanName(node.name);
        const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        const price =
          parsePrice(offers?.price) ||
          parsePrice(offers?.lowPrice) ||
          parsePrice(offers?.highPrice);

        if (!name || price === null || isBadProductName(name)) continue;

        products.push({
          product_name: name,
          detected_price: price,
          currency: String(offers?.priceCurrency || 'EUR').toUpperCase(),
          source_url: sourceUrl,
          source_domain: sourceDomain,
          confidence: 92,
          raw_text: cleanText(html).slice(0, 1200),
        });
      }
    } catch {
      continue;
    }
  }

  return products;
};

const extractMetaProducts = ({
  html,
  sourceUrl,
  sourceDomain,
}: {
  html: string;
  sourceUrl: string;
  sourceDomain: string;
}) => {
  const products: ExtractedProduct[] = [];
  const text = cleanText(html);
  const title =
    html.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    getPageTitle(html);

  const cleanTitle = cleanName(title);

  const price =
    parsePrice(
      html.match(/property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ) ||
    parsePrice(html.match(/name=["']price["'][^>]+content=["']([^"']+)["']/i)?.[1]);

  if (cleanTitle && price !== null && !isBadProductName(cleanTitle)) {
    products.push({
      product_name: cleanTitle,
      detected_price: price,
      currency: 'EUR',
      source_url: sourceUrl,
      source_domain: sourceDomain,
      confidence: 78,
      raw_text: text.slice(0, 1200),
    });
  }

  return products;
};

const extractFallbackProduct = ({
  html,
  sourceUrl,
  sourceDomain,
}: {
  html: string;
  sourceUrl: string;
  sourceDomain: string;
}) => {
  const text = cleanText(html);
  const title = getPageTitle(html);
  const prices = extractPrices(text);

  if (!title || prices.length === 0 || isBadProductName(title)) {
    return [];
  }

  return [
    {
      product_name: title,
      detected_price: prices[0],
      currency: 'EUR',
      source_url: sourceUrl,
      source_domain: sourceDomain,
      confidence: 55,
      raw_text: text.slice(0, 1200),
    },
  ] satisfies ExtractedProduct[];
};

const uniqueProducts = (products: ExtractedProduct[]) => {
  const map = new Map<string, ExtractedProduct>();

  for (const product of products) {
    const key = `${product.source_domain}:${product.source_url}:${product.product_name}:${product.detected_price}`;

    if (!map.has(key)) {
      map.set(key, product);
    }
  }

  return Array.from(map.values());
};

export async function POST() {
  let logId: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: createdLog } = await supabase
      .from('market_sync_logs')
      .insert({
        user_id: user.id,
        sync_type: 'competitor_analyze',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    logId = createdLog?.id || null;

    const { data: domains, error: domainsError } = await supabase
      .from('competitor_domains')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (domainsError) {
      throw new Error(domainsError.message);
    }

    if (!domains || domains.length === 0) {
      throw new Error('No competitor domains found. Add websites first.');
    }

    await supabase.from('competitor_price_signals').delete().eq('user_id', user.id);

    const allProducts: ExtractedProduct[] = [];
    const crawlDebug: any[] = [];

    let totalDiscovered = 0;
    let totalScanned = 0;
    let totalFailed = 0;

    for (const competitor of domains.slice(0, 8)) {
      const domain = normalizeDomain(competitor.domain);
      if (!domain) continue;

      const startUrl = competitor.start_url || `https://${domain}`;
      const homeUrl = normalizeUrl(startUrl, `https://${domain}`) || `https://${domain}`;
      const homepageHtml = await fetchHtml(homeUrl);

      const discoveredUrls = new Set<string>();
      discoveredUrls.add(homeUrl);

      if (domain === 'zarahome.com') {
        discoveredUrls.add('https://www.zarahome.com/xk');
        discoveredUrls.add('https://www.zarahome.com/xk/en');
      }

      const sitemapUrls = await extractSitemapUrls(domain);
      sitemapUrls.forEach((url) => discoveredUrls.add(url));

      if (homepageHtml) {
        extractLinks(homepageHtml, homeUrl, domain).forEach((url) => discoveredUrls.add(url));
      } else {
        totalFailed += 1;
      }

      const firstLayer = Array.from(discoveredUrls).slice(0, 40);

      for (const url of firstLayer) {
        const html = url === homeUrl && homepageHtml ? homepageHtml : await fetchHtml(url);

        if (!html) {
          totalFailed += 1;
          continue;
        }

        extractLinks(html, url, domain)
          .slice(0, 80)
          .forEach((link) => discoveredUrls.add(link));
      }

      const urlsToScan = Array.from(discoveredUrls).slice(0, 140);

      let domainProducts = 0;
      let scannedPages = 0;
      let failedPages = 0;

      for (const url of urlsToScan) {
        const html = url === homeUrl && homepageHtml ? homepageHtml : await fetchHtml(url);

        if (!html) {
          failedPages += 1;
          totalFailed += 1;
          continue;
        }

        scannedPages += 1;
        totalScanned += 1;

        const jsonLdProducts = extractJsonLdProducts({
          html,
          sourceUrl: url,
          sourceDomain: domain,
        });

        const metaProducts =
          jsonLdProducts.length === 0
            ? extractMetaProducts({
                html,
                sourceUrl: url,
                sourceDomain: domain,
              })
            : [];

        const fallbackProducts =
          jsonLdProducts.length === 0 && metaProducts.length === 0
            ? extractFallbackProduct({
                html,
                sourceUrl: url,
                sourceDomain: domain,
              })
            : [];

        const extracted = [...jsonLdProducts, ...metaProducts, ...fallbackProducts];

        domainProducts += extracted.length;
        allProducts.push(...extracted);

        if (allProducts.length >= 800) break;
      }

      totalDiscovered += discoveredUrls.size;

      crawlDebug.push({
        domain,
        startUrl: homeUrl,
        discoveredUrls: discoveredUrls.size,
        scannedPages,
        failedPages,
        productsFound: domainProducts,
      });

      if (allProducts.length >= 800) break;
    }

    const finalProducts = uniqueProducts(allProducts).slice(0, 800);

    if (finalProducts.length > 0) {
      const rows = finalProducts.map((product) => ({
        user_id: user.id,
        competitor_domain_id:
          domains.find(
            (domainRow) => normalizeDomain(domainRow.domain) === product.source_domain
          )?.id || null,
        source_domain: product.source_domain,
        source_url: product.source_url,
        product_name: product.product_name,
        detected_price: product.detected_price,
        currency: product.currency || 'EUR',
        confidence: product.confidence,
        raw_text: product.raw_text,
      }));

      const { error: insertError } = await supabase
        .from('competitor_price_signals')
        .insert(rows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    if (logId) {
      await supabase
        .from('market_sync_logs')
        .update({
          status: 'success',
          domains_scanned: Math.min(domains.length, 8),
          pages_discovered: totalDiscovered,
          pages_scanned: totalScanned,
          products_found: finalProducts.length,
          signals_inserted: finalProducts.length,
          failed_pages: totalFailed,
          debug: crawlDebug,
          finished_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      productsInserted: finalProducts.length,
      debug: crawlDebug,
      message:
        finalProducts.length > 0
          ? `Inserted ${finalProducts.length} products from competitor websites.`
          : 'No products found. Some websites may block crawling or load products dynamically with JavaScript.',
    });
  } catch (error: any) {
    try {
      if (logId) {
        const supabase = await createClient();
        await supabase
          .from('market_sync_logs')
          .update({
            status: 'failed',
            error_message: error?.message || 'Failed to analyze competitor websites.',
            finished_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }
    } catch {}

    return NextResponse.json(
      { error: error?.message || 'Failed to analyze competitor websites.' },
      { status: 500 }
    );
  }
}