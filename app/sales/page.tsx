'use client';

import { useMemo, useState } from 'react';
import DashboardShell from '@/components/layout/dashboard-shell';

export default function SalesPage() {
  const [period, setPeriod] = useState('30 ditë');
  const [channel, setChannel] = useState('Të gjitha');

  const sales = [
    { name: 'Perde Premium Linen', units: 132, revenue: 7390, margin: 29, status: 'Rritje' },
    { name: 'Çarçaf 4 Pjesësh Deluxe', units: 216, revenue: 7980, margin: 24, status: 'Stabil' },
    { name: 'Jorgan Dimëror Premium', units: 74, revenue: 6282, margin: 27, status: 'Në rënie' },
    { name: 'Set Peshqirësh Hotel', units: 310, revenue: 6480, margin: 16, status: 'Promocion' },
  ];

  const totals = useMemo(() => {
    const units = sales.reduce((sum, item) => sum + item.units, 0);
    const revenue = sales.reduce((sum, item) => sum + item.revenue, 0);
    const avgMargin = Math.round(sales.reduce((sum, item) => sum + item.margin, 0) / sales.length);
    return { units, revenue, avgMargin };
  }, [sales]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">
                Performanca komerciale
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
                Shitjet
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Shiko si kanë ecur shitjet sipas produkteve, të ardhurat, marzhat dhe ndikimin
                e ndryshimeve të çmimeve.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
              >
                <option>7 ditë</option>
                <option>30 ditë</option>
                <option>90 ditë</option>
                <option>12 muaj</option>
              </select>

              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
              >
                <option>Të gjitha</option>
                <option>Dyqan</option>
                <option>Online</option>
                <option>B2B</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Njësi të shitura</div>
            <div className="mt-3 text-4xl font-black text-slate-900">{totals.units}</div>
          </div>
          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Të ardhura</div>
            <div className="mt-3 text-4xl font-black text-slate-900">€{totals.revenue.toLocaleString()}</div>
          </div>
          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Marzha mesatare</div>
            <div className="mt-3 text-4xl font-black text-slate-900">{totals.avgMargin}%</div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Produktet sipas performancës</h3>
            <div className="mt-6 space-y-4">
              {sales.map((item) => (
                <div key={item.name} className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.units} njësi • €{item.revenue.toLocaleString()} të ardhura</div>
                    </div>
                    <div className="flex gap-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold">
                        Marzha {item.margin}%
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold">
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#4f46e5_0%,#7c3aed_55%,#0ea5e9_100%)]"
                      style={{ width: `${Math.min(item.units / 3.5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Sinjale kryesore</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Produktet premium po ruajnë marzhë më të lartë.',
                  'Produktet me stok të lartë po kërkojnë promotime.',
                  'Kategori të caktuara po lëvizin më shpejt pas repricing.',
                  'Disa produkte kanë volum të mirë por fitim të dobët.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Veprime të sugjeruara</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Ule çmimin e setit të peshqirëve për pastrim stoku.',
                  'Mbaje pozicionimin premium për jorganin dimëror.',
                  'Rrit gradualisht çmimin e perdeve premium.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-medium text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}