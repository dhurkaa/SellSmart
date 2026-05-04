'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

type SettingsPayload = {
  companyName: string;
  companyLocation: string;
  currency: string;
  defaultVatPct: string;
  defaultPlatformFeePct: string;
  defaultAdCostPct: string;
  minimumMarginPct: string;
  targetRoiPct: string;
  maximumDiscountPct: string;
  pricingMode: 'balanced' | 'profit_first' | 'cash_flow' | 'market_aggressive';
  aiStrictness: 'conservative' | 'balanced' | 'aggressive';
  confidenceThreshold: string;
  allowLowConfidenceSuggestions: boolean;
  requireMarketEvidence: boolean;
  autoRefreshMarketData: boolean;
  marketRefreshFrequency: 'manual' | 'daily' | 'weekly';
  reportFormat: 'pdf' | 'excel' | 'both';
  accountingMethod: 'gross' | 'net';
  notifyOnLowMargin: boolean;
  notifyOnHighCompetition: boolean;
  notifyOnPriceOpportunity: boolean;
};

type IntegrationStatus = {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'not_connected' | 'needs_attention';
};

type SettingsApiResponse = {
  settings: SettingsPayload;
  integrations?: IntegrationStatus[];
  updatedAt?: string | null;
};

const defaultSettings: SettingsPayload = {
  companyName: '',
  companyLocation: '',
  currency: 'EUR',
  defaultVatPct: '18',
  defaultPlatformFeePct: '0',
  defaultAdCostPct: '0',
  minimumMarginPct: '18',
  targetRoiPct: '25',
  maximumDiscountPct: '15',
  pricingMode: 'balanced',
  aiStrictness: 'balanced',
  confidenceThreshold: '70',
  allowLowConfidenceSuggestions: false,
  requireMarketEvidence: true,
  autoRefreshMarketData: true,
  marketRefreshFrequency: 'daily',
  reportFormat: 'both',
  accountingMethod: 'gross',
  notifyOnLowMargin: true,
  notifyOnHighCompetition: true,
  notifyOnPriceOpportunity: true,
};

const defaultIntegrations: IntegrationStatus[] = [
  {
    id: 'supabase',
    name: 'Supabase Database',
    description: 'Stores products, valuations, inventory, sales and settings.',
    status: 'needs_attention',
  },
  {
    id: 'market_sources',
    name: 'Market Sources',
    description: 'Competitor pricing and market signal collection.',
    status: 'needs_attention',
  },
  {
    id: 'reports',
    name: 'Reports API',
    description: 'Generates PDF / Excel reports from live business data.',
    status: 'not_connected',
  },
  {
    id: 'ai',
    name: 'AI Valuation Engine',
    description: 'Pricing assistant, product analysis and strategy generator.',
    status: 'needs_attention',
  },
];

const statusStyle: Record<
  IntegrationStatus['status'],
  {
    label: string;
    className: string;
    dot: string;
  }
