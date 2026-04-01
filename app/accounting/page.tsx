'use client';

import DashboardShell from '@/components/layout/dashboard-shell';

export default function AccountingPage() {
  const rows = [
    { name: 'Perde Premium Linen', revenue: 7390, cost: 4210, fees: 420, ads: 260, profit: 2500 },
    { name: 'Çarçaf 4 Pjesësh Deluxe', revenue: 7980, cost: 5200, fees: 510, ads: 320, profit: 1950 },
    { name: 'Jorgan Dimëror Premium', revenue: 6282, cost: 4020, fees: 340, ads: 220, profit: 1702 },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">
            Kontroll financiar
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
            Kontabiliteti
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Shiko të ardhurat, kostot, tarifat, reklamat dhe fitimin real sipas produktit.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Të ardhura totale', '€21,652'],
            ['Kosto totale', '€13,430'],
            ['Tarifa + reklama', '€2,070'],
            ['Fitimi neto', '€6,152'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {label}
              </div>
              <div className="mt-3 text-4xl font-black text-slate-900">{value}</div>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Pasqyra financiare sipas produktit</h3>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold">Produkti</th>
                    <th className="px-4 py-4 text-left font-bold">Të ardhura</th>
                    <th className="px-4 py-4 text-left font-bold">Kosto</th>
                    <th className="px-4 py-4 text-left font-bold">Tarifa</th>
                    <th className="px-4 py-4 text-left font-bold">Reklama</th>
                    <th className="px-4 py-4 text-left font-bold">Fitimi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-4 py-4">€{row.revenue.toLocaleString()}</td>
                      <td className="px-4 py-4">€{row.cost.toLocaleString()}</td>
                      <td className="px-4 py-4">€{row.fees.toLocaleString()}</td>
                      <td className="px-4 py-4">€{row.ads.toLocaleString()}</td>
                      <td className="px-4 py-4 font-bold text-emerald-700">€{row.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}