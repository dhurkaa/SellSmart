# SellSmart

SellSmart is an AI-assisted pricing intelligence and business dashboard for product-based companies. It helps businesses analyze competitor prices, understand market signals, review sales performance, generate reports, and control accounting insights from one platform.

## Live URL

https://sell-smart-six.vercel.app/

## Repository

https://github.com/dhurkaa/SellSmart

## Main features

- Premium SaaS-style dashboard
- Competitor website setup
- Competitor product and price signal extraction
- Pricing recommendation table
- Confidence scores
- "Why this recommendation?" explanations
- CSV import fallback
- Manual competitor product entry
- Sync logs for website scan transparency
- Sales summary API
- Reports summary API
- Accounting summary API
- Company settings page
- Tutorial page explaining the system

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- Supabase Row Level Security
- API Routes
- Vercel

## Main demo flow

1. Login to the application.
2. Open Pricing.
3. Add competitor websites.
4. Run competitor price analysis.
5. Open Sync Logs to verify the scan.
6. Review pricing recommendations.
7. Use CSV/manual fallback if automatic scanning fails.
8. Show Sales, Reports, Accounting, Settings, and Tutorial pages.

## Fallback plan

Some websites may block crawling or load products dynamically with JavaScript. For this reason, SellSmart includes:

- CSV competitor product import
- Manual competitor product entry
- Sync Logs to show what happened during scanning

This makes the system more realistic and reliable for demo and future development.

## Local development

```bash
npm install
npm run dev
