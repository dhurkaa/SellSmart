import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { count, error } = await supabase
      .from('competitor_domains')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure competitor_domains table exists.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasCompetitors: (count || 0) > 0,
      count: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check competitor status.' },
      { status: 500 }
    );
  }
}