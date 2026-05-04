'use client';

import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

const systemSteps = [
  {
    number: '01',
    title: 'User creates account',
    desc: 'Çdo biznes hyn me llogarinë e vet. Të dhënat ruhen veç për atë user në Supabase me RLS policies.',
    icon: '🔐',
  },
  {
    number: '02',
    title: 'User adds competitor websites',
    desc: 'Në Pricing Setup, user-i shton website të konkurrentëve si Zara Home, KARE, DiCasa ose faqe tjera relevante.',
    icon: '🌐',
  },
  {
    number: '03',
    title: 'System scans public pages',
    desc: 'SellSmart tenton të lexojë faqe publike, sitemap, product pages dhe çmime të dukshme nga website-et e dhëna.',
    icon: '🛰️',
  },
  {
    number: '04',
    title: 'Prices become market signals',
    desc: 'Produktet dhe çmimet e gjetura ruhen si competitor price signals në databazë.',
    icon: '📡',
  },
  {
    number: '05',
    title: 'Pricing page compares prices',
    desc: 'Pricing table i krahason çmimet, llogarit average, minimum, maximum, confidence dhe statusin e produktit.',
    icon: '💰',
  },
  {
    number: '06',
    title: 'System explains recommendations',
    desc: 'Çdo produkt ka “Why this recommendation?” që tregon pse është rekomanduar ai çmim.',
    icon: '🧠',
  },
];

const safeRules = [
  {
    title: 'No private scraping',
    desc: 'Sistemi përdor vetëm faqe publike dhe nuk kërkon login, password ose zona private të website-ve.',
    icon: '🛡️',
  },
  {
    title: 'Fallback when websites block crawling',
    desc: 'Nëse një website nuk lejon scan automatik, user-i mund të përdorë CSV import ose manual product entry.',
    icon: '📥',
  },
  {
    title: 'Data belongs to each user',
    desc: 'Supabase RLS e kufizon secilin user që të shohë vetëm të dhënat e veta.',
    icon: '🔒',
  },
  {
    title: 'Confidence score is shown',
    desc: 'Rekomandimet nuk paraqiten si 100% të sigurta. Çdo produkt ka confidence score sipas cilësisë së sinjaleve.',
    icon: '📊',
  },
];

const pageGuides = [
  {
    page: 'Dashboard',
    href: '/dashboard',
    desc: 'Qendra kryesore ku user-i sheh pamjen e përgjithshme të biznesit dhe gjendjen e analizës.',
    icon: '🏠',
  },
  {
    page: 'Pricing',
    href: '/pricing',
    desc: 'Faqja kryesore e projektit. Këtu bëhet krahasimi i çmimeve, rekomandimi dhe fallback import.',
    icon: '💰',
  },
  {
    page: 'Competitor Setup',
    href: '/pricing/setup-competitors',
    desc: 'Këtu shtohen website-et e konkurrentëve që sistemi duhet t’i analizojë.',
    icon: '🌐',
  },
  {
    page: 'Sync Logs',
    href: '/sync-logs',
    desc: 'Tregon provën e scan-it: domains scanned, pages found, products found dhe failed pages.',
    icon: '🛰️',
  },
  {
    page: 'Sales',
    href: '/sales',
    desc: 'Analizon shitjet reale nga tabela sales dhe tregon revenue, profit, margin dhe products performance.',
    icon: '📊',
  },
  {
    page: 'Reports',
    href: '/reports',
    desc: 'Përmbledhje ekzekutive nga sales/report exports për profit, margin dhe produkte të dobëta.',
    icon: '📑',
  },
  {
    page: 'Accounting',
    href: '/accounting',
    desc: 'Llogarit revenue, cost, fees, ads, tax dhe net profit sipas produktit.',
    icon: '🧾',
  },
  {
    page: 'Settings',
    href: '/settings',
    desc: 'Ruan company rules, target margin, AI strictness dhe pricing preferences për user-in.',
    icon: '⚙️',
  },
];

const demoFlow = [
  'Login ose krijo account.',
  'Shko te Pricing.',
  'Nëse nuk ka competitor websites, sistemi të dërgon te setup page.',
  'Shto një website si https://www.zarahome.com/xk.',
  'Kliko Analyze Competitor Prices.',
  'Hap Sync Logs për të parë çka ndodhi gjatë scan-it.',
  'Nëse crawler nuk gjen produkte, përdor Import CSV ose Add Manual Product.',
  'Kthehu te Pricing dhe hap “Why this recommendation?” për të shpjeguar logjikën.',
  'Hap Sales, Reports dhe Accounting për të treguar që sistemi është i ndërtuar për live data.',
];

export default function TutorialPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                  Safe Tutorial
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  How SellSmart Works
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Demo Guide
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                SellSmart
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Tutorial
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
                Kjo faqe shpjegon qartë si funksionon sistemi: nga website-et e
                konkurrentëve, te market signals, pricing recommendations, sync logs,
                fallback CSV/manual import, sales, reports dhe accounting.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[520px]">
              <Link
                href="/pricing"
                className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Start here
                </div>
                <div className="mt-2 text-3xl font-black">Open Pricing</div>
                <div className="mt-2 text-sm text-white/60">
                  Main business intelligence workspace
                </div>
              </Link>

              <Link
                href="/sync-logs"
                className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm transition-all hover:-translate-y-1"
              >
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Proof
                </div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  Sync Logs
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Show scan history and products found
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {systemSteps.map((step) => (
            <div
              key={step.number}
              className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(79,70,229,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  {step.icon}
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {step.number}
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">{step.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Pages Guide
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  What each page does
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Kjo pjesë është shumë e mirë për demo, sepse tregon që projekti
                  është i strukturuar si produkt real.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pageGuides.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[28px] border border-slate-100 bg-white/70 p-5 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl transition-all group-hover:bg-indigo-600 group-hover:text-white">
                        {item.icon}
                      </div>

                      <div>
                        <h3 className="font-black text-slate-950">{item.page}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Demo Flow
              </div>

              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                How to present it
              </h3>

              <div className="mt-6 space-y-3">
                {demoFlow.map((item, index) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-white/70">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
          <div className="mb-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              Safety and reliability
            </div>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Safe system rules
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              SellSmart është ndërtuar që të jetë i sigurt për demo dhe praktik për përdorim real.
              Nuk premton që çdo website do të skanohet 100%, sepse disa website bllokojnë crawling,
              por ofron fallback me CSV dhe manual input.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {safeRules.map((rule) => (
              <div
                key={rule.title}
                className="rounded-[28px] border border-slate-100 bg-white/70 p-5"
              >
                <div className="text-3xl">{rule.icon}</div>
                <h3 className="mt-4 text-lg font-black text-slate-950">
                  {rule.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{rule.desc}</p>
              </div>
            ))}
          </div>
        </section>

        
      </div>
    </AppShell>
  );
}