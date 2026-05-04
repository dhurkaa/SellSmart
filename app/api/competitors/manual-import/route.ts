import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ManualProductInput = {
  product_name?: string;
  detected_price?: string | number;
  source_domain?: string;
  source_url?: string;
  currency?: string;
};

const normalizeDomain = (input: string) => {
  let value = String(input || '').trim().toLowerCase();

  if (!value) return 'manual-entry';

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return String(input || 'manual-entry')
      .trim()
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/[^a-z0-9.-]/g, '') || 'manual-entry';
  }
};

const normalizeUrl = (input: string, domain: string) => {
  const value = String(input || '').trim();

  if (!value) return `https://${domain}`;

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return `https://${value}`;
  }

  return value;
};

const cleanName = (value: unknown) => {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
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

    const body = await request.json();

    const productsInput = Array.isArray(body.products)
      ? body.products
      : body.product
        ? [body.product]
        : [];

    if (productsInput.length === 0) {
      return NextResponse.json(
        { error: 'No products provided for manual import.' },
        { status: 400 }
      );
    }

    const cleanProducts = productsInput
      .map((item: ManualProductInput) => {
        const productName = cleanName(item.product_name);
        const price = parsePrice(item.detected_price);
        const domain = normalizeDomain(item.source_domain || item.source_url || 'manual-entry');
        const sourceUrl = normalizeUrl(item.source_url || '', domain);

        if (!productName || price === null) {
          return null;
        }

        return {
          user_id: user.id,
          competitor_domain_id: null,
          source_domain: domain,
          source_url: sourceUrl,
          product_name: productName,
          detected_price: price,
          currency: String(item.currency || 'EUR').toUpperCase().slice(0, 10),
          confidence: 98,
          raw_text: `Manual import: ${productName} - ${price}`,
        };
      })
      .filter(Boolean);

    if (cleanProducts.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid products found. Each row needs product_name and detected_price.',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('competitor_price_signals')
      .insert(cleanProducts)
      .select('*');

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure competitor_price_signals table exists and RLS allows inserts.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      products: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Manual import failed.',
      },
      { status: 500 }
    );
  }
}