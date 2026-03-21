# EntryLab — Agent Operations Guide

Everything a Claude agent needs to know to manage content and entities on EntryLab.

---

## Authentication

All admin API calls require the `x-admin-secret` header:

```
x-admin-secret: <value of ADMIN_PASSWORD env var>
```

The UI admin panel is at `/admin`. The API base is the same origin as the app.

---

## Core Rule — Empty Fields

**Never leave a placeholder, fallback, or "N/A" for any empty field.** If you don't have a value for a field, omit it from the payload entirely or pass `null`. The UI is built to hide any field that is null/empty.

---

## URL Architecture

EntryLab has two types of articles:

### 1. General / Category Articles
Standard articles that live under a category:
```
/broker-news/xm-spreads-update
/prop-firm-news/ftmo-rule-change
/trading-tools/how-to-use-rsi
```
These have `relatedBroker: null` and `relatedPropFirm: null`.

### 2. Cluster / Nested Articles (under a broker or prop firm)
Articles linked to a specific broker or prop firm get a nested URL:
```
/broker/gatesfx-review/ecn-account-review
/broker/herofx-review/deposit-guide
/prop-firm/ftmo/challenge-rules-explained
```
These are set by putting the broker's slug in `relatedBroker` (or prop firm slug in `relatedPropFirm`).

**Old flat URLs 301-redirect automatically** — so if an article previously lived at `/broker-guides/gatesfx-ecn-account` and you add `relatedBroker: "gatesfx-review"`, Google will be redirected to the new nested URL.

---

## Article Category Slugs

Use exactly these slugs in the `category` field:

| Slug | Use for |
|---|---|
| `broker-news` | News about a specific broker |
| `broker-guides` | How-to guides for brokers |
| `prop-firm-news` | News about a specific prop firm |
| `prop-firm-guides` | How-to guides for prop firms |
| `trading-tools` | Tools, indicators, platform guides |
| `news` | General forex / market news |

---

## Current Broker Slugs

Use these exact slugs in `relatedBroker` or when referencing brokers:

```
avatrade              gatesfx-review        pepperstone
cmc-markets           herofx-review         saxo-bank
eightcap              ic-markets            tickmill-review
fp-markets            ig-group              tmgm
liquidbrokers-review  trade-nation
moneta-markets        tradu
ninjatrader           xm
octafx
```

Note: Some broker slugs include `-review` (e.g. `gatesfx-review`, `herofx-review`, `tickmill-review`). Always use the exact slug from this list.

---

## Current Prop Firm Slugs

```
crypto-fund-trader    ftmo                  smart-trader-funds
e8-markets            fundednext            the5ers
fintokei              funderpro             tx3-funding
goat-funded-trader    funding-pips          wall-street-funded
lux-trading-firm      rebelsfunding
```

---

## Creating a General News Article

**Endpoint:** `POST /api/admin/articles`
**Header:** `x-admin-secret: <ADMIN_PASSWORD>`

```json
{
  "title": "XM Tightens Spreads on Major Pairs",
  "slug": "xm-tightens-spreads-major-pairs",
  "excerpt": "XM has announced tighter spreads across EUR/USD, GBP/USD and USD/JPY starting Monday.",
  "content": "<p>Full article HTML content here...</p>",
  "category": "broker-news",
  "status": "published",
  "author": "EntryLab Team",
  "featuredImage": "https://example.com/image.jpg",
  "seoTitle": "XM Tightens Spreads on Major Pairs | EntryLab",
  "seoDescription": "XM has announced tighter spreads across EUR/USD, GBP/USD and USD/JPY. Here's what traders need to know."
}
```

**Rules:**
- `slug` is auto-generated from `title` if omitted, but set it explicitly to control the URL
- `status` must be `"published"` for the article to appear publicly (or `"draft"` to save without publishing)
- `publishedAt` is set automatically when `status` is `"published"`
- `relatedBroker` and `relatedPropFirm` should be omitted (or `null`) for general articles

---

## Creating a Broker Cluster Article (Nested URL)

This creates an article at `/broker/<broker-slug>/<article-slug>`.

**Endpoint:** `POST /api/admin/articles`

```json
{
  "title": "GatesFX ECN Account: Full Deposit Guide",
  "slug": "deposit-guide",
  "excerpt": "Step-by-step guide to depositing funds into your GatesFX ECN account.",
  "content": "<p>Full article content...</p>",
  "category": "broker-guides",
  "status": "published",
  "author": "EntryLab Team",
  "relatedBroker": "gatesfx-review",
  "featuredImage": "https://example.com/image.jpg",
  "seoTitle": "GatesFX Deposit Guide | EntryLab",
  "seoDescription": "How to deposit into your GatesFX ECN account — step-by-step with all payment methods covered."
}
```

