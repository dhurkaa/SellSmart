import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const normalizeCompetitorInput = (input: string) => {
  let value = String(input || '').trim();

  if (!value) {
    return null;
  }

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    url.hash = '';

    const domain = url.hostname.replace(/^www\./, '').toLowerCase();

    return {
      domain,
      start_url: url.toString().replace(/\/$/, ''),
      label: domain,
    };
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('competitor_domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure competitor_domains has the start_url column.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ domains: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load competitor domains.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const domainsInput = Array.isArray(body.domains) ? body.domains : [];

    const normalized = domainsInput
      .map((item: any) => normalizeCompetitorInput(String(item.domain || item)))
      .filter(Boolean) as Array<{ domain: string; start_url: string; label: string }>;

    const uniqueByStartUrl = Array.from(
      new Map(normalized.map((item) => [item.start_url, item])).values()
    ).slice(0, 25);

    if (uniqueByStartUrl.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one valid competitor website URL.' },
        { status: 400 }
      );
    }

    const rows = uniqueByStartUrl.map((item) => ({
      user_id: user.id,
      domain: item.domain,
      start_url: item.start_url,
      label: item.label,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('competitor_domains')
      .upsert(rows, {
        onConflict: 'user_id,domain',
      })
      .select('*');

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure competitor_domains has columns: user_id, domain, start_url, label, is_active.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domains: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save competitor domains.' },
      { status: 500 }
    );
  }
}