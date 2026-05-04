import { Groq } from 'groq-sdk';
import OpenAI from 'openai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const provider = process.env.AI_PROVIDER ?? 'groq';

export async function callLLM(messages: ChatMessage[]): Promise<string> {
  if (provider === 'groq') {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
    });
    return res.choices[0].message.content ?? '';
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });
  return res.choices[0].message.content ?? '';
}

const SYSTEM_PROMPT = `
You are a market research assistant for a pricing intelligence platform.
Your job is to:
1. Ask clarifying questions to understand the product.
2. When you have enough context (at least: product name, category, condition, location, business goal, and some finance controls), provide **only** a JSON object with:
   - "rawPriceSignals": number[] — 5-10 realistic market prices for this product in the given location/condition. These must be numbers only, no currency symbols.
   - "narrative": string — your analysis in Albanian, explaining market conditions.
   - "collectedData": object — any structured info you've extracted.
   - "missingInfo": string[] — what's still missing.
   - "ready": boolean — true only if you have enough to provide rawPriceSignals.
   - "seoTitle": string — an SEO-friendly title.
   - "description": string — a compelling product description.

IMPORTANT: You do NOT compute a single final price. The platform's pricing engine will calculate that from your rawPriceSignals and the user's financial controls. Output valid JSON only when ready=true.
`;

export async function getAIValuation(context: {
  baseInfo: any;
  businessGoal: string;
  financeControls: any;
  messages: { role: 'assistant' | 'user'; content: string }[];
  images: any[];
}) {
  const userMessage = `
Product: ${context.baseInfo.productName}
Category: ${context.baseInfo.category}
Condition: ${context.baseInfo.condition}
Location: ${context.baseInfo.location}
Business goal: ${context.businessGoal}
Finance: landed=${context.financeControls.landedCost}, shipping=${context.financeControls.shippingCost}, packaging=${context.financeControls.packagingCost}, minMargin=${context.financeControls.minimumMarginPct}%
Images uploaded: ${context.images.length}
Previous conversation: ${JSON.stringify(context.messages.slice(-3))}

Provide your JSON response.
  `;
  
  const llmResponse = await callLLM([
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ]);

  let jsonStr = llmResponse.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];
  const parsed = JSON.parse(jsonStr);

  return {
    rawPriceSignals: parsed.rawPriceSignals || [],
    narrative: parsed.narrative || '',
    collectedData: parsed.collectedData || {},
    missingInfo: parsed.missingInfo || [],
    ready: parsed.ready || false,
    seoTitle: parsed.seoTitle || '',
    description: parsed.description || '',
  };
}