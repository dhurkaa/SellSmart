import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const formatReportTitle = (type: string) => {
  switch (type) {
    case 'monthly-profit':
      return 'Raporti i Fitimit Mujor';
    case 'product-margin':
      return 'Raporti i Marzhës sipas Produktit';
    case 'pricing-performance':
      return 'Raporti i Performancës së Çmimeve';
    case 'weak-products':
      return 'Raporti i Produkteve të Dobëta';
    case 'inventory-capital':
      return 'Raporti i Kapitalit në Inventar';
    case 'market-position':
      return 'Raporti i Pozicionimit në Treg';
    default:
      return 'Raport biznesi';
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
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      );
    }

    const monthStart = startOfCurrentMonth();

    const { data: salesRows, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .gte('sold_at', monthStart)
      .order('sold_at', { ascending: false });

    if (salesError) {
      return NextResponse.json(
        {
          error: salesError.message,
          hint: 'Make sure the sales table exists before using reports.',
        },
        { status: 500 }
      );
    }

    const sales = salesRows || [];

    const totalRevenue = sales.reduce(
      (sum, row) => sum + toNumber(row.sale_price) * toNumber(row.quantity, 1),
      0
    );

    const trackedCost = sales.reduce(
      (sum, row) => sum + toNumber(row.cost_price) * toNumber(row.quantity, 1),
      0
    );

    const monthlyGrossProfit = totalRevenue - trackedCost;

    const estimatedOperatingCost = totalRevenue * 0.08;
    const monthlyNetProfit = monthlyGrossProfit - estimatedOperatingCost;

    const averageMargin =
      totalRevenue > 0 ? (monthlyGrossProfit / totalRevenue) * 100 : 0;

    const productMap = new Map<
      string,
      {
        revenue: number;
        cost: number;
        quantity: number;
      }
    >();

    for (const row of sales) {
      const productName = String(row.product_name || 'Unnamed product');
      const quantity = toNumber(row.quantity, 1);
      const revenue = toNumber(row.sale_price) * quantity;
      const cost = toNumber(row.cost_price) * quantity;

      if (!productMap.has(productName)) {
        productMap.set(productName, {
          revenue: 0,
          cost: 0,
          quantity: 0,
        });
      }

      const item = productMap.get(productName)!;
      item.revenue += revenue;
      item.cost += cost;
      item.quantity += quantity;
    }

    const productSummaries = Array.from(productMap.entries()).map(
      ([productName, item]) => {
        const profit = item.revenue - item.cost;
        const marginPct = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;

        return {
          productName,
          revenue: item.revenue,
          cost: item.cost,
          profit,
          marginPct,
          quantity: item.quantity,
        };
      }
    );

    const weakProductsCount = productSummaries.filter(
      (item) => item.marginPct < 15 || item.quantity <= 1
    ).length;

    let exportedReports = 0;
    let recentReports: any[] = [];

    const { data: reportExports, error: reportExportsError } = await supabase
      .from('report_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!reportExportsError && reportExports) {
      exportedReports = reportExports.length;

      recentReports = reportExports.map((report) => ({
        id: report.id,
        title: formatReportTitle(report.report_type),
        type: report.format || 'PDF / Excel',
        created_at: report.created_at,
        status: report.status || 'ready',
        export_url: report.export_url || null,
      }));
    }

    const priceChangesCount = sales.filter(
      (row) => row.notes && String(row.notes).toLowerCase().includes('price')
    ).length;

    return NextResponse.json({
      summary: {
        activeReports: 6,
        exportedReports,
        trackedCost: Number(trackedCost.toFixed(2)),
        monitoredProfit: Number(monthlyGrossProfit.toFixed(2)),
        monthlyGrossProfit: Number(monthlyGrossProfit.toFixed(2)),
        monthlyNetProfit: Number(monthlyNetProfit.toFixed(2)),
        averageMargin: Number(averageMargin.toFixed(2)),
        weakProductsCount,
        priceChangesCount,
        lastUpdated: new Date().toISOString(),
      },
      recentReports,
      meta: {
        source: 'sales + report_exports',
        salesRows: sales.length,
        productCount: productSummaries.length,
        warning:
          sales.length === 0
            ? 'Reports API is connected, but there are no sales rows for this month.'
            : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load reports summary.',
      },
      { status: 500 }
    );
  }
}