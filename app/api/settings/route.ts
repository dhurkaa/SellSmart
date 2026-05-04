import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

const getIntegrationStatuses = () => {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  return [
    {
      id: 'supabase',
      name: 'Supabase Database',
      description: 'Stores products, valuations, inventory, sales and settings.',
      status: hasSupabase ? 'connected' : 'needs_attention',
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
      status: 'needs_attention',
    },
    {
      id: 'ai',
      name: 'AI Valuation Engine',
      description: 'Pricing assistant, product analysis and strategy generator.',
      status: hasGroq ? 'connected' : 'needs_attention',
    },
  ];
};

const normalizeSettings = (input: Partial<SettingsPayload>): SettingsPayload => {
  return {
    ...defaultSettings,
    ...input,
    companyName: String(input.companyName || '').slice(0, 120),
    companyLocation: String(input.companyLocation || '').slice(0, 120),
    currency: String(input.currency || 'EUR').slice(0, 10),

    defaultVatPct: String(input.defaultVatPct ?? defaultSettings.defaultVatPct),
    defaultPlatformFeePct: String(
      input.defaultPlatformFeePct ?? defaultSettings.defaultPlatformFeePct
    ),
    defaultAdCostPct: String(input.defaultAdCostPct ?? defaultSettings.defaultAdCostPct),
    minimumMarginPct: String(input.minimumMarginPct ?? defaultSettings.minimumMarginPct),
    targetRoiPct: String(input.targetRoiPct ?? defaultSettings.targetRoiPct),
    maximumDiscountPct: String(input.maximumDiscountPct ?? defaultSettings.maximumDiscountPct),
    confidenceThreshold: String(
      input.confidenceThreshold ?? defaultSettings.confidenceThreshold
    ),

    pricingMode: [
      'balanced',
      'profit_first',
      'cash_flow',
      'market_aggressive',
    ].includes(String(input.pricingMode))
      ? (input.pricingMode as SettingsPayload['pricingMode'])
      : 'balanced',

    aiStrictness: ['conservative', 'balanced', 'aggressive'].includes(
      String(input.aiStrictness)
    )
      ? (input.aiStrictness as SettingsPayload['aiStrictness'])
      : 'balanced',

    marketRefreshFrequency: ['manual', 'daily', 'weekly'].includes(
      String(input.marketRefreshFrequency)
    )
      ? (input.marketRefreshFrequency as SettingsPayload['marketRefreshFrequency'])
      : 'daily',

    reportFormat: ['pdf', 'excel', 'both'].includes(String(input.reportFormat))
      ? (input.reportFormat as SettingsPayload['reportFormat'])
      : 'both',

    accountingMethod: ['gross', 'net'].includes(String(input.accountingMethod))
      ? (input.accountingMethod as SettingsPayload['accountingMethod'])
      : 'gross',

    allowLowConfidenceSuggestions: Boolean(input.allowLowConfidenceSuggestions),
    requireMarketEvidence:
      typeof input.requireMarketEvidence === 'boolean'
        ? input.requireMarketEvidence
        : true,
    autoRefreshMarketData:
      typeof input.autoRefreshMarketData === 'boolean'
        ? input.autoRefreshMarketData
        : true,
    notifyOnLowMargin:
      typeof input.notifyOnLowMargin === 'boolean' ? input.notifyOnLowMargin : true,
    notifyOnHighCompetition:
      typeof input.notifyOnHighCompetition === 'boolean'
        ? input.notifyOnHighCompetition
        : true,
    notifyOnPriceOpportunity:
      typeof input.notifyOnPriceOpportunity === 'boolean'
        ? input.notifyOnPriceOpportunity
        : true,
  };
};

const validateSettings = (settings: SettingsPayload) => {
  const numericFields: Array<keyof SettingsPayload> = [
    'defaultVatPct',
    'defaultPlatformFeePct',
    'defaultAdCostPct',
    'minimumMarginPct',
    'targetRoiPct',
    'maximumDiscountPct',
    'confidenceThreshold',
  ];

  for (const field of numericFields) {
    const value = Number(settings[field]);

    if (!Number.isFinite(value)) {
      return `${String(field)} must be a valid number.`;
    }

    if (value < 0) {
      return `${String(field)} cannot be negative.`;
    }
  }

  const maxDiscount = Number(settings.maximumDiscountPct);
  if (maxDiscount > 100) {
    return 'maximumDiscountPct must be between 0 and 100.';
  }

  const confidence = Number(settings.confidenceThreshold);
  if (confidence > 100) {
    return 'confidenceThreshold must be between 0 and 100.';
  }

  if (!settings.companyName.trim()) {
    return 'companyName is required.';
  }

  if (!settings.companyLocation.trim()) {
    return 'companyLocation is required.';
  }

  return null;
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

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure the company_settings table exists in Supabase.',
        },
        { status: 500 }
      );
    }

    const settings = normalizeSettings((data?.settings || {}) as Partial<SettingsPayload>);

    return NextResponse.json({
      settings,
      integrations: getIntegrationStatuses(),
      updatedAt: data?.updated_at || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load settings.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json();
    const settings = normalizeSettings(body?.settings || {});
    const validationError = validateSettings(settings);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('company_settings')
      .upsert(
        {
          user_id: user.id,
          settings,
          updated_at: now,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Make sure the company_settings table exists and RLS policies allow the logged-in user to manage their row.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: normalizeSettings((data.settings || settings) as Partial<SettingsPayload>),
      integrations: getIntegrationStatuses(),
      updatedAt: data.updated_at || now,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to save settings.',
      },
      { status: 500 }
    );
  }
}