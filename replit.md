# EntryLab — Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application that aggregates and displays forex broker news, proprietary firm updates, and trading analysis. The platform is 100% WordPress-free — all data (articles, brokers, prop firms, categories, reviews) is stored in and served from PostgreSQL. There are zero runtime calls to any external CMS.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks & Libraries**: React 18 with TypeScript, Vite for tooling, `wouter` for routing, React Query for server state, React Context for theme.
- **UI/UX**: Shadcn UI (Radix UI primitives), "new-york" preset, Tailwind CSS. Dark mode by default with light/dark toggle. Inter font for text, JetBrains Mono for financial data.
- **Key Features**: Category archive pages, nested SEO URL architecture (see below), 6-step review modal, broker comparison tool (`/compare`), broker/prop-firm contextual article displays, full Comparison System with hub pages + individual vs pages (`/compare/broker/:slug`, `/compare/prop-firm/:slug`).
- **Nested URL Architecture**: Cluster articles linked to a broker/prop firm via `relatedBroker`/`relatedPropFirm` get nested URLs — `/broker/:brokerSlug/:articleSlug` and `/prop-firm/:propFirmSlug/:articleSlug`. Old flat `/:category/:slug` URLs 301-redirect to nested URLs automatically. Admin editor shows the correct URL preview based on selected parent entity. `getArticleUrl()` utility auto-computes the correct URL.
- **Performance**: Client-side CSS deferral, static asset caching, image optimisation (WebP, responsive `srcset`), loading skeletons, `font-display: swap`.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: Pure REST API serving data directly from PostgreSQL via Drizzle ORM. No CMS proxy layer.
- **Authentication**: Admin routes protected by `x-admin-secret` / session-based auth. JWT used for signal user sessions.
- **Telegram Bot Integration**: Webhook-based bot for review moderation — approve/reject buttons sent to a Telegram channel.
- **Subscription System**: Stripe payments (Replit connector) for monthly ($49) and yearly ($319) premium signal subscriptions.
- **PromoStack Integration**: `POST https://dash.promostack.io/api/telegram/grant-access` for dynamic Telegram invite links. Plan mapping:
  - 7-day/weekly → "Premium Forex Signals - 7 Day"
  - Monthly → "Premium Forex Signals - Monthly"
  - One-time (lifetime) → "Premium Forex Signals - Lifetime"
  - Free users: static `https://t.me/entrylabs` link
- **Key Endpoints**: `/api/articles`, `/api/articles/by-parent/:entityType/:entitySlug` (cluster articles for a broker/prop firm), `/api/categories`, `/api/category-content`, `/api/brokers`, `/api/prop-firms`, `/api/trust-signals`, `/api/reviews/:id`, `/api/reviews/submit`, Stripe webhook, Telegram webhook. Comparison endpoints: `/api/comparisons/hub/:entityType`, `/api/comparisons/related/:entityType/:slug`, `/api/comparisons/:entityType/:slug`. Admin comparison endpoints: `/api/admin/comparisons`, `/api/admin/comparisons/stats`, `/api/admin/comparisons/generate-all`, `/api/admin/comparisons/bulk`, `/api/admin/comparisons/:id`.
- **301 Redirect Middleware**: Server-side Express middleware at `/:category/:articleSlug` detects articles with `relatedBroker`/`relatedPropFirm` set and returns HTTP 301 to the new nested URL. Only fires for known article category slugs.
- **SEO Middleware**: Server-side injection of title, meta description, Open Graph tags, canonical URLs, and JSON-LD structured data — all sourced from PostgreSQL.
- **Structured Data**: JSON-LD generated server-side for Organization, FinancialService, Article, Review, BreadcrumbList, and FAQPage schemas.
- **Webhook Resilience**: All Stripe handlers include defensive error handling and non-blocking external API calls.

