# EntryLab — Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application that aggregates and displays forex broker news, proprietary firm updates, and trading analysis. The platform is 100% WordPress-free — all data (articles, brokers, prop firms, categories, reviews) is stored in and served from PostgreSQL. There are zero runtime calls to any external CMS.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks & Libraries**: React 18 with TypeScript, Vite for tooling, `wouter` for routing, React Query for server state, React Context for theme.
- **UI/UX**: Shadcn UI (Radix UI primitives), "new-york" preset, Tailwind CSS. Dark mode by default with light/dark toggle. Inter font for text, JetBrains Mono for financial data.
- **Key Features**: Category archive pages, SEO-optimised `/:category/:slug` URLs, 6-step review modal, broker comparison page (`/compare`), broker/prop-firm contextual article displays.
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
- **Key Endpoints**: `/api/articles`, `/api/categories`, `/api/category-content`, `/api/brokers`, `/api/prop-firms`, `/api/trust-signals`, `/api/reviews/:id`, `/api/reviews/submit`, Stripe webhook, Telegram webhook.
- **SEO Middleware**: Server-side injection of title, meta description, Open Graph tags, canonical URLs, and JSON-LD structured data — all sourced from PostgreSQL.
- **Structured Data**: JSON-LD generated server-side for Organization, FinancialService, Article, Review, BreadcrumbList, and FAQPage schemas.
- **Webhook Resilience**: All Stripe handlers include defensive error handling and non-blocking external API calls.

### Data Layer
- **Database**: PostgreSQL (Neon serverless), managed with Drizzle ORM.
- **Tables**: `articles`, `brokers_data`, `prop_firms_data`, `categories`, `broker_categories`, `prop_firm_categories`, `reviews`, `signal_users`, `subscriptions`, `email_captures`, `webhook_events`, `broker_alerts`, `article_views`.
- **Current Data**: 41 published articles, 17 brokers, 14 prop firms, 10 categories — all in PostgreSQL.
- **Data Sources**: 100% PostgreSQL. No external CMS or API dependency for any runtime data.
- **Category Assignments**: `broker_categories` and `prop_firm_categories` junction tables with composite PKs.
- **Comparison Feature**: `/compare` page supports side-by-side comparison of up to 4 brokers.
- **Admin Panel**: Full CRUD for articles, brokers, prop firms, categories, and reviews via `/admin/*` routes.

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
