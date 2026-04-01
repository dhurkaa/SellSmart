'use client';

import { useMemo, useState } from 'react';
import DashboardShell from '@/components/layout/dashboard-shell';

type Goal = 'balanced' | 'margin' | 'volume' | 'cashflow';

export default function PricingPage() {
  const [goal, setGoal] = useState<Goal>('balanced');
  const [selectedCategory, setSelectedCategory] = useState('Të gjitha');
  const [search, setSearch] = useState('');

  const products = [
    { id: 1, name: 'Perde Premium Linen', category: 'Perde', current: 49.9, recommended: 56.9, floor: 42.4, margin: 31, stock: 88, status: 'Nënvlerësuar' },
    { id: 2, name: 'Çarçaf 4 Pjesësh Deluxe', category: 'Bedding', current: 34.9, recommended: 37.9, floor: 28.5, margin: 26, stock: 120, status: 'E balancuar' },
    { id: 3, name: 'Jorgan Dimëror Premium', category: 'Home', current: 79.9, recommended: 84.9, floor: 66.2, margin: 24, stock: 36, status: 'Premium i mundshëm' },
    { id: 4, name: 'Set Peshqirësh Hotel', category: 'Bath', current: 24.9, recommended: 21.9, floor: 18.2, margin: 17, stock: 210, status: 'Pastrim stoku' },
  ];

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Të gjitha' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">
                Menaxhimi i çmimeve
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
                Qendra e çmimeve
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Shiko produktet që duhet të rishikohen, vendos strategji sipas objektivit të biznesit
                dhe aprovo ndryshimet e çmimeve me logjikë të qartë.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['balanced', 'E balancuar'],
                ['margin', 'Marzhë'],
                ['volume', 'Volum'],
                ['cashflow', 'Cash flow'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setGoal(value as Goal)}
                  className={
                    goal === value
                      ? 'rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700'
                      : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Produkte për rishikim', '24'],
            ['Nënvlerësuar', '9'],
            ['Rrezik marzhe', '5'],
            ['Aprovime në pritje', '11'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {label}
              </div>
              <div className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                {value}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kërko produkt ose status..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
            >
              <option>Të gjitha</option>
              <option>Perde</option>
              <option>Bedding</option>
              <option>Home</option>
              <option>Bath</option>
            </select>

            <button className="rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_55%,#0ea5e9_100%)] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)]">
              Gjenero rekomandime
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold">Produkti</th>
                    <th className="px-4 py-4 text-left font-bold">Kategoria</th>
                    <th className="px-4 py-4 text-left font-bold">Aktuale</th>
                    <th className="px-4 py-4 text-left font-bold">Rekomanduar</th>
                    <th className="px-4 py-4 text-left font-bold">Pragu</th>
                    <th className="px-4 py-4 text-left font-bold">Marzha</th>
                    <th className="px-4 py-4 text-left font-bold">Stoku</th>
                    <th className="px-4 py-4 text-left font-bold">Statusi</th>
                    <th className="px-4 py-4 text-left font-bold">Veprim</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-4 text-slate-600">{item.category}</td>
                      <td className="px-4 py-4">€{item.current.toFixed(2)}</td>
                      <td className="px-4 py-4 font-bold text-indigo-700">€{item.recommended.toFixed(2)}</td>
                      <td className="px-4 py-4">€{item.floor.toFixed(2)}</td>
                      <td className="px-4 py-4">{item.margin}%</td>
                      <td className="px-4 py-4">{item.stock}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                          Aprovo
                        </button>
                      </td>
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