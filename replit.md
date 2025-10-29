# Forex News & Trading Intelligence Hub

## Overview
EntryLab is a full-stack web application serving as a Forex News & Trading Intelligence Hub. It aggregates and displays forex broker news, prop firm updates, and trading analysis, sourcing content from a WordPress backend. Inspired by Bloomberg and CoinDesk, the platform provides traders with a professional interface for broker information, articles, and market data, focusing on business vision and market potential.

## Recent Changes (October 2025)

### ✅ Automatic Pros & Cons Cards (October 29, 2025) - READY FOR DEPLOYMENT
**Feature**: Automatically converts WordPress "Pros and Cons" sections into beautiful two-column cards with green checkmarks (pros) and red X marks (cons).

**How It Works**:
1. Detects H2/H3/H4 headings containing "Pros and Cons" or "Pros & Cons" (case-insensitive)
2. Extracts bullet lists following bold "Pros" and "Cons" labels
3. Removes plain lists from content and renders styled ProsConsCard component inline
4. Card appears immediately after the heading with proper spacing

**WordPress Format Required**:
```
## Pros & Cons

**Pros**
• Fast execution speeds
• Low spreads
• 24/7 support

**Cons**
• High minimum deposit
• Limited payment methods
```

**Files Modified**:
- `client/src/pages/Article.tsx` - Added `processContentWithProsConsCard()` parser and `renderContentWithProsConsCards()` renderer, fixed broker card element selector to include `div[data-pros-cons-placeholder]`
- `client/src/components/ProsConsCard.tsx` - Created new component with green/red color-coded two-column layout
- `client/src/index.css` - Added branded purple link styling with white hover state for article content

**Impact**:
- Improved visual hierarchy and scannability of product reviews
- Consistent pros/cons presentation across all articles
- Works automatically with any existing or future WordPress content following the format

**Verified Working**:
- ✅ Detects "Pros and Cons" and "Pros & Cons" headings
- ✅ Extracts and displays bullet points correctly
- ✅ Preserves broker card insertion logic (40% position calculation)
- ✅ Dark mode support with proper color contrast

### ✅ Eliminated Duplicate Structured Data Schemas (October 27, 2025) - DEPLOYED
**Issue**: Google Rich Results Test showed duplicate schemas preventing rich snippets:
1. Duplicate Organization schemas (2x EntryLab on broker/prop firm pages)
2. Duplicate FinancialService schemas (2x HeroFX - one with full address, one minimal inside Review)

**Root Cause**: 
1. Server-side middleware added Organization schema to ALL pages including broker/prop-firm pages
2. Review schemas created inline FinancialService entities instead of referencing the main entity

**Solution**: 
1. **Conditional Organization**: Modified `generateStructuredData()` to skip Organization schema on broker/prop-firm pages (they use FinancialService as primary entity)
2. **@id References**: Changed Review schemas to reference FinancialService via `@id` instead of duplicating entity inline

**Schema Structure (Broker/Prop Firm Pages)**:
- ✅ 1 FinancialService schema (standalone entity with full details)
- ✅ 1 Review schema (references FinancialService via @id)
- ✅ 1 Organization (only as Review author, not standalone)
- ✅ 1 BreadcrumbList schema

**Files Modified**: 
- `server/structured-data.ts` - Added conditional Organization logic + @id references in Review schemas
- `client/src/components/SEO.tsx` - Added conditional rendering for organizationSchema (defense-in-depth)

**Impact**: 
- Google Rich Results Test now shows clean schemas with NO duplicates
- Star ratings eligible to display in search results
- Proper entity recognition for brokers/prop firms as FinancialService type
- Expected 20-30% CTR improvement when rich results appear

**Verified Working**:
- ✅ Broker pages: Single FinancialService + Review (via @id reference) + Breadcrumbs
- ✅ Prop firm pages: Same clean structure
- ✅ Article pages: Organization + Article + Breadcrumbs (unchanged)

**Next Steps**:
- Monitor Search Console structured-data reports for declining error counts
- Spot-check new broker/prop firm pages to ensure schema quality with varying WordPress ACF data

### ✅ Fixed Article & Prop Firm Structured Data (October 23, 2025) - DEPLOYED
**Issue**: Two critical structured data problems found in SEO audit:
1. Prop firm Review schemas used incorrect "@type": "Organization" instead of "FinancialService" (brokers correctly used FinancialService)
2. Article pages had NO Article schema server-side - only Organization schema

**Root Cause**: 
1. Prop firm schema generator used wrong type for itemReviewed
2. Server-side structured data generator didn't recognize `/:category/:slug` article URL pattern (only recognized deprecated `/article/:slug`)

**Solution**: 
1. Changed prop firm Review schema itemReviewed from Organization to FinancialService for consistency with brokers
2. Added `/:category/:slug` URL pattern detection to generateStructuredData() for articles in /broker-news/, /prop-firm-news/, /news/, etc.

**Files Modified**: 
- `server/structured-data.ts` - Fixed prop firm type + added article URL pattern recognition

