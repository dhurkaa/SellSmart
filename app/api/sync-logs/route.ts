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

    const { data, error } = await supabase
      .from('market_sync_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Run the final_core_fix.sql file to create market_sync_logs.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load sync logs.' },
      { status: 500 }
    );
  }
}