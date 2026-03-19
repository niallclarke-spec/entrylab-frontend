# EntryLab — Agent Knowledge Base

> This document is the complete operational guide for the EntryLab AI agent. It covers everything needed to manage content, SEO, brokers, prop firms, and site health for **entrylab.io** — a Forex news and trading intelligence platform.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Brokers vs Prop Firms — Core Distinction](#2-brokers-vs-prop-firms--core-distinction)
3. [Broker Entity — Field Reference](#3-broker-entity--field-reference)
4. [Prop Firm Entity — Field Reference](#4-prop-firm-entity--field-reference)
5. [Category System](#5-category-system)
6. [Content Types & Article System](#6-content-types--article-system)
7. [SEO Principles & Editorial Standards](#7-seo-principles--editorial-standards)
8. [Tone of Voice & Writing Style](#8-tone-of-voice--writing-style)
9. [GSC Integration — SEO Optimisation Tasks](#9-gsc-integration--seo-optimisation-tasks)
10. [Broken Link & Site Health Checks](#10-broken-link--site-health-checks)
11. [Competitor Awareness](#11-competitor-awareness)
12. [New Broker / Prop Firm Discovery](#12-new-broker--prop-firm-discovery)
13. [API Reference — Admin Endpoints](#13-api-reference--admin-endpoints)
14. [Daily Task Schedule (Reference)](#14-daily-task-schedule-reference)
15. [Rules & Safety Constraints](#15-rules--safety-constraints)

---

## 1. Platform Overview

**EntryLab** (`entrylab.io`) is a Forex broker and proprietary trading firm review and news platform. It targets active forex traders, aspiring prop firm traders, and retail investors looking for:

- Honest, data-backed broker reviews
- Prop firm evaluations (funded account programmes)
- Category-based listing pages (e.g. "US Brokers", "Low Deposit Brokers")
- Educational guides on trading with brokers or passing prop firm evaluations
- Up-to-date news on broker changes, closures, bonuses, and industry events
- Premium Forex signals (subscription product)

**Architecture notes:**
- All data (brokers, prop firms, articles, categories) lives in a **PostgreSQL database**
- There is no WordPress — the site is 100% custom-built
- The admin API is available at `https://entrylab.io/api/admin/*`
- Authentication: `Authorization: Bearer YOUR_ADMIN_PASSWORD` header on every admin request

---

## 2. Brokers vs Prop Firms — Core Distinction

Understanding this distinction is critical. These are fundamentally different business models.

### Forex Broker

A **forex broker** is a regulated (or unregulated) financial intermediary that allows retail traders to trade currency pairs, indices, commodities, and other CFD instruments using their **own money**.

Key characteristics:
- Traders deposit their **own capital**
- Profits and losses are the trader's own
- Regulated by bodies like the FCA (UK), ASIC (Australia), CySEC (EU), FSA, FSCA
- Revenue model: spreads, commissions, overnight swap fees
- Offer platforms like MetaTrader 4, MetaTrader 5, cTrader, or proprietary platforms
- Account types: Standard, ECN, Raw Spread, Islamic (swap-free)

Examples on EntryLab: AvaTrade, CMC Markets, Eightcap, FP Markets, GatesFX

### Proprietary (Prop) Trading Firm

A **prop firm** is a company that provides **funded accounts** to traders who pass an evaluation challenge. The trader uses the firm's capital, not their own.

Key characteristics:
- Traders trade with the **firm's money** after passing an evaluation
- Profit is split between trader and the firm (e.g. 80/20 or 90/10 in trader's favour)
- The trader pays an **evaluation fee** to attempt the challenge
- Governed by drawdown rules: daily drawdown limit and overall max drawdown
- Not regulated in the same way as brokers (they are not offering financial services to the public)
- Revenue model: evaluation fees, failed challenges, sometimes small monthly fees

Examples on EntryLab: FTMO, FundedNext, E8 Markets, Fintokei, Crypto Fund Trader

### Why the Distinction Matters for Content

| Topic | Broker Article | Prop Firm Article |
|---|---|---|
| Regulation | Always mention — critical trust signal | Less relevant; mention if they have any |
| Deposit | Minimum deposit amount | Evaluation fee (not a deposit) |
| Risk | Trader risks own money | Trader risks only the eval fee |
| Profit | All profit is the trader's | Split (e.g. 80% to trader) |
| Drawdown | Not typically discussed | Critical — daily + max drawdown rules |
| Audience intent | "Which broker should I use?" | "Which prop firm can I get funded with?" |

---

## 3. Broker Entity — Field Reference

When creating or updating a broker, every field has a specific purpose. Here is a complete reference:

### Identity Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `name` | text | Full official broker name | `"AvaTrade"` |
| `slug` | text | URL-safe unique identifier. Lowercase, hyphens, ends with `-review` | `"avatrade-review"` |
| `logoUrl` | text | Absolute URL to the broker's logo image (WebP preferred) | `"https://cdn.entrylab.io/logos/avatrade.webp"` |
| `affiliateLink` | text | Tracked affiliate/referral URL | `"https://www.avatrade.com/?ref=entrylab"` |
| `tagline` | text | Short one-line description for cards and listings | `"Award-winning broker with 1,250+ instruments"` |

### Trading Conditions

| Field | Type | Description | Example |
|---|---|---|---|
| `regulation` | text | Comma-separated list of regulatory bodies and licence numbers | `"FCA, ASIC, CySEC, FSCA"` |
| `minDeposit` | text | Minimum deposit to open a live account | `"$100"` |
| `minWithdrawal` | text | Minimum withdrawal amount | `"$50"` |
| `maxLeverage` | text | Maximum leverage offered (retail and/or professional) | `"1:30 (retail), 1:400 (pro)"` |
| `spreadFrom` | text | Lowest spread available (usually on EUR/USD) | `"0.9 pips"` |
| `commission` | text | Commission structure per lot or round turn | `"$0 (Standard), $3.50/lot (ECN)"` |
| `yearFounded` | text | Year the broker was founded or established | `"2006"` |
| `headquarters` | text | Country or city where the broker is headquartered | `"Dublin, Ireland"` |

### Accounts & Platforms

| Field | Type | Array? | Description | Example |
|---|---|---|---|---|
| `accountTypes` | text | Yes | List of account types offered | `["Standard", "ECN", "Islamic"]` |
| `platforms` | text | No | Comma-separated trading platform names | `"MT4, MT5, AvaOptions"` |
| `platformsList` | text | Yes | Same as platforms but as an array (used for filtering) | `["MT4", "MT5", "AvaOptions"]` |
| `instruments` | text | Yes | Tradeable instruments/asset classes | `["Forex", "Indices", "Commodities", "Crypto", "ETFs"]` |
| `paymentMethods` | text | No | Accepted deposit/withdrawal methods | `"Visa, Mastercard, PayPal, Bank Transfer, Skrill"` |
| `countries` | text | Yes | Countries the broker accepts clients from | `["UK", "Australia", "South Africa", "Canada"]` |
| `support` | text | No | Support channels and hours | `"24/5 Live Chat, Email, Phone"` |

### Marketing & Trust

| Field | Type | Array? | Description | Example |
|---|---|---|---|---|
| `pros` | text | Yes | Key advantages — 3 to 6 bullet points | `["Regulated by FCA", "No minimum deposit on demo"]` |
| `cons` | text | Yes | Key disadvantages — 2 to 4 bullet points | `["Limited crypto selection", "Inactivity fee after 3 months"]` |
| `highlights` | text | Yes | Short feature highlights shown on cards | `["FCA Regulated", "MT4 & MT5", "$100 Min Deposit"]` |
| `bonusOffer` | text | No | Current bonus or promotion if applicable | `"20% Welcome Bonus up to $10,000"` |
| `popularity` | text | No | Relative popularity indicator | `"High"` / `"Medium"` / `"Low"` |
| `isFeatured` | boolean | — | Show broker in featured/promoted positions | `true` |
| `isVerified` | boolean | — | Broker has been manually verified by EntryLab | `true` |

### Content & SEO

| Field | Type | Description | Example |
|---|---|---|---|
| `content` | text | Full review content in HTML. This is the main body of the broker review page | Full HTML review |
| `seoTitle` | text | Page `<title>` tag. Max 60 characters. Include broker name + primary keyword | `"AvaTrade Review 2025 — Is It Safe? Spreads, Pros & Cons"` |
| `seoDescription` | text | Meta description. 140–160 characters. Include a call-to-action | `"AvaTrade review: FCA-regulated, $100 min deposit, 1,250+ instruments. Discover spreads, fees, platforms and whether AvaTrade is right for you."` |
| `lastUpdated` | timestamp | Date the review was last reviewed/updated | `2025-03-01T00:00:00Z` |

---

## 4. Prop Firm Entity — Field Reference

### Identity Fields

Same as brokers: `name`, `slug`, `logoUrl`, `affiliateLink`, `tagline`

Slug convention for prop firms: **no `-review` suffix** (e.g. `"ftmo"`, `"fundednext"`, `"e8-markets"`)

### Evaluation & Funding Conditions

| Field | Type | Description | Example |
|---|---|---|---|
| `profitSplit` | text | The profit-sharing ratio in the trader's favour | `"80/20"` or `"Up to 90%"` |
| `maxFundingSize` | text | Maximum funded account size available | `"$400,000"` |
| `evaluationFee` | text | Cost to attempt the evaluation challenge | `"From $149"` |
| `challengeTypes` | text | Types of evaluation programmes offered | `"1-Step Challenge, 2-Step Challenge, Instant Funding"` |
| `profitTarget` | text | Profit target required to pass each phase | `"Phase 1: 10%, Phase 2: 5%"` |
| `dailyDrawdown` | text | Maximum loss allowed in a single trading day | `"5%"` |
| `maxDrawdown` | text | Maximum total account drawdown allowed at any time | `"10%"` |
| `payoutFrequency` | text | How often funded traders receive payouts | `"Bi-weekly"` |
| `payoutMethods` | text | Methods used to pay traders | `"Bank Transfer, Wise, Crypto (USDC)"` |
| `discountCode` | text | Discount/promo code for EntryLab readers | `"ENTRYLAB10"` |
| `discountAmount` | text | Value of the discount | `"10% off"` |
| `propFirmUsp` | text | The firm's unique selling point in 1–2 sentences | `"No time limits on challenges, with the highest profit split in the industry."` |

### Shared Fields (same as brokers)

`pros`, `cons`, `highlights`, `bonusOffer`, `popularity`, `isFeatured`, `isVerified`, `countries`, `platformsList`, `instruments`, `support`, `headquarters`, `paymentMethods`, `content`, `seoTitle`, `seoDescription`, `lastUpdated`

---

## 5. Category System

### How Categories Work

Every article on EntryLab belongs to exactly one category. Categories define the URL structure:

```
/category-slug/article-slug
```

Example: `/broker-guides/avatrade-mt5-tutorial`

Brokers and prop firms can also be **assigned to categories** through junction tables (`broker_categories`, `prop_firm_categories`). This powers filtered listing pages like "US Brokers" or "Low Deposit Brokers".

### Current Live Categories

| Category Name | Slug | Content Type |
|---|---|---|
| Broker Guides | `broker-guides` | Educational articles about using specific brokers |
| Broker News | `broker-news` | News, updates, closures, regulatory changes |
| Prop Firm Guides | `prop-firm-guides` | How-to guides for passing challenges, tips |
| Prop Firm News | `prop-firm-news` | News about specific prop firms |
| Trading Tools | `trading-tools` | Reviews and guides for charting/analysis tools |
| Top CFD Brokers | `top-cfd-brokers` | Curated list/ranking articles |
| Top 3 CFD Brokers | `top-3-cfd-brokers` | Short-form ranking content |
| Best Verified Prop Firms | `best-verified-propfirms` | Curated verified prop firm lists |
| New Prop Firms | `new-prop-firms` | Newly launched prop firms |

### Planned Broker Listing Categories (to be created)

These are **filtering categories** for the broker listing pages, not article categories:

| Planned Category | Description |
|---|---|
| US Brokers | Brokers that accept US residents |
| UK Brokers | FCA-regulated brokers for UK traders |
| Low Deposit Brokers | Brokers with minimum deposits under $50 |
| No Deposit Bonus | Brokers offering no-deposit welcome bonuses |
| High Leverage Brokers | Brokers offering leverage above 1:200 |
| ECN Brokers | Brokers operating on an ECN/STP model |
| Islamic Brokers | Brokers offering swap-free Islamic accounts |
| Crypto Brokers | Brokers with strong cryptocurrency CFD offering |
| Australian Brokers | ASIC-regulated brokers |
| South African Brokers | FSCA-regulated brokers |
| MT4 Brokers | Brokers supporting MetaTrader 4 |
| MT5 Brokers | Brokers supporting MetaTrader 5 |
| Scalping Brokers | Brokers that explicitly permit scalping strategies |

---

## 6. Content Types & Article System

### Article Fields

| Field | Description |
|---|---|
| `title` | Article headline. Should be specific and keyword-rich |
| `slug` | URL-safe version of the title. Lowercase, hyphens only |
| `excerpt` | 1–2 sentence summary used in cards and meta previews (140–160 chars) |
| `content` | Full article body in HTML |
| `category` | Category slug the article belongs to |
| `status` | `draft` (not visible) or `published` (live on site) |
| `featuredImage` | Absolute URL to a WebP image (1200×630 recommended) |
| `seoTitle` | Page `<title>` tag (max 60 chars) |
| `seoDescription` | Meta description (140–160 chars) |
| `author` | Author name. Default: `"EntryLab"` |
| `relatedBroker` | Slug of the broker this article is about (if applicable) |
| `relatedPropFirm` | Slug of the prop firm this article is about (if applicable) |
| `publishedAt` | Publication datetime (ISO 8601) |

### Article Type: Broker Guide

**URL pattern:** `/broker-guides/[slug]`
**Purpose:** Educational content about trading with a specific broker, or comparisons.
**Examples:**
- "How to withdraw funds from GatesFX step by step"
- "AvaTrade MT5 tutorial for beginners"
- "GatesFX vs TMGM — which broker is better for UK traders?"

**What makes a good broker guide:**
- Specific, actionable, step-by-step where applicable
- References real features of the broker (spreads, platforms, regulation)
- Includes a section on who the broker is best suited for
- Internal links to the broker's main review page
- Always set `relatedBroker` to the broker's slug

### Article Type: Broker News

**URL pattern:** `/broker-news/[slug]`
**Purpose:** Timely coverage of broker industry events.
**Examples:**
- Broker closures or license revocations
- New regulation announcements
- Withdrawal issues or customer complaints trending
- New platform launches or account type introductions
- Bonus or promotion announcements

**What makes a good news article:**
- Written within 24–48 hours of the event
- Factual, neutral, cites sources where possible
- Includes what traders should do in response
- Links to the affected broker's review page

### Article Type: Prop Firm Guide

**URL pattern:** `/prop-firm-guides/[slug]`
**Purpose:** Educational content for traders trying to get funded.
**Examples:**
- "How to pass the FTMO challenge in 30 days"
- "FundedNext vs FTMO — which challenge is easier?"
- "Best prop firms with no time limit in 2025"
- "How prop firm drawdown rules actually work"

**Always set `relatedPropFirm`** to the relevant prop firm slug.

### Article Type: Prop Firm News

**URL pattern:** `/prop-firm-news/[slug]`
**Purpose:** News about specific prop firms.
**Examples:**
- A prop firm shutting down or pausing payouts
- A firm changing its challenge rules or profit splits
- A firm launching a new product (e.g. instant funding)
- Trader reports of delayed payouts

### Article Type: Trading Tools

**URL pattern:** `/trading-tools/[slug]`
**Purpose:** Reviews and tutorials for tools traders use alongside brokers/prop firms.
**Examples:**
- VPS providers (QuantVPS, BeeksFX)
- Charting platforms (TradingView, NinjaTrader)
- Copy trading tools
- Economic calendar tools

---

## 7. SEO Principles & Editorial Standards

### SEO Title Rules

- Maximum **60 characters** including spaces
- Always include the **primary keyword** near the front
- Include the **year** for review and list articles (it improves CTR significantly)
- Format: `[Primary Keyword] — [Secondary Benefit] | EntryLab` or `[Broker Name] Review [Year] — [Key Hook]`
- Avoid clickbait; be specific and accurate

**Good examples:**
```
AvaTrade Review 2025 — FCA Regulated, $100 Min Deposit
Best US Forex Brokers 2025 — Regulated & Low Spreads
How to Pass the FTMO Challenge — 7 Proven Strategies
```

**Bad examples:**
```
AvaTrade: Everything You Need to Know About This Amazing Broker!
Top Forex Brokers You Won't Believe (Number 3 Will Shock You)
```

### Meta Description Rules

- **140–160 characters** including spaces
- Must contain the primary keyword naturally
- Should include a **call-to-action** or benefit statement
- Do not use ALL CAPS or excessive punctuation
- Must be unique per page — never duplicate descriptions

**Good example:**
```
AvaTrade review: FCA-regulated since 2006, $100 min deposit, 1,250+ instruments across MT4 and MT5. Find out if AvaTrade is the right broker for you.
```

### URL Slug Rules

- Lowercase letters and hyphens only
- No special characters, no underscores, no numbers unless meaningful
- Should reflect the primary keyword naturally
- Broker review slugs end with `-review`: `avatrade-review`
- Prop firm slugs do not: `ftmo`, `fundednext`, `e8-markets`
- Article slugs should be descriptive: `how-to-pass-ftmo-challenge`

### Content Quality Standards

- Minimum **800 words** for guides and reviews
- News articles: minimum **300 words**
- Always include a structured introduction (who this is for, what they'll learn)
- Use H2 and H3 subheadings throughout for readability
- Include a summary or verdict section at the end
- Never fabricate data — use known facts about the broker/firm
- Flag uncertainty with "as of [date]" or "according to [source]"

---

## 8. Tone of Voice & Writing Style

### Brand Voice

EntryLab speaks as a **knowledgeable but approachable trading insider**. The tone is:

- **Authoritative** — We know the forex industry well. We don't hedge unnecessarily.
- **Direct** — Get to the point. Traders are busy and experienced.
- **Honest** — We acknowledge when a broker has weaknesses. Overly positive reviews lose credibility.
- **Neutral** — We are not promoters. We are reviewers. Affiliate relationships do not bias our verdicts.
- **Accessible** — We don't dumb things down, but we do explain jargon on first use.

### Who We Are Writing For

**Primary reader:** A retail forex trader with 6 months to 3 years of experience. They:
- Know what a spread is, what leverage means, and what MT4/MT5 is
- Are trying to decide between 2–3 brokers or prop firms
- Are sceptical of marketing — they want real, unbiased information
- May be in the UK, South Africa, Australia, or Southeast Asia

**Secondary reader:** An aspiring prop firm trader who wants to get funded. They:
- Have tried or are considering the evaluation challenge model
- Want to understand the rules and whether a firm is trustworthy
- Compare firms heavily on profit split, drawdown rules, and payout reliability

### Writing Rules

- Write in **British English** (use "analyse" not "analyze", "licence" not "license" for the noun)
- Use **active voice** wherever possible: "AvaTrade charges no commission" not "No commission is charged by AvaTrade"
- **Avoid filler phrases**: "In conclusion", "It's worth noting that", "Without further ado"
- **Avoid fluff adjectives**: "amazing", "incredible", "outstanding" — be specific instead
- Write **short paragraphs** — 2 to 4 sentences maximum
- Use **numbered lists** for step-by-step processes, **bullet lists** for features and pros/cons
- Always introduce acronyms on first use: "Financial Conduct Authority (FCA)"

### Verdict / Rating Guidance

When summarising a broker or prop firm:
- 8.5–10: Exceptional — top-tier, recommended for most traders
- 7.0–8.4: Good — solid choice with minor limitations
- 5.5–6.9: Average — works for specific traders but has notable drawbacks
- Below 5.5: Below average or risky — flag issues clearly

---

## 9. GSC Integration — SEO Optimisation Tasks

The site has a live integration with Google Search Console (GSC). Data is synced daily into the `gsc_performance` and `gsc_queries` tables.

### Available GSC API Endpoints

```
GET /api/admin/gsc/stats?days=28
Returns: total_impressions, total_clicks, avg_position, url_count, top 20 pages by clicks

GET /api/admin/gsc/insights?days=28
Returns:
  quickWins — pages ranking positions 4–15 with 50+ impressions (low-hanging fruit)
  ctrIssues — pages with 100+ impressions but under 2% CTR

GET /api/admin/gsc/queries?url=https://entrylab.io/broker/avatrade-review&days=28
Returns: top search queries driving traffic to a specific URL

GET /api/admin/gsc/indexing-log
Returns: recent URL submission and indexing status log
```

### SEO Optimisation Workflow

#### Task: Fix CTR Issues

1. Call `GET /api/admin/gsc/insights?days=28`
2. For each URL in `ctrIssues` (high impressions, low CTR):
   - The page is ranking but not being clicked — the title/description is likely the problem
   - Call `GET /api/admin/gsc/queries?url=[URL]` to see what queries are driving impressions
   - Rewrite the `seoTitle` to be more compelling and match searcher intent
   - Rewrite the `seoDescription` to include a clearer benefit and call-to-action
   - Update via the appropriate admin endpoint (see Section 13)

#### Task: Capitalise on Quick Wins

1. Call `GET /api/admin/gsc/insights?days=28`
2. For each URL in `quickWins` (positions 4–15, 50+ impressions):
   - The page is close to page 1 — improve content quality to push it up
   - Check what queries it ranks for (`GET /api/admin/gsc/queries?url=[URL]`)
   - Update the article/page content to better answer those queries
   - Ensure the primary keyword appears in the title, first paragraph, and at least one H2

#### Task: Monitor Position Changes

- Compare `avg_position` week-over-week (use `days=7` vs `days=28`)
- Pages that have dropped more than 3 positions need content freshness review
- Update `lastUpdated` timestamp after any content improvement

---

## 10. Broken Link & Site Health Checks

### What to Check

1. **Internal broken links:** Links in article `content` HTML that point to `/broker/[slug]` or `/prop-firm/[slug]` pages where that slug no longer exists in the database
2. **Affiliate link validity:** `affiliateLink` URLs on brokers and prop firms that return 404 or redirect to error pages
3. **Image URLs:** `logoUrl` fields pointing to images that no longer load
4. **Orphaned content:** Published articles with a `relatedBroker` or `relatedPropFirm` slug that has been deleted from the database

### How to Check

- Fetch all brokers: `GET /api/brokers`
- Fetch all prop firms: `GET /api/prop-firms`
- Fetch all published articles: `GET /api/admin/articles?status=published`
- Cross-reference `relatedBroker` / `relatedPropFirm` slugs against the broker/prop firm lists
- For affiliate links, make a HEAD request — a 200 or 301 to the broker site is acceptable. A 404 or 5xx is a problem.

### How to Report / Fix

- For broken `affiliateLink`: Update the broker/prop firm record with a corrected URL or clear the field
- For orphaned articles: Update the article's `relatedBroker` / `relatedPropFirm` to `null` or assign it to the correct entity
- For broken internal links in content: Update the article content HTML to use the correct URL

---

## 11. Competitor Awareness

### Primary Competitors

EntryLab competes with these sites for the same search rankings:

| Site | Strengths | Notes |
|---|---|---|
| ForexBrokers.com | Very high DA, comprehensive data | US-focused |
| BrokerChooser.com | Strong data tables, interactive comparisons | European-focused |
| Investopedia.com | Huge domain authority, broad finance coverage | Not specialist forex |
| FXEmpire.com | Large broker database, active news | Lower quality content |
| TopBrokers.com | SEO-aggressive, many geo pages | Thin content |
| Prop Firm Match | Prop firm comparison specialist | Dedicated competitor |
| The Funded Trader Blog | Prop firm news and guides | Community-driven |

### Competitive Content Strategy

- For any keyword where a competitor ranks in position 1–3, produce a better-structured, more specific version of that content
- Prioritise keywords that are **underserved** — specific, long-tail queries where top results are generic
- Always include **data points** (specific numbers, dates, regulation details) that competitors' generic content misses
- Freshness matters: update review dates and data tables regularly — stale content loses rankings

---

## 12. New Broker / Prop Firm Discovery

### Signals That a New Entity Should Be Added

- A broker or prop firm is mentioned in trader communities (Reddit r/Forex, r/Forex_Prop, Telegram groups)
- A new firm appears on regulatory body new-registration lists (FCA Register, ASIC Connect)
- GSC shows branded search queries for an entity not yet in the database (e.g. "XYZ Broker review" with impressions but no page)
- A competitor site has added a review for an entity EntryLab doesn't have

### Before Adding a New Broker

Verify:
1. Is it regulated? (Check FCA Register, ASIC Connect, CySEC register)
2. Does it have a real presence? (Live website, established social media)
3. Is there genuine trader interest? (Search volume, forum mentions)
4. Is it potentially an affiliate partner? (Do they have an affiliate programme?)

### Minimum Data Needed to Create a Broker

These fields are required — do not create a record without them:
- `name`
- `slug` (must be unique, ending in `-review`)
- `regulation`
- `minDeposit`
- `maxLeverage`
- `spreadFrom`
- `platforms`
- `yearFounded`
- `headquarters`
- `pros` (at least 3)
- `cons` (at least 2)
- `highlights` (at least 3)
- `content` (full review, minimum 800 words)
- `seoTitle`
- `seoDescription`

### Minimum Data Needed to Create a Prop Firm

- `name`
- `slug`
- `profitSplit`
- `maxFundingSize`
- `evaluationFee`
- `challengeTypes`
- `profitTarget`
- `dailyDrawdown`
- `maxDrawdown`
- `payoutFrequency`
- `pros` (at least 3)
- `cons` (at least 2)
- `content` (minimum 800 words)
- `seoTitle`
- `seoDescription`

---

## 13. API Reference — Admin Endpoints

**Base URL:** `https://entrylab.io`
**Authentication:** Every request must include:
```
Authorization: Bearer YOUR_ADMIN_PASSWORD
```

### Brokers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/brokers` | List all brokers (public) |
| GET | `/api/admin/brokers/:slug` | Get full broker record |
| POST | `/api/admin/brokers` | Create a new broker |
| PUT | `/api/admin/brokers/:slug` | Update an existing broker (full or partial) |
| DELETE | `/api/admin/brokers/:slug` | Delete a broker |
| GET | `/api/admin/brokers/:slug/categories` | Get category assignments |
| PUT | `/api/admin/brokers/:slug/categories` | Update category assignments `{ categoryIds: [1, 2, 3] }` |

### Prop Firms

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/prop-firms` | List all prop firms (public) |
| GET | `/api/admin/prop-firms/:slug` | Get full prop firm record |
| POST | `/api/admin/prop-firms` | Create a new prop firm |
| PUT | `/api/admin/prop-firms/:slug` | Update an existing prop firm |
| DELETE | `/api/admin/prop-firms/:slug` | Delete a prop firm |
| GET | `/api/admin/prop-firms/:slug/categories` | Get category assignments |
| PUT | `/api/admin/prop-firms/:slug/categories` | Update category assignments |

### Articles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/articles` | List all articles. Filter: `?status=published&category=broker-news` |
| GET | `/api/admin/articles/:id` | Get full article by ID |
| POST | `/api/admin/articles` | Create a new article |
| PUT | `/api/admin/articles/:id` | Update an article (full or partial) |
| DELETE | `/api/admin/articles/:id` | Delete an article |

**To publish an article:** `PUT /api/admin/articles/:id` with `{ "status": "published", "publishedAt": "2025-03-18T10:00:00Z" }`

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/categories` | List all categories |
| POST | `/api/admin/categories` | Create a new category `{ name, slug }` |
| PUT | `/api/admin/categories/:id` | Update a category |
| DELETE | `/api/admin/categories/:id` | Delete a category |

### Static Page SEO

For pages without individual DB entities (e.g. `/brokers`, `/prop-firms`, `/compare`, `/signals`):

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/static-page-seo` | Get all static page SEO records |
| PUT | `/api/admin/static-page-seo/:slug` | Update SEO for a static page `{ seoTitle, seoDescription }` |

Static page slugs: `brokers`, `prop-firms`, `compare`, `signals`, `subscribe`, `success`, `broker-news`, `prop-firm-news`, `broker-guides`, `prop-firm-guides`, `trading-tools`, `news`

### GSC (Google Search Console)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/gsc/stats?days=28` | Overall performance stats + top pages |
| GET | `/api/admin/gsc/insights?days=28` | Quick wins + CTR issues |
| GET | `/api/admin/gsc/queries?url=[URL]&days=28` | Top queries for a specific URL |
| GET | `/api/admin/gsc/indexing-log` | Recent indexing activity log |
| POST | `/api/admin/gsc/submit-url` | Submit a URL to Google for indexing `{ url }` |

### Comparisons

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/comparisons` | List all comparison pages |
| GET | `/api/admin/comparisons/stats` | Comparison system statistics |
| POST | `/api/admin/comparisons/generate-all` | Auto-generate all missing comparison pairs |
| POST | `/api/admin/comparisons/bulk` | Bulk publish/archive comparisons |
| PUT | `/api/admin/comparisons/:id` | Update a specific comparison |

---

## 14. Daily Task Schedule (Reference)

This is a suggested daily schedule for the automation agent:

### Every Day (3:00 AM)

1. **GSC sync check** — confirm data is up to date
2. **CTR issue scan** — pull insights, identify top 3 pages with CTR below 2% and 100+ impressions
3. **Rewrite SEO titles/descriptions** — for the identified CTR issue pages
4. **Quick win scan** — identify top 3 pages in positions 4–15 with content improvement potential
5. **Broken affiliate link check** — scan all broker/prop firm affiliate links for errors
6. **Submit updated URLs** — submit any pages updated today via `/api/admin/gsc/submit-url`

### Every Week (Monday, 4:00 AM)

1. **Full site health check** — broken internal links across all articles
2. **Position drop report** — compare last 7 days vs previous 7 days, flag any -3 position drops
3. **Competitor monitoring** — check if competitors have published reviews for entities not yet on EntryLab
4. **New broker/prop firm check** — search for newly launched or recently talked-about entities
5. **Review freshness** — identify broker/prop firm records where `lastUpdated` is older than 90 days
6. **Comparison pair audit** — ensure all broker and prop firm pairs have comparison pages generated

### Every Month (1st of month, 5:00 AM)

1. **Update year references** in top-performing article titles and descriptions if a new year has started
2. **Audit all broker ratings** — check if any have had significant regulatory or market changes
3. **Category listing audit** — ensure all brokers have accurate category assignments
4. **Review static page SEO** — refresh meta descriptions for `/brokers`, `/prop-firms`, `/compare`

---

## 15. Rules & Safety Constraints

These rules must **never** be violated:

1. **Never delete a broker, prop firm, or article** without explicit human confirmation. Create a draft/archive instead.

2. **Never publish an article without** `seoTitle`, `seoDescription`, `excerpt`, `featuredImage`, and at least 300 words of `content`.

3. **Never fabricate regulation details, spread data, or fee information.** If you are unsure of a value, leave the field blank or use a clearly marked placeholder like `"Check official site"`.

4. **Never change an existing slug** — this breaks live URLs and causes 404 errors.

5. **Always set `lastUpdated`** when modifying a broker or prop firm record.

6. **Never create a duplicate slug** — always check if the slug exists before creating a new entity.

7. **Always use British English** in all content written for the site.

8. **Affiliate links must not be stripped.** When updating a broker record, always preserve the existing `affiliateLink` value unless you have a confirmed replacement.

9. **Content updates to live articles should be minimal and targeted** — change SEO fields and specific outdated paragraphs only. Do not rewrite entire articles without explicit instruction.

10. **When in doubt, create a draft** (`status: "draft"`) and flag it for human review rather than publishing directly.