### Data Layer
- **Database**: PostgreSQL (Neon serverless), managed with Drizzle ORM.
- **Tables**: `articles`, `brokers_data`, `prop_firms_data`, `categories`, `broker_categories`, `prop_firm_categories`, `reviews`, `signal_users`, `subscriptions`, `email_captures`, `webhook_events`, `broker_alerts`, `article_views`, `static_page_seo`, `comparisons`.
- **Current Data**: 41 published articles, 17 brokers, 14 prop firms, 10 categories — all in PostgreSQL.
- **Data Sources**: 100% PostgreSQL. No external CMS or API dependency for any runtime data.
- **Category Assignments**: `broker_categories` and `prop_firm_categories` junction tables with composite PKs.
- **Comparison Tool**: `/compare` page supports side-by-side comparison of up to 4 brokers.
- **Comparison System**: Auto-generated vs pages for every entity pair. `comparisons` table (status: draft/published/updated/archived). Comparison engine in `server/comparison-engine.ts` — 14 winner-logic categories, FAQ generation, `generateAllMissingPairs()`. Hub pages at `/compare/broker` and `/compare/prop-firm`. Individual pages at `/compare/broker/:slug` and `/compare/prop-firm/:slug`. Admin UI at `/admin/comparisons`. SSR tags injected for all comparison URLs. **New comparisons from `onEntityCreated` auto-publish immediately** (no manual step needed).
- **Content Automation**: `sanitiseArticleContent()` scrubs legacy `/popular_broker/` and `/popular-broker/` WordPress URLs from article content on every save. `pingSitemaps()` fires non-blocking pings to Google + Bing when articles are published or new brokers/prop firms are added.
- **Legacy Redirects**: Express middleware handles `/popular_broker/:slug`, `/popular-broker/:slug` (both variants, with WP slug → canonical broker slug mapping), `/popular-brokers` → `/brokers`. `redirects.conf` mirrors these rules for Nginx on the VPS.
- **Admin Panel**: Full CRUD for articles, brokers, prop firms, categories, reviews, and static page SEO via `/admin/*` routes. All fields displayed on broker/prop firm review pages are editable in the admin — highlights, bonusOffer, discountCode, discountAmount, yearFounded, headquarters, support, minWithdrawal, accountTypes (broker), challengeTypes/propFirmUsp/regulation/minDeposit/maxLeverage (prop firm).
- **Static Page SEO**: `static_page_seo` table (PK: slug) stores seo_title + seo_description for 6 static pages (`/brokers`, `/prop-firms`, `/compare`, `/signals`, `/subscribe`, `/success`) and 6 category archives (`broker-news`, `prop-firm-news`, `broker-guides`, `prop-firm-guides`, `trading-tools`, `news`). Editable from admin at `/admin/pages`. Admin endpoints: `GET /api/admin/static-page-seo`, `PUT /api/admin/static-page-seo/:slug`.

### Design System
- **Theming**: Dark/light mode with `localStorage` persistence, defaulting to dark.
- **Branding**: Custom favicon, EntryLab purple + gold palette, market indicator greens/reds.
- **Component Patterns**: Compound components, Radix Slot pattern, `class-variance-authority` for variants, responsive design.

### Deployment & Analytics
- **Deployment**: Frontend at `entrylab.io`, both served via Hostinger VPS with PM2 and Nginx.
- **Analytics**: Google Tag Manager for affiliate click and review submission tracking.
- **CI/CD**: GitHub Actions for continuous deployment to main branch.

## External Dependencies

### Third-Party Services
- **Database**: PostgreSQL (Neon serverless).
- **Payments**: Stripe (Replit connector) for subscription management.
- **Email**: Resend for transactional emails (welcome, cancellation).
- **Telegram Access**: PromoStack API for automated Telegram invite links.
- **Messaging/Bots**: Telegram Bot API for review moderation.

### Key NPM Packages
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
- **Data Management**: `@tanstack/react-query`, `react-hook-form`, `zod`, `drizzle-zod`.
- **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.
- **Telegram Integration**: `node-telegram-bot-api`.
