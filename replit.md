# Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application designed as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, prop firm updates, and trading analysis, fetching content from a WordPress backend. The platform aims to provide traders with a clean, professional interface for broker information, articles, and market data, inspired by Bloomberg and CoinDesk, with a focus on business vision and market potential.

## Recent Changes (October 12, 2025)

### Telegram Bot Review Moderation - Fixed & Optimized ✅
- **Inline Button Integration**: Added clickable buttons (✅ Approve, ❌ Reject, 👁️ View Details) directly in Telegram channel notifications for one-click review moderation
- **Fixed Endpoint Issue**: Corrected API endpoints from `/posts/{ID}` to `/review/{ID}` for proper custom post type handling
- **Direct Notification Flow**: Notifications now sent directly from Replit after review creation (bypasses WordPress webhook timing issues)
- **Enhanced Security**: All callback queries validated against `TELEGRAM_CHANNEL_ID` with proper error handling and markdown escaping

### UI/UX Fixes ✅
- **Featured Broker Widget**: Fixed "Read Review" button to use internal navigation instead of external link (uses `<Link>` from wouter instead of `<a target="_blank">`)
- **Review Link Consistency**: All broker review links now properly route to `/broker/{slug}` within the application

### ✅ Production Deployment Complete
- All Telegram bot fixes complete and tested on production
- Featured broker navigation working correctly
- Telegram webhook registered and operational on entrylab.io
- Environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`) configured in production `.env` file
- Review notifications with inline buttons working perfectly on production

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite.
- **Routing**: `wouter` for client-side routing.
- **State Management**: React Query for server state, React Context API for theme.
- **UI Components**: Shadcn UI (Radix UI primitives) with "new-york" style preset.
- **Styling**: Tailwind CSS, CSS variables for theming (dark mode default), custom design system.
- **Typography**: Inter (headlines/body), JetBrains Mono (financial data).
- **Color Palette**: EntryLab purple, gold for ratings, green/red for market indicators.
- **Key UI Elements**: Navigation, hero with forex animation, various article/broker card types, featured broker showcase, market ticker, newsletter CTA, trending topics filter, trust signals, single article template, archive page with search and filtering.
- **Review System**: A 6-step review modal for brokers/prop firms, creating WordPress review posts via authenticated REST API (spam protection temporarily disabled). Telegram bot integration for review moderation directly from Telegram channel.
- **Broker-Contextual Articles**: ACF relationship field (`related_broker`) links articles to specific brokers. Articles with related brokers display BrokerCardEnhanced in sidebar (desktop) or inline (mobile), plus BrokerAlertPopup with 80% scroll threshold (vs 60% on review pages).

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API proxying requests to WordPress.
- **Authentication**: WordPress Application Password for REST API write operations.
- **Telegram Bot Integration**: Webhook-based bot for review moderation. Receives notifications when new reviews are submitted to WordPress, sends formatted alerts to Telegram channel with inline approve/reject buttons. Commands `/approve_[ID]`, `/reject_[ID]`, `/view_[ID]` update WordPress post status directly from Telegram. Security enforced via `TELEGRAM_CHANNEL_ID` authentication.
- **Key API Endpoints**: Endpoints for WordPress posts, categories, brokers, prop firms, trust signals, and review submission/fetching. Article endpoint detects ACF `related_broker` field, extracts broker ID from post object/array, and fetches full broker details. Telegram webhook endpoint at `/api/telegram/webhook` for command processing, WordPress review webhook at `/api/wordpress/review-webhook` for new review notifications.

### Data Layer
- **Database**: Drizzle ORM for PostgreSQL.
- **Data Models**: User, Broker, WordPressPost (interfaces for REST API response).
- **Current Data Sources**: WordPress REST API for articles, categories, brokers, prop firms, and ACF Options.

### Design System
- **Theme**: Dark/light mode toggle with localStorage persistence (dark mode default).
- **Branding**: Custom favicon system with EntryLab purple (#8B5CF6) "E" logo in SVG format (16x16, 32x32, 180x180 for Apple devices), theme-color meta tag for browser chrome.
- **Component Patterns**: Compound components, Radix UI Slot pattern, `class-variance-authority` for variants, responsive design, dynamic content parsing.

### Deployment & Analytics
- **Deployment**: Frontend on `entrylab.io`, Backend (WordPress) on `admin.entrylab.io`, hosted on Hostinger VPS with PM2 and Nginx.
- **Analytics**: Google Tag Manager for granular placement tracking, enhanced affiliate click tracking, and brand-specific email submission/review tracking.
- **Production Deployment**: Uses PM2 with `NODE_ENV=production` and `PORT=3000`, Nginx reverse proxy.
- **GitHub Actions Auto-Deployment**: Workflow for continuous deployment to main branch.
- **Emergency Rollback System**: Git tags for stable checkpoints with defined rollback procedures.

### Development Tools
- **Code Quality**: `ErrorBoundary` for React errors, shared transformation functions for WordPress data (`transformBroker`, `transformPropFirm`), `handleWordPressError` for consistent API error handling, native lazy loading and intrinsic sizing for image optimization.
- **Broker Review Page**: Quick Stats Bar with 6 stat tiles (N/A fallbacks), conditional CTA section based on regulation status.
- **Newsletter CTA**: Redesigned with dark premium aesthetic, simplified benefits, and GTM tracking.
- **Category Filtering**: Centralized `EXCLUDED_CATEGORIES` list for consistent filtering across components.
- **Article View Counter**: PostgreSQL `article_views` table, API endpoints for incrementing/fetching counts, displayed when > 10 views.
- **Article Thumbnails**: Subtle gradient overlay for visual consistency.
- **Brand-Specific Statistics**: Dynamic social proof for broker alert popups, auto-incrementing trader counts and dollar values based on `brandStats.ts` configuration.

### Performance Optimizations
- **WordPress API Caching**: In-memory cache layer with 15-min TTL, 60-min stale-while-revalidate, reduces API latency from 690ms to <5ms on cache hits. Browser cache headers (5 min) on all endpoints.
- **CSS Render-Blocking Mitigation**: Client-side CSS deferral using preload+onload pattern with cached-asset guards to prevent FOUC. Static and dynamic stylesheets converted to non-blocking. Note: PageSpeed lab tests don't detect this optimization (measures initial HTML only), but real users receive optimized non-blocking CSS.
- **Static Asset Caching**: Production cache-control headers (1 year for hashed JS/CSS, 30 days for images, 1 year for fonts, no-cache for HTML).
- **Image Optimizations**: 
  - WordPress: Imagify plugin for WebP conversion with `<picture>` tags
  - Standard dimensions: Articles 768×307 JPEG, Broker/Prop Firm logos 220×220 PNG
  - WordPress media_details integration for optimized image sizes (large→medium_large→medium priority)
  - Responsive srcset generation from URL patterns, `fetchPriority="high"` for LCP images, lazy loading for below-fold content
- **Loading Skeletons**: Structured content placeholders on Home, Article, and Archive pages for improved perceived performance during API fetches.
- **Font Loading**: `font-display: swap` to prevent invisible text during font load.
- **Mobile Performance**: Responsive image serving (300px mobile, 768px tablet, 1024px desktop), preconnect to critical domains, async GTM loading, inline critical CSS.

## External Dependencies

### Third-Party Services
- **Content Management**: WordPress REST API.
- **Database**: PostgreSQL (Neon serverless).
- **Telegram Bot API**: Webhook integration for review moderation, notification delivery, and command processing.

### Key NPM Packages
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
- **Data Fetching & Forms**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
- **Development Tools**: `vite`, `@vitejs/plugin-react`, `tsx`, `esbuild`.
- **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.
- **Telegram Integration**: `node-telegram-bot-api` for webhook-based bot commands and notifications.

## Telegram Review Bot

### Architecture
- **Webhook Mode**: Receives commands via POST `/api/telegram/webhook` (no polling).
- **Security**: All webhook requests validated against `TELEGRAM_CHANNEL_ID` environment variable. Unauthorized chat IDs receive 403 response.
- **Inline Button Commands**: Telegram notifications include inline buttons (✅ Approve, ❌ Reject, 👁️ View Details) that work directly in channels. Button callbacks update WordPress review post type (`/wp-json/wp/v2/review/{ID}`) status via REST API.
- **Notification Flow**: Replit sends notification directly after review creation → Telegram channel with inline buttons → User clicks button → Webhook processes callback → WordPress updated.

### Setup & Configuration
1. **Secrets Required**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `WORDPRESS_USERNAME`, `WORDPRESS_PASSWORD` (stored as Replit Secrets).
2. **Webhook Registration**: Run `tsx server/setup-telegram-webhook.ts` after deployment to register webhook URL with Telegram API.
3. **WordPress Integration**: WordPress sends POST request to `/api/wordpress/review-webhook` when new review is submitted (status: pending).

### Available Commands
- Inline Buttons (preferred method):
  - ✅ **Approve** - Publishes review (sets post status to "publish")
  - ❌ **Reject** - Moves review to trash (sets post status to "trash")
  - 👁️ **View Details** - Displays full review content with WordPress edit link
- Text Commands (fallback):
  - `/approve_[ID]` - Publishes review
  - `/reject_[ID]` - Moves review to trash
  - `/view_[ID]` - Displays full review details

### Security Features
- Chat ID authentication for all webhook requests
- Markdown escaping for error messages to prevent parse failures
- Callback queries acknowledged without channel broadcast (no spam)
- WordPress credentials stored as environment secrets, never exposed in logs

### Testing
- Manual test endpoint: `POST /api/telegram/test-notification` sends sample review notification to channel
- Logs: All commands logged to console with `[Telegram Bot]` prefix for debugging