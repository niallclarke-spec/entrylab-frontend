# Design Guidelines: Forex News & Trading Intelligence Hub

## Design Approach

**Hybrid Approach**: Financial Media + Modern News Platform
- Primary References: Bloomberg, CoinDesk, The Block (crypto news), TradingView
- Supporting Patterns: Medium's reading experience + Stripe's professional aesthetic
- Industry Context: Financial credibility with modern, accessible design

**Core Principle**: Establish authority through clean design, strategic color use, and information hierarchy while making complex trading content approachable and scannable.

---

## Color Palette

### Dark Mode (Primary)
- **Background**: 220 15% 8% (deep navy-black)
- **Surface**: 220 15% 12% (elevated cards)
- **Primary Brand**: 210 100% 55% (professional blue - trust/stability)
- **Accent**: 160 85% 45% (market green for bullish/positive indicators)
- **Alert Red**: 0 75% 55% (bearish/risk indicators)
- **Text Primary**: 0 0% 98%
- **Text Secondary**: 220 10% 65%

### Light Mode
- **Background**: 0 0% 100%
- **Surface**: 220 15% 98%
- **Primary**: 210 100% 45% (deeper blue for light mode)
- **Accent**: 160 80% 40% (adjusted green)
- **Text Primary**: 220 15% 15%

**Color Strategy**: Use green/red sparingly for market data only. Primary blue for CTAs, links, and brand elements. Maintain high contrast for readability of financial data.

---

## Typography

**Font Families** (via Google Fonts):
- **Headlines**: Inter (600-700 weight) - modern, geometric, professional
- **Body**: Inter (400-500 weight) - excellent readability
- **Data/Numbers**: JetBrains Mono (500 weight) - monospace for financial figures

**Scale**:
- Hero Headline: text-5xl md:text-6xl lg:text-7xl font-bold
- Section Titles: text-3xl md:text-4xl font-semibold
- Article Titles: text-xl md:text-2xl font-semibold
- Body: text-base md:text-lg
- Captions/Meta: text-sm
- Data Numbers: text-lg md:text-xl font-mono

---

## Layout System

**Spacing Units**: Use Tailwind spacing of 4, 6, 8, 12, 16, 20, 24, 32 (p-4, gap-8, py-20, etc.)

**Container Strategy**:
- Full-width sections with inner max-w-7xl mx-auto px-6
- Article content: max-w-4xl for optimal reading
- Card grids: max-w-7xl with responsive columns

**Vertical Rhythm**:
- Section padding: py-16 md:py-24 lg:py-32
- Component spacing: space-y-12 md:space-y-16
- Card gaps: gap-6 md:gap-8

---

## Component Library

### Hero Section
**Layout**: Full-width with dark overlay on background image
- Breaking news ticker at top (thin horizontal strip, auto-scroll)
- Large headline with date/timestamp
- Featured article with metadata (author, read time, category)
- Secondary featured stories grid (2-3 cards)
- Market data widget (live indices: S&P 500, Gold, BTC)
- Use LARGE hero image showing trading floor, charts, or abstract financial imagery

### Navigation
- Sticky header with blur backdrop
- Logo left, category navigation center, search + theme toggle right
- Categories: Forex, Brokers, Prop Firms, Analysis, Education
- Mobile: Hamburger menu with slide-out panel

### Article Grid Sections
**Latest News** (3-column desktop, 2 tablet, 1 mobile):
- Card design: image thumbnail, category badge, title, excerpt, metadata
- Hover: subtle lift effect (translate-y-1), border highlight
- Categories color-coded with subtle badge colors

**Featured Categories** (2-column layouts):
- "Broker Reviews" section with rating stars
- "Prop Firm Updates" with firm logos
- "Market Analysis" with chart thumbnails
- Each with "View All" link

### Market Data Component
- Live ticker strip with price changes (green/red)
- Major pairs: EUR/USD, GBP/USD, USD/JPY with percentage changes
- Use monospace font, update indicators

### Newsletter CTA
- 2-column: Left (headline + benefits list), Right (email form)
- Benefit icons using Heroicons
- Professional "Stay Informed" messaging
- Background: subtle gradient or solid surface color

### Broker/Firm Showcase
- Logo grid of featured brokers (6-8 logos)
- "Trusted by Traders Worldwide" messaging
- Grayscale logos with color on hover

### Footer
- 4-column: About, Categories, Resources, Newsletter
- Social links, legal links, copyright
- Newsletter signup repeat
- Trust indicators: "Unbiased Reviews Since 20XX"

---

## Images

**Hero Section**: Large 16:9 image showing professional trading environment - modern office with multiple monitors displaying charts, or abstract financial data visualization. Dark overlay (bg-black/50) for text readability.

**Article Thumbnails**: 16:9 ratio images for articles - use relevant trading imagery, broker logos, chart screenshots, or abstract financial graphics.

**Background Images**: None for sections (maintain performance), use solid colors or subtle gradients.

---

## Interactions

**Minimal Animations**:
- Card hover: subtle lift and border glow (transition-all duration-200)
- Links: underline on hover
- Buttons: slight scale on active (active:scale-95)
- No scroll animations, no parallax

**Icons**: Heroicons (via CDN)
- TrendingUp, ChartBar, NewspaperIcon for categories
- Clock, User for metadata
- Search, Menu, Moon/Sun for navigation

---

## Accessibility & Dark Mode

- Maintain WCAG AA contrast ratios (4.5:1 minimum)
- Dark mode as default with toggle in header
- All form inputs styled consistently for dark mode
- Focus indicators: ring-2 ring-primary ring-offset-2
- Semantic HTML: article, section, nav tags

---

## Page Structure (5-7 Sections)

1. **Hero + Breaking News** (100vh)
2. **Latest Articles Grid** (multi-column)
3. **Featured Categories Showcase** (2-column sections)
4. **Broker/Prop Firm Highlights**
5. **Market Insights Section**
6. **Newsletter CTA** (full-width, contrasting background)
7. **Footer** (comprehensive, multi-column)

**Critical**: This is a news home page - content density is key. Each section should be rich with articles, data, and information. Avoid sparse layouts.