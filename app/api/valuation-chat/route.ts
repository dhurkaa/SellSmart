import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

function cleanAssistantText(text: string) {
  if (!text) return '';

  return text
    .replace(/```json\s*[\s\S]*?\s*```/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .trim();
}

function tryExtractJson(text: string) {
  if (!text) return null;

  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {}
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const possibleJson = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(possibleJson);
    } catch {}
  }

  return null;
}

function isCompleteValuation(data: any): data is Valuation {
  return Boolean(
    data &&
      typeof data === 'object' &&
      data.seoTitle &&
      data.description &&
      data.quickSale &&
      data.marketBalanced &&
      data.maxProfit &&
      data.estimatedTime?.quickSale &&
      data.estimatedTime?.marketBalanced &&
      data.estimatedTime?.maxProfit &&
      data.rationale &&
      data.listingType &&
      data.confidence
  );
}

function parseEuroValue(value: string): number | null {
  if (!value || typeof value !== 'string') return null;

  const cleaned = value
    .replace(/€/g, '')
    .replace(/eur/gi, '')
    .replace(/,/g, '')
    .trim();

  const match = cleaned.match(/\d+(\.\d+)?/);
  if (!match) return null;

  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

function formatEuro(value: number): string {
  return `${Math.round(value)} EUR`;
}

function getReasonableRange(baseInfo: BaseInfo) {
  const category = (baseInfo.category || '').toLowerCase();
  const productName = (baseInfo.productName || '').toLowerCase();

  if (productName.includes('iphone 13 pro')) {
    return { min: 250, max: 1200 };
  }

  if (productName.includes('iphone')) {
    return { min: 100, max: 2000 };
  }

  if (
    productName.includes('samsung') ||
    productName.includes('galaxy') ||
    productName.includes('xiaomi') ||
    productName.includes('macbook') ||
    productName.includes('laptop')
  ) {
    return { min: 80, max: 5000 };
  }

  if (category.includes('electronics')) {
    return { min: 20, max: 5000 };
  }

  if (category.includes('vehicle')) {
    return { min: 300, max: 150000 };
  }

  if (category.includes('general')) {
    return { min: 5, max: 10000 };
  }

  return { min: 1, max: 50000 };
}

function sanitizeValuationPrices(valuation: Valuation, baseInfo: BaseInfo): Valuation {
  const range = getReasonableRange(baseInfo);

  const quick = parseEuroValue(valuation.quickSale);
  const balanced = parseEuroValue(valuation.marketBalanced);
  const max = parseEuroValue(valuation.maxProfit);

  if (quick === null || balanced === null || max === null) {
    return valuation;
  }

  const invalid =
    quick < range.min ||
    quick > range.max ||
    balanced < range.min ||
    balanced > range.max ||
    max < range.min ||
    max > range.max ||
    !(quick <= balanced && balanced <= max);

  if (!invalid) {
    return {
      ...valuation,
      quickSale: formatEuro(quick),
      marketBalanced: formatEuro(balanced),
      maxProfit: formatEuro(max),
    };
  }

  let fallbackBalanced = Math.min(Math.max(balanced, range.min), range.max);
  let fallbackQuick = Math.max(range.min, Math.round(fallbackBalanced * 0.9));
  let fallbackMax = Math.min(range.max, Math.round(fallbackBalanced * 1.1));

  const productName = (baseInfo.productName || '').toLowerCase();

  if (productName.includes('iphone 13 pro')) {
    fallbackBalanced = 550;
    fallbackQuick = 480;
    fallbackMax = 650;
  }

  return {
    ...valuation,
    quickSale: formatEuro(fallbackQuick),
    marketBalanced: formatEuro(fallbackBalanced),
    maxProfit: formatEuro(fallbackMax),
    rationale:
      `${valuation.rationale}\n\n[Sanity check applied: AI generated an unrealistic price, so the result was normalized to a reasonable market range.]`,
    confidence: '55%',
  };
}

function extractMissingInfoFromText(text: string) {
  const lowerMsg = text.toLowerCase();

  const possibleFields = [
    'viti',
    'kilometrazhi',
    'modeli',
    'ram',
    'storage',
    'bateria',
    'aksesor',
    'aksidente',
    'shërbimeve',
    'materiali',
    'mosha',
    'përmasat',
    'marka',
    'madhësia',
    'dëmtime',
  ];

  return possibleFields.filter((field) => lowerMsg.includes(field) && text.includes('?'));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const baseInfo = body?.baseInfo as BaseInfo;
    const messages = body?.messages as ChatMessage[];

    if (
      !baseInfo ||
      !Array.isArray(messages) ||
      !baseInfo.category ||
      !baseInfo.productName ||
      !baseInfo.location ||
      !baseInfo.condition
    ) {
      return NextResponse.json(
        { error: 'Kërkesa nuk përmban të dhëna të vlefshme.' },
        { status: 400 }
      );
    }

    const conversation: ChatCompletionMessageParam[] = [];

    conversation.push({
      role: 'system',
      content: `
Je një asistent për vlerësimin e produkteve të përdorura në tregun e Shqipërisë dhe Kosovës.

INFORMACIONI BAZË (MOS E KËRKO PËRSËRI):
- Kategoria: ${baseInfo.category}
- Produkti: ${baseInfo.productName}
- Lokacioni: ${baseInfo.location}
- Gjendja: ${baseInfo.condition}

RREGULLAT:
1. Përgjigju gjithmonë në shqip.
2. Nëse mungojnë të dhëna, bëj vetëm 1-3 pyetje të shkurtra dhe natyrale.
3. MOS kthe JSON nëse ende po bën pyetje.
4. Vetëm kur je gati për vlerësimin final, kthe VETËM JSON valid.
5. Kur kthen JSON final, mos shto asnjë shpjegim para ose pas tij.
6. Mos përdor markdown për JSON, vetëm JSON të pastër.
7. Jep vetëm çmime reale dhe të arsyeshme për tregun e Kosovës dhe Shqipërisë.
8. Për elektronikë si telefona, laptopë dhe pajisje të ngjashme, shmang çmime absurde ose jashtë tregut.
9. Mos kthe kurrë vlera absurde si 52000 EUR për një telefon.
10. Të gjitha çmimet duhet të jenë në formatin "123 EUR".
11. Për një produkt të përdorur, çmimi duhet të jetë proporcional me vitin, gjendjen dhe tregun lokal.

DETAJET SIPAS KATEGORISË:

AUTOMJETE:
- Viti i prodhimit
- Kilometrazhi
- Motorri / karburanti
- Aksidente
- Historia e shërbimeve

ELEKTRONIKË:
- Modeli i saktë
- RAM / storage
- Viti i blerjes
- Gjendja e baterisë
- Gërvishtje / dëmtime
- Aksesorët

MOBILJE:
- Materiali
- Mosha
- Përmasat
- Dëmtimet

VESHJE:
- Marka
- Madhësia
- Origjinaliteti
- Gjendja

KUR TË JESH GATI PËR VLERËSIM FINAL, kthe këtë format JSON:
{
  "seoTitle": "Titulli tërheqës për listim",
  "description": "Përshkrim i detajuar i produktit",
  "quickSale": "çmimi për shitje të shpejtë",
  "marketBalanced": "çmimi i drejtë i tregut",
  "maxProfit": "çmimi maksimal",
  "estimatedTime": {
    "quickSale": "p.sh. 1-7 ditë",
    "marketBalanced": "p.sh. 1-4 javë",
    "maxProfit": "p.sh. 1-3 muaj"
  },
  "rationale": "Arsyetimi i çmimit",
  "listingType": "Auction ose Fixed Price",
  "confidence": "0-100%"
}
      `.trim(),
    });

    for (const msg of messages) {
      conversation.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: conversation,
      temperature: 0.2,
      max_tokens: 2048,
    });

    const rawAssistantMessage = completion.choices[0]?.message?.content?.trim() || '';

    let valuation: Valuation | null = null;
    let collectedData: Record<string, string> = {};
    let missingInfo: string[] = [];
    let assistantMessage = rawAssistantMessage;

    const parsed = tryExtractJson(rawAssistantMessage);

    if (parsed) {
      if (isCompleteValuation(parsed)) {
        valuation = sanitizeValuationPrices(parsed, baseInfo);
        assistantMessage = 'Vlerësimi u gjenerua me sukses.';
      } else if (typeof parsed === 'object' && parsed !== null) {
        collectedData = parsed as Record<string, string>;
        assistantMessage = cleanAssistantText(rawAssistantMessage) || 'Të dhënat u përditësuan.';
      }
    } else {
      assistantMessage = cleanAssistantText(rawAssistantMessage);
    }

    if (!valuation) {
      missingInfo = extractMissingInfoFromText(assistantMessage);
    }

    return NextResponse.json({
      assistantMessage,
      collectedData,
      missingInfo,
      readyForValuation: valuation !== null,
      valuation,
    });
  } catch (error: any) {
    console.error('Groq error:', error);

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Kufiri i përdorimit u arrit. Provo përsëri pas disa minutash.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Gabim i brendshëm i serverit.' },
      { status: 500 }
    );
  }
}