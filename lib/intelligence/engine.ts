// lib/intelligence/engine.ts

export type PricingEngineInput = {
  rawPrices: number[];           // price signals from AI or scraped data
  financeControls: {
    landedCost: number;
    shippingCost: number;
    packagingCost: number;
    minimumMarginPct: number;
  };
  businessGoal: 'balanced' | 'gross_margin' | 'cash_flow' | 'stock_clearance' | 'market_penetration' | 'premium_positioning';
};

export type PricingResult = {
  marketBalanced: string;        // formatted price e.g. "€129.99"
  quickSale: string;
  maxProfit: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  confidence: string;            // e.g. "78%"
  confidenceScore: number;       // 0-100
  sourceCount: number;
  rationale: string;
  seoTitle: string;              // still LLM-generated
  description: string;           // still LLM-generated
  listingType: string;
  estimatedTime: {
    quickSale: string;
    marketBalanced: string;
    maxProfit: string;
  };
};

export class PricingEngine {
  private prices: number[];
  private landed: number;
  private shipping: number;
  private packaging: number;
  private minMarginPct: number;
  private goal: PricingEngineInput['businessGoal'];

  constructor(input: PricingEngineInput) {
    this.prices = this.filterOutliers(input.rawPrices);
    this.landed = input.financeControls.landedCost || 0;
    this.shipping = input.financeControls.shippingCost || 0;
    this.packaging = input.financeControls.packagingCost || 0;
    this.minMarginPct = input.financeControls.minimumMarginPct || 0;
    this.goal = input.businessGoal;
  }

  private filterOutliers(prices: number[]): number[] {
    if (prices.length < 3) return prices;
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
  }

  private median(): number {
    const s = [...this.prices].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
  }

  private safeFloor(): number {
    const base = this.landed + this.shipping + this.packaging;
    return base > 0 ? base * (1 + this.minMarginPct / 100) : 0;
  }

  private applyGoalMultiplier(base: number): number {
    const multipliers: Record<PricingEngineInput['businessGoal'], number> = {
      balanced: 1.0,
      gross_margin: 1.12,
      cash_flow: 0.92,
      stock_clearance: 0.85,
      market_penetration: 0.88,
      premium_positioning: 1.18,
    };
    return base * (multipliers[this.goal] ?? 1.0);
  }

  private confidenceScore(): number {
    let score = 30; // base
    if (this.prices.length >= 3) score += 20;
    if (this.prices.length >= 6) score += 15;
    if (this.prices.length >= 10) score += 10;
    const spread = this.prices.length > 1
      ? (Math.max(...this.prices) - Math.min(...this.prices)) / this.median()
      : 1;
    if (spread < 0.15) score += 25;
    else if (spread < 0.30) score += 15;
    else if (spread < 0.50) score += 5;
    if (this.safeFloor() > 0) score += 10;
    return Math.min(score, 100);
  }

  calculate(): PricingResult {
    const med = this.prices.length > 0 ? this.median() : 0;
    const floor = this.safeFloor();
    const goalAdjusted = this.applyGoalMultiplier(med);
    const balanced = Math.max(goalAdjusted, floor);
    const quickSale = Math.max(balanced * 0.88, floor);
    const maxProfit = balanced * 1.10;

    const confidence = this.confidenceScore();
    const spread = this.prices.length > 1
      ? (Math.max(...this.prices) - Math.min(...this.prices)) / (med || 1)
      : 0.2;

    const fmt = (n: number) => `€${n.toFixed(2)}`;

    // Rationale in Albanian (matching your UI)
    const rationaleParts = [];
    if (this.prices.length > 0) {
      rationaleParts.push(`Bazuar në ${this.prices.length} sinjale çmimi (pas filtrimit të anomalive)`);
    }
    if (floor > 0 && balanced > floor) {
      rationaleParts.push(`Çmimi është mbi pragun e sigurt financiar (€${floor.toFixed(2)})`);
    } else if (floor > 0 && balanced <= floor) {
      rationaleParts.push(`⚠️ Çmimi i tregut është nën pragun financiar — shqyrto strategjinë`);
    }
    rationaleParts.push(`Besueshmëria: ${confidence}% (${this.prices.length} burime)`);

    return {
      marketBalanced: fmt(balanced),
      quickSale: fmt(quickSale),
      maxProfit: fmt(maxProfit),
      priceRangeLow: balanced * (1 - spread / 2),
      priceRangeHigh: balanced * (1 + spread / 2),
      confidence: `${confidence}%`,
      confidenceScore: confidence,
      sourceCount: this.prices.length,
      rationale: rationaleParts.join('. '),
      seoTitle: '',   // Will be filled by LLM later
      description: '', // Will be filled by LLM later
      listingType: 'standard',
      estimatedTime: {
        quickSale: '1-3 ditë',
        marketBalanced: '5-14 ditë',
        maxProfit: '14-30 ditë',
      },
    };
  }
}