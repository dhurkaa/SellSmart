import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getStatus = (netProfit: number, marginPct: number) => {
  if (netProfit < 0) return 'loss';
  if (marginPct < 12) return 'low_margin';
  if (marginPct < 20) return 'review';
  return 'healthy';
};

export async function GET() {
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

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: salesRows, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .gte('sold_at', monthStart.toISOString())
      .order('sold_at', { ascending: false });

    if (salesError) {
      return NextResponse.json(
        {
          error: salesError.message,
          hint: 'Make sure the sales table exists.',
        },
        { status: 500 }
      );
    }

    const sales = salesRows || [];

    const grouped = new Map<string, any>();

    for (const sale of sales) {
      const productName = String(sale.product_name || 'Unnamed product');
      const sku = sale.sku || null;
      const category = sale.category || 'Uncategorized';
      const key = `${productName}:${sku || ''}`;

      const quantity = toNumber(sale.quantity, 1);
      const revenue = toNumber(sale.sale_price) * quantity;
      const cost = toNumber(sale.cost_price) * quantity;

      const fees =
        toNumber(sale.fees, 0) ||
        toNumber(sale.platform_fee, 0) ||
        revenue * 0.03;

      const ads =
        toNumber(sale.ads, 0) ||
        toNumber(sale.ad_cost, 0) ||
        revenue * 0.02;

      const tax =
        toNumber(sale.tax, 0) ||
        toNumber(sale.vat, 0) ||
        0;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          productName,
          sku,
          category,
          revenue: 0,
          cost: 0,
          fees: 0,
          ads: 0,
          tax: 0,
          grossProfit: 0,
          netProfit: 0,
          marginPct: 0,
          status: 'review',
        });
      }

      const row = grouped.get(key);

      row.revenue += revenue;
      row.cost += cost;
      row.fees += fees;
      row.ads += ads;
      row.tax += tax;
    }

    const rows = Array.from(grouped.values()).map((row) => {
      const grossProfit = row.revenue - row.cost;
      const netProfit = grossProfit - row.fees - row.ads - row.tax;
      const marginPct = row.revenue > 0 ? (netProfit / row.revenue) * 100 : 0;

      return {
        ...row,
        revenue: Number(row.revenue.toFixed(2)),
        cost: Number(row.cost.toFixed(2)),
        fees: Number(row.fees.toFixed(2)),
        ads: Number(row.ads.toFixed(2)),
        tax: Number(row.tax.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        marginPct: Number(marginPct.toFixed(2)),
        status: getStatus(netProfit, marginPct),
      };
    });

    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const totalFees = rows.reduce((sum, row) => sum + row.fees, 0);
    const totalAds = rows.reduce((sum, row) => sum + row.ads, 0);
    const totalTax = rows.reduce((sum, row) => sum + row.tax, 0);
    const grossProfit = rows.reduce((sum, row) => sum + row.grossProfit, 0);
    const netProfit = rows.reduce((sum, row) => sum + row.netProfit, 0);

    const grossMarginPct =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const netMarginPct =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const productsAtRisk = rows.filter(
      (row) => row.status === 'loss' || row.status === 'low_margin'
    ).length;

    return NextResponse.json({
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalFees: Number(totalFees.toFixed(2)),
        totalAds: Number(totalAds.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        netMarginPct: Number(netMarginPct.toFixed(2)),
        productsTracked: rows.length,
        productsAtRisk,
        lastUpdated: new Date().toISOString(),
      },
      rows,
      meta: {
        source: 'sales',
        rows: sales.length,
        warning:
          sales.length === 0
            ? 'Accounting API is connected, but there are no sales rows for this month.'
            : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load accounting summary.',
      },
      { status: 500 }
    );
  }
}