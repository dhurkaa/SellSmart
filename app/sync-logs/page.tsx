'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type SyncLog = {
  id: string;
  sync_type: string;
  status: 'running' | 'success' | 'failed';
  domains_scanned: number;
  pages_discovered: number;
  pages_scanned: number;
  products_found: number;
  signals_inserted: number;
  failed_pages: number;
  debug: any[];
  error_message?: string | null;
  started_at: string;
  finished_at?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('sq-AL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getStatusStyle = (status: SyncLog['status']) => {
  switch (status) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
};

export default function SyncLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const latest = logs[0];

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.products += Number(log.products_found || 0);
        acc.signals += Number(log.signals_inserted || 0);
        acc.pages += Number(log.pages_scanned || 0);
        acc.failed += Number(log.failed_pages || 0);
        return acc;
      },
      { products: 0, signals: 0, pages: 0, failed: 0 }
    );
  }, [logs]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sync-logs', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load sync logs.');
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err: any) {
      setError(err?.message || 'Could not load sync logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

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
                  Market Sync Logs
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Proof of crawling
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Sync
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Logs
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Kontrollo saktësisht cilat website u skanuan, sa faqe u gjetën,
                sa produkte u nxorën dhe pse ndonjë faqe dështoi.
              </p>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
            >
              Refresh Logs
            </button>
          </div>
        </section>

        {error && (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Products found', loading ? '—' : totals.products, '📦'],
            ['Signals inserted', loading ? '—' : totals.signals, '📡'],
            ['Pages scanned', loading ? '—' : totals.pages, '🌐'],
            ['Failed pages', loading ? '—' : totals.failed, '⚠️'],
          ].map(([label, value, icon]) => (
            <div
              key={label as string}
              className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                  Total
                </span>
              </div>
              <div className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {label}
              </div>
              <div className="mt-2 text-4xl font-black text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        {latest && (
          <section className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)] md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  Latest sync
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  {latest.products_found} products found
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Started {formatDate(latest.started_at)} · Finished {formatDate(latest.finished_at)}
                </p>
              </div>

              <span
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${getStatusStyle(
                  latest.status
                )}`}
              >
                {latest.status}
              </span>
            </div>
          </section>
        )}

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="mb-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              Crawl history
            </div>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Recent website scans
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
              <div className="text-4xl">📭</div>
              <div className="mt-3 text-xl font-black text-slate-900">
                No sync logs yet
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Run competitor analysis from the Pricing page.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[28px] border border-slate-100 bg-white/70 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusStyle(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {formatDate(log.started_at)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        {[
                          ['Domains', log.domains_scanned],
                          ['Discovered', log.pages_discovered],
                          ['Scanned', log.pages_scanned],
                          ['Products', log.products_found],
                          ['Signals', log.signals_inserted],
                          ['Failed', log.failed_pages],
                        ].map(([label, value]) => (
                          <div key={label as string} className="rounded-2xl bg-slate-50 p-3">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              {label}
                            </div>
                            <div className="text-xl font-black text-slate-950">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {log.error_message}
                    </div>
                  )}

                  {Array.isArray(log.debug) && log.debug.length > 0 && (
                    <details className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <summary className="cursor-pointer text-sm font-black text-slate-700">
                        Domain debug details
                      </summary>
                      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                        {JSON.stringify(log.debug, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}