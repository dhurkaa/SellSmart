'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  condition: string;
  location: string;
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
  const navItems = [
    { href: '/pricing', label: 'Çmimet' },
    { href: '/sales', label: 'Shitjet' },
    { href: '/reports', label: 'Raportet' },
    { href: '/market-intelligence', label: 'Tregu' },
    { href: '/accounting', label: 'Kontabiliteti' },
    { href: '/imports', label: 'Importet' },
    { href: '/products', label: 'Produktet' },
    { href: '/inventory', label: 'Inventari' },
    { href: '/settings', label: 'Cilësimet' },
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [marketTrend, setMarketTrend] = useState('➡️ i qëndrueshëm');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisStages, setAnalysisStages] = useState<StageItem[]>(defaultStages);

  useEffect(() => {
    const saved = localStorage.getItem('valuationHistoryCompany');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('valuationHistoryCompany', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const trends = [
      '📈 kërkesa lokale po forcohet',
      '📉 presioni nga zbritjet po rritet',
      '➡️ i qëndrueshëm në tregun tënd',
      '📈 interes për nivel premium',
      '📉 oferta agresive nga konkurrenca',
    ];
    setMarketTrend(trends[Math.floor(Math.random() * trends.length)]);
  }, [baseInfo.category, baseInfo.location, baseInfo.productName, businessGoal]);

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

  const confidenceValue = parseInt(valuation?.confidence || '50') || 50;

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
  };

  const handleFinanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFinanceControls((prev) => ({ ...prev, [name]: value }));
  };

  const generateImagePayload = () =>
    uploadedImages.map((img) => ({
      name: img.name,
      role: img.role,
      type: img.type,
      size: img.size,
    }));

  const callAssistant = async (nextMessages: ChatMessage[]) => {
    setLoading(true);
    setError('');
    resetStages();

    setStageStatus('input', 'running');
    setTimeout(() => setStageStatus('input', 'done'), 250);

    if (uploadedImages.length > 0) {
      setStageStatus('images', 'running');
      setTimeout(() => setStageStatus('images', 'done'), 500);
    }

    setStageStatus('market', 'running');

    try {
      const res = await fetch('/api/valuation-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseInfo,
          businessGoal,
          financeControls,
          messages: nextMessages,
          images: generateImagePayload(),
        }),
      });

      setStageStatus('market', 'done');
      setStageStatus('matching', 'running');

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

      setMessages((prev) => [...nextMessages, assistantMessage]);

      setCollectedData({
        ...(data.collectedData || {}),
        businessGoal: getGoalLabel(businessGoal),
        uploadedImages: uploadedImages.length ? `${uploadedImages.length} të ngarkuara` : '',
        financeSummary:
          financialSnapshot.trueBaseCost > 0
            ? `Bazë €${financialSnapshot.trueBaseCost.toFixed(2)}`
            : '',
      });

      setMissingInfo(data.missingInfo || []);

      if (data.valuation) {
        setValuation(data.valuation);
        setStageStatus('strategy', 'done');
        setStageStatus('final', 'done');

        const newHistoryItem: HistoryItem = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          productName: baseInfo.productName,
          price: data.valuation.marketBalanced,
          condition: baseInfo.condition,
          location: baseInfo.location,
          date: Date.now(),
          valuation: data.valuation,
          imagePreview: uploadedImages[0]?.preview,
          evidenceCount: uploadedImages.length + Object.keys(data.collectedData || {}).length,
        };

        setHistory((prev) => [newHistoryItem, ...prev].slice(0, 10));
      } else {
        setValuation(null);
        setStageStatus('strategy', 'done');
      }
    } catch (err: any) {
      setError(err?.message || 'Diçka shkoi gabim gjatë komunikimit me AI.');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !baseInfo.category.trim() ||
      !baseInfo.productName.trim() ||
      !baseInfo.location.trim() ||
      !baseInfo.condition.trim()
    ) {
      setError('Ju lutem plotëso të gjitha fushat bazë përpara se të vazhdoni.');
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
    if (!composer.trim() || loading || valuation) return;

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
    setUploadedImages([]);
    resetStages();
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setBaseInfo({
      category: item.valuation?.seoTitle?.split(' ')[0] || '',
      productName: item.productName,
      location: item.location,
      condition: item.condition,
    });
    setValuation(item.valuation);
    setStarted(true);
    setMessages([]);
    setCollectedData({});
    setMissingInfo([]);
    setError('');
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
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage: UploadedImage = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          name: file.name,
          preview: String(reader.result),
          size: file.size,
          type: file.type,
          role: uploadedImages.length === 0 && index === 0 ? 'primary' : 'other',
        };

        setUploadedImages((prev) => [...prev, newImage].slice(0, 8));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
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

  return (
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
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto">
          {/* Header Section */}
          <section className="glass-card-strong rounded-3xl p-6 md:p-8 lg:p-10 mb-8 transition-all hover:shadow-xl">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm">
                    Qendra e Çmimeve për Kompani
                  </span>
                  <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm">
                    Kontrolle të Kapitalit dhe Marzhës
                  </span>
                  <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-indigo-600 font-semibold text-sm shadow-sm">
                    Vendimmarrje e Bazuar në Treg
                  </span>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-white/80 hover:text-indigo-600 transition-all hover:-translate-y-0.5"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    DALJE
                  </button>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  SELLSMART<br />
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
                    <div className="text-2xl font-black text-slate-900">{uploadedImages.length}</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Të Dhëna Financiare</div>
                    <div className="text-2xl font-black text-slate-900">
                      {Object.values(financeControls).filter((v) => String(v).trim() !== '').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="2xl:col-span-3 space-y-6">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rezultatet e Mëparshme</div>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Historia</h3>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/60 text-sm font-semibold text-slate-600">{history.length}/10</div>
                </div>

                {history.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">— nuk ka vlerësime të mëparshme —</div>
                ) : (
                  <div className="space-y-3 max-h-[720px] overflow-y-auto custom-scroll pr-1">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left bg-white/50 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-3">
                          {item.imagePreview ? (
                            <img
                              src={item.imagePreview}
                              alt={item.productName}
                              className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200">
                              IMG
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                  {item.condition} • {item.location}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-indigo-600">{item.price}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{formatHistoryDate(item.date)}</div>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                                {item.valuation.confidence} besueshmëri
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                evidenca {item.evidenceCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Gjendja Bazë e Objektit</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Konteksti</h3>
                <div className="space-y-3">
                  {[
                    ['Kategoria', baseInfo.category || '—'],
                    ['Produkti', baseInfo.productName || '—'],
                    ['Lokacioni', baseInfo.location || '—'],
                    ['Gjendja', baseInfo.condition || '—'],
                    ['Qëllimi', getGoalLabel(businessGoal)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white/50 rounded-xl p-3 backdrop-blur-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase">{label}</div>
                      <div className="text-lg font-bold text-slate-900 break-words">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rrjedha e Analizës</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Fazat</h3>
                <div className="space-y-3">
                  {analysisStages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-3 bg-white/50 rounded-xl p-3 backdrop-blur-sm">
                      <span
                        className={`stage-dot ${
                          stage.status === 'waiting'
                            ? 'stage-waiting'
                            : stage.status === 'running'
                            ? 'stage-running'
                            : 'stage-done'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{stage.label}</div>
                        <div className="text-sm text-slate-500">
                          {stage.status === 'waiting'
                            ? 'në pritje'
                            : stage.status === 'running'
                            ? 'në proces'
                            : 'e kryer'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="2xl:col-span-6 space-y-6">
              {!started ? (
                <div className="glass-card-strong rounded-3xl p-6 md:p-8 lg:p-10 space-y-8">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Sesioni i Vlerësimit për Kompani</div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mt-1">
                        Nis një vendim për çmimin
                      </h2>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-sm font-semibold text-slate-600">
                      Modalitet ekzekutiv + analitik
                    </div>
                  </div>

                  <form onSubmit={startSession} className="space-y-8">
                    <div className="space-y-4">
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Qëllimi i Biznesit</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {[
                          ['balanced', 'E balancuar'],
                          ['gross_margin', 'Marzhë Bruto'],
                          ['cash_flow', 'Cash Flow'],
                          ['stock_clearance', 'Pastrim Stoku'],
                          ['market_penetration', 'Depërtim në Treg'],
                          ['premium_positioning', 'Pozicionim Premium'],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setBusinessGoal(value as BusinessGoal)}
                            className={`px-4 py-3 rounded-xl text-left transition-all ${
                              businessGoal === value
                                ? 'bg-indigo-100 border border-indigo-200 shadow-md font-bold text-indigo-800'
                                : 'bg-white/50 border border-slate-200 text-slate-700 hover:bg-white/80'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Kategoria</span>
                        <select
                          name="category"
                          value={baseInfo.category}
                          onChange={handleBaseChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                          disabled={loading}
                        >
                          <option value="">Zgjidh kategorinë</option>
                          <option value="vehicle">Automjet</option>
                          <option value="electronics">Elektronikë</option>
                          <option value="general product">Produkt i Përgjithshëm</option>
                          <option value="home goods">Produkte për Shtëpi</option>
                          <option value="fashion">Modë</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Gjendja</span>
                        <select
                          name="condition"
                          value={baseInfo.condition}
                          onChange={handleBaseChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                          disabled={loading}
                        >
                          <option value="">Zgjidh gjendjen</option>
                          <option value="Excellent">Shumë e mirë</option>
                          <option value="Good">E mirë</option>
                          <option value="Fair">Mesatare</option>
                          <option value="Used">E përdorur</option>
                          <option value="New">E re</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Emri i produktit</span>
                      <input
                        name="productName"
                        value={baseInfo.productName}
                        onChange={handleBaseChange}
                        placeholder="p.sh. koleksion premium perdesh / iPhone / linjë produkti e personalizuar"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                        disabled={loading}
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Lokacioni</span>
                      <input
                        name="location"
                        value={baseInfo.location}
                        onChange={handleBaseChange}
                        placeholder="Tregu / qyteti / rajoni"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all"
                        disabled={loading}
                      />
                    </label>

                    <div className="space-y-4">
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Kontrollet Financiare</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[
                          ['landedCost', 'Kosto bazë'],
                          ['shippingCost', 'Kosto e transportit'],
                          ['packagingCost', 'Kosto e paketimit'],
                          ['platformFeePct', 'Tarifa e platformës %'],
                          ['vatPct', 'TVSH %'],
                          ['adCostPct', 'Kosto reklame %'],
                          ['minimumMarginPct', 'Marzha minimale %'],
                          ['maximumDiscountPct', 'Zbritja maksimale %'],
                          ['targetRoiPct', 'Objektivi ROI %'],
                        ].map(([name, label]) => (
                          <label className="block" key={name}>
                            <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
                            <input
                              name={name}
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
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Imazhet e produktit</span>
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
                            <div className="text-xl font-black text-slate-900">Ngarko fotot e produktit me drag & drop</div>
                            <div className="text-sm mt-2 text-slate-500">
                              Shto fotografinë kryesore, detaje, paketimin dhe kontekstin e bundle-it
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
                              />
                              <span className="px-6 py-2 rounded-full bg-white/80 text-indigo-600 font-semibold text-sm shadow-sm hover:bg-white transition-all">
                                NGARKO IMAZHET
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {uploadedImages.map((img) => (
                            <div key={img.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <div className="mt-3">
                                <div className="font-bold text-slate-900 truncate">{img.name}</div>
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
                                <option value="primary">Kryesore</option>
                                <option value="detail">Detaj</option>
                                <option value="packaging">Paketim</option>
                                <option value="bundle">Bundle</option>
                                <option value="other">Tjetër</option>
                              </select>
                              <button
                                type="button"
                                className="mt-3 w-full rounded-lg bg-red-50 text-red-600 py-2 text-sm font-medium hover:bg-red-100 transition-all"
                                onClick={() => removeImage(img.id)}
                              >
                                HIQE
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <span className="spinner" />
                            Duke u ngarkuar...
                          </>
                        ) : (
                          'NIS ANALIZËN E KOMPANISË'
                        )}
                      </button>
                      <button
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
                        }}
                        className="rounded-xl bg-white/80 px-6 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-white transition-all hover:-translate-y-0.5"
                        disabled={loading}
                      >
                        NGARKO DEMO TË KOMPANISË
                      </button>
                    </div>
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
                        <button onClick={handleExport} className="px-4 py-2 rounded-full bg-white/80 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white transition-all">
                          EKSPORTO RAPORTIN
                        </button>
                      </div>

                      <div className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 break-words">
                        {valuation.marketBalanced}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                          <div className="text-xs font-semibold text-slate-500 uppercase">Shitje e Shpejtë</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.quickSale}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.quickSale}</div>
                        </div>
                        <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                          <div className="text-xs font-semibold text-slate-500 uppercase">E Balancuar me Tregun</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.marketBalanced}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.marketBalanced}</div>
                        </div>
                        <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                          <div className="text-xs font-semibold text-slate-500 uppercase">Fitim Maksimal</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.maxProfit}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.maxProfit}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                        {strategyHighlights.map((item) => (
                          <div key={item.title} className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
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
                        <div className="text-xs font-semibold text-indigo-600 uppercase mb-3">Në pritje të inputit</div>
                        <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-700">
                          Po përgatitet hapësira e analizës për kompaninë...
                        </p>
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
                      <button onClick={resetSession} className="px-4 py-2 rounded-full bg-white/80 text-sm font-medium text-slate-600 hover:bg-white transition-all" disabled={loading}>
                        ✕ SESION I RI
                      </button>
                    </div>

                    <div className="bg-white/60 rounded-2xl h-[460px] md:h-[520px] overflow-y-auto custom-scroll p-4 space-y-4">
                      {messages.length === 0 && !loading && (
                        <div className="h-full flex items-center justify-center text-center text-slate-400 font-medium">
                          — në pritje të inputit —
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
                              {msg.role === 'user' ? 'Ju' : 'AI'}
                            </span>
                            <span className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</span>
                          </div>
                        </div>
                      ))}

                      {loading && (
                        <div className="flex justify-start">
                          <div className="chat-bubble-assistant rounded-2xl px-5 py-3">
                            <span className="block text-[10px] tracking-wider uppercase text-slate-400 font-bold mb-1">
                              AI
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2">
                                <span className="pulse-dot" />
                                <span className="pulse-dot" />
                                <span className="pulse-dot" />
                              </div>
                              <span className="text-sm text-slate-500">Duke gjeneruar përgjigjen...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!valuation && (
                      <div className="mt-5 flex flex-col md:flex-row gap-3">
                        <textarea
                          value={composer}
                          onChange={(e) => setComposer(e.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          rows={3}
                          placeholder="Shkruaj detajet e biznesit ose përgjigju pyetjeve të AI..."
                          className="flex-1 resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[92px]"
                          disabled={loading}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!composer.trim() || loading}
                          className="md:w-[180px] flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 font-bold text-white shadow-md hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Duke u ngarkuar...
                            </>
                          ) : (
                            'DËRGO'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Right Sidebar */}
            <aside className="2xl:col-span-3 space-y-6">
              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tregu përreth nesh</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Sinjali</h3>
                <div className="bg-white/50 rounded-xl p-4 text-center mb-4">
                  <div className="text-3xl md:text-4xl font-black text-slate-900">{marketTrend}</div>
                  <div className="text-sm text-slate-500 mt-2">në {baseInfo.location || 'zonën tënde'}</div>
                </div>
                <div className="space-y-3">
                  {marketAroundUs.map((item) => (
                    <div key={item.title} className="bg-white/50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase">{item.title}</div>
                      <div className="font-black text-xl text-slate-900">{item.value}</div>
                      <div className="text-sm text-slate-500 mt-1">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Inteligjenca e Imazhit</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Pamjet</h3>
                {uploadedImages.length === 0 ? (
                  <div className="text-center text-slate-400 py-6">— nuk ka imazhe të ngarkuara —</div>
                ) : (
                  <div className="space-y-2">
                    {imageInsights.map((item, index) => (
                      <div key={index} className="bg-white/50 rounded-xl p-3 font-medium text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Evidenca e Tregut</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Kërkimi</h3>
                <div className="space-y-3">
                  {marketEvidence.map((item) => (
                    <div key={item.title} className="bg-white/50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase">{item.title}</div>
                      <div className="font-black text-xl text-slate-900">{item.value}</div>
                      <div className="text-sm text-slate-500 mt-1">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rreziku i Kapitalit</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Rreziku</h3>
                <div className="space-y-3">
                  {capitalRisks.map((item) => (
                    <div
                      key={item.title}
                      className={`rounded-xl p-3 ${
                        item.tone === 'warn'
                          ? 'bg-amber-50 border border-amber-200'
                          : item.tone === 'good'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-sky-50 border border-sky-200'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase">{item.title}</div>
                      <div className="font-black text-xl">{item.value}</div>
                      <div className="text-sm mt-1">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {valuation && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Besueshmëria e Parashikimit</div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Besueshmëria</h3>
                  <div className="bg-white/50 rounded-xl p-4">
                    <div className="text-center mb-4">
                      <span className="text-5xl md:text-6xl font-black text-slate-900">
                        {valuation.confidence}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full progress-bar"
                        style={{ width: `${confidenceValue}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-slate-500 mt-3">Niveli i sigurisë së AI</div>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Të Dhënat e Nxjerra</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Të Nxjerra</h3>
                {Object.keys(collectedData).filter(
                  (k) =>
                    collectedData[k] &&
                    typeof collectedData[k] === 'string' &&
                    collectedData[k].trim() !== ''
                ).length === 0 ? (
                  <div className="text-center text-slate-400 py-6">— ende nuk ka të dhëna —</div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scroll pr-1">
                    {Object.entries(collectedData).map(([k, v]) => {
                      if (v && typeof v === 'string' && v.trim() !== '') {
                        return (
                          <div key={k} className="bg-white/50 rounded-xl p-3">
                            <div className="text-xs font-semibold text-slate-500 uppercase">{toLabel(k)}</div>
                            <div className="font-bold text-slate-900 break-words">{v}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Të Dhënat që Mungojnë</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1 mb-4">Mungojnë</h3>
                {missingInfo.length === 0 ? (
                  <div className="bg-emerald-50 rounded-xl p-3 text-emerald-700 font-medium text-center">— gjithçka është në rregull —</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {missingInfo.map((item, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="text-xs font-semibold text-red-500 uppercase tracking-wider">Gabim në API</div>
                  <h3 className="text-2xl font-black text-red-700 mt-1 mb-2">Diçka shkoi gabim</h3>
                  <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
                  <button onClick={() => setError('')} className="mt-4 px-4 py-2 rounded-full bg-white/80 text-sm font-medium text-red-600 hover:bg-white transition-all">
                    MBYLLE
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}