'use client';

import DashboardShell from '@/components/layout/dashboard-shell';

export default function MarketIntelligencePage() {
  const insights = [
    { title: 'Presioni i konkurrencës', value: 'I lartë', note: 'Rritje e ofertave me zbritje në zonën tënde.' },
    { title: 'Ngopja e tregut', value: 'Mesatare', note: 'Ka hapësirë për produkte premium me dallim të qartë.' },
    { title: 'Rreziku i luftës së çmimeve', value: 'I moderuar', note: 'Mos hy në ulje agresive pa kontrolluar marzhën.' },
    { title: 'Mundësia premium', value: 'Pozitive', note: 'Klientët po pranojnë më mirë produkte me prezantim të fortë.' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">
            Inteligjenca e tregut
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
            Çfarë po ndodh në treg
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Monitoro presionin e konkurrencës, ngopjen e tregut dhe mundësitë për rritje ose
            mbrojtje të çmimeve.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {item.title}
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
              <div className="mt-3 text-sm leading-6 text-slate-500">{item.note}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Sinjale kryesore të tregut</h3>
            <div className="mt-6 space-y-4">
              {[
                'Konkurrentët po përdorin promotime më të shpeshta në segmentin e çarçafëve.',
                'Produktet që duken premium po mbajnë më mirë çmimin.',
                'Ka presion në produktet me stok të lartë dhe diferencim të ulët.',
                'Kategoritë e shtëpisë po përfitojnë nga bundle offers.',
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Reagime të sugjeruara</h3>
            <div className="mt-6 space-y-4">
              {[
                'Mbaje marzhën në produktet premium dhe mos hy në luftë çmimi.',
                'Përdor bundle për produktet me stok të lartë.',
                'Shto fokus te prezantimi vizual për të justifikuar çmimin.',
                'Krahaso kategoritë që kanë presion të lartë me ROI real.',
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-5 text-sm font-medium leading-6 text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}