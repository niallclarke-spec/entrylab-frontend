# Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application serving as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, prop firm updates, and trading analysis, sourcing content from a WordPress backend. Inspired by Bloomberg and CoinDesk, the platform provides traders with a professional interface for broker information, articles, and market data, focusing on business vision and market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Frameworks & Libraries**: React 18 with TypeScript, Vite, `wouter` for routing, React Query for server state, React Context API for theme management.
-   **UI/UX**: Shadcn UI (Radix UI primitives) with "new-york" style preset, Tailwind CSS for styling, custom design system with CSS variables for theming (dark mode default). Typography uses Inter for headlines/body and JetBrains Mono for financial data.
-   **Key Features**: Dynamic category archive pages with Yoast SEO integration, SEO-optimized category-based URLs (`/:category/:slug`), a 6-step review modal for brokers/prop firms, and broker-contextual article displays.
-   **Performance**: WordPress API caching with 15-min TTL, client-side CSS deferral, static asset caching, image optimizations (WebP conversion, responsive `srcset`), loading skeletons, and `font-display: swap`.

### Backend
-   **Runtime**: Node.js with Express.js.
-   **API Design**: RESTful API proxying and extending WordPress functionality.
-   **Authentication**: WordPress Application Passwords for secure REST API write operations.
-   **Telegram Bot Integration**: Webhook-based bot for review moderation, sending notifications with inline approve/reject buttons to a Telegram channel when new reviews are submitted.
-   **Key Endpoints**: Handles WordPress posts, categories, brokers, prop firms, trust signals, review submission/fetching, and Telegram/WordPress webhooks.

### Data Layer
-   **Database**: PostgreSQL via Drizzle ORM.
-   **Data Sources**: Primarily the WordPress REST API for all content types (articles, categories, brokers, prop firms) and ACF Options.

### Design System
-   **Theming**: Dark/light mode toggle with localStorage persistence (dark mode default).
-   **Branding**: Custom favicon system and color palette (EntryLab purple, gold, green/red for market indicators).
-   **Component Patterns**: Utilizes compound components, Radix UI Slot pattern, `class-variance-authority` for variants, and responsive design.

### Deployment & Analytics
-   **Deployment**: Frontend on `entrylab.io`, Backend (WordPress) on `admin.entrylab.io`, hosted on Hostinger VPS with PM2 and Nginx.
-   **Analytics**: Google Tag Manager for granular tracking, including affiliate clicks and review submissions.
-   **CI/CD**: GitHub Actions for continuous deployment to the main branch.

## External Dependencies

### Third-Party Services
-   **Content Management**: WordPress REST API.
-   **Database**: PostgreSQL (Neon serverless).
-   **Messaging/Bots**: Telegram Bot API for review moderation and notifications.

### Key NPM Packages
-   **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
-   **Data Management**: `@tanstack/react-query`, `react-hook-form`, `zod`, `drizzle-zod`.
-   **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.
-   **Telegram Integration**: `node-telegram-bot-api`.