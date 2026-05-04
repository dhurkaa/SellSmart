import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAIValuation } from '../../../lib/services/ai.service';
import { PricingEngine } from '@/lib/intelligence/engine';

export async function POST(req: NextRequest) {
  // ✅ Await the Supabase client
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { baseInfo, businessGoal, financeControls, messages, images } = body;

  // Step 1: Get price signals + narrative from AI
  const aiResult = await getAIValuation({
    baseInfo,
    businessGoal,
    financeControls,
    messages,
    images,
  });

  if (!aiResult.ready || aiResult.rawPriceSignals.length === 0) {
    return NextResponse.json({
      assistantMessage: aiResult.narrative || "Më jep më shumë detaje për produktin (çmime konkurrentësh, veçori, etj.).",
      collectedData: aiResult.collectedData,
      missingInfo: aiResult.missingInfo,
      readyForValuation: false,
      valuation: null,
    });
  }

  // Step 2: Run pricing engine
  const engine = new PricingEngine({
    rawPrices: aiResult.rawPriceSignals,
    financeControls: {
      landedCost: Number(financeControls.landedCost) || 0,
      shippingCost: Number(financeControls.shippingCost) || 0,
      packagingCost: Number(financeControls.packagingCost) || 0,
      minimumMarginPct: Number(financeControls.minimumMarginPct) || 0,
    },
    businessGoal,
  });

  const pricing = engine.calculate();
  pricing.seoTitle = aiResult.seoTitle;
  pricing.description = aiResult.description;

  // Step 3: Save snapshot to Supabase
  // ✅ Now supabase is properly awaited, so from() works
  await supabase.from('price_snapshots').insert({
    user_id: user.id,
    product_name: baseInfo.productName,
    category: baseInfo.category,
    location: baseInfo.location,
    condition: baseInfo.condition,
    business_goal: businessGoal,
    raw_price_signals: aiResult.rawPriceSignals,
    recommended_price: parseFloat(pricing.marketBalanced.replace('€', '')),
    price_range_low: pricing.priceRangeLow,
    price_range_high: pricing.priceRangeHigh,
    confidence_score: pricing.confidenceScore,
    source_count: pricing.sourceCount,
    finance_controls: financeControls,
    created_at: new Date().toISOString(),
  });

  // Step 4: Return response
  return NextResponse.json({
    assistantMessage: aiResult.narrative || "Vlerësimi i çmimit është gati.",
    collectedData: {
      ...aiResult.collectedData,
      "Sinjale çmimi": aiResult.rawPriceSignals.join(', '),
    },
    missingInfo: aiResult.missingInfo,
    readyForValuation: true,
    valuation: {
      seoTitle: pricing.seoTitle,
      description: pricing.description,
      quickSale: pricing.quickSale,
      marketBalanced: pricing.marketBalanced,
      maxProfit: pricing.maxProfit,
      estimatedTime: pricing.estimatedTime,
      rationale: pricing.rationale,
      listingType: pricing.listingType,
      confidence: pricing.confidence,
    },
  });
}