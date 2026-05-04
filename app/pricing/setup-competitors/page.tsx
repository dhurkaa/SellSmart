'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

type CompetitorDomain = {
  id: string;
  domain: string;
  start_url?: string | null;
  label?: string | null;
  is_active: boolean;
};

const suggestedDomains = [
  'https://www.zarahome.com/xk',
  'https://www.kare-design.com/xk-en',
  'https://dicasahome.com',
  'https://bbavariahome.com',
  'https://sulaworld.com',
];

export default function SetupCompetitorsPage() {
  const router = useRouter();

  const [domains, setDomains] = useState<string[]>(['']);
  const [existingDomains, setExistingDomains] = useState<CompetitorDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const loadDomains = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/competitors/domains', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load competitor domains.');
      }

      setExistingDomains(Array.isArray(data.domains) ? data.domains : []);

      if (Array.isArray(data.domains) && data.domains.length > 0) {
        setDomains(
          data.domains.map((item: CompetitorDomain) => item.start_url || `https://${item.domain}`)
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load competitor domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const updateDomain = (index: number, value: string) => {
    setDomains((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addDomain = () => {
    setDomains((prev) => [...prev, ''].slice(0, 25));
  };

  const addSuggested = (value: string) => {
    setDomains((prev) => {
      if (prev.includes(value)) return prev;

      const withoutEmpty = prev.filter((item) => item.trim());
      return [...withoutEmpty, value].slice(0, 25);
    });
  };

  const removeDomain = (index: number) => {
    setDomains((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const saveDomains = async () => {
    setSaving(true);
    setError('');

    try {
      const clean = domains.map((domain) => domain.trim()).filter(Boolean);

      if (clean.length === 0) {
        throw new Error('Add at least one competitor website.');
      }

      const res = await fetch('/api/competitors/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save competitor domains.');
      }

      router.push('/pricing?refreshCompetitors=true');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <div className="mb-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                Competitor Setup
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                Full URL Preserved
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                Automatic Product Discovery
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
              Add competitor
              <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                websites
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Add the exact website URLs you want SellSmart to scan. For websites like Zara
              Home, use the Kosovo URL with path, for example
              <span className="font-black text-slate-900"> https://www.zarahome.com/xk</span>.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Website URLs
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Competitor product sources
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Use full URLs, not only domains. Example:
                  <span className="font-black text-slate-800"> https://www.zarahome.com/xk</span>
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain, index) => (
                    <div key={index} className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={domain}
                        onChange={(e) => updateDomain(index, e.target.value)}
                        placeholder="https://www.zarahome.com/xk"
                        className="flex-1 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />

                      <button
                        type="button"
                        onClick={() => removeDomain(index)}
                        className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addDomain}
                  disabled={domains.length >= 25}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 transition-all hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
                >
                  + Add another website
                </button>

                <button
                  type="button"
                  onClick={saveDomains}
                  disabled={saving || loading}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save and analyze products'}
                </button>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Suggested sources
              </div>

              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Start with these
              </h3>

              <div className="mt-6 space-y-3">
                {suggestedDomains.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addSuggested(item)}
                    className="w-full rounded-2xl bg-white/10 p-4 text-left text-sm font-semibold text-white/75 transition-all hover:bg-white/15 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Important
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-800">
                For Zara Home, do not add only <b>zarahome.com</b>. Add
                <b> https://www.zarahome.com/xk</b> because the Kosovo product pages live under
                the /xk path.
              </p>
            </div>

            {existingDomains.length > 0 && (
              <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Saved websites
                </div>

                <div className="mt-4 space-y-2">
                  {existingDomains.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white/70 p-3 text-sm font-semibold text-slate-700"
                    >
                      {item.start_url || item.domain}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </AppShell>
  );
}