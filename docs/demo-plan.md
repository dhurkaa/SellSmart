SellSmart Demo Plan
Project overview
SellSmart is a pricing intelligence and business dashboard for product-based companies. The goal of the project is to help businesses make better selling and pricing decisions by comparing competitor prices, analyzing market signals, reviewing sales performance, and understanding profit margins.
The project is focused on businesses that sell physical products, especially home and interior products. The idea is inspired by companies like Nuka Home and similar competitors such as Zara Home, KARE, DiCasa, Bavaria Home, and other home product websites.
SellSmart is built for small and medium businesses that do not have a full data analysis team, but still need a clear system for pricing, sales, reports, and accounting decisions.
Who the project serves
SellSmart is useful for:
Business owners who want to compare their products with competitor prices.
Sales teams who want to understand which products need price changes.
Managers who need reports and financial summaries.
Companies that want to avoid guessing prices manually.
Businesses that want one dashboard for pricing, sales, reports, accounting, and market intelligence.
Main value of the project
The main value of SellSmart is that it does not only show a static dashboard. It helps the user make decisions.
SellSmart can:
Save competitor websites.
Scan public competitor pages.
Extract product and price signals.
Store competitor price signals in Supabase.
Show pricing recommendations.
Explain why a price recommendation was given.
Show confidence scores.
Provide Sync Logs as proof of what was scanned.
Use CSV/manual fallback if automatic scanning fails.
Connect sales, reports, accounting, and settings through live-data APIs.
This makes the project more realistic and more prepared for real business use.
---
Demo duration
Planned demo time: 5–7 minutes.
---
Demo flow
0:00–0:45 — Introduction
I will start by explaining what SellSmart is.
SellSmart is a business intelligence platform for smarter product pricing. It helps businesses compare competitor prices, collect market signals, understand margins, and make better pricing decisions.
I will mention that the project is focused on businesses like Nuka Home, where product pricing and competitor comparison are important.
Main message:
SellSmart helps a business move from guessing prices manually to making pricing decisions based on competitor data, market signals, confidence scores, and financial logic.
---
0:45–1:30 — Dashboard and layout
I will open the live application and show the main dashboard layout.
I will explain that the project uses a shared premium AppShell layout with a sidebar. This gives the project a consistent SaaS-style structure.
Pages I will mention briefly:
Dashboard
Pricing
Sales
Reports
Accounting
Settings
Sync Logs
Tutorial
I will explain that each page has a specific business purpose and is not only decorative.
---
1:30–3:20 — Main demo: Pricing intelligence
This is the most important part of the demo.
I will open the Pricing page.
Main flow:
User opens Pricing.
If no competitor websites exist, the system redirects the user to Competitor Setup.
User adds competitor websites such as:
https://www.zarahome.com/xk
https://www.kare-design.com/xk-en
https://dicasahome.com
User clicks “Analyze Competitor Prices”.
The system scans public pages from the competitor websites.
The system tries to extract product names and prices.
The extracted data is saved as competitor price signals.
Pricing page displays products, detected prices, recommended prices, market average, competitor range, status, and confidence score.
Each product has “Why this recommendation?” to explain the recommendation.
I will explain that the system does not simply generate random prices. It uses competitor signals, market average, minimum price, maximum price, estimated margin, and confidence score.
---
3:20–4:00 — Sync Logs proof
After the pricing scan, I will open the Sync Logs page.
This page proves that the system really attempted to scan the websites.
I will show:
Domains scanned
Pages discovered
Pages scanned
Products found
Signals inserted
Failed pages
Debug details
This is important because it makes the project transparent. If a website gives 0 products, the system shows why and does not hide the failure.
---
4:00–4:45 — Plan B and fallback system
I will explain that some websites block scraping or load products with JavaScript. This is a real-world problem, not only a project issue.
Because of this, SellSmart includes a fallback system:
CSV import
Manual competitor product entry
Sync Logs to understand scan results
This makes the project more reliable for demo and more realistic for actual business use.
If automatic scan fails during the demo, I will use the CSV import or manual product entry.
Example CSV format:
```csv
product_name,detected_price,source_domain,source_url
Premium Curtain,49.99,zarahome.com,https://www.zarahome.com/xk/example
Luxury Carpet,129.90,kare-design.com,https://www.kare-design.com/xk-en/example
Cotton Bedsheet,35.50,dicasahome.com,https://dicasahome.com/example
Bathroom Set,24.90,bbavariahome.com,https://bbavariahome.com/example
Decor Pillow,19.99,sulaworld.com,https://sulaworld.com/example
```
This shows that the project still works even when a competitor website blocks automatic crawling.
---
4:45–5:45 — Supporting business pages
I will briefly show the other important pages.
Sales
The Sales page is prepared to show real sales data from Supabase. It can show revenue, cost, profit, margin, top products, weak products, and sales channels.
Reports
The Reports page is prepared for business reporting. It includes report templates such as monthly profit, product margin, pricing performance, weak products, inventory capital, and market position.
Accounting
The Accounting page shows revenue, cost, fees, ads, tax, gross profit, net profit, and product-level financial results.
Settings
The Settings page stores company configuration such as target margin, AI strictness, pricing mode, confidence threshold, and reporting preferences.
Tutorial
The Tutorial page explains how the whole system works and can be used during the demo if needed.
---
5:45–6:30 — Technical explanation
I will briefly explain the technical side without going too deep.
Tech stack:
Next.js
TypeScript
Tailwind CSS
Supabase
Supabase Auth
Supabase Row Level Security
API Routes
Vercel
Main technical parts:
Shared AppShell layout for consistent UI
Supabase authentication
User-specific data with RLS policies
API routes for pricing, competitors, sales, reports, accounting, settings, and sync logs
Competitor domains table
Competitor price signals table
Market sync logs table
CSV/manual fallback endpoint
Live-data APIs instead of hardcoded static data
I will explain that the project is structured like a real SaaS dashboard, with frontend pages and backend API routes.
---
6:30–7:00 — Final summary
I will finish by explaining the main value again.
SellSmart is not only a dashboard. It is a decision-support system for product pricing and business analysis. It helps businesses collect competitor price signals, understand market position, review financial results, and make better selling decisions.
Final message:
SellSmart helps businesses make smarter pricing decisions using competitor data, market signals, confidence scores, sync logs, and fallback tools.
---
Technical parts to explain shortly
Authentication and user data
The project uses Supabase Auth. Each logged-in user has their own data. Supabase Row Level Security helps protect user data.
Competitor websites
Users can save competitor websites. These websites are used as sources for market price analysis.
Competitor price signals
When the system scans public pages or when the user imports CSV/manual products, the product names and prices are stored as competitor price signals.
Pricing recommendations
The Pricing page uses:
Current detected price
Recommended price
Market average
Competitor minimum price
Competitor maximum price
Confidence score
Estimated margin
The system then gives a status such as:
Balanced
Undervalued
Overpriced
Margin risk
Stock clearance
Premium opportunity
Sync Logs
Sync Logs show what happened during a scan. This includes scanned domains, discovered pages, scanned pages, products found, signals inserted, failed pages, and debug details.
Fallback system
If automatic scanning fails, the user can still use CSV import or manual competitor product entry. This is important because many real websites block scraping or load products dynamically.
---
Pre-demo checklist
Before the final demo, I will check:
Live URL opens correctly.
Login works.
Dashboard opens after login.
Sidebar navigation works.
Pricing page opens.
Competitor setup page works.
At least one competitor website is saved.
Analyze Competitor Prices button works.
Sync Logs page opens and shows scan results.
CSV import works.
Manual product entry works.
Pricing table shows products or a clear empty state.
“Why this recommendation?” works.
Sales page opens without crashing.
Reports page opens without crashing.
Accounting page opens without crashing.
Settings page opens and can save settings.
Tutorial page explains the system clearly.
`npm run build` passes.
Latest commit is pushed to GitHub.
Live deployment is updated.
---
Plan B if live demo fails
Backup 1: Localhost
If the live URL does not work, I will run the project locally:
```bash
npm run dev
```
Then I will present from localhost.
Backup 2: CSV/manual fallback
If competitor scanning fails because a website blocks crawling, I will use CSV import or manual product entry.
This proves that the system still works even when automation is blocked.
Backup 3: Sync Logs explanation
If a scan finds 0 products, I will open Sync Logs and explain:
Which domains were scanned
How many pages were discovered
How many pages were scanned
How many pages failed
Why some websites may block crawling
Backup 4: Tutorial page
If I need to explain the system quickly, I can use the Tutorial page because it explains how SellSmart works step by step.
Backup 5: Technical explanation
If the live app cannot be used at all, I will explain the architecture:
Next.js frontend
Supabase backend
API routes
Competitor domains
Competitor price signals
Sync logs
CSV/manual fallback
Pricing recommendations
---
Live URL:
https://sell-smart-six.vercel.app
GitHub repository
https://github.com/dhurkaa/SellSmart
---
Final demo message
SellSmart is a business intelligence platform focused on smarter pricing decisions. It helps businesses compare competitor prices, collect market signals, understand margins, and make better decisions. The project is prepared for demo with a clear main flow, fallback plan, sync logs, and live-data structure.