# Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application designed as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, proprietary firm updates, and trading analysis, sourcing all content from a WordPress backend. The platform provides traders with a professional interface for broker information, articles, and market data, inspired by platforms like Bloomberg and CoinDesk, with a focus on business vision and market potential. Key capabilities include dynamic content display, user review submissions, and robust SEO for market visibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks & Libraries**: React 18 with TypeScript, Vite for tooling, `wouter` for routing, React Query for server state management, and React Context API for theme management.
- **UI/UX**: Utilizes Shadcn UI (built on Radix UI primitives) with a "new-york" style preset, styled with Tailwind CSS. Features a custom design system with CSS variables for theming (dark mode by default). Typography uses Inter for text and JetBrains Mono for financial data.
- **Key Features**: Dynamic category archive pages with Yoast SEO integration, SEO-optimized category-based URLs (`/:category/:slug`), a 6-step review submission modal, and broker-contextual article displays.
- **Performance**: Achieved through WordPress API caching (15-min TTL), client-side CSS deferral, static asset caching, image optimization (WebP, responsive `srcset`), loading skeletons, and `font-display: swap`.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: Functions as a RESTful API proxy, extending WordPress functionality.
- **Authentication**: Uses WordPress Application Passwords for secure REST API write operations.
- **Telegram Bot Integration**: A webhook-based bot facilitates review moderation by sending notifications with inline approve/reject buttons to a Telegram channel.
- **Subscription System**: Integrated Stripe payments via Replit connector with automatic webhook management. Handles monthly ($49) and yearly ($319) premium signal subscriptions.
- **PromoStack Integration**: Separate Replit app that manages Telegram channel access via API. Provides fallback to direct invite links if PromoStack is unavailable.
- **Key Endpoints**: Manages WordPress posts, categories, brokers, prop firms, trust signals, review submissions/fetching, Stripe checkout sessions, and webhook handlers (Stripe, Telegram, WordPress).
- **SEO Implementation**: Server-side SEO injection middleware pre-fetches data from WordPress to inject title tags, meta descriptions, Open Graph tags, and canonical URLs into the HTML, ensuring content visibility for search engines. Handles 301 redirects for legacy WordPress URLs.
- **Structured Data**: Generates JSON-LD structured data server-side for various content types (Organization, FinancialService, Article, Review, BreadcrumbList) to enhance search engine rich results, avoiding client-side duplication.
- **Webhook Resilience**: All Stripe webhook handlers include defensive timestamp parsing, graceful error handling, and non-blocking external API calls to ensure payment processing continues even if secondary services fail.

### Data Layer
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **Data Sources**: Primarily the WordPress REST API for all content types (articles, categories, brokers, prop firms) and ACF Options.

### Design System
- **Theming**: Supports dark/light mode with localStorage persistence, defaulting to dark mode.
- **Branding**: Features a custom favicon system and a defined color palette including EntryLab purple, gold, and market indicator greens/reds.
- **Component Patterns**: Employs compound components, Radix UI Slot pattern, `class-variance-authority` for managing component variants, and responsive design principles.

### Deployment & Analytics
- **Deployment**: Frontend hosted at `entrylab.io`, Backend (WordPress) at `admin.entrylab.io`, both on Hostinger VPS with PM2 and Nginx.
- **Analytics**: Google Tag Manager is used for granular tracking, including affiliate clicks and review submissions.
- **CI/CD**: GitHub Actions automate continuous deployment to the main branch.

## External Dependencies

### Third-Party Services
- **Content Management**: WordPress REST API.
- **Database**: PostgreSQL (specifically Neon serverless).
- **Payments**: Stripe (via Replit connector) for subscription management and billing.
- **Email**: Resend for transactional emails (welcome emails, cancellation notifications).
- **Telegram Access**: PromoStack API (custom Replit app) for automated Telegram channel invite link generation.
- **Messaging/Bots**: Telegram Bot API for review moderation and notifications.

### Key NPM Packages
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
- **Data Management**: `@tanstack/react-query`, `react-hook-form`, `zod`, `drizzle-zod`.
- **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.
- **Telegram Integration**: `node-telegram-bot-api`.