This will be live at: `/broker/gatesfx-review/deposit-guide`

**Rules:**
- `relatedBroker` must be a valid broker slug from the list above
- Do NOT set `relatedPropFirm` at the same time — only one parent entity per article
- The article will also appear in the "Guides & Resources" section on the GatesFX review page

---

## Creating a Prop Firm Cluster Article (Nested URL)

This creates an article at `/prop-firm/<propfirm-slug>/<article-slug>`.

**Endpoint:** `POST /api/admin/articles`

```json
{
  "title": "FTMO Challenge Rules Explained",
  "slug": "challenge-rules-explained",
  "excerpt": "Everything you need to know about FTMO's challenge drawdown rules and profit targets.",
  "content": "<p>Full article content...</p>",
  "category": "prop-firm-guides",
  "status": "published",
  "author": "EntryLab Team",
  "relatedPropFirm": "ftmo",
  "featuredImage": "https://example.com/image.jpg",
  "seoTitle": "FTMO Challenge Rules Explained | EntryLab",
  "seoDescription": "A full breakdown of FTMO's challenge rules, drawdown limits, and profit targets for 2026."
}
```

This will be live at: `/prop-firm/ftmo/challenge-rules-explained`

---

## Updating an Existing Article

**Endpoint:** `PUT /api/admin/articles/:id`

First fetch the article ID:
```
GET /api/articles   → returns all articles, each has an `id` field
```