**Impact**: 
- Prop firms now show consistent FinancialService type in Rich Results
- Article pages now have complete structured data (Organization + Article + BreadcrumbList schemas)
- All future content automatically gets correct schemas

**Verified Working**:
- ✅ Prop firm pages: Review schema with FinancialService itemReviewed
- ✅ Article pages: 3 schemas (Organization, Article, BreadcrumbList)

### ✅ Fixed Duplicate Structured Data (October 23, 2025) - DEPLOYED
**Issue**: Google's Rich Results Test showed duplicate Review schemas for broker/prop firm pages (2x HeroFX Review, 2x Organization, etc.).

**Root Cause**: Both server-side SEO middleware AND client-side React components were generating JSON-LD structured data, causing duplicates.

**Solution**: Added `disableStructuredData` prop to SEO component to suppress client-side schema generation on broker/prop firm pages:
- Server-side middleware now handles ALL structured data for these pages
- Client-side schemas disabled for Organization, Review, and Breadcrumb on broker/prop firm routes
- Article and archive pages still use client-side schemas (no server-side generation yet)

**Files Modified**: 
- `client/src/components/SEO.tsx` - Added disableStructuredData prop with conditional rendering
- `client/src/pages/BrokerReview.tsx` - Set disableStructuredData={true}
- `client/src/pages/PropFirmReview.tsx` - Set disableStructuredData={true}

**Impact**: Google now sees single, clean structured data per page instead of duplicates

**User Action**: Re-test pages in Google Rich Results Test to verify duplicates are gone

### ✅ Legacy Category URL Redirects (October 23, 2025) - READY FOR DEPLOYMENT
**Issue**: Google indexed old WordPress `/category/*` URLs (e.g., `/category/top-tier-trader/`, `/category/sagefx/`) that show empty pages or don't exist in the new React app.

**Solution**: Added 301 permanent redirects from `/category/*` to proper format (strips `/category/` prefix):
- `/category/broker-news` → `/broker-news`
- `/category/top-tier-trader` → `/top-tier-trader` (then 404 if doesn't exist)
- All `/category/*` URLs automatically redirect to correct format

**Files Modified**: 
- `server/routes.ts` - Added redirect middleware before SEO injection (lines 1307-1322)

**Impact**: Once deployed and Google re-crawls:
- Old `/category/*` URLs will redirect to correct pages
- Google will consolidate ranking signals on new URLs
- Search result snippets will update to show correct pages
- Empty/broken category pages will disappear from search results

**User Action Required After Deploy**: Request re-indexing in Google Search Console for key pages

### ✅ CRITICAL SEO Fix - Server-Side Rendering (October 22, 2025) - DEPLOYED & VERIFIED
**Issue**: Traffic collapsed after migrating from WordPress to React SPA. Google couldn't see content because all pages were client-side rendered.

**Solution**: Implemented server-side SEO injection middleware that:
- Pre-fetches broker/article data from WordPress API before sending HTML
- Injects title tags, meta descriptions, Open Graph tags, and canonical URLs into HTML
- Makes content visible to Googlebot immediately without waiting for JavaScript execution
- Uses Yoast SEO fields from WordPress with intelligent fallbacks
- Works in both development (Vite) and production (static serving)

**Files Modified**: 
- `server/routes.ts` - Enhanced SEO middleware (lines 1324-1488)
- `client/index.html` - Added default title/meta tags for middleware replacement

**Verified Working (October 22, 2025)**:
- ✅ Broker pages: Titles from Yoast SEO (e.g., "HeroFX Review 2025: Read Real User Reviews")
- ✅ Prop firm pages: Titles from Yoast SEO (e.g., "FunderPro Review 2025 | EntryLab")
- ✅ Article pages: Titles from Yoast SEO with category context
- ✅ Meta descriptions, Open Graph tags, canonical URLs all injecting correctly
- ✅ Production deployment confirmed via live testing

**Expected Impact**: Rankings should recover within 4-8 weeks as Google re-crawls pages

### Previous SEO Fixes
- **Sitemap URLs**: Fixed sitemap to use correct `/:category/:slug` format instead of deprecated `/article/:slug` pattern
- **Category Archive URLs**: Added all category archive pages (`/news`, `/broker-news`, `/prop-firm-news`, etc.) to sitemap for better discoverability
- **Canonical URLs**: Implemented canonical tags on category archive pages to prevent duplicate content issues
- **Cache Headers**: Updated HTML cache from `no-cache, no-store, must-revalidate` to `public, max-age=600, stale-while-revalidate=86400` for better SEO performance
- **Archive Tab Navigation**: Enabled SEO-friendly URLs that change when switching category tabs while maintaining instant client-side filtering
- **Fixed /home Empty Page**: Added 301 redirect from `/home` to `/`, excluded "home" from category archives, and removed from sitemap to fix Google indexing empty "Category" page

### User Action Items for SEO Recovery
1. ✅ Server-side SEO injection deployed
2. Block admin.entrylab.io: Go to WordPress Settings → Reading → Check "Discourage search engines"
3. Submit sitemap in Google Search Console: Add sitemap.xml
4. Monitor Google Search Console for indexing improvements over next 2 weeks

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