'use client';

import DashboardShell from '@/components/layout/dashboard-shell';

export default function ReportsPage() {
  const reports = [
    { title: 'Raporti i Fitimit Mujor', desc: 'Shfaq fitimin bruto, neto dhe ndikimin e çmimeve.', type: 'PDF / Excel' },
    { title: 'Raporti i Marzhës sipas Produktit', desc: 'Krahason marzhën reale dhe marzhën e synuar.', type: 'Excel' },
    { title: 'Raporti i Performancës së Çmimeve', desc: 'Tregon çfarë ndodhi pas rritjes ose uljes së çmimit.', type: 'PDF' },
    { title: 'Raporti i Produkteve të Dobëta', desc: 'Identifikon produktet me shitje të ulëta ose fitim të dobët.', type: 'PDF / Excel' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">
                Raportim ekzekutiv
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
                Raportet
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Krijo raporte të qarta për menaxhmentin, kontabilitetin dhe ekipin e shitjeve.
              </p>
            </div>

            <button className="rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_55%,#0ea5e9_100%)] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)]">
              Krijo raport të ri
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Raporte aktive', '12'],
            ['Raporte të eksportuara', '47'],
            ['Kosto e ndjekur', '€184,000'],
            ['Fitim i monitoruar', '€62,400'],
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

        <section className="grid gap-6 xl:grid-cols-2">
          {reports.map((report) => (
            <div
              key={report.title}
              className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-8"
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {report.type}
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">
                {report.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{report.desc}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
                  Shiko
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
                  Eksporto PDF
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
                  Eksporto Excel
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}