Then update:
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "status": "published"
}
```

Only include fields you want to change. The server preserves everything else.

---

## Creating a New Broker

**Endpoint:** `POST /api/admin/brokers`

```json
{
  "name": "Pepperstone",
  "slug": "pepperstone",
  "tagline": "Fast execution, tight spreads, trusted globally.",
  "affiliateLink": "https://pepperstone.com/?ref=entrylab",
  "rating": "4.8",
  "regulation": "FCA, ASIC, CySEC, DFSA, BaFin",
  "headquarters": "Melbourne, Australia",
  "yearFounded": "2010",
  "minDeposit": "$200",
  "minWithdrawal": "$50",
  "maxLeverage": "1:500",
  "spreadFrom": "0.0 pips",
  "commission": "$3.50 per lot",
  "withdrawalTime": "1-3 business days",
  "support": "24/5 live chat + email",
  "paymentMethods": "Bank transfer, Visa, Mastercard, PayPal, Skrill, Neteller",
  "platforms": "MetaTrader 4 (MT4), MetaTrader 5 (MT5), cTrader, TradingView",
  "accountTypes": ["Standard", "Razor"],
  "pros": [
    "Tight spreads from 0.0 pips on Razor",
    "Regulated in multiple top-tier jurisdictions",
    "Award-winning customer support"
  ],
  "cons": [
    "No fixed spread accounts",
    "Limited educational content"
  ],
  "highlights": [
    "Regulated by FCA & ASIC",
    "Spreads from 0.0 pips",
    "No minimum deposit on Standard"
  ],
  "bonusOffer": null,
  "bestFor": "Active traders and scalpers",
  "countries": ["Australia", "United Kingdom", "Germany"],
  "platformsList": ["MetaTrader 4 (MT4)", "MetaTrader 5 (MT5)", "cTrader", "TradingView"],
  "instruments": ["Forex (FX)", "CFDs", "Indices", "Commodities", "Crypto"],
  "isFeatured": false,
  "isVerified": true,
  "seoTitle": "Pepperstone Review 2026 | EntryLab",
  "seoDescription": "Full Pepperstone review covering spreads, regulation, platforms and more. Is Pepperstone right for you?",
  "logoUrl": "https://example.com/pepperstone-logo.png",
  "parentCompany": null,
  "ceo": null,
  "trustpilot": null,
  "isPubliclyTraded": false
}
```

**After creating a broker:**
- Comparison pages vs all existing brokers are auto-generated and published immediately
- The broker review page is live at `/broker/<slug>`
- The sitemap is pinged automatically

**Broker slug convention:** Use lowercase, hyphen-separated. If you want a `-review` suffix (e.g. for a dedicated review page), include it: `pepperstone-review`. Look at existing slugs to match the style.

---

## Updating an Existing Broker

**Endpoint:** `PUT /api/brokers/:slug`  
(No admin auth header required for this endpoint — it uses the same `x-admin-secret` via the session)

Or use the admin-specific endpoint:  
**Endpoint:** `PUT /api/admin/brokers/:slug`  
**Header:** `x-admin-secret: <ADMIN_PASSWORD>`

Only include fields you want to change:
```json
{
  "rating": "4.9",
  "bonusOffer": "30% deposit bonus up to $500",
  "minDeposit": "$100"
}
```

---

## Creating a New Prop Firm

**Endpoint:** `POST /api/admin/prop-firms`

```json
{
  "name": "FTMO",
  "slug": "ftmo",
  "tagline": "The world's leading prop firm for funded traders.",
  "affiliateLink": "https://ftmo.com/?ref=entrylab",
  "rating": "4.7",
  "profitSplit": "Up to 90%",
  "maxFundingSize": "$200,000",
  "evaluationFee": "From $155",
  "profitTarget": "10% Phase 1, 5% Phase 2",
  "dailyDrawdown": "5%",
  "maxDrawdown": "10%",
  "payoutFrequency": "Monthly",
  "challengeTypes": "2-Step Challenge, Swing",
  "propFirmUsp": "Most established prop firm globally with a proven track record since 2015",
  "discountCode": "ENTRYLAB10",
  "discountAmount": "10%",
  "regulation": "Unregulated (standard for industry)",
  "minDeposit": "$155",
  "maxLeverage": "1:100",
  "headquarters": "Prague, Czech Republic",
  "yearFounded": "2015",
  "support": "24/5 live chat",
  "paymentMethods": "Visa, Mastercard, Bank Transfer, Crypto",
  "payoutMethods": "Bank Transfer, Rise, Deel",
  "pros": [
    "Industry-leading reputation",
    "Up to 90% profit split",
    "Flexible challenge types"
  ],
  "cons": [
    "Stricter rules than some competitors",
    "No lifetime accounts"
  ],
  "highlights": [
    "Up to 90% profit split",
    "Funding up to $200K",
    "Free retries if rules broken"
  ],
  "countries": ["Czech Republic", "United Kingdom", "United States"],
  "platformsList": ["MetaTrader 4 (MT4)", "MetaTrader 5 (MT5)", "cTrader"],
  "instruments": ["Forex (FX)", "Indices", "Commodities", "Crypto"],
  "isFeatured": true,
  "isVerified": true,
  "seoTitle": "FTMO Review 2026 | EntryLab",
  "seoDescription": "Full FTMO review — challenge rules, profit splits, payout process and more. Is FTMO the right prop firm for you?",
  "logoUrl": "https://example.com/ftmo-logo.png",
  "parentCompany": null,
  "ceo": null,
  "trustpilot": "4.8 / 5",
  "isPubliclyTraded": false
}
```

**After creating a prop firm:**
- Comparison pages vs all existing prop firms are auto-generated and published immediately
- The prop firm review page is live at `/prop-firm/<slug>`
- The sitemap is pinged automatically

---

## Assigning Categories to a Broker or Prop Firm

After creating/updating a broker or prop firm, assign it to categories (used for filtering on archive pages):

**Get category IDs first:**
```
GET /api/admin/categories?type=broker       → list of broker categories with IDs
GET /api/admin/categories?type=prop_firm    → list of prop firm categories with IDs
```

**Assign:**
```
PUT /api/admin/brokers/:slug/categories
PUT /api/admin/prop-firms/:slug/categories

