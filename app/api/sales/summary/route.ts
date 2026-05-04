import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SalesChannel = 'online' | 'store' | 'wholesale' | 'marketplace' | 'other';

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const startDateByPeriod = (period: string) => {
  const now = new Date();
  const start = new Date(now);

  if (period === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (period === '90d') {
    start.setDate(now.getDate() - 90);
  } else if (period === '12m') {
    start.setMonth(now.getMonth() - 12);
  } else {
    start.setDate(now.getDate() - 30);
  }

  return start.toISOString();
};

const getStatus = (marginPct: number, unitsSold: number) => {
  if (marginPct < 10) return 'margin_risk';
  if (unitsSold === 0) return 'no_sales';
  if (unitsSold >= 20 && marginPct >= 25) return 'strong';
  if (unitsSold >= 8) return 'stable';
  return 'slow';
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
    const period = searchParams.get('period') || '30d';
    const channel = searchParams.get('channel') || 'all';
    const fromDate = startDateByPeriod(period);

    let query = supabase
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .gte('sold_at', fromDate)
      .order('sold_at', { ascending: false });

    if (channel !== 'all') {
      query = query.eq('channel', channel);
    }

    const { data: salesRows, error: salesError } = await query;

    if (salesError) {
      return NextResponse.json(
        {
          error: salesError.message,
          hint: 'Make sure the sales table exists and has user_id, product_name, sale_price, cost_price, quantity, channel, sold_at.',
        },
        { status: 500 }
      );
    }

    const sales = salesRows || [];

    const totalRevenue = sales.reduce(
      (sum, row) => sum + toNumber(row.sale_price) * toNumber(row.quantity, 1),
      0
    );

    const totalCost = sales.reduce(
      (sum, row) => sum + toNumber(row.cost_price) * toNumber(row.quantity, 1),
      0
    );

    const grossProfit = totalRevenue - totalCost;

    const totalUnits = sales.reduce(
      (sum, row) => sum + toNumber(row.quantity, 1),
      0
    );

    const averageOrderValue =
      sales.length > 0 ? totalRevenue / sales.length : 0;

    const grossMarginPct =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const productMap = new Map<string, any>();

    for (const row of sales) {
      const productName = String(row.product_name || 'Unnamed product');
      const key = `${productName}:${row.sku || ''}`;

      const quantity = toNumber(row.quantity, 1);
      const revenue = toNumber(row.sale_price) * quantity;
      const cost = toNumber(row.cost_price) * quantity;
      const profit = revenue - cost;

      if (!productMap.has(key)) {
        productMap.set(key, {
          id: key,
          productName,
          sku: row.sku || null,
          category: row.category || 'Uncategorized',
          channel: row.channel || 'other',
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          lastSoldAt: row.sold_at || null,
        });
      }

      const item = productMap.get(key);

      item.unitsSold += quantity;
      item.revenue += revenue;
      item.cost += cost;
      item.profit += profit;

      if (
        row.sold_at &&
        (!item.lastSoldAt || new Date(row.sold_at) > new Date(item.lastSoldAt))
      ) {
        item.lastSoldAt = row.sold_at;
      }
    }

    const products = Array.from(productMap.values()).map((item) => {
      const marginPct =
        item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;

      return {
        ...item,
        revenue: Number(item.revenue.toFixed(2)),
        cost: Number(item.cost.toFixed(2)),
        profit: Number(item.profit.toFixed(2)),
        marginPct: Number(marginPct.toFixed(2)),
        status: getStatus(marginPct, item.unitsSold),
      };
    });

    const channelMap = new Map<SalesChannel, number>();

    for (const row of sales) {
      const saleChannel = (row.channel || 'other') as SalesChannel;
      const revenue = toNumber(row.sale_price) * toNumber(row.quantity, 1);

      channelMap.set(saleChannel, (channelMap.get(saleChannel) || 0) + revenue);
    }

    const channels = Array.from(channelMap.entries()).map(([name, revenue]) => ({
      name,
      revenue: Number(revenue.toFixed(2)),
      percentage:
        totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(2)) : 0,
    }));

    const weakProducts = products.filter(
      (item) => item.status === 'margin_risk' || item.status === 'slow'
    );

    const topProducts = [...products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const suggestedActions = [
      ...(weakProducts.length > 0
        ? [
            {
              title: 'Review weak products',
              description: `${weakProducts.length} products have low margin or slow sales.`,
              priority: 'high',
            },
          ]
        : []),
      ...(grossMarginPct < 18 && totalRevenue > 0
        ? [
            {
              title: 'Increase margin protection',
              description: 'Gross margin is below the recommended business threshold.',
              priority: 'high',
            },
          ]
        : []),
      ...(sales.length === 0
        ? [
            {
              title: 'No sales found',
              description:
                'No sales were found for this period. Import sales or extend the selected period.',
              priority: 'medium',
            },
          ]
        : []),
    ];

    return NextResponse.json({
      summary: {
        period,
        channel,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        totalUnits,
        totalOrders: sales.length,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        productsSold: products.length,
        weakProductsCount: weakProducts.length,
        lastUpdated: new Date().toISOString(),
      },
      products,
      topProducts,
      channels,
      suggestedActions,
      meta: {
        source: 'sales',
        rows: sales.length,
        warning:
          sales.length === 0
            ? 'Sales API is connected, but no sales rows were found for this user and period.'
            : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load sales summary.',
      },
      { status: 500 }
    );
  }
}