> = {
  connected: {
    label: 'Connected',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  needs_attention: {
    label: 'Needs Attention',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  not_connected: {
    label: 'Not Connected',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    dot: 'bg-slate-400',
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not synced yet';

  try {
    return new Intl.DateTimeFormat('sq-AL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload>(defaultSettings);
  const [originalSettings, setOriginalSettings] =
    useState<SettingsPayload>(defaultSettings);
  const [integrations, setIntegrations] =
    useState<IntegrationStatus[]>(defaultIntegrations);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const settingsHealth = useMemo(() => {
    let score = 100;

    if (!settings.companyName.trim()) score -= 15;
    if (!settings.companyLocation.trim()) score -= 10;
    if (!settings.minimumMarginPct || Number(settings.minimumMarginPct) <= 0) score -= 15;
    if (!settings.targetRoiPct || Number(settings.targetRoiPct) <= 0) score -= 10;
    if (Number(settings.confidenceThreshold) < 60) score -= 10;
    if (!settings.requireMarketEvidence) score -= 10;

    const disconnected = integrations.filter(
      (item) => item.status !== 'connected'
    ).length;

    score -= Math.min(disconnected * 7, 25);

    return Math.max(0, Math.min(100, score));
  }, [settings, integrations]);

  const updateSetting = <K extends keyof SettingsPayload>(
    key: K,
    value: SettingsPayload[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'API /api/settings nuk ekziston ende. Settings janë gati në UI, por duhet backend për ruajtje reale.'
            : `Settings nuk u ngarkuan. Server error ${res.status}.`
        );
      }

      const data = (await res.json()) as Partial<SettingsApiResponse>;

      const nextSettings = {
        ...defaultSettings,
        ...(data.settings || {}),
      };

      setSettings(nextSettings);
      setOriginalSettings(nextSettings);
      setIntegrations(
        Array.isArray(data.integrations) ? data.integrations : defaultIntegrations
      );
      setUpdatedAt(data.updatedAt || null);
    } catch (err: any) {
      setError(
        err?.message ||
          'Nuk mund të ngarkohen settings reale. Kontrollo API-në ose Supabase.'
      );

      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
      setIntegrations(defaultIntegrations);
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!settings.companyName.trim()) {
        throw new Error('Company name është i detyrueshëm.');
      }

      if (!settings.companyLocation.trim()) {
        throw new Error('Company location është i detyrueshëm.');
      }

      if (Number(settings.minimumMarginPct) < 0) {
        throw new Error('Minimum margin nuk mund të jetë negativ.');
      }

      if (Number(settings.targetRoiPct) < 0) {
        throw new Error('Target ROI nuk mund të jetë negativ.');
      }

      if (Number(settings.maximumDiscountPct) < 0 || Number(settings.maximumDiscountPct) > 100) {
        throw new Error('Maximum discount duhet të jetë mes 0 dhe 100.');
      }

      if (
        Number(settings.confidenceThreshold) < 0 ||
        Number(settings.confidenceThreshold) > 100
      ) {
        throw new Error('Confidence threshold duhet të jetë mes 0 dhe 100.');
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'API /api/settings nuk ekziston ende. Duhet ta krijojmë që settings të ruhen realisht.'
            : `Settings nuk u ruajtën. Server error ${res.status}.`
        );
      }

      const data = (await res.json()) as Partial<SettingsApiResponse>;

      const nextSettings = {
        ...defaultSettings,
        ...(data.settings || settings),
      };

      setSettings(nextSettings);
      setOriginalSettings(nextSettings);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setSuccessMessage('Settings u ruajtën me sukses.');
    } catch (err: any) {
      setError(err?.message || 'Ruajtja dështoi. Provo përsëri.');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setSettings(originalSettings);
    setError('');
    setSuccessMessage('');
  };

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
                  Company Settings
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                  Live Configuration
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Pricing Rules
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.06em] text-slate-950 md:text-7xl">
                Settings
                <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Control Room
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Manage company rules, target margins, AI pricing behavior, accounting
                preferences, market refresh logic and integrations from one serious business
                control panel.
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-500">
                Last update: {formatDate(updatedAt)}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[500px]">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Settings Health
                </div>
                <div className="mt-2 text-5xl font-black text-slate-950">
                  {loading ? '—' : `${settingsHealth}%`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    style={{ width: `${loading ? 0 : settingsHealth}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-xl">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  Current Mode
                </div>
                <div className="mt-2 text-3xl font-black capitalize">
                  {settings.pricingMode.replace('_', ' ')}
                </div>
                <div className="mt-1 text-sm font-medium text-white/55">
                  AI strictness: {settings.aiStrictness}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-amber-800">
                  ⚠️ Settings live backend is not fully connected
                </div>
                <p className="mt-1 text-sm leading-6 text-amber-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={loadSettings}
                className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-black text-amber-800 transition-all hover:bg-amber-200"
              >
                Reload
              </button>
            </div>
          </section>
        )}

        {successMessage && (
          <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black text-emerald-800">
                  ✅ Saved successfully
                </div>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  {successMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-black text-emerald-800 transition-all hover:bg-emerald-200"
              >
                Close
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Minimum Margin',
              value: loading ? '—' : `${settings.minimumMarginPct}%`,
              icon: '📈',
              note: 'Protects profit floor',
            },
            {
              label: 'Target ROI',
              value: loading ? '—' : `${settings.targetRoiPct}%`,
              icon: '🎯',
              note: 'Used in pricing decisions',
            },
            {
              label: 'Max Discount',
              value: loading ? '—' : `${settings.maximumDiscountPct}%`,
              icon: '🏷️',
              note: 'Controls discount risk',
            },
            {
              label: 'Confidence Gate',
              value: loading ? '—' : `${settings.confidenceThreshold}%`,
              icon: '🧠',
              note: 'AI recommendation threshold',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                  Rule
                </span>
              </div>
              <div className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </div>
              <div className="mt-2 text-4xl font-black text-slate-950">{item.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">{item.note}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Company Profile
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Business identity
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Company name
                  </span>
                  <input
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="e.g. Nuka Home"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Company location
                  </span>
                  <input
                    value={settings.companyLocation}
                    onChange={(e) => updateSetting('companyLocation', e.target.value)}
                    placeholder="e.g. Prishtinë, Kosovo"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Currency
                  </span>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="ALL">ALL</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Report format
                  </span>
                  <select
                    value={settings.reportFormat}
                    onChange={(e) =>
                      updateSetting('reportFormat', e.target.value as SettingsPayload['reportFormat'])
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="pdf">PDF only</option>
                    <option value="excel">Excel only</option>
                    <option value="both">PDF + Excel</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Pricing Rules
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Profit and price control
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  ['defaultVatPct', 'Default VAT %'],
                  ['defaultPlatformFeePct', 'Platform fee %'],
                  ['defaultAdCostPct', 'Ad cost %'],
                  ['minimumMarginPct', 'Minimum margin %'],
                  ['targetRoiPct', 'Target ROI %'],
                  ['maximumDiscountPct', 'Maximum discount %'],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {label}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={settings[key as keyof SettingsPayload] as string}
                      onChange={(e) =>
                        updateSetting(key as keyof SettingsPayload, e.target.value as any)
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Pricing mode
                  </span>
                  <select
                    value={settings.pricingMode}
                    onChange={(e) =>
                      updateSetting('pricingMode', e.target.value as SettingsPayload['pricingMode'])
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="profit_first">Profit first</option>
                    <option value="cash_flow">Cash flow</option>
                    <option value="market_aggressive">Market aggressive</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Accounting method
                  </span>
                  <select
                    value={settings.accountingMethod}
                    onChange={(e) =>
                      updateSetting(
                        'accountingMethod',
                        e.target.value as SettingsPayload['accountingMethod']
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="gross">Gross</option>
                    <option value="net">Net</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
              <div className="mb-6">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  AI Behavior
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Recommendation rules
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    AI strictness
                  </span>
                  <select
                    value={settings.aiStrictness}
                    onChange={(e) =>
                      updateSetting('aiStrictness', e.target.value as SettingsPayload['aiStrictness'])
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Confidence threshold %
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.confidenceThreshold}
                    onChange={(e) => updateSetting('confidenceThreshold', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  {
                    key: 'allowLowConfidenceSuggestions',
                    label: 'Allow low confidence suggestions',
                    desc: 'If disabled, AI should warn before recommending weak prices.',
                  },
                  {
                    key: 'requireMarketEvidence',
                    label: 'Require market evidence',
                    desc: 'Pricing should prefer real competitor or market data.',
                  },
                  {
                    key: 'notifyOnLowMargin',
                    label: 'Notify on low margin',
                    desc: 'Warn when product price is below profit target.',
                  },
                  {
                    key: 'notifyOnHighCompetition',
                    label: 'Notify on high competition',
                    desc: 'Warn when competitors put pressure on price.',
                  },
                  {
                    key: 'notifyOnPriceOpportunity',
                    label: 'Notify on price opportunity',
                    desc: 'Suggest when price can safely increase.',
                  },
                  {
                    key: 'autoRefreshMarketData',
                    label: 'Auto refresh market data',
                    desc: 'Allow scheduled refresh of competitor prices.',
                  },
                ].map((item) => {
                  const checked = settings[item.key as keyof SettingsPayload] as boolean;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        updateSetting(item.key as keyof SettingsPayload, !checked as any)
                      }
                      className={`rounded-3xl border p-4 text-left transition-all ${
                        checked
                          ? 'border-indigo-200 bg-indigo-50/80 shadow-sm'
                          : 'border-slate-200 bg-white/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-black text-slate-950">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-slate-500">
                            {item.desc}
                          </div>
                        </div>

                        <span
                          className={`mt-1 flex h-6 w-11 items-center rounded-full p-1 transition-all ${
                            checked ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`h-4 w-4 rounded-full bg-white transition-all ${
                              checked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Market refresh frequency
                  </span>
                  <select
                    value={settings.marketRefreshFrequency}
                    onChange={(e) =>
                      updateSetting(
                        'marketRefreshFrequency',
                        e.target.value as SettingsPayload['marketRefreshFrequency']
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="manual">Manual only</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Save Center
              </div>

              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Configuration status
              </h3>

              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <div className="text-sm font-black">Unsaved changes</div>
                <div className="mt-1 text-3xl font-black">
                  {hasChanges ? 'Yes' : 'No'}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Changes should be saved to `/api/settings`.
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving || loading || !hasChanges}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving settings...' : 'Save Settings'}
                </button>

                <button
                  type="button"
                  onClick={resetChanges}
                  disabled={saving || loading || !hasChanges}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reset Changes
                </button>

                <button
                  type="button"
                  onClick={loadSettings}
                  disabled={saving || loading}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reload From API
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Integrations
              </div>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                System connections
              </h3>

              <div className="mt-5 space-y-3">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">{item.name}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-500">
                          {item.description}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                          statusStyle[item.status].className
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${statusStyle[item.status].dot}`}
                        />
                        {statusStyle[item.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 shadow-[0_22px_80px_rgba(79,70,229,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Backend Required
              </div>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                For real settings
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page is ready for live settings, but it needs `/api/settings`
                connected to Supabase. The API should save one settings row per company/user
                and return integration statuses.
              </p>

              <div className="mt-5 rounded-2xl bg-white/70 p-4 text-xs font-semibold leading-6 text-slate-600">
                GET `/api/settings` → returns settings.
                <br />
                PUT `/api/settings` → saves settings.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}