Body: { "categoryIds": ["uuid1", "uuid2"] }
```

This replaces the full category assignment — include all category IDs you want, not just new ones.

---

## Fetching Existing Data

```
GET /api/articles                          → all published articles (includes relatedBroker, relatedPropFirm slugs)
GET /api/articles?category=broker-guides   → filter by category
GET /api/articles/by-parent/broker/gatesfx-review   → cluster articles for a specific broker
GET /api/articles/by-parent/prop-firm/ftmo          → cluster articles for a specific prop firm
GET /api/brokers                           → all brokers
GET /api/brokers/:slug                     → single broker
GET /api/prop-firms                        → all prop firms
GET /api/prop-firms/:slug                  → single prop firm
GET /api/categories                        → all categories
```

---

## Field Reference — Articles

| Field | Type | Notes |
|---|---|---|
| `title` | string | **Required** |
| `slug` | string | URL-safe, auto-generated if omitted |
| `excerpt` | string | Short summary shown in cards |
| `content` | string | Full HTML content |
| `category` | string | Must be a valid category slug (see above) |
| `status` | string | `"draft"` or `"published"` |
| `author` | string | Defaults to `"EntryLab"` |
| `featuredImage` | string | Full URL to image |
| `seoTitle` | string | `<title>` tag — recommended max 60 chars |
| `seoDescription` | string | Meta description — recommended max 160 chars |
| `relatedBroker` | string | Broker slug — sets nested URL under `/broker/` |
| `relatedPropFirm` | string | Prop firm slug — sets nested URL under `/prop-firm/` |

Only one of `relatedBroker` or `relatedPropFirm` should be set at a time.

---

## Field Reference — Brokers

| Field | Type | Notes |
|---|---|---|
| `name` | string | **Required** |
| `slug` | string | Auto-generated from name if omitted |
| `tagline` | string | Short marketing line |
| `affiliateLink` | string | Your tracked affiliate URL |
| `rating` | string | Number e.g. `"4.8"` |
| `regulation` | string | Comma-separated regulators |
| `headquarters` | string | City, Country format |
| `yearFounded` | string | e.g. `"2010"` |
| `minDeposit` | string | e.g. `"$200"` |
| `minWithdrawal` | string | e.g. `"$50"` |
| `maxLeverage` | string | e.g. `"1:500"` |
| `spreadFrom` | string | e.g. `"0.0 pips"` |
| `commission` | string | e.g. `"$3.50 per lot"` |
| `withdrawalTime` | string | e.g. `"1-3 business days"` |
| `support` | string | e.g. `"24/5 live chat"` |
| `paymentMethods` | string | Comma-separated |
| `platforms` | string | Comma-separated (legacy text field) |
| `platformsList` | string[] | Array — preferred, used for filtering |
| `accountTypes` | string[] | e.g. `["Standard", "ECN"]` |
| `pros` | string[] | Bullet points |
| `cons` | string[] | Bullet points |
| `highlights` | string[] | Key selling points (shown in cards) |
| `awards` | string[] | e.g. `["Best Broker 2025"]` |
| `bestFor` | string | e.g. `"Scalpers and day traders"` |
| `bonusOffer` | string | Promotional offer text |
| `countries` | string[] | Accepted trader countries |
| `instruments` | string[] | Tradeable asset classes |
| `isFeatured` | boolean | Shows in featured sections |
| `isVerified` | boolean | Shows verified badge |
| `logoUrl` | string | Full URL to logo image |
| `seoTitle` | string | Page `<title>` |
| `seoDescription` | string | Meta description |
| `parentCompany` | string | e.g. `"NSFX Ltd"` — omit if unknown |
| `ceo` | string | CEO name — omit if unknown |
| `trustpilot` | string | e.g. `"4.6 / 5"` — omit if not available |
| `isPubliclyTraded` | boolean | Only set `true` for publicly listed companies |
| `content` | string | Full HTML review content |

---

## Field Reference — Prop Firms

Inherits most fields from brokers, plus:

| Field | Type | Notes |
|---|---|---|
| `profitSplit` | string | e.g. `"Up to 90%"` |
| `maxFundingSize` | string | e.g. `"$200,000"` |
| `evaluationFee` | string | e.g. `"From $155"` |
| `profitTarget` | string | e.g. `"10% Phase 1, 5% Phase 2"` |
| `dailyDrawdown` | string | e.g. `"5%"` |
| `maxDrawdown` | string | e.g. `"10%"` |
| `payoutFrequency` | string | e.g. `"Monthly"` |
| `challengeTypes` | string | e.g. `"2-Step, Instant Funding"` |
| `propFirmUsp` | string | Unique selling point shown in sidebar |
| `discountCode` | string | Promo code for the firm |
| `discountAmount` | string | e.g. `"10%"` or `"$30 off"` |
| `payoutMethods` | string | e.g. `"Bank Transfer, Crypto"` |

Note: Broker-only fields (`minWithdrawal`, `withdrawalTime`, `awards`, `bestFor`, `commission`, `spreadFrom`) are not shown on prop firm pages.

---

## Common Mistakes to Avoid

1. **Setting both `relatedBroker` and `relatedPropFirm`** — only one parent per article
2. **Using a wrong category slug** — always use the exact slugs from the Category Slugs table
3. **Using a wrong broker/prop firm slug** — always use the exact slug from the lists above (some include `-review`)
4. **Sending empty strings** — always send `null` or omit the field entirely for unknown/empty values
5. **Duplicate slugs** — the API returns a 409 if a slug already exists; generate a unique one
6. **Missing the auth header** — all `/api/admin/*` endpoints need `x-admin-secret`

---

## What Happens Automatically

When you create or update content, the following happens without any extra steps:

- **Sitemap** is pinged to Google and Bing
- **Google Indexing API** submission is scheduled for the new/updated URL
- **Comparison pages** are auto-generated (and published immediately) for new brokers/prop firms vs all existing entities
- **301 redirects** are served if an article has a parent entity set — old flat category URLs redirect to the new nested URL
- **API cache** is cleared for affected endpoints so changes are live immediately
