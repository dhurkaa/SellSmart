'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ---------- Types ----------
type BaseInfo = {
  category: string;
  productName: string;
  location: string;
  condition: string;
};

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

type Valuation = {
  seoTitle: string;
  description: string;
  quickSale: string;
  marketBalanced: string;
  maxProfit: string;
  estimatedTime: {
    quickSale: string;
    marketBalanced: string;
    maxProfit: string;
  };
  rationale: string;
  listingType: string;
  confidence: string;
};

type ApiResponse = {
  assistantMessage: string;
  collectedData: Record<string, string>;
  missingInfo: string[];
  readyForValuation: boolean;
  valuation: Valuation | null;
  error?: string;
};

type UploadedImage = {
  id: string;
  name: string;
  preview: string;
  size: number;
  type: string;
  role: 'primary' | 'detail' | 'packaging' | 'bundle' | 'other';
};

type HistoryItem = {
  id: string;
  productName: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  businessGoal: BusinessGoal;
  date: number;
  valuation: Valuation;
  imagePreview?: string;
  evidenceCount?: number;
};

type StageItem = {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'done';
};

type BusinessGoal =
  | 'balanced'
  | 'gross_margin'
  | 'cash_flow'
  | 'stock_clearance'
  | 'market_penetration'
  | 'premium_positioning';

type FinanceControls = {
  landedCost: string;
  shippingCost: string;
  packagingCost: string;
  platformFeePct: string;
  vatPct: string;
  adCostPct: string;
  minimumMarginPct: string;
  maximumDiscountPct: string;
  targetRoiPct: string;
};

type FieldError = {
  field: string;
  message: string;
};

type SessionError = {
  type: 'unauthorized' | 'network' | 'timeout';
  message: string;
} | null;

type PendingAssistantRequest = {
  baseInfo: BaseInfo;
  businessGoal: BusinessGoal;
  financeControls: FinanceControls;
  messages: ChatMessage[];
  images: {
    name: string;
    role: UploadedImage['role'];
    type: string;
    size: number;
  }[];
};



type SidebarItem = {
  href: string;
  label: string;
  icon: string;
};

function DashboardSidebar({
  navItems,
  onLogout,
}: {
  navItems: SidebarItem[];
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[292px] flex-col border-r border-white/60 bg-white/75 backdrop-blur-2xl shadow-[24px_0_70px_-45px_rgba(15,23,42,0.55)]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.12),_transparent_28%)]" />

      <div className="relative flex h-full flex-col p-5">
        <Link href="/" className="mb-6 flex items-center gap-3 rounded-3xl bg-slate-950 px-4 py-4 text-white shadow-2xl shadow-indigo-500/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            ⚡
          </div>
          <div>
            <div className="text-lg font-black leading-tight">SellSmart</div>
            <div className="text-xs font-medium text-slate-300">Company Dashboard</div>
          </div>
        </Link>

        <div className="mb-4 rounded-3xl border border-indigo-100 bg-white/65 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Paneli</div>
          <div className="mt-1 text-sm text-slate-500">Navigim i shpejtë për biznesin.</div>
        </div>

        <nav className="custom-scroll flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`text-lg transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className={`transition-transform ${active ? 'translate-x-0 opacity-100' : 'translate-x-[-4px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                  →
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 space-y-3">
          <Link
            href="/market-intelligence"
            className="block rounded-3xl bg-gradient-to-br from-indigo-50 to-cyan-50 p-4 text-sm font-bold text-slate-800 ring-1 ring-indigo-100 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span>Dashboard i tregut</span>
              <span>📊</span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">Çmime, konkurrentë dhe sinjale reale.</div>
          </Link>

          <button
            onClick={onLogout}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-bold text-white transition-all hover:bg-rose-600"
          >
            Dalje
          </button>
        </div>
      </div>
    </aside>
  );
}


function MobileTopbar({
  navItems,
  onLogout,
}: {
  navItems: SidebarItem[];
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed left-0 right-0 top-0 z-50 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-2xl shadow-[0_18px_45px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white shadow-lg shadow-indigo-500/20">
              ⚡
            </span>
            <span>
              <span className="block text-base font-black leading-tight text-slate-950">SellSmart</span>
              <span className="block text-xs font-semibold text-slate-500">Company Dashboard</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            ☰ Menu
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-[390px] overflow-y-auto border-l border-white/60 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Navigation</div>
                <div className="text-2xl font-black text-slate-950">SellSmart</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition-all active:scale-95"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-black transition-all ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-white/65 text-slate-700 ring-1 ring-slate-200 hover:text-indigo-600'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span>→</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-4 text-left text-sm font-black text-white transition-all active:scale-95"
            >
              🚪 Dalje
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

const initialBaseInfo: BaseInfo = {
  category: '',
  productName: '',
  location: '',
  condition: '',
};

const initialFinanceControls: FinanceControls = {
  landedCost: '',
  shippingCost: '',
  packagingCost: '',
  platformFeePct: '0',
  vatPct: '0',
  adCostPct: '0',
  minimumMarginPct: '18',
  maximumDiscountPct: '15',
  targetRoiPct: '25',
};

const defaultStages: StageItem[] = [
  { id: 'input', label: 'Produkti u kuptua', status: 'waiting' },
  { id: 'images', label: 'Imazhet u analizuan', status: 'waiting' },
  { id: 'market', label: 'Kërkimi në treg', status: 'waiting' },
  { id: 'matching', label: 'Përputhja me konkurrencën', status: 'waiting' },
  { id: 'strategy', label: 'Strategjia u gjenerua', status: 'waiting' },
  { id: 'final', label: 'Rekomandimi është gati', status: 'waiting' },
];

// Validation limits
const VALIDATION_LIMITS = {
  productName: { min: 2, max: 120 },
  location: { min: 2, max: 80 },
  composer: { max: 800 },
  imageMaxCount: 8,
  imageMaxSizeMb: 5,
};

const getGoalLabel = (goal: BusinessGoal) => {
  switch (goal) {
    case 'balanced':
      return 'E balancuar';
    case 'gross_margin':
      return 'Marzhë bruto';
    case 'cash_flow':
      return 'Cash flow';
    case 'stock_clearance':
      return 'Pastrim stoku';
    case 'market_penetration':
      return 'Depërtim në treg';
    case 'premium_positioning':
      return 'Pozicionim premium';
    default:
      return goal;
  }
};

export default function CompanyHome() {
  const router = useRouter();
  const supabase = createClient();
  const pendingRequestRef = useRef<PendingAssistantRequest | null>(null);

  const navItems = [
    { href: '/pricing', label: 'Çmimet', icon: '💰' },
    { href: '/sales', label: 'Shitjet', icon: '📊' },
    { href: '/reports', label: 'Raportet', icon: '📑' },
    { href: '/market-intelligence', label: 'Tregu', icon: '📡' },
    { href: '/accounting', label: 'Kontabiliteti', icon: '🧾' },
    { href: '/imports', label: 'Importet', icon: '🚢' },
    { href: '/products', label: 'Produktet', icon: '📦' },
    { href: '/inventory', label: 'Inventari', icon: '🏪' },
    { href: '/settings', label: 'Cilësimet', icon: '⚙️' },
  ];

  const [started, setStarted] = useState(false);
  const [baseInfo, setBaseInfo] = useState<BaseInfo>(initialBaseInfo);
  const [businessGoal, setBusinessGoal] = useState<BusinessGoal>('balanced');
  const [financeControls, setFinanceControls] = useState<FinanceControls>(initialFinanceControls);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [sessionError, setSessionError] = useState<SessionError>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [marketTrend, setMarketTrend] = useState('➡️ duke analizuar tregun...');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisStages, setAnalysisStages] = useState<StageItem[]>(defaultStages);
  const [retryCount, setRetryCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setSessionError({
            type: 'unauthorized',
            message: 'Sesioni juaj ka skaduar. Ju lutem kyçuni përsëri.',
          });
        }
      } catch {
        setSessionError({
          type: 'network',
          message: 'Nuk mund të verifikohej sesioni. Kontrollo lidhjen e internetit.',
        });
      }
    };
    checkSession();
  }, [supabase]);

  useEffect(() => {
    const saved = localStorage.getItem('valuationHistoryCompany');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      localStorage.removeItem('valuationHistoryCompany');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('valuationHistoryCompany', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  // ***** REPLACED: real market trend derived from valuation confidence *****
  useEffect(() => {
    if (valuation && valuation.confidence) {
      const confidenceNum = parseInt(valuation.confidence, 10) || 50;
      if (confidenceNum >= 80) {
        setMarketTrend('📈 besueshmëri e lartë – çmimi i qëndrueshëm');
      } else if (confidenceNum >= 50) {
        setMarketTrend('➡️ besueshmëri mesatare – verifikoni me burime shtesë');
      } else {
        setMarketTrend('📉 besueshmëri e ulët – mblidhni më shumë sinjale çmimi');
      }
    } else {
      setMarketTrend('📡 në pritje të sinjaleve të tregut');
    }
  }, [valuation]);
  // ***** END OF REPLACEMENT *****

  useEffect(() => {
    return () => {
      uploadedImages.forEach((img) => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [uploadedImages]);

  // Validation function
  const validateField = useCallback((name: string, value: string): string | null => {
    if (name === 'productName') {
      if (!value.trim()) return 'Emri i produktit është i detyrueshëm';
      if (value.length < VALIDATION_LIMITS.productName.min)
        return `Emri duhet të ketë të paktën ${VALIDATION_LIMITS.productName.min} karaktere`;
      if (value.length > VALIDATION_LIMITS.productName.max)
        return `Emri nuk mund të kalojë ${VALIDATION_LIMITS.productName.max} karaktere`;
    }
    if (name === 'location') {
      if (!value.trim()) return 'Lokacioni është i detyrueshëm';
      if (value.length < VALIDATION_LIMITS.location.min)
        return `Lokacioni duhet të ketë të paktën ${VALIDATION_LIMITS.location.min} karaktere`;
      if (value.length > VALIDATION_LIMITS.location.max)
        return `Lokacioni nuk mund të kalojë ${VALIDATION_LIMITS.location.max} karaktere`;
    }
    if (name === 'category' && !value) return 'Kategoria është e detyrueshme';
    if (name === 'condition' && !value) return 'Gjendja është e detyrueshme';
    return null;
  }, []);

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const errors: FieldError[] = [];

    const categoryError = validateField('category', baseInfo.category);
    if (categoryError) errors.push({ field: 'category', message: categoryError });

    const productError = validateField('productName', baseInfo.productName);
    if (productError) errors.push({ field: 'productName', message: productError });

    const locationError = validateField('location', baseInfo.location);
    if (locationError) errors.push({ field: 'location', message: locationError });

    const conditionError = validateField('condition', baseInfo.condition);
    if (conditionError) errors.push({ field: 'condition', message: conditionError });

    setFieldErrors(errors);
    return errors.length === 0;
  }, [baseInfo, validateField]);

  const completionScore = useMemo(() => {
    const values = Object.values(collectedData || {});
    const filled = values.filter((v) => typeof v === 'string' && v.trim() !== '').length;
    const financeFilled = Object.values(financeControls).filter((v) => String(v).trim() !== '').length;
    const base = 18;
    const extra = Math.min(filled * 5, 34);
    const imageBonus = Math.min(uploadedImages.length * 5, 15);
    const financeBonus = Math.min(financeFilled * 3, 21);
    const valuationBonus = valuation ? 12 : 0;
    return Math.min(base + extra + imageBonus + financeBonus + valuationBonus, 100);
  }, [collectedData, valuation, uploadedImages.length, financeControls]);

  const confidenceValue = parseInt(valuation?.confidence || '50', 10) || 50;

  const financialSnapshot = useMemo(() => {
    const landed = Number(financeControls.landedCost) || 0;
    const shipping = Number(financeControls.shippingCost) || 0;
    const packaging = Number(financeControls.packagingCost) || 0;
    const feePct = Number(financeControls.platformFeePct) || 0;
    const vatPct = Number(financeControls.vatPct) || 0;
    const adPct = Number(financeControls.adCostPct) || 0;
    const minMargin = Number(financeControls.minimumMarginPct) || 0;
    const maxDiscount = Number(financeControls.maximumDiscountPct) || 0;
    const roi = Number(financeControls.targetRoiPct) || 0;

    const trueBaseCost = landed + shipping + packaging;
    const safeFloor = trueBaseCost > 0 ? trueBaseCost * (1 + minMargin / 100) : 0;

    const basedOnBalanced =
      Number(String(valuation?.marketBalanced || '').replace(/[^\d.]/g, '')) || 0;
    const feeCost = basedOnBalanced * (feePct / 100);
    const adCost = basedOnBalanced * (adPct / 100);
    const vatCost = basedOnBalanced * (vatPct / 100);
    const contribution = basedOnBalanced - trueBaseCost - feeCost - adCost - vatCost;
    const discountFloor = basedOnBalanced > 0 ? basedOnBalanced * (1 - maxDiscount / 100) : 0;

    return {
      trueBaseCost,
      safeFloor,
      contribution,
      feeCost,
      adCost,
      vatCost,
      discountFloor,
      roi,
    };
  }, [financeControls, valuation]);

  const marketAroundUs = useMemo(() => {
    const pressure =
      businessGoal === 'market_penetration'
        ? 'I lartë'
        : businessGoal === 'premium_positioning'
        ? 'Mesatar'
        : 'I moderuar';

    const promoIntensity =
      businessGoal === 'stock_clearance'
        ? 'Agresiv'
        : businessGoal === 'gross_margin'
        ? 'I kontrolluar'
        : 'I përzier';

    const demandPulse =
      uploadedImages.length > 0
        ? 'Të dhënat vizuale mbështesin përputhje më të fortë të produktit'
        : 'Lexim i kërkesës bazuar vetëm në tekst';

    const saturation =
      baseInfo.category
        ? `Tregu i ${baseInfo.category.toLowerCase()} duket konkurrues`
        : 'Në pritje të kategorisë së produktit';

    return [
      {
        title: 'Presioni nga konkurrenca',
        value: pressure,
        note: 'Sa fort duhet të ndikojë tregu përreth në çmimin final',
      },
      {
        title: 'Intensiteti i promocioneve',
        value: promoIntensity,
        note: 'Sa agresive duket klima e zbritjeve në treg',
      },
      {
        title: 'Pulsi i kërkesës',
        value: demandPulse,
        note: 'Bazuar në kontekstin aktual, imazhet dhe mënyrën e paraqitjes së produktit',
      },
      {
        title: 'Ngopja e tregut',
        value: saturation,
        note: 'Ndihmon për të vendosur nëse duhet mbrojtur marzha apo shtyrë volumi',
      },
    ];
  }, [businessGoal, uploadedImages.length, baseInfo.category]);

  const capitalRisks = useMemo(() => {
    const contribution = financialSnapshot.contribution;
    const safeFloor = financialSnapshot.safeFloor;
    const balanced = Number(String(valuation?.marketBalanced || '').replace(/[^\d.]/g, '')) || 0;

    return [
      {
        title: 'Rreziku i kapitalit qarkullues',
        value: contribution <= 0 ? 'I lartë' : contribution < safeFloor * 0.1 ? 'Mesatar' : 'I ulët',
        note: 'Sa kapital mund të bllokohet nëse çmimi ose shpejtësia e shitjes nuk del si pritet',
        tone: contribution <= 0 ? 'warn' : contribution < safeFloor * 0.1 ? 'info' : 'good',
      },
      {
        title: 'Ngjeshja e marzhës',
        value: balanced > 0 && balanced < safeFloor ? 'I lartë' : 'I kontrolluar',
        note: 'Tregon nëse rekomandimi aktual është shumë afër pragut financiar',
        tone: balanced > 0 && balanced < safeFloor ? 'warn' : 'good',
      },
      {
        title: 'Ekspozimi ndaj luftës së çmimeve',
        value:
          businessGoal === 'market_penetration' || businessGoal === 'stock_clearance'
            ? 'I ngritur'
            : 'I moderuar',
        note: 'Strategjitë me çmim të ulët rrisin rrezikun e reagimit nga konkurrenca',
        tone:
          businessGoal === 'market_penetration' || businessGoal === 'stock_clearance'
            ? 'warn'
            : 'info',
      },
      {
        title: 'Varësia nga zbritjet',
        value: Number(financeControls.maximumDiscountPct) > 20 ? 'E lartë' : 'E menaxhuar',
        note: 'Toleranca e lartë ndaj zbritjeve dobëson kontrollin afatgjatë të çmimit',
        tone: Number(financeControls.maximumDiscountPct) > 20 ? 'warn' : 'good',
      },
    ];
  }, [financialSnapshot, valuation, businessGoal, financeControls.maximumDiscountPct]);

  const imageInsights = useMemo(() => {
    if (uploadedImages.length === 0) return [];
    const insights: string[] = [];
    insights.push(`${uploadedImages.length} imazh${uploadedImages.length > 1 ? 'e' : ''} të ngarkuara`);
    if (uploadedImages.some((img) => img.role === 'primary')) insights.push('Pamja kryesore e produktit është e disponueshme');
    if (uploadedImages.some((img) => img.role === 'detail')) insights.push('Janë të pranishme detaje vizuale të afërta');
    if (uploadedImages.some((img) => img.role === 'bundle')) insights.push('Është shtuar imazh bundle ose konteksti');
    if (uploadedImages.some((img) => img.role === 'packaging')) insights.push('Është shtuar referencë për paketimin ose prezantimin');
    return insights;
  }, [uploadedImages]);

  const strategyHighlights = useMemo(() => {
    if (!valuation) return [];

    return [
      {
        title: 'Çmimi kryesor i rekomanduar',
        value: valuation.marketBalanced,
        note: 'Balanca më e mirë e përgjithshme komerciale',
      },
      {
        title: 'Strategjia për marzhë bruto',
        value: valuation.maxProfit,
        note: 'Mbron më fort ekonominë e njësisë',
      },
      {
        title: 'Strategjia për cash flow',
        value: valuation.quickSale,
        note: 'Projektuar për ritëm më të shpejtë të shitjes',
      },
      {
        title: 'Pragu i sigurt',
        value: financialSnapshot.safeFloor > 0 ? `€${financialSnapshot.safeFloor.toFixed(2)}` : 'Në pritje',
        note: 'Mos zbrit nën këtë pa miratim të qartë',
      },
    ];
  }, [valuation, financialSnapshot.safeFloor]);

  const marketEvidence = useMemo(() => {
    return [
      {
        title: 'Qëndrimi në treg',
        value:
          businessGoal === 'premium_positioning'
            ? 'Premium'
            : businessGoal === 'market_penetration'
            ? 'Depërtim'
            : businessGoal === 'stock_clearance'
            ? 'Pastrim stoku'
            : businessGoal === 'cash_flow'
            ? 'I fokusuar te cash flow'
            : businessGoal === 'gross_margin'
            ? 'I fokusuar te marzha'
            : 'I balancuar',
        note: 'Qëndrimi aktual komercial që drejton rekomandimin',
      },
      {
        title: 'Forca e evidencës',
        value:
          uploadedImages.length >= 3
            ? 'E fortë'
            : uploadedImages.length >= 1
            ? 'Mesatare'
            : 'Bazike',
        note: 'Sa më shumë evidencë, aq më e fortë përputhja e AI',
      },
      {
        title: 'Përputhja me kapitalin',
        value:
          financialSnapshot.trueBaseCost > 0
            ? `Bazë €${financialSnapshot.trueBaseCost.toFixed(2)}`
            : 'Në pritje të të dhënave financiare',
        note: 'Baza financiare që përdoret për të sfiduar ose vërtetuar çmimin e tregut',
      },
    ];
  }, [businessGoal, uploadedImages.length, financialSnapshot.trueBaseCost]);

  const setStageStatus = (id: string, status: StageItem['status']) => {
    setAnalysisStages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const resetStages = () => setAnalysisStages(defaultStages);

  const toLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

  const formatHistoryDate = (date: number) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const handleBaseChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBaseInfo((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    setFieldErrors((prev) => prev.filter((err) => err.field !== name));

    // Validate on change
    const fieldError = validateField(name, value);
    if (fieldError) {
      setFieldErrors((prev) => {
        const withoutField = prev.filter((err) => err.field !== name);
        return [...withoutField, { field: name, message: fieldError }];
      });
    }
  };

  const handleFinanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFinanceControls((prev) => ({ ...prev, [name]: value }));
  };

  const generateImagePayload = (images = uploadedImages) =>
    images.map((img) => ({
      name: img.name,
      role: img.role,
      type: img.type,
      size: img.size,
    }));

  const buildPendingRequest = (nextMessages: ChatMessage[]): PendingAssistantRequest => ({
    baseInfo,
    businessGoal,
    financeControls,
    messages: nextMessages,
    images: generateImagePayload(uploadedImages),
  });

  const callAssistant = async (
    nextMessages: ChatMessage[],
    requestOverride?: PendingAssistantRequest
  ) => {
    if (isSubmitting) return; // Prevent double submit

    const requestPayload = requestOverride ?? buildPendingRequest(nextMessages);
    pendingRequestRef.current = requestPayload;

    setIsSubmitting(true);
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setSessionError(null);
    resetStages();

    setStageStatus('input', 'running');
    setTimeout(() => setStageStatus('input', 'done'), 250);

    if (requestPayload.images.length > 0) {
      setStageStatus('images', 'running');
      setTimeout(() => setStageStatus('images', 'done'), 500);
    }

    setStageStatus('market', 'running');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch('/api/valuation-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setStageStatus('market', 'done');
      setStageStatus('matching', 'running');

      // Handle unauthorized
      if (res.status === 401) {
        setSessionError({
          type: 'unauthorized',
          message: 'Sesioni juaj ka skaduar. Ju lutem kyçuni përsëri.',
        });
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Serveri nuk ktheu JSON valid.');
      }

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server error: ${res.status}`);
      }

      setStageStatus('matching', 'done');
      setStageStatus('strategy', 'running');

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.assistantMessage,
      };

      setMessages([...requestPayload.messages, assistantMessage]);

      const requestTrueBaseCost =
        (Number(requestPayload.financeControls.landedCost) || 0) +
        (Number(requestPayload.financeControls.shippingCost) || 0) +
        (Number(requestPayload.financeControls.packagingCost) || 0);

      setCollectedData({
        ...(data.collectedData || {}),
        businessGoal: getGoalLabel(requestPayload.businessGoal),
        uploadedImages: requestPayload.images.length
          ? `${requestPayload.images.length} të ngarkuara`
          : '',
        financeSummary:
          requestTrueBaseCost > 0
            ? `Bazë €${requestTrueBaseCost.toFixed(2)}`
            : '',
      });

      setMissingInfo(data.missingInfo || []);

      if (data.valuation) {
        setValuation(data.valuation);
        setStageStatus('strategy', 'done');
        setStageStatus('final', 'done');
        setSuccessMessage('Vlerësimi u gjenerua me sukses.');

        const newHistoryItem: HistoryItem = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          productName: requestPayload.baseInfo.productName,
          price: data.valuation.marketBalanced,
          category: requestPayload.baseInfo.category,
          condition: requestPayload.baseInfo.condition,
          location: requestPayload.baseInfo.location,
          businessGoal: requestPayload.businessGoal,
          date: Date.now(),
          valuation: data.valuation,
          imagePreview: uploadedImages[0]?.preview,
          evidenceCount: requestPayload.images.length + Object.keys(data.collectedData || {}).length,
        };

        setHistory((prev) => [newHistoryItem, ...prev].slice(0, 10));
      } else {
        setValuation(null);
        setStageStatus('strategy', 'done');
      }

      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Kërkesa mori shumë kohë. Ju lutem provoni përsëri.');
        setSessionError({ type: 'timeout', message: 'Kërkesa skadoi. Kontrollo lidhjen ose provo përsëri.' });
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Gabim në rrjet. Kontrollo lidhjen e internetit.');
        setSessionError({ type: 'network', message: 'Nuk mund të lidhej me serverin.' });
      } else {
        setError(err?.message || 'Diçka shkoi gabim gjatë komunikimit me AI.');
      }

      // Reset stages on error
      resetStages();
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');
    setSuccessMessage('');
    setSessionError(null);

    // Validate all fields
    if (!validateAllFields()) {
      setError('Ju lutem korrigjoni gabimet në formë përpara se të vazhdoni.');
      return;
    }

    setStarted(true);
    setMessages([]);
    setValuation(null);
    setCollectedData({});
    setMissingInfo([]);
    await callAssistant([]);
  };

  const sendMessage = async () => {
    if (!composer.trim() || loading || valuation || isSubmitting) return;

    // Validate composer length
    if (composer.length > VALIDATION_LIMITS.composer.max) {
      setError(`Mesazhi nuk mund të kalojë ${VALIDATION_LIMITS.composer.max} karaktere.`);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: composer.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setComposer('');

    await callAssistant(nextMessages);
  };

  const handleComposerKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  };

  const resetSession = () => {
    setStarted(false);
    setBaseInfo(initialBaseInfo);
    setBusinessGoal('balanced');
    setFinanceControls(initialFinanceControls);
    setMessages([]);
    setComposer('');
    setLoading(false);
    setValuation(null);
    setCollectedData({});
    setMissingInfo([]);
    setError('');
    setSuccessMessage('');
    setFieldErrors([]);
    setSessionError(null);
    setUploadedImages([]);
    setIsSubmitting(false);
    setRetryCount(0);
    pendingRequestRef.current = null;
    resetStages();
  };

  const retryLastRequest = async () => {
    if (retryCount >= 3) {
      setError('Shumë përpjekje të dështuara. Ju lutem rifreskoni faqen ose provoni më vonë.');
      return;
    }

    if (!pendingRequestRef.current) {
      setError('Nuk ka kërkesë të mëparshme për ta provuar përsëri.');
      return;
    }

    setRetryCount((prev) => prev + 1);
    setError('');
    setSuccessMessage('');
    setSessionError(null);

    await callAssistant(
      pendingRequestRef.current.messages,
      pendingRequestRef.current
    );
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setBaseInfo({
      category: item.category || '',
      productName: item.productName,
      location: item.location,
      condition: item.condition,
    });
    setBusinessGoal(item.businessGoal || 'balanced');
    setValuation(item.valuation);
    setStarted(true);
    setMessages([]);
    setCollectedData({});
    setMissingInfo([]);
    setError('');
    setSuccessMessage('Vlerësimi u ngarkua nga historia.');
    setFieldErrors([]);
    resetStages();
  };

  const handleExport = () => {
    if (!valuation) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Raporti i Kompanisë: ${baseInfo.productName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; background: #ffffff; color: #111827; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { margin: 0.6rem 0; line-height: 1.5; }
            strong { color: #4f46e5; }
          </style>
        </head>
        <body>
          <h1>RAPORTI I KOMPANISË SELLSMART</h1>
          <p><strong>Produkti:</strong> ${baseInfo.productName}</p>
          <p><strong>Qëllimi i biznesit:</strong> ${getGoalLabel(businessGoal)}</p>
          <p><strong>Gjendja:</strong> ${baseInfo.condition}</p>
          <p><strong>Lokacioni:</strong> ${baseInfo.location}</p>
          <p><strong>Shitje e shpejtë:</strong> ${valuation.quickSale} (${valuation.estimatedTime.quickSale})</p>
          <p><strong>E balancuar me tregun:</strong> ${valuation.marketBalanced} (${valuation.estimatedTime.marketBalanced})</p>
          <p><strong>Fitim maksimal:</strong> ${valuation.maxProfit} (${valuation.estimatedTime.maxProfit})</p>
          <p><strong>Pragu i sigurt:</strong> €${financialSnapshot.safeFloor.toFixed(2)}</p>
          <p><strong>Titulli SEO:</strong> ${valuation.seoTitle}</p>
          <p><strong>Përshkrimi:</strong> ${valuation.description}</p>
          <p><strong>Arsyetimi:</strong> ${valuation.rationale}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const addFiles = (files: FileList | File[]) => {
    setError('');
    const incomingFiles = Array.from(files);

    if (uploadedImages.length + incomingFiles.length > VALIDATION_LIMITS.imageMaxCount) {
      setError(`Maksimumi ${VALIDATION_LIMITS.imageMaxCount} imazhe mund të ngarkohen.`);
      return;
    }

    const validFiles = incomingFiles.filter((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" nuk është imazh i vlefshëm.`);
        return false;
      }
      // Validate file size
      if (file.size > VALIDATION_LIMITS.imageMaxSizeMb * 1024 * 1024) {
        setError(`File "${file.name}" kalon limitin prej ${VALIDATION_LIMITS.imageMaxSizeMb}MB.`);
        return false;
      }
      return true;
    });

    const newImages: UploadedImage[] = validFiles.map((file, index) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7) + index,
      name: file.name,
      preview: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      role: uploadedImages.length === 0 && index === 0 ? 'primary' : 'other',
    }));

    if (newImages.length > 0) {
      setUploadedImages((prev) => [...prev, ...newImages]);
      setSuccessMessage(`${newImages.length} imazh(e) u ngarkuan me sukses.`);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => {
      const found = prev.find((img) => img.id === id);
      if (found?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(found.preview);
      }

      const next = prev.filter((img) => img.id !== id);

      if (next.length > 0 && !next.some((img) => img.role === 'primary')) {
        next[0] = { ...next[0], role: 'primary' };
      }

      return next;
    });
  };

  const updateImageRole = (id: string, role: UploadedImage['role']) => {
    setUploadedImages((prev) =>
      prev.map((img) => {
        if (role === 'primary' && img.id !== id && img.role === 'primary') {
          return { ...img, role: 'other' };
        }
        if (img.id === id) {
          return { ...img, role };
        }
        return img;
      })
    );
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors.find((err) => err.field === fieldName)?.message;
  };

  // Render session error
  if (sessionError?.type === 'unauthorized') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
          <div className="glass-card-strong rounded-3xl p-10 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Sesioni ka skaduar</h2>
            <p className="text-slate-600 mb-6">{sessionError.message}</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-lg hover:shadow-indigo-200/50 transition-all"
            >
              Shko te Kyçja
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <>
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
            100% { transform: translateY(0px); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
          .glass-card-strong {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }
          .gradient-text {
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .progress-bar {
            background: linear-gradient(90deg, #4f46e5, #06b6d4);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.15);
          }
          .chat-bubble-user {
            background: linear-gradient(135deg, #eef2ff, #e0f2fe);
            border: 1px solid rgba(99, 102, 241, 0.2);
            box-shadow: 0 8px 20px -8px rgba(99, 102, 241, 0.2);
          }
          .chat-bubble-assistant {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.05);
          }
          .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #4f46e5;
            animation: pulse 1.2s infinite ease-in-out;
          }
          .pulse-dot:nth-child(2) { animation-delay: 0.15s; }
          .pulse-dot:nth-child(3) { animation-delay: 0.3s; }
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          .spinner-dark {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(79, 70, 229, 0.1);
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .stage-dot {
            width: 12px;
            height: 12px;
            border-radius: 999px;
            transition: all 0.2s ease;
          }
          .stage-waiting { background: #cbd5e1; }
          .stage-running {
            background: #4f46e5;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
          }
          .stage-done {
            background: #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
          }
          .custom-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.3);
            border-radius: 999px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(100, 116, 139, 0.5);
          }
          .dropzone {
            transition: all 0.2s ease;
          }
          .dropzone-active {
            border-color: #4f46e5;
            background: rgba(79, 70, 229, 0.05);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }
          .error-shake {
            animation: shake 0.3s ease-in-out;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .sidebar-nav-item {
            transition: all 0.2s ease;
            animation: slideIn 0.3s ease forwards;
            opacity: 0;
          }
          .sidebar-nav-item:nth-child(1) { animation-delay: 0.05s; }
          .sidebar-nav-item:nth-child(2) { animation-delay: 0.1s; }
          .sidebar-nav-item:nth-child(3) { animation-delay: 0.15s; }
          .sidebar-nav-item:nth-child(4) { animation-delay: 0.2s; }
          .sidebar-nav-item:nth-child(5) { animation-delay: 0.25s; }
          .sidebar-nav-item:nth-child(6) { animation-delay: 0.3s; }
          .sidebar-nav-item:nth-child(7) { animation-delay: 0.35s; }
          .sidebar-nav-item:nth-child(8) { animation-delay: 0.4s; }
          .sidebar-nav-item:nth-child(9) { animation-delay: 0.45s; }
          .field-error {
            border-color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.02) !important;
          }
        `}</style>

        <DashboardSidebar navItems={navItems} onLogout={handleLogout} />
        <MobileTopbar navItems={navItems} onLogout={handleLogout} />

        <main className="min-h-screen pt-20 lg:pt-8 lg:pl-[292px] bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.18),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.12),_transparent_18%),linear-gradient(135deg,#f8fafc,#ffffff,#eef2ff)] px-4 pb-4 pt-24 md:px-6 md:pb-6 lg:p-8">
          <div className="max-w-[1920px] mx-auto">
            {/* Header Section */}
            <section className="glass-card-strong rounded-3xl p-6 md:p-8 lg:p-10 mb-8 transition-all hover:shadow-xl">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm border border-indigo-200/50">
                      Qendra e Çmimeve për Kompani
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm">
                      Kontrolle të Kapitalit
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm">
                      Vendimmarrje e Bazuar në Treg
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.1]">
                    SELLSMART
                    <br />
                    <span className="gradient-text">KOMPANI</span>
                  </h1>
                  <p className="mt-6 max-w-2xl text-base md:text-lg text-slate-600 leading-relaxed">
                    Panel i avancuar vetëm për kompani, për shitje strategjike, mbrojtje të fitimit,
                    kontroll të kapitalit dhe pozicionim konkurrues në treg.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-6 w-full xl:w-[400px] transition-all hover:shadow-lg">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Gatishmëria Komerciale</div>
                  <div className="text-5xl md:text-6xl font-black text-slate-900 mt-2">
                    {completionScore}%
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/50 rounded-xl p-3 text-center backdrop-blur-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Imazhe</div>
                      <div className="text-2xl font-black text-slate-900">
                        {uploadedImages.length}/{VALIDATION_LIMITS.imageMaxCount}
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3 text-center backdrop-blur-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Të Dhëna Financiare</div>
                      <div className="text-2xl font-black text-slate-900">
                        {Object.values(financeControls).filter((v) => String(v).trim() !== '').length}/9
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation Bar - Desktop uses fixed sidebar */}
              <div className="mt-6 pt-6 border-t border-white/30 lg:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="sidebar-nav-item group px-4 py-2.5 rounded-xl bg-white/40 backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-gradient-to-r hover:from-indigo-500/90 hover:to-cyan-500/90 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-lg"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span>{item.label}</span>
                      <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="sidebar-nav-item ml-auto px-4 py-2.5 rounded-xl bg-red-50/60 backdrop-blur-sm text-red-600 font-medium text-sm hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-lg"
                  >
                    <span>🚪</span>
                    <span>DALJE</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold text-emerald-800">Sukses</div>
                    <div className="text-sm text-emerald-600">{successMessage}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium text-sm hover:bg-emerald-200 transition-all"
                >
                  Mbylle
                </button>
              </div>
            )}

            {/* Session Error Banner */}
            {sessionError && (() => {
              const currentSessionError = sessionError;
              if (currentSessionError.type === 'unauthorized') return null;

              return (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-semibold text-amber-800">
                        {currentSessionError.type === 'network' ? 'Problem me rrjetin' : 'Timeout i kërkesës'}
                      </div>
                      <div className="text-sm text-amber-600">{currentSessionError.message}</div>
                    </div>
                  </div>
                  <button
                    onClick={retryLastRequest}
                    className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 font-medium text-sm hover:bg-amber-200 transition-all"
                  >
                    Provo Përsëri
                  </button>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
              {/* Left Sidebar - Enhanced Design */}
              <aside className={`2xl:col-span-3 space-y-6 ${sidebarCollapsed ? '2xl:col-span-1' : ''}`}>
                {/* Quick Actions Card */}
                <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 to-white/70">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Veprime të Shpejta</div>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">Paneli i Kontrollit</h3>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={resetSession}
                      className="p-3 rounded-xl bg-white/60 text-left hover:bg-white hover:shadow-md transition-all group"
                    >
                      <span className="text-xl mb-1 block">🔄</span>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">Sesion i Ri</span>
                    </button>
                    <button
                      onClick={() => document.getElementById('demo-trigger')?.click()}
                      className="p-3 rounded-xl bg-white/60 text-left hover:bg-white hover:shadow-md transition-all group"
                    >
                      <span className="text-xl mb-1 block">🎮</span>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">Ngarko Demo</span>
                    </button>
                  </div>
                </div>

                {/* History Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rezultatet e Mëparshme</div>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">Historia</h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">{history.length}/10</div>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-2 opacity-30">📋</div>
                      <div className="text-slate-400 text-sm">— nuk ka vlerësime të mëparshme —</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[720px] overflow-y-auto custom-scroll pr-1">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => loadHistoryItem(item)}
                          className="w-full text-left bg-white/40 backdrop-blur-sm rounded-xl p-3 transition-all hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-indigo-100"
                        >
                          <div className="flex items-start gap-3">
                            {item.imagePreview ? (
                              <img
                                src={item.imagePreview}
                                alt={item.productName}
                                className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center text-xs font-bold text-indigo-500 border border-indigo-200">
                                IMG
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 truncate text-sm">{item.productName}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {item.condition} • {item.location}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-indigo-600 text-sm">{item.price}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{formatHistoryDate(item.date)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Context Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Gjendja Bazë e Objektit</div>
                  <div className="space-y-2">
                    {[
                      ['📂 Kategoria', baseInfo.category || '—'],
                      ['📦 Produkti', baseInfo.productName || '—'],
                      ['📍 Lokacioni', baseInfo.location || '—'],
                      ['🔧 Gjendja', baseInfo.condition || '—'],
                      ['🎯 Qëllimi', getGoalLabel(businessGoal)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white/40 rounded-xl p-3 backdrop-blur-sm border border-white/30">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{label}</div>
                        <div className="text-sm font-bold text-slate-900 break-words">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stages Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rrjedha e Analizës</div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5 mb-4">Fazat</h3>
                  <div className="space-y-2">
                    {analysisStages.map((stage) => (
                      <div key={stage.id} className="flex items-center gap-3 bg-white/40 rounded-xl p-3 backdrop-blur-sm border border-white/30">
                        <span
                          className={`stage-dot ${
                            stage.status === 'waiting'
                              ? 'stage-waiting'
                              : stage.status === 'running'
                              ? 'stage-running'
                              : 'stage-done'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-sm">{stage.label}</div>
                          <div className="text-xs text-slate-500">
                            {stage.status === 'waiting'
                              ? '⏳ në pritje'
                              : stage.status === 'running'
                              ? '🔄 në proces'
                              : '✅ e kryer'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <section className={`2xl:col-span-6 space-y-6 ${sidebarCollapsed ? '2xl:col-span-7' : ''}`}>
                {!started ? (
                  <div className="glass-card-strong rounded-3xl p-6 md:p-8 lg:p-10 space-y-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Sesioni i Vlerësimit për Kompani</div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mt-1">
                          Nis një vendim për çmimin
                        </h2>
                      </div>
                      <div className="px-4 py-2 rounded-full bg-indigo-50 backdrop-blur-sm text-sm font-semibold text-indigo-600 border border-indigo-200">
                        Modalitet ekzekutiv + analitik
                      </div>
                    </div>

                    {/* Error Summary */}
                    {fieldErrors.length > 0 && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="font-semibold text-red-700 mb-2">Ju lutem korrigjoni gabimet e mëposhtme:</div>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {fieldErrors.map((err, i) => (
                            <li key={i}>{err.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <form onSubmit={startSession} className="space-y-8">
                      <div className="space-y-4">
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Qëllimi i Biznesit</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {[
                            ['balanced', 'E balancuar', '⚖️'],
                            ['gross_margin', 'Marzhë Bruto', '📈'],
                            ['cash_flow', 'Cash Flow', '💵'],
                            ['stock_clearance', 'Pastrim Stoku', '🏷️'],
                            ['market_penetration', 'Depërtim në Treg', '🚀'],
                            ['premium_positioning', 'Pozicionim Premium', '💎'],
                          ].map(([value, label, icon]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBusinessGoal(value as BusinessGoal)}
                              className={`px-4 py-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                                businessGoal === value
                                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg border-0'
                                  : 'bg-white/50 border border-slate-200 text-slate-700 hover:bg-white/80'
                              }`}
                            >
                              <span className="text-lg">{icon}</span>
                              <span className="font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-500 uppercase">Kategoria *</span>
                          <select
                            name="category"
                            value={baseInfo.category}
                            onChange={handleBaseChange}
                            className={`mt-2 w-full rounded-xl border bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all ${
                              getFieldError('category') ? 'field-error' : 'border-slate-200'
                            }`}
                            disabled={loading}
                          >
                            <option value="">Zgjidh kategorinë</option>
                            <option value="vehicle">🚗 Automjet</option>
                            <option value="electronics">📱 Elektronikë</option>
                            <option value="general product">📦 Produkt i Përgjithshëm</option>
                            <option value="home goods">🏠 Produkte për Shtëpi</option>
                            <option value="fashion">👕 Modë</option>
                          </select>
                          {getFieldError('category') && (
                            <p className="text-xs text-red-500 mt-1">{getFieldError('category')}</p>
                          )}
                        </label>

                        <label className="block">
                          <span className="text-xs font-semibold text-slate-500 uppercase">Gjendja *</span>
                          <select
                            name="condition"
                            value={baseInfo.condition}
                            onChange={handleBaseChange}
                            className={`mt-2 w-full rounded-xl border bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all ${
                              getFieldError('condition') ? 'field-error' : 'border-slate-200'
                            }`}
                            disabled={loading}
                          >
                            <option value="">Zgjidh gjendjen</option>
                            <option value="New">✨ E re</option>
                            <option value="Excellent">🌟 Shumë e mirë</option>
                            <option value="Good">👍 E mirë</option>
                            <option value="Fair">👌 Mesatare</option>
                            <option value="Used">📦 E përdorur</option>
                          </select>
                          {getFieldError('condition') && (
                            <p className="text-xs text-red-500 mt-1">{getFieldError('condition')}</p>
                          )}
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Emri i produktit *{' '}
                          <span className="font-normal text-slate-400">
                            ({baseInfo.productName.length}/{VALIDATION_LIMITS.productName.max})
                          </span>
                        </span>
                        <input
                          name="productName"
                          value={baseInfo.productName}
                          onChange={handleBaseChange}
                          maxLength={VALIDATION_LIMITS.productName.max}
                          placeholder="p.sh. koleksion premium perdesh / iPhone / linjë produkti e personalizuar"
                          className={`mt-2 w-full rounded-xl border bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all ${
                            getFieldError('productName') ? 'field-error' : 'border-slate-200'
                          }`}
                          disabled={loading}
                        />
                        {getFieldError('productName') && (
                          <p className="text-xs text-red-500 mt-1">{getFieldError('productName')}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Lokacioni *{' '}
                          <span className="font-normal text-slate-400">
                            ({baseInfo.location.length}/{VALIDATION_LIMITS.location.max})
                          </span>
                        </span>
                        <input
                          name="location"
                          value={baseInfo.location}
                          onChange={handleBaseChange}
                          maxLength={VALIDATION_LIMITS.location.max}
                          placeholder="Tregu / qyteti / rajoni"
                          className={`mt-2 w-full rounded-xl border bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all ${
                            getFieldError('location') ? 'field-error' : 'border-slate-200'
                          }`}
                          disabled={loading}
                        />
                        {getFieldError('location') && (
                          <p className="text-xs text-red-500 mt-1">{getFieldError('location')}</p>
                        )}
                      </label>

                      <div className="space-y-4">
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Kontrollet Financiare</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {[
                            ['landedCost', 'Kosto bazë (€)'],
                            ['shippingCost', 'Transport (€)'],
                            ['packagingCost', 'Paketim (€)'],
                            ['platformFeePct', 'Tarifa platformë %'],
                            ['vatPct', 'TVSH %'],
                            ['adCostPct', 'Reklamë %'],
                            ['minimumMarginPct', 'Marzha min %'],
                            ['maximumDiscountPct', 'Zbritja max %'],
                            ['targetRoiPct', 'ROI target %'],
                          ].map(([name, label]) => (
                            <label className="block" key={name}>
                              <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
                              <input
                                name={name}
                                type="number"
                                step="any"
                                value={financeControls[name as keyof FinanceControls]}
                                onChange={handleFinanceChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                                placeholder="0"
                                disabled={loading}
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                            Imazhet e produktit ({uploadedImages.length}/{VALIDATION_LIMITS.imageMaxCount})
                          </span>
                          <div
                            className={`mt-2 dropzone rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                              dragActive ? 'dropzone-active border-indigo-400 bg-indigo-50/30' : 'border-slate-300 bg-white/50'
                            }`}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragActive(true);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                            }}
                          >
                            <div className="text-slate-600">
                              <div className="text-4xl mb-3">📸</div>
                              <div className="text-xl font-black text-slate-900">Ngarko fotot e produktit</div>
                              <div className="text-sm mt-2 text-slate-500">
                                Drag & drop ose kliko për të zgjedhur. Max {VALIDATION_LIMITS.imageMaxSizeMb}MB për imazh.
                              </div>
                              <label className="inline-flex mt-6 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.length) addFiles(e.target.files);
                                  }}
                                  disabled={uploadedImages.length >= VALIDATION_LIMITS.imageMaxCount}
                                />
                                <span
                                  className={`px-6 py-2 rounded-full font-semibold text-sm shadow-sm transition-all ${
                                    uploadedImages.length >= VALIDATION_LIMITS.imageMaxCount
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-white/80 text-indigo-600 hover:bg-white'
                                  }`}
                                >
                                  {uploadedImages.length >= VALIDATION_LIMITS.imageMaxCount ? 'LIMITI I ARRITUR' : 'NGARKO IMAZHET'}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {uploadedImages.map((img) => (
                              <div key={img.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-white/50">
                                <img
                                  src={img.preview}
                                  alt={img.name}
                                  className="w-full h-40 object-cover rounded-lg"
                                />
                                <div className="mt-3">
                                  <div className="font-bold text-slate-900 truncate text-sm">{img.name}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {(img.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </div>
                                <select
                                  value={img.role}
                                  onChange={(e) =>
                                    updateImageRole(img.id, e.target.value as UploadedImage['role'])
                                  }
                                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-300"
                                >
                                  <option value="primary">⭐ Kryesore</option>
                                  <option value="detail">🔍 Detaj</option>
                                  <option value="packaging">📦 Paketim</option>
                                  <option value="bundle">🎁 Bundle</option>
                                  <option value="other">📄 Tjetër</option>
                                </select>
                                <button
                                  type="button"
                                  className="mt-3 w-full rounded-lg bg-red-50 text-red-600 py-2 text-sm font-medium hover:bg-red-100 transition-all"
                                  onClick={() => removeImage(img.id)}
                                >
                                  🗑️ HIQE
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <button
                          type="submit"
                          disabled={loading || isSubmitting}
                          className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Duke u ngarkuar...
                            </>
                          ) : (
                            <>
                              <span>🚀</span> NIS ANALIZËN E KOMPANISË
                            </>
                          )}
                        </button>
                        <button
                          id="demo-trigger"
                          type="button"
                          onClick={() => {
                            setBaseInfo({
                              category: 'home goods',
                              productName: 'Koleksion Premium Perdesh',
                              location: 'Prishtinë',
                              condition: 'New',
                            });
                            setBusinessGoal('gross_margin');
                            setFinanceControls({
                              landedCost: '18',
                              shippingCost: '2',
                              packagingCost: '1.5',
                              platformFeePct: '6',
                              vatPct: '18',
                              adCostPct: '4',
                              minimumMarginPct: '25',
                              maximumDiscountPct: '12',
                              targetRoiPct: '32',
                            });
                            setFieldErrors([]);
                            setError('');
                            setSuccessMessage('Demo u ngarkua me sukses.');
                          }}
                          className="rounded-xl bg-white/80 px-6 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-white transition-all hover:-translate-y-0.5"
                          disabled={loading}
                        >
                          🎮 NGARKO DEMO TË KOMPANISË
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 text-center">* Fushat e detyrueshme</p>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {valuation ? (
                      <div className="glass-card-strong rounded-3xl p-6 md:p-8 lg:p-10">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                          <div>
                            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rekomandimi për Kompaninë</div>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 mt-1">
                              Vlerësimi i Balancuar i Tregut
                            </h2>
                          </div>
                          <button
                            onClick={handleExport}
                            className="px-4 py-2 rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
                          >
                            📄 EKSPORTO RAPORTIN
                          </button>
                        </div>

                        <div className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 break-words">
                          {valuation.marketBalanced}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
                            <div className="text-xs font-semibold text-emerald-600 uppercase">Shitje e Shpejtë</div>
                            <div className="text-3xl font-black text-slate-900">{valuation.quickSale}</div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <span>⏱️</span> {valuation.estimatedTime.quickSale}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100">
                            <div className="text-xs font-semibold text-indigo-600 uppercase">E Balancuar</div>
                            <div className="text-3xl font-black text-slate-900">{valuation.marketBalanced}</div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <span>⏱️</span> {valuation.estimatedTime.marketBalanced}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-100">
                            <div className="text-xs font-semibold text-amber-600 uppercase">Fitim Maksimal</div>
                            <div className="text-3xl font-black text-slate-900">{valuation.maxProfit}</div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <span>⏱️</span> {valuation.estimatedTime.maxProfit}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                          {strategyHighlights.map((item) => (
                            <div key={item.title} className="bg-white/50 rounded-xl p-4 backdrop-blur-sm border border-white/50">
                              <div className="text-xs font-semibold text-slate-500 uppercase">{item.title}</div>
                              <div className="text-2xl font-black text-slate-900">{item.value}</div>
                              <div className="text-sm text-slate-500 mt-2">{item.note}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Kostoja Reale Bazë</div>
                            <div className="text-2xl font-black text-slate-900">
                              €{financialSnapshot.trueBaseCost.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Vlerësim i Kontributit</div>
                            <div className="text-2xl font-black text-slate-900">
                              €{financialSnapshot.contribution.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Kufiri i Zbritjes</div>
                            <div className="text-2xl font-black text-slate-900">
                              €{financialSnapshot.discountFloor.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/50 rounded-xl p-4 mt-6">
                          <div className="text-xs font-semibold text-slate-500 uppercase">Titulli SEO</div>
                          <div className="font-semibold text-slate-900 leading-relaxed">{valuation.seoTitle}</div>
                        </div>

                        <div className="bg-white/50 rounded-xl p-4 mt-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase">Përshkrimi</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{valuation.description}</div>
                        </div>

                        <div className="bg-white/50 rounded-xl p-4 mt-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase">Arsyetimi</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{valuation.rationale}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card rounded-3xl p-10 min-h-[220px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-4">🤖</div>
                          <div className="text-xs font-semibold text-indigo-600 uppercase mb-3">Në pritje të inputit</div>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-700">
                            Po përgatitet hapësira e analizës...
                          </p>
                          {loading && (
                            <div className="flex justify-center mt-6">
                              <div className="spinner-dark"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="glass-card rounded-3xl p-5 md:p-6 lg:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                        <div>
                          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Bisedo me AI</div>
                          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1">
                            Konzola
                          </h3>
                        </div>
                        <button
                          onClick={resetSession}
                          className="px-4 py-2 rounded-full bg-white/80 text-sm font-medium text-slate-600 hover:bg-white transition-all flex items-center gap-2"
                          disabled={loading}
                        >
                          <span>✕</span> SESION I RI
                        </button>
                      </div>

                      <div className="bg-white/60 rounded-2xl h-[460px] md:h-[520px] overflow-y-auto custom-scroll p-4 space-y-4">
                        {messages.length === 0 && !loading && (
                          <div className="h-full flex items-center justify-center text-center">
                            <div>
                              <div className="text-4xl mb-3 opacity-30">💬</div>
                              <div className="text-slate-400 font-medium">— në pritje të inputit —</div>
                            </div>
                          </div>
                        )}

                        {messages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[88%] md:max-w-[78%] rounded-2xl px-5 py-3 ${
                                msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                              }`}
                            >
                              <span className="block text-[10px] tracking-wider uppercase text-slate-400 font-bold mb-1">
                                {msg.role === 'user' ? '👤 Ju' : '🤖 AI'}
                              </span>
                              <span className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</span>
                            </div>
                          </div>
                        ))}

                        {loading && (
                          <div className="flex justify-start">
                            <div className="chat-bubble-assistant rounded-2xl px-5 py-3">
                              <span className="block text-[10px] tracking-wider uppercase text-slate-400 font-bold mb-1">
                                🤖 AI
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                  <span className="pulse-dot" />
                                  <span className="pulse-dot" />
                                  <span className="pulse-dot" />
                                </div>
                                <span className="text-sm text-slate-500">Duke analizuar...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!valuation && (
                        <div className="mt-5 flex flex-col md:flex-row gap-3">
                          <textarea
                            value={composer}
                            onChange={(e) => setComposer(e.target.value.slice(0, VALIDATION_LIMITS.composer.max))}
                            onKeyDown={handleComposerKeyDown}
                            rows={3}
                            maxLength={VALIDATION_LIMITS.composer.max}
                            placeholder="Shkruaj detajet e biznesit ose përgjigju pyetjeve të AI..."
                            className={`flex-1 resize-none rounded-xl border bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[92px] ${
                              composer.length > VALIDATION_LIMITS.composer.max * 0.9 ? 'border-amber-300' : 'border-slate-200'
                            }`}
                            disabled={loading || isSubmitting}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!composer.trim() || loading || isSubmitting}
                            className="md:w-[180px] flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 font-bold text-white shadow-md hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <span className="spinner" />
                                Duke u ngarkuar...
                              </>
                            ) : (
                              <>
                                <span>📤</span> DËRGO
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {composer.length > 0 && (
                        <div className="mt-2 text-right">
                          <span className={`text-xs ${composer.length > VALIDATION_LIMITS.composer.max * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {composer.length}/{VALIDATION_LIMITS.composer.max} karaktere
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Right Sidebar */}
              <aside className={`2xl:col-span-3 space-y-6 ${sidebarCollapsed ? '2xl:col-span-4' : ''}`}>
                {/* Market Signal Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                    <span>📡</span> Tregu përreth nesh
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 text-center mt-3 border border-indigo-100">
                    <div className="text-3xl md:text-4xl font-black text-slate-900">{marketTrend}</div>
                    <div className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-1">
                      <span>📍</span> në {baseInfo.location || 'zonën tënde'}
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    {marketAroundUs.map((item) => (
                      <div key={item.title} className="bg-white/40 rounded-xl p-3 border border-white/30">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{item.title}</div>
                        <div className="font-black text-base text-slate-900">{item.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Intelligence Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                    <span>🖼️</span> Inteligjenca e Imazhit
                  </div>
                  {uploadedImages.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-3xl mb-2 opacity-30">📸</div>
                      <div className="text-slate-400 text-sm">— nuk ka imazhe të ngarkuara —</div>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {imageInsights.map((item, index) => (
                        <div key={index} className="bg-white/40 rounded-xl p-3 font-medium text-slate-700 text-sm border border-white/30 flex items-start gap-2">
                          <span className="text-indigo-400">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Market Evidence Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                    <span>🔬</span> Evidenca e Tregut
                  </div>
                  <div className="space-y-2 mt-3">
                    {marketEvidence.map((item) => (
                      <div key={item.title} className="bg-white/40 rounded-xl p-3 border border-white/30">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{item.title}</div>
                        <div className="font-black text-base text-slate-900">{item.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital Risk Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                    <span>⚠️</span> Rreziku i Kapitalit
                  </div>
                  <div className="space-y-2 mt-3">
                    {capitalRisks.map((item) => (
                      <div
                        key={item.title}
                        className={`rounded-xl p-3 border ${
                          item.tone === 'warn'
                            ? 'bg-amber-50/70 border-amber-200'
                            : item.tone === 'good'
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-sky-50/70 border-sky-200'
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase">{item.title}</div>
                        <div className="font-black text-base">{item.value}</div>
                        <div className="text-xs mt-1 opacity-70">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {valuation && (
                  <div className="glass-card rounded-2xl p-5">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Besueshmëria e Parashikimit</div>
                    <div className="bg-white/40 rounded-xl p-4 mt-3 border border-white/30">
                      <div className="text-center">
                        <span className="text-5xl md:text-6xl font-black text-slate-900">
                          {valuation.confidence}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full rounded-full progress-bar"
                          style={{ width: `${confidenceValue}%` }}
                        />
                      </div>
                      <div className="text-center text-sm text-slate-500 mt-3">Niveli i sigurisë së AI</div>
                    </div>
                  </div>
                )}

                {/* Collected Data Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Të Dhënat e Nxjerra</div>
                  {Object.keys(collectedData).filter(
                    (k) =>
                      collectedData[k] &&
                      typeof collectedData[k] === 'string' &&
                      collectedData[k].trim() !== ''
                  ).length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-slate-400 text-sm">— ende nuk ka të dhëna —</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scroll pr-1 mt-3">
                      {Object.entries(collectedData).map(([k, v]) => {
                        if (v && typeof v === 'string' && v.trim() !== '') {
                          return (
                            <div key={k} className="bg-white/40 rounded-xl p-3 border border-white/30">
                              <div className="text-[10px] font-semibold text-slate-500 uppercase">{toLabel(k)}</div>
                              <div className="font-bold text-slate-900 text-sm break-words">{v}</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>

                {/* Missing Info Card */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Të Dhënat që Mungojnë</div>
                  {missingInfo.length === 0 ? (
                    <div className="bg-emerald-50/70 rounded-xl p-3 text-emerald-700 font-medium text-center text-sm mt-3 border border-emerald-200">
                      ✅ gjithçka është në rregull
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {missingInfo.map((item, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 error-shake">
                    <div className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-2">
                      <span>❌</span> Gabim
                    </div>
                    <p className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setError('')}
                        className="px-4 py-2 rounded-full bg-white/80 text-sm font-medium text-red-600 hover:bg-white transition-all"
                      >
                        MBYLLE
                      </button>
                      {sessionError && (
                        <button
                          onClick={retryLastRequest}
                          className="px-4 py-2 rounded-full bg-red-100 text-sm font-medium text-red-700 hover:bg-red-200 transition-all"
                          disabled={retryCount >= 3}
                        >
                          {retryCount >= 3 ? 'SHUMË PËRPJEKJE' : '🔄 PROVO PËRSËRI'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </main>
      </>
    </AuthGuard>
  );
}