# Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application designed as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, prop firm updates, and trading analysis, fetching content from a WordPress backend. The platform aims to provide traders with a clean, professional interface for broker information, articles, and market data, inspired by Bloomberg and CoinDesk, with a focus on business vision and market potential.

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
- **Review System**: A 6-step review modal for brokers/prop firms, creating WordPress review posts via authenticated REST API (spam protection temporarily disabled).
- **Broker-Contextual Articles**: ACF relationship field (`related_broker`) links articles to specific brokers. Articles with related brokers display BrokerCardEnhanced in sidebar (desktop) or inline (mobile), plus BrokerAlertPopup with 80% scroll threshold (vs 60% on review pages).

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API proxying requests to WordPress.
- **Authentication**: WordPress Application Password for REST API write operations.
- **Key API Endpoints**: Endpoints for WordPress posts, categories, brokers, prop firms, trust signals, and review submission/fetching. Article endpoint detects ACF `related_broker` field, extracts broker ID from post object/array, and fetches full broker details.

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
- **WordPress API Caching**: In-memory cache layer with TTL (5-15 min based on content type) reduces API latency from 690ms to <5ms on cache hits.
- **Static Asset Caching**: Production cache-control headers (1 year for hashed JS/CSS, 30 days for images, 1 year for fonts, no-cache for HTML).
- **Image Optimizations**: WordPress media_details integration for optimized image sizes (large→medium_large→medium priority), responsive srcset generation from URL patterns, `fetchPriority="high"` for LCP images, lazy loading for below-fold content.
- **Loading Skeletons**: Structured content placeholders on Home, Article, and Archive pages for improved perceived performance during API fetches.
- **Font Loading**: `font-display: swap` to prevent invisible text during font load.
- **Mobile Performance**: Responsive image serving (300px mobile, 768px tablet, 1024px desktop), preconnect to critical domains, async GTM loading, inline critical CSS.

## External Dependencies

### Third-Party Services
- **Content Management**: WordPress REST API.
- **Database**: PostgreSQL (Neon serverless).

### Key NPM Packages
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
- **Data Fetching & Forms**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
- **Development Tools**: `vite`, `@vitejs/plugin-react`, `tsx`, `esbuild`.
- **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.