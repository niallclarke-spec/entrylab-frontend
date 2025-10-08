# Forex News & Trading Intelligence Hub

## Overview
This is a full-stack web application, "EntryLab," designed as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, prop firm updates, and trading analysis. The platform fetches content from a WordPress backend via REST API, presenting broker information, articles, and market data in a clean, professional format optimized for traders, inspired by Bloomberg and CoinDesk.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite.
- **Routing**: `wouter` for client-side routing (homepage, single article, archive, 404).
- **State Management**: React Query for server state, React Context API for theme, local component state.
- **UI Components**: Shadcn UI (Radix UI primitives) with "new-york" style preset.
- **Styling**: Tailwind CSS, CSS variables for theming (dark mode default), custom design system.
- **Typography**: Inter (headlines/body), JetBrains Mono (financial data).
- **Color Palette**: EntryLab purple, gold for ratings, green/red for market indicators.
- **Key UI Elements**: Navigation, hero with forex animation, article/broker cards (standard, enhanced, inline), featured broker showcase, market ticker, newsletter CTA, trending topics filter, trust signals, single article template, archive page with search and filtering.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API proxying requests to WordPress.
- **Middleware**: JSON/URL-encoded body parsing, logging, error handling.
- **Key API Endpoints**:
    - `GET /api/wordpress/posts`, `GET /api/wordpress/post/:slug`
    - `GET /api/wordpress/categories`
    - `GET /api/wordpress/brokers`, `GET /api/wordpress/broker/:slug`
    - `GET /api/wordpress/prop-firms`, `GET /api/wordpress/prop-firm/:slug`, `GET /api/wordpress/prop-firm-categories`
    - `GET /api/wordpress/trust-signals`
    - `GET /api/brokers` (legacy in-memory fallback)

### Data Layer
- **Database**: Drizzle ORM for PostgreSQL (via `@neondatabase/serverless`).
- **Data Models**: User (for authentication, not yet implemented), Broker, WordPressPost (interface for REST API response).
- **Current Data Sources**: WordPress REST API for articles, categories, brokers, prop firms, and ACF Options.

### Design System
- **Theme**: Dark/light mode toggle with localStorage persistence (dark mode default).
- **Component Patterns**: Compound components, Radix UI Slot pattern, `class-variance-authority` for variants, responsive design, dynamic content parsing.

### Deployment & Analytics
- **Deployment**: Frontend on `entrylab.io`, Backend (WordPress) on `admin.entrylab.io`, hosted on Hostinger.
- **Analytics**: Google Tag Manager (GTM-KPCJDF2M) with enhanced granular placement tracking
  - **Enhanced Affiliate Click Tracking** (October 8, 2025): Granular placement attribution with `page_location`, `placement_type`, `position`, and auto-generated `click_location` field
  - **Event Types**: `page_view`, `affiliate_click`, `category_filter`, `search`, `newsletter_signup`, `review_view`, `article_view`
  - **Placement Tracking**: Home featured widget, Top rated cards with positions, Broker/PropFirm list cards, Review page CTAs (hero, quick stats, bottom), Inline article cards
  - **Data Fields**: broker_name, broker_type, page_location, placement_type, click_location (e.g., "home_top_rated_card_position_1"), position, rating, affiliate_link

## External Dependencies

### Third-Party Services
- **Content Management**: WordPress REST API (`https://admin.entrylab.io/wp-json/wp/v2/` and custom endpoints).
- **Database**: PostgreSQL (Neon serverless).

### Key NPM Packages
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `react-icons`.
- **Data Fetching & Forms**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
- **Development Tools**: `vite`, `@vitejs/plugin-react`, `tsx`, `esbuild`.
- **Utilities**: `date-fns`, `clsx`/`tailwind-merge`, `cmdk`, `embla-carousel-react`, `nanoid`.