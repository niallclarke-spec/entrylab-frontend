# Forex News & Trading Intelligence Hub

## Overview

This is a full-stack web application designed as a Forex News & Trading Intelligence Hub, branded as "EntryLab." The platform aggregates and displays forex broker news, prop firm updates, and trading analysis. It features a modern, professional design inspired by Bloomberg and CoinDesk, with a focus on financial credibility and accessible content presentation.

The application fetches content from a WordPress backend via REST API and displays broker information, articles, and market data in a clean, scannable format optimized for traders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Uses `wouter` for lightweight client-side routing (currently only home page and 404 page implemented).

**State Management**: 
- React Query (`@tanstack/react-query`) for server state management and data fetching
- React Context API for theme management (dark/light mode)
- Local component state with React hooks

**UI Component Library**: Shadcn UI components built on top of Radix UI primitives, providing accessible, customizable components following the "new-york" style preset.

**Styling Approach**:
- Tailwind CSS for utility-first styling
- CSS variables for theme customization (dark mode primary, light mode alternative)
- Custom design system defined in `design_guidelines.md` emphasizing financial credibility
- Typography: Inter for headlines/body, JetBrains Mono for financial data
- Color palette: Purple (#A855F6 / 271 91% 65%) matching EntryLab branding, gold (amber-500) for star ratings, green/red reserved for market indicators

**Key UI Components**:
- Navigation with search, category filtering, and theme toggle
- Hero section with floating forex symbols animation (with HTML-stripped excerpts)
- Article cards with WordPress content
- Broker cards (standard and enhanced versions) with gold star ratings
- Featured broker showcase with dashed-border bonus badges
- Market ticker displaying real-time-style forex data
- Newsletter CTA with email subscription
- **Trending topics filter bar** - Interactive category filtering with active state
- Trust signals section

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful API endpoints that proxy requests to WordPress

**Middleware Stack**:
- JSON body parsing
- URL-encoded form data parsing
- Request/response logging middleware for API routes
- Error handling middleware

**Development vs Production**:
- Development: Vite middleware integrated for HMR (Hot Module Replacement)
- Production: Serves pre-built static assets from `dist/public`

**Key API Endpoints**:
- `GET /api/wordpress/posts` - Fetches posts from WordPress, supports category filtering via query param
- `GET /api/wordpress/categories` - Fetches category data, supports slug filtering
- `GET /api/wordpress/brokers` - Fetches broker data from WordPress custom post type
- `GET /api/brokers` - Legacy endpoint for in-memory broker storage (fallback)
- In-memory storage interface defined (ready for database integration)

### Data Layer

**Database Setup**: 
- Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)
- Schema defined for users table (authentication ready but not implemented)
- Migration system configured via `drizzle-kit`

**Data Models**:
- `User`: Basic user authentication schema (id, username, password)
- `Broker`: Interface for broker information including ratings, features, and promotional details
- `WordPressPost`: TypeScript interface mapping WordPress REST API response structure

**Current Data Sources**:
- WordPress REST API at `https://entrylab.io/wp-json/wp/v2/` for articles and categories
- WordPress custom post type `popular_broker` for broker information (via REST API)
- In-memory storage for broker data (fallback, can be replaced with WordPress data)

### Design System

**Theme System**:
- Built-in dark/light mode toggle with localStorage persistence
- Dark mode as default (financial platform convention)
- CSS custom properties for dynamic theming
- Elevation system using transparency overlays for hover/active states

**Component Patterns**:
- Compound components for complex UI elements (Cards, Dialogs, Forms)
- Composition via Radix UI Slot pattern
- Variant-based styling using `class-variance-authority`
- Responsive design with mobile-first approach

## External Dependencies

### Third-Party Services

**Content Management**: WordPress REST API
- Endpoint: `https://entrylab.io/wp-json/wp/v2/`
- Used for fetching articles, categories, featured media, and author information
- Embeds support for related data (featured images, author details, taxonomy terms)

**Database**: PostgreSQL (configured for Neon serverless)
- Connection managed via `DATABASE_URL` environment variable
- Currently schema-ready but not actively used (WordPress serves as primary content source)

### Key NPM Packages

**UI & Styling**:
- `@radix-ui/*` - Accessible component primitives (30+ packages)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Variant-based component styling
- `lucide-react` - Icon library
- `react-icons` - Social media icons

**Data Fetching & Forms**:
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation
- `drizzle-zod` - Database schema to Zod validation bridge

**Development Tools**:
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `tsx` - TypeScript execution for development
- `esbuild` - Production bundling for server code
- Replit-specific plugins for development experience

**Utilities**:
- `date-fns` - Date formatting and manipulation
- `clsx` / `tailwind-merge` - Conditional className handling
- `cmdk` - Command menu component
- `embla-carousel-react` - Carousel functionality
- `nanoid` - Unique ID generation