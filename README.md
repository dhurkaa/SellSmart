# SellSmart Demo Plan

## Project overview

SellSmart is an AI-assisted business intelligence dashboard for product pricing, competitor analysis, sales tracking, reporting, and accounting insights.

The project is designed for small and medium businesses that sell physical products and want to make better pricing decisions. Instead of guessing prices manually, SellSmart helps the business compare competitor prices, understand market signals, check margins, and receive clearer pricing recommendations.

The main business case is focused on home products and interior goods, inspired by Nuka Home and similar competitors such as Zara Home, KARE, DiCasa, Bavaria Home, and other home/interior product websites.

## Target users

SellSmart is useful for:

- Business owners who want to compare their prices with competitors.
- Sales teams who want to understand which products need price adjustments.
- Managers who want reports, profit overview, and accounting summaries.
- Small companies that do not have a full data analysis team but still need data-driven decisions.

## Main value of the project

The value of SellSmart is that it combines:

- Competitor website analysis
- Product and price signal extraction
- Pricing recommendation logic
- Confidence scores
- Sync logs for transparency
- CSV/manual fallback if automatic scanning fails
- Sales, reports, accounting, and settings pages connected to live-data APIs

This makes the app more realistic than a simple dashboard with static data.

---

# Demo duration

Planned demo time: 5–7 minutes

## Demo flow overview

### 0:00–0:45 — Introduction

I will briefly explain what SellSmart is and why it exists.

Main explanation:

SellSmart is a pricing intelligence platform that helps businesses make smarter product pricing decisions. The system can scan competitor websites, collect public price signals, compare prices, and generate pricing recommendations with confidence scores. It also includes sales, reports, accounting, settings, and sync logs to make the business workflow more complete.

### 0:45–1:30 — Dashboard and layout

I will open the live application and show the premium dashboard layout.

I will explain:

- The shared sidebar/navigation system
- The SaaS-style interface
- The main pages of the system
- How the project is organized around business decision-making

Pages shown briefly:

- Dashboard
- Pricing
- Sales
- Reports
- Accounting
- Settings
- Sync Logs
- Tutorial

### 1:30–3:20 — Main demo: Pricing intelligence

This is the most important part of the demo.

I will open the Pricing page and show the main workflow:

1. The user opens Pricing.
2. If no competitor websites are saved, the system redirects to competitor setup.
3. The user adds competitor websites, for example:
   - https://www.zarahome.com/xk
   - https://www.kare-design.com/xk-en
   - https://dicasahome.com
4. The user clicks "Analyze Competitor Prices".
5. The system tries to scan public pages and extract product names and prices.
6. Extracted products are saved as competitor price signals.
7. The Pricing table shows products, prices, confidence score, market range, and recommendation status.
8. Each product includes "Why this recommendation?" to explain the logic.

I will explain that the system does not simply guess prices. It uses market signals, competitor price ranges, confidence scores, and pricing logic.

### 3:20–4:00 — Sync Logs proof

I will open the Sync Logs page.

I will show:

- Domains scanned
- Pages discovered
- Pages scanned
- Products found
- Signals inserted
- Failed pages
- Debug details

This proves that the system has a transparent scanning process and is not just showing random numbers.

### 4:00–4:45 — Plan B / fallback system

I will explain that some websites block crawling or load products dynamically with JavaScript.

Because of that, SellSmart includes fallback options:

- CSV import
- Manual competitor product entry
- Sync logs to understand why a scan failed

This makes the project more realistic because real business tools need fallback options when automation cannot access a website.

I will demonstrate either:

- Import CSV, or
- Add Manual Product

Example CSV columns:

```csv
product_name,detected_price,source_domain,source_url
Premium Curtain,49.99,zarahome.com,https://www.zarahome.com/xk/example
Luxury Carpet,129.90,kare-design.com,https://www.kare-design.com/xk-en/example
Cotton Bedsheet,35.50,dicasahome.com,https://dicasahome.com/example
