'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';

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

const initialBaseInfo: BaseInfo = {
  category: '',
  productName: '',
  location: '',
  condition: '',
};

const defaultStages: StageItem[] = [
  { id: 'input', label: 'Product understood', status: 'waiting' },
  { id: 'images', label: 'Images analyzed', status: 'waiting' },
  { id: 'market', label: 'Market research', status: 'waiting' },
  { id: 'matching', label: 'Competitor matching', status: 'waiting' },
  { id: 'strategy', label: 'Strategy generated', status: 'waiting' },
  { id: 'final', label: 'Recommendation ready', status: 'waiting' },
];

export default function Home() {
  const router = useRouter();
const supabase = createClient();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/auth/login');
  router.refresh();
};
  const [started, setStarted] = useState(false);
  const [baseInfo, setBaseInfo] = useState<BaseInfo>(initialBaseInfo);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [marketTrend, setMarketTrend] = useState('➡️ stable');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisStages, setAnalysisStages] = useState<StageItem[]>(defaultStages);

  useEffect(() => {
    const saved = localStorage.getItem('valuationHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('valuationHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const trends = ['📈 +5.2%', '📉 -2.1%', '➡️ stable', '📈 premium demand', '📉 discount-heavy'];
    const randomIndex = Math.floor(Math.random() * trends.length);
    setMarketTrend(trends[randomIndex]);
  }, [baseInfo.category, baseInfo.location, baseInfo.productName]);

  const completionScore = useMemo(() => {
    const values = Object.values(collectedData || {});
    const filled = values.filter((v) => typeof v === 'string' && v.trim() !== '').length;
    const base = 22;
    const extra = Math.min(filled * 7, 50);
    const imageBonus = Math.min(uploadedImages.length * 6, 18);
    const valuationBonus = valuation ? 18 : 0;
    return Math.min(base + extra + imageBonus + valuationBonus, 100);
  }, [collectedData, valuation, uploadedImages.length]);

  const confidenceValue = parseInt(valuation?.confidence || '50') || 50;

  const imageInsights = useMemo(() => {
    if (uploadedImages.length === 0) return [];

    const insights: string[] = [];
    insights.push(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded`);
    if (uploadedImages.some((img) => img.role === 'primary')) insights.push('Primary product angle available');
    if (uploadedImages.some((img) => img.role === 'detail')) insights.push('Close-up/detail reference present');
    if (uploadedImages.some((img) => img.role === 'bundle')) insights.push('Bundle/context image available');

    const totalMb =
      uploadedImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024);

    if (totalMb > 6) {
      insights.push('Rich visual context uploaded');
    } else {
      insights.push('Basic visual context uploaded');
    }

    return insights;
  }, [uploadedImages]);

  const marketEvidence = useMemo(() => {
    const product = baseInfo.productName || 'your product';
    const category = baseInfo.category || 'general market';

    return [
      {
        title: 'Comparable range',
        value:
          valuation?.marketBalanced ||
          'Pending',
        note: `Similar ${category.toLowerCase()} items around ${baseInfo.location || 'your market'}`,
      },
      {
        title: 'Positioning',
        value:
          uploadedImages.length > 0
            ? 'Image-assisted'
            : 'Text-based',
        note: `AI can refine positioning for ${product}`,
      },
      {
        title: 'Research scope',
        value:
          uploadedImages.length > 1
            ? 'Broader'
            : 'Standard',
        note: 'More product evidence improves matching quality',
      },
    ];
  }, [baseInfo, uploadedImages.length, valuation]);

  const strategyHighlights = useMemo(() => {
    if (!valuation) return [];

    return [
      {
        title: 'Recommended anchor',
        value: valuation.marketBalanced,
        note: 'Best overall balance between sale speed and profit',
      },
      {
        title: 'Fast-sell move',
        value: valuation.quickSale,
        note: valuation.estimatedTime.quickSale,
      },
      {
        title: 'Premium strategy',
        value: valuation.maxProfit,
        note: valuation.estimatedTime.maxProfit,
      },
    ];
  }, [valuation]);

  const handleBaseChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBaseInfo((prev) => ({ ...prev, [name]: value }));
  };

  const toLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

  const formatHistoryDate = (date: number) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const setStageStatus = (id: string, status: StageItem['status']) => {
    setAnalysisStages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const resetStages = () => setAnalysisStages(defaultStages);

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
    } else {
      setStageStatus('images', 'waiting');
    }

    setStageStatus('market', 'running');
    setStageStatus('matching', 'waiting');
    setStageStatus('strategy', 'waiting');
    setStageStatus('final', 'waiting');

    try {
      const res = await fetch('/api/valuation-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseInfo,
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

      setMessages((prev) => {
        const candidate = [...nextMessages, assistantMessage];
        const deduped: ChatMessage[] = [];

        for (const msg of candidate) {
          const last = deduped[deduped.length - 1];
          if (
            last &&
            last.role === msg.role &&
            last.content.trim() === msg.content.trim()
          )
            continue;
          deduped.push(msg);
        }

        return deduped;
      });

      const mergedCollectedData = {
        ...(data.collectedData || {}),
        uploadedImages: uploadedImages.length ? `${uploadedImages.length} uploaded` : '',
        imageRoles:
          uploadedImages.length > 0
            ? uploadedImages.map((img) => img.role).join(', ')
            : '',
      };

      setCollectedData(mergedCollectedData);
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
          <title>Valuation: ${baseInfo.productName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 2rem;
              background: #ffffff;
              color: #111827;
            }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { margin: 0.6rem 0; line-height: 1.5; }
            strong { color: #4f46e5; }
          </style>
        </head>
        <body>
          <h1>SELLSMART VALUATION</h1>
          <p><strong>Product:</strong> ${baseInfo.productName}</p>
          <p><strong>Condition:</strong> ${baseInfo.condition}</p>
          <p><strong>Location:</strong> ${baseInfo.location}</p>
          <p><strong>Quick Sale:</strong> ${valuation.quickSale} (${valuation.estimatedTime.quickSale})</p>
          <p><strong>Market Balanced:</strong> ${valuation.marketBalanced} (${valuation.estimatedTime.marketBalanced})</p>
          <p><strong>Max Profit:</strong> ${valuation.maxProfit} (${valuation.estimatedTime.maxProfit})</p>
          <p><strong>SEO Title:</strong> ${valuation.seoTitle}</p>
          <p><strong>Description:</strong> ${valuation.description}</p>
          <p><strong>Rationale:</strong> ${valuation.rationale}</p>
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
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #0f172a;
          background:
            radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 30%),
            radial-gradient(circle at 100% 0%, rgba(14, 165, 233, 0.10), transparent 28%),
            radial-gradient(circle at 50% 100%, rgba(244, 114, 182, 0.08), transparent 30%),
            linear-gradient(180deg, #fcfcfe 0%, #f8fafc 44%, #f6f7fb 100%);
        }

        .surface {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.06),
            0 8px 24px rgba(15, 23, 42, 0.03),
            inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(16px);
        }

        .surface-strong {
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78));
          border: 1px solid rgba(255,255,255,0.92);
          box-shadow:
            0 24px 80px rgba(99, 102, 241, 0.08),
            0 12px 30px rgba(15, 23, 42, 0.05),
            inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(18px);
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #64748b;
        }

        .tiny {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .lux-input {
          width: 100%;
          border-radius: 18px;
          border: 1px solid #dbe2ea;
          background: rgba(255,255,255,0.92);
          padding: 14px 16px;
          font-size: 15px;
          color: #0f172a;
          outline: none;
          transition: all 0.18s ease;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.95),
            0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .lux-input::placeholder { color: #94a3b8; }

        .lux-input:focus {
          border-color: rgba(99, 102, 241, 0.42);
          box-shadow:
            0 0 0 5px rgba(99, 102, 241, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.95);
        }

        .lux-input option {
          color: #0f172a;
          background: white;
        }

        .primary-btn {
          border: 0;
          border-radius: 20px;
          padding: 15px 22px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 42%, #0ea5e9 100%);
          box-shadow:
            0 18px 40px rgba(99, 102, 241, 0.22),
            inset 0 1px 0 rgba(255,255,255,0.25);
          transition: all 0.18s ease;
          cursor: pointer;
        }

        .primary-btn:hover { transform: translateY(-1px); }
        .primary-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .ghost-btn {
          border-radius: 18px;
          padding: 14px 18px;
          font-weight: 700;
          color: #0f172a;
          background: rgba(255,255,255,0.72);
          border: 1px solid #e2e8f0;
          transition: all 0.18s ease;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
          cursor: pointer;
        }

        .ghost-btn:hover {
          background: rgba(255,255,255,0.95);
          transform: translateY(-1px);
        }

        .ghost-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .metric {
          border-radius: 24px;
          padding: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.72));
          border: 1px solid rgba(226,232,240,0.95);
          box-shadow:
            0 10px 25px rgba(15, 23, 42, 0.04),
            inset 0 1px 0 rgba(255,255,255,0.95);
        }

        .history-item {
          width: 100%;
          text-align: left;
          border-radius: 22px;
          padding: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.66));
          border: 1px solid rgba(226,232,240,0.95);
          transition: all 0.18s ease;
          box-shadow: 0 8px 20px rgba(15,23,42,0.03);
          cursor: pointer;
        }

        .history-item:hover {
          transform: translateY(-2px);
          border-color: rgba(99,102,241,0.22);
        }

        .chat-shell {
          background:
            radial-gradient(circle at top, rgba(99,102,241,0.06), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.62));
          border: 1px solid rgba(226,232,240,0.95);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .assistant-bubble {
          background: rgba(255,255,255,0.86);
          color: #0f172a;
          border: 1px solid rgba(226,232,240,0.95);
          box-shadow: 0 8px 22px rgba(15,23,42,0.04);
        }

        .user-bubble {
          background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);
          color: #0f172a;
          border: 1px solid rgba(191,219,254,0.9);
          box-shadow: 0 10px 24px rgba(59,130,246,0.08);
        }

        .chip {
          border-radius: 999px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(226,232,240,0.95);
          color: #334155;
          font-weight: 600;
          font-size: 13px;
        }

        .status-good {
          background: linear-gradient(135deg, rgba(236,253,245,1), rgba(209,250,229,0.85));
          color: #065f46;
          border: 1px solid rgba(167,243,208,1);
        }

        .status-warn {
          background: linear-gradient(135deg, rgba(255,251,235,1), rgba(254,240,138,0.38));
          color: #92400e;
          border: 1px solid rgba(253,224,71,0.55);
        }

        .status-info {
          background: linear-gradient(135deg, rgba(239,246,255,1), rgba(219,234,254,0.85));
          color: #1d4ed8;
          border: 1px solid rgba(191,219,254,1);
        }

        .danger-card {
          background: linear-gradient(180deg, rgba(254,242,242,0.96), rgba(255,255,255,0.84));
          border: 1px solid rgba(254,202,202,1);
          box-shadow: 0 12px 30px rgba(239,68,68,0.08);
        }

        .progress-track {
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(226,232,240,0.9);
          box-shadow: inset 0 1px 2px rgba(15,23,42,0.05);
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 42%, #0ea5e9 100%);
          box-shadow: 0 4px 14px rgba(99,102,241,0.22);
          transition: width .4s ease;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.45);
          border-radius: 999px;
        }

        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #6366f1;
          animation: pulse 1.2s infinite ease-in-out;
        }

        .pulse-dot:nth-child(2) { animation-delay: 0.15s; }
        .pulse-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.45);
          border-top-color: white;
          border-radius: 999px;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .dropzone {
          border: 1.5px dashed #cbd5e1;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.82));
          padding: 20px;
          transition: all 0.18s ease;
        }

        .dropzone.active {
          border-color: #6366f1;
          box-shadow: 0 0 0 5px rgba(99,102,241,0.08);
          background: linear-gradient(180deg, rgba(238,242,255,0.9), rgba(224,242,254,0.7));
        }

        .thumb {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(226,232,240,0.95);
          background: white;
          box-shadow: 0 10px 25px rgba(15,23,42,0.05);
        }

        .stage-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .stage-waiting { background: #cbd5e1; }
        .stage-running { background: #6366f1; box-shadow: 0 0 0 6px rgba(99,102,241,0.1); }
        .stage-done { background: #10b981; box-shadow: 0 0 0 6px rgba(16,185,129,0.08); }
      `}</style>

      <main className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-[1780px] mx-auto">
          <section className="surface-strong rounded-[34px] p-6 md:p-8 lg:p-10 mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-3 mb-5">
  <span className="chip">AI Pricing Intelligence</span>
  <span className="chip">Image Upload Enabled</span>
  <span className="chip">Research-Ready Layout</span>

  <button
    type="button"
    onClick={handleLogout}
    className="ghost-btn text-sm"
  >
    LOGOUT
  </button>
</div>

                <h1 className="text-5xl md:text-7xl font-black tracking-[-0.08em] leading-none text-slate-900">
                  SELLSMART
                </h1>

                <p className="mt-5 max-w-2xl text-[15px] md:text-lg text-slate-600 leading-relaxed">
                  A stronger valuation interface with visual product input, staged AI analysis,
                  cleaner market evidence, and richer pricing recommendations.
                </p>
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6 w-full xl:w-[430px]">
                <div className="label">System readiness</div>
                <div className="text-5xl md:text-6xl font-black tracking-[-0.06em] text-slate-900 mt-2">
                  {completionScore}%
                </div>

                <div className="progress-track mt-6">
                  <div className="progress-fill" style={{ width: `${completionScore}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="metric">
                    <div className="tiny mb-2">Images</div>
                    <div className="text-2xl font-black text-slate-900">{uploadedImages.length}</div>
                  </div>
                  <div className="metric">
                    <div className="tiny mb-2">Messages</div>
                    <div className="text-2xl font-black text-slate-900">{messages.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            <aside className="2xl:col-span-3 space-y-6">
              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="label">Past results</div>
                    <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1">History</h3>
                  </div>
                  <div className="chip">{history.length}/10</div>
                </div>

                {history.length === 0 ? (
                  <div className="metric text-slate-500 font-medium">— no past valuations —</div>
                ) : (
                  <div className="space-y-3 max-h-[720px] overflow-y-auto scrollbar-thin pr-1">
                    {history.map((item) => (
                      <button key={item.id} onClick={() => loadHistoryItem(item)} className="history-item">
                        <div className="flex items-start gap-3">
                          {item.imagePreview ? (
                            <img
                              src={item.imagePreview}
                              alt={item.productName}
                              className="h-16 w-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-2xl shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold">
                              IMG
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  {item.condition} • {item.location}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-black text-indigo-700">{item.price}</div>
                                <div className="text-[11px] text-slate-400 mt-1">{formatHistoryDate(item.date)}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="chip status-info text-xs">
                                {item.valuation.confidence} confidence
                              </span>
                              <span className="chip text-xs">
                                evidence {item.evidenceCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Base object state</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Context</h3>

                <div className="space-y-3">
                  <div className="metric">
                    <div className="tiny mb-2">Category</div>
                    <div className="text-lg font-bold text-slate-900">{baseInfo.category || '—'}</div>
                  </div>

                  <div className="metric">
                    <div className="tiny mb-2">Product</div>
                    <div className="text-lg font-bold text-slate-900 break-words">{baseInfo.productName || '—'}</div>
                  </div>

                  <div className="metric">
                    <div className="tiny mb-2">Location</div>
                    <div className="text-lg font-bold text-slate-900">{baseInfo.location || '—'}</div>
                  </div>

                  <div className="metric">
                    <div className="tiny mb-2">Condition</div>
                    <div className="text-lg font-bold text-slate-900">{baseInfo.condition || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Analysis flow</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Stages</h3>

                <div className="space-y-3">
                  {analysisStages.map((stage) => (
                    <div key={stage.id} className="metric flex items-center gap-3">
                      <span
                        className={`stage-dot ${
                          stage.status === 'waiting'
                            ? 'stage-waiting'
                            : stage.status === 'running'
                            ? 'stage-running'
                            : 'stage-done'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{stage.label}</div>
                        <div className="text-sm text-slate-500 capitalize">{stage.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="2xl:col-span-6 space-y-6">
              {!started ? (
                <div className="surface-strong rounded-[34px] p-6 md:p-8 lg:p-10">
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                      <div className="label">Create new session</div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-[-0.06em] text-slate-900 mt-1">
                        Start a valuation
                      </h2>
                    </div>
                    <div className="chip">Image-aware + chat-driven</div>
                  </div>

                  <form onSubmit={startSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="label">Category</span>
                        <select
                          name="category"
                          value={baseInfo.category}
                          onChange={handleBaseChange}
                          className="lux-input mt-2"
                          disabled={loading}
                        >
                          <option value="">Select category</option>
                          <option value="vehicle">Vehicle</option>
                          <option value="electronics">Electronics</option>
                          <option value="general product">General Product</option>
                          <option value="home goods">Home Goods</option>
                          <option value="fashion">Fashion</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="label">Condition</span>
                        <select
                          name="condition"
                          value={baseInfo.condition}
                          onChange={handleBaseChange}
                          className="lux-input mt-2"
                          disabled={loading}
                        >
                          <option value="">Select condition</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Used">Used</option>
                          <option value="New">New</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="label">Product name</span>
                      <input
                        name="productName"
                        value={baseInfo.productName}
                        onChange={handleBaseChange}
                        placeholder="e.g. iPhone 13 Pro"
                        className="lux-input mt-2"
                        disabled={loading}
                      />
                    </label>

                    <label className="block">
                      <span className="label">Location</span>
                      <input
                        name="location"
                        value={baseInfo.location}
                        onChange={handleBaseChange}
                        placeholder="Prishtinë"
                        className="lux-input mt-2"
                        disabled={loading}
                      />
                    </label>

                    <div className="space-y-4">
                      <div>
                        <span className="label">Product images</span>
                        <div
                          className={`dropzone mt-2 ${dragActive ? 'active' : ''}`}
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
                          <div className="text-center">
                            <div className="text-xl font-black text-slate-900">Drag & drop product photos</div>
                            <div className="text-sm text-slate-500 mt-2">
                              Add front view, details, packaging, or bundle photos
                            </div>

                            <label className="inline-flex mt-4 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.length) addFiles(e.target.files);
                                }}
                              />
                              <span className="ghost-btn">UPLOAD IMAGES</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {uploadedImages.map((img) => (
                            <div key={img.id} className="thumb p-3">
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-40 object-cover rounded-2xl"
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
                                className="lux-input mt-3 !py-3"
                              >
                                <option value="primary">Primary</option>
                                <option value="detail">Detail</option>
                                <option value="packaging">Packaging</option>
                                <option value="bundle">Bundle</option>
                                <option value="other">Other</option>
                              </select>

                              <button
                                type="button"
                                className="ghost-btn mt-3 w-full text-sm"
                                onClick={() => removeImage(img.id)}
                              >
                                REMOVE
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
                        className="primary-btn text-base md:text-lg flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <>
                            <span className="spinner" />
                            Loading...
                          </>
                        ) : (
                          '▶ START MACHINE'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setBaseInfo({
                            category: 'electronics',
                            productName: 'iPhone 13 Pro',
                            location: 'Prishtinë',
                            condition: 'Good',
                          })
                        }
                        className="ghost-btn text-base md:text-lg"
                        disabled={loading}
                      >
                        LOAD DEMO
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {valuation ? (
                    <div className="surface-strong rounded-[34px] p-6 md:p-8 lg:p-10">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <div className="label">Formatted AI output</div>
                          <h2 className="text-2xl md:text-4xl font-black tracking-[-0.06em] text-slate-900 mt-1">
                            Market balanced valuation
                          </h2>
                        </div>

                        <button onClick={handleExport} className="ghost-btn text-sm">
                          EXPORT REPORT
                        </button>
                      </div>

                      <div className="text-6xl md:text-8xl font-black tracking-[-0.06em] text-slate-900 break-words">
                        {valuation.marketBalanced}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="metric">
                          <div className="tiny mb-2">Quick sale</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.quickSale}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.quickSale}</div>
                        </div>

                        <div className="metric">
                          <div className="tiny mb-2">Market balanced</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.marketBalanced}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.marketBalanced}</div>
                        </div>

                        <div className="metric">
                          <div className="tiny mb-2">Max profit</div>
                          <div className="text-3xl font-black text-slate-900">{valuation.maxProfit}</div>
                          <div className="text-sm text-slate-500 mt-1">{valuation.estimatedTime.maxProfit}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                        {strategyHighlights.map((item) => (
                          <div key={item.title} className="metric">
                            <div className="tiny mb-2">{item.title}</div>
                            <div className="text-2xl font-black text-slate-900">{item.value}</div>
                            <div className="text-sm text-slate-500 mt-2">{item.note}</div>
                          </div>
                        ))}
                      </div>

                      <div className="metric mt-6">
                        <div className="tiny mb-2">SEO title</div>
                        <div className="font-semibold text-slate-900 leading-relaxed">{valuation.seoTitle}</div>
                      </div>

                      <div className="metric mt-4">
                        <div className="tiny mb-2">Description</div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{valuation.description}</div>
                      </div>

                      <div className="metric mt-4">
                        <div className="tiny mb-2">Rationale</div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{valuation.rationale}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="surface rounded-[34px] p-10 min-h-[220px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="label mb-3">Awaiting input</div>
                        <p className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-slate-700">
                          Preparing analysis workspace...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="surface rounded-[34px] p-5 md:p-6 lg:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                      <div>
                        <div className="label">Chat with AI</div>
                        <h3 className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-slate-900 mt-1">
                          Console
                        </h3>
                      </div>

                      <button onClick={resetSession} className="ghost-btn text-sm" disabled={loading}>
                        ✕ NEW SESSION
                      </button>
                    </div>

                    <div className="chat-shell rounded-[28px] h-[460px] md:h-[520px] overflow-y-auto scrollbar-thin p-4 md:p-5 space-y-4">
                      {messages.length === 0 && !loading && (
                        <div className="h-full flex items-center justify-center text-center text-slate-400 font-medium">
                          — waiting for input —
                        </div>
                      )}

                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[88%] md:max-w-[78%] rounded-[24px] px-4 py-3 md:px-5 md:py-4 ${
                              msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'
                            }`}
                          >
                            <span className="block text-[11px] tracking-[0.22em] uppercase text-slate-400 font-bold mb-2">
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </span>
                            <span className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</span>
                          </div>
                        </div>
                      ))}

                      {loading && (
                        <div className="flex justify-start">
                          <div className="assistant-bubble rounded-[24px] px-5 py-4">
                            <span className="block text-[11px] tracking-[0.22em] uppercase text-slate-400 font-bold mb-2">
                              AI
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2">
                                <span className="pulse-dot" />
                                <span className="pulse-dot" />
                                <span className="pulse-dot" />
                              </div>
                              <span className="text-sm text-slate-500">Generating response...</span>
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
                          placeholder="Type your details or answer AI questions..."
                          className="lux-input flex-1 resize-none min-h-[92px]"
                          disabled={loading}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!composer.trim() || loading}
                          className="primary-btn md:w-[180px] flex items-center justify-center gap-3"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Loading...
                            </>
                          ) : (
                            'SEND'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside className="2xl:col-span-3 space-y-6">
              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Market signal</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Trend</h3>

                <div className="metric text-center">
                  <div className="text-4xl md:text-5xl font-black text-slate-900">{marketTrend}</div>
                  <div className="text-sm text-slate-500 mt-3">in {baseInfo.location || 'your area'}</div>
                </div>
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Image intelligence</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Visuals</h3>

                {uploadedImages.length === 0 ? (
                  <div className="metric text-slate-500 font-medium">— no images uploaded —</div>
                ) : (
                  <div className="space-y-3">
                    {imageInsights.map((item, index) => (
                      <div key={index} className="metric">
                        <div className="font-semibold text-slate-900">{item}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Market evidence</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Research</h3>

                <div className="space-y-3">
                  {marketEvidence.map((item) => (
                    <div key={item.title} className="metric">
                      <div className="tiny mb-2">{item.title}</div>
                      <div className="font-black text-xl text-slate-900">{item.value}</div>
                      <div className="text-sm text-slate-500 mt-2">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {valuation && (
                <div className="surface rounded-[30px] p-5 md:p-6">
                  <div className="label">Prediction confidence</div>
                  <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Confidence</h3>

                  <div className="metric">
                    <div className="text-center mb-4">
                      <span className="text-5xl md:text-6xl font-black text-slate-900">
                        {valuation.confidence}
                      </span>
                    </div>

                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${confidenceValue}%` }} />
                    </div>

                    <div className="text-center text-sm text-slate-500 mt-3">AI certainty level</div>
                  </div>
                </div>
              )}

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Parsed metadata</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Extracted</h3>

                {Object.keys(collectedData).filter(
                  (k) =>
                    collectedData[k] &&
                    typeof collectedData[k] === 'string' &&
                    collectedData[k].trim() !== ''
                ).length === 0 ? (
                  <div className="metric text-slate-500 font-medium">— no data yet —</div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                    {Object.entries(collectedData).map(([k, v]) => {
                      if (v && typeof v === 'string' && v.trim() !== '') {
                        return (
                          <div key={k} className="metric">
                            <div className="tiny mb-2">{toLabel(k)}</div>
                            <div className="font-bold text-slate-900 break-words">{v}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              <div className="surface rounded-[30px] p-5 md:p-6">
                <div className="label">Missing requirements</div>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-900 mt-1 mb-5">Missing</h3>

                {missingInfo.length === 0 ? (
                  <div className="metric status-good font-semibold">— all systems nominal —</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {missingInfo.map((item, i) => (
                      <span key={i} className="chip status-warn">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="danger-card rounded-[30px] p-5 md:p-6">
                  <div className="label text-red-400">API error</div>
                  <h3 className="text-2xl font-black tracking-[-0.05em] text-red-700 mt-1 mb-3">
                    Something went wrong
                  </h3>
                  <p className="text-sm leading-relaxed text-red-600 whitespace-pre-wrap">{error}</p>
                  <button onClick={() => setError('')} className="ghost-btn mt-4 text-sm">
                    DISMISS
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