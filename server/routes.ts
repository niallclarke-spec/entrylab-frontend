import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { db } from "./db";
import { brokerAlerts, insertBrokerAlertSchema, signalUsers, emailCaptures, subscriptions, brokersTable, propFirmsTable, articlesTable, insertArticleSchema, pageViewsTable, categoriesTable, brokerCategoriesTable, propFirmCategoriesTable, reviewsTable, insertReviewSchema, staticPageSeoTable, comparisonsTable } from "../shared/schema";
import { apiCache } from "./cache";
import { sendReviewNotification, sendTelegramMessage, getTelegramBot } from "./telegram";
import { addInternalLinks, invalidateInternalLinksCache } from "./internal-links";
import { generateStructuredData } from "./structured-data";
import { getUncachableStripeClient } from "./stripeClient";
import { eq, asc, ilike, desc, sql, and, or, ne, inArray } from "drizzle-orm";
import { generateAllMissingPairs, generateAllAlternatives, generateNextForEntity, getEntityComparisonStats, regenerateComparisons, onEntityUpdated, onEntityCreated, makeComparisonSlug } from "./comparison-engine";
import { getWelcomeEmailHtml, getCancellationEmailHtml, getFreeChannelEmailHtml } from "./emailTemplates";
import { getUncachableResendClient } from "./resendClient";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";

// ─── DB row → API shape helpers ──────────────────────────────────────────────

function brokerDbToApi(row: any) {
  // Prefer the curated platformsList array; fall back to raw platforms string
  const platformsList: string[] = row.platformsList?.length ? row.platformsList : (row.platforms ? row.platforms.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) : []);
  const platforms = platformsList.length ? platformsList.join(", ") : (row.platforms || "");
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logoUrl || `https://placehold.co/200x80/1a1a1a/8b5cf6?text=${encodeURIComponent(row.name)}`,
    logoUrl: row.logoUrl || null,
    verified: row.isVerified ?? true,
    featured: row.isFeatured ?? false,
    rating: parseFloat(String(row.rating ?? "0")) || 4.5,
    pros: row.pros || [],
    cons: row.cons || [],
    highlights: row.highlights || [],
    features: (row.highlights || []).map((h: string) => ({ icon: "trending", text: h })),
    featuredHighlights: row.highlights || [],
    link: row.affiliateLink || "#",
    reviewLink: `/broker/${row.slug}`,
    tagline: row.tagline || "",
    bonusOffer: row.bonusOffer || "",
    content: row.content || "",
    minDeposit: row.minDeposit,
    minWithdrawal: row.minWithdrawal,
    maxLeverage: row.maxLeverage,
    spreadFrom: row.spreadFrom,
    regulation: row.regulation,
    platforms,
    paymentMethods: row.paymentMethods,
    headquarters: row.headquarters,
    support: row.support,
    yearFounded: row.yearFounded,
    totalUsers: row.popularity,
    lastUpdated: row.lastUpdated,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    countries: row.countries || [],
    platformsList,
    instruments: row.instruments || [],
  };
}

function propFirmDbToApi(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logoUrl || `https://placehold.co/200x80/1a1a1a/8b5cf6?text=${encodeURIComponent(row.name)}`,
    logoUrl: row.logoUrl || null,
    verified: row.isVerified ?? true,
    featured: row.isFeatured ?? false,
    rating: parseFloat(String(row.rating ?? "0")) || 4.5,
    pros: row.pros || [],
    cons: row.cons || [],
    highlights: row.highlights || [],
    features: (row.highlights || []).map((h: string) => ({ icon: "trending", text: h })),
    featuredHighlights: row.highlights || [],
    link: row.affiliateLink || "#",
    reviewLink: `/prop-firm/${row.slug}`,
    tagline: row.tagline || "",
    bonusOffer: row.bonusOffer || "",
    discountAmount: row.discountAmount || "",
    content: row.content || "",
    profitSplit: row.profitSplit,
    maxFundingSize: row.maxFundingSize,
    evaluationFee: row.evaluationFee,
    discountCode: row.discountCode,
    propFirmUsp: row.propFirmUsp,
    support: row.support,
    headquarters: row.headquarters,
    paymentMethods: row.paymentMethods,
    payoutMethods: row.payoutMethods,
    totalUsers: row.popularity,
    lastUpdated: row.lastUpdated,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    countries: row.countries || [],
    platformsList: row.platformsList || [],
    instruments: row.instruments || [],
  };
}

// Convert DB article row to clean flat API shape
function articleToApi(article: any): any {
  const catSlug = article.category || "news";
  const catName = catSlug
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    id: article.id,
    slug: article.slug,
    title: article.title || "",
    excerpt: article.excerpt || "",
    content: article.content || "",
    author: article.author || "EntryLab Team",
    category: catSlug,
    categoryName: catName,
    featuredImage: article.featuredImage || null,
    publishedAt: article.publishedAt?.toISOString?.() || article.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: article.updatedAt?.toISOString?.() || new Date().toISOString(),
    status: article.status,
    seoTitle: article.seoTitle || article.title || null,
    seoDescription: article.seoDescription || article.excerpt || null,
    relatedBroker: null,
  };
}

// Lightweight version for list/archive views — strips the large content field
function articleToListApi(article: any): any {
  const catSlug = article.category || "news";
  const catName = catSlug
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    id: article.id,
    slug: article.slug,
    title: article.title || "",
    excerpt: article.excerpt || "",
    author: article.author || "EntryLab Team",
    category: catSlug,
    categoryName: catName,
    featuredImage: article.featuredImage || null,
    publishedAt: article.publishedAt?.toISOString?.() || article.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: article.updatedAt?.toISOString?.() || new Date().toISOString(),
    status: article.status,
    relatedBroker: null,
  };
}

// Generic API error handler
function handleApiError(error: any, res: any, operation: string) {
  console.error(`Error ${operation}:`, error.message);
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.status(500).json({ error: `Failed to ${operation}` });
}

// Helper function to verify reCAPTCHA token
// DISABLED: reCAPTCHA verification temporarily disabled until traffic increases
async function verifyRecaptcha(token: string): Promise<boolean> {
  console.log('[reCAPTCHA] Verification disabled - accepting all submissions');
  return true;
  
  // Original implementation (commented out):
  /*
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Skip reCAPTCHA verification in development/Replit environment
  // Only enforce in production
  if (!isProduction) {
    console.log('[reCAPTCHA] Development/Replit mode - skipping verification');
    return true;
  }
  
  // Production mode - enforce reCAPTCHA
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured in production');
    return false;
  }

  // If no token provided in production, reject
  if (!token || token.trim() === '') {
    console.warn('No reCAPTCHA token provided in production');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    console.log('[reCAPTCHA] Verification response:', JSON.stringify(data));
    
    if (!data.success) {
      console.warn('[reCAPTCHA] Verification failed. Errors:', data['error-codes']);
    }
    
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
  */
}

// ─── Admin auth helpers ──────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function adminAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Bearer token — for programmatic / LLM API access
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    if (ADMIN_PASSWORD && key === ADMIN_PASSWORD) return next();
    return res.status(401).json({ error: "Invalid API key" });
  }

  // 2. Cookie-based JWT — for browser admin panel
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    // Numeric decimal entities first (covers &#038; &#8211; etc.)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    // Numeric hex entities
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Named entities
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ─── Legacy WordPress URL redirects ───────────────────────────────────────
  // 301 permanent redirects for old WordPress routes still indexed by Google.
  const wpRedirects: Record<string, string> = {
    '/contact/':        '/',
    '/contact':         '/',
    '/what-we-do/':     '/',
    '/what-we-do':      '/',
    // Plural popular-brokers hub pages → broker listing
    '/popular-brokers':   '/brokers',
    '/popular-brokers/':  '/brokers',
    '/popular_brokers':   '/brokers',
    '/popular_brokers/':  '/brokers',
    // Old root-level WordPress article URLs
    '/kot4x-shuts-down-what-you-should-know/': '/broker-news/kot4x-shuts-down-what-you-should-know',
    '/kot4x-shuts-down-what-you-should-know':  '/broker-news/kot4x-shuts-down-what-you-should-know',
    // Old /article/ prefix that may be indexed
    '/article/kot4x-shuts-down-what-you-should-know': '/broker-news/kot4x-shuts-down-what-you-should-know',
  };

  // Map known WordPress review slugs to their canonical EntryLab broker slug.
  // These all follow the pattern /{broker}-broker-review-{year}/ on the old site.
  const wpBrokerSlugMap: Record<string, string> = {
    'xm-broker-review-2026':           'xm',
    'xm-broker-review-2025':           'xm',
    'ic-markets-broker-review-2026':   'ic-markets',
    'ic-markets-broker-review-2025':   'ic-markets',
    'pepperstone-broker-review-2026':  'pepperstone',
    'pepperstone-broker-review-2025':  'pepperstone',
    'cmc-markets-broker-review-2026':  'cmc-markets',
    'cmc-markets-broker-review-2025':  'cmc-markets',
    'ig-broker-review-2026':           'ig-group',
    'ig-broker-review-2025':           'ig-group',
    'saxo-bank-broker-review-2026':    'saxo-bank',
    'saxo-bank-broker-review-2025':    'saxo-bank',
    'avatrade-broker-review-2026':     'avatrade',
    'avatrade-broker-review-2025':     'avatrade',
    'fp-markets-broker-review-2026':   'fp-markets',
    'fp-markets-broker-review-2025':   'fp-markets',
    'octafx-broker-review-2026':       'octafx',
    'octafx-broker-review-2025':       'octafx',
  };

  // Resolve an old WP-style broker review slug to its canonical EntryLab slug.
  // Tries the explicit map first, then strips common review suffixes as fallback.
  function resolveWpBrokerSlug(raw: string): string {
    const clean = raw.replace(/\/$/, '').toLowerCase();
    if (wpBrokerSlugMap[clean]) return wpBrokerSlugMap[clean];
    // Generic fallback: strip -broker-review-YYYY or -review-YYYY suffixes
    return clean
      .replace(/-broker-review-\d{4}$/, '')
      .replace(/-review-\d{4}$/, '') || clean;
  }

  app.use((req, res, next) => {
    const dest = wpRedirects[req.path];
    if (dest) return res.redirect(301, dest);

    // /popular-broker/:slug and /popular_broker/:slug → /broker/:canonical-slug
    // Handles both hyphen and underscore variants (WP used underscore in URLs).
    const popularMatch = req.path.match(/^\/popular[_-]broker\/(.+?)\/?$/i);
    if (popularMatch) {
      const brokerSlug = resolveWpBrokerSlug(popularMatch[1]);
      return res.redirect(301, `/broker/${brokerSlug}`);
    }

    next();
  });

  // ─── Content quality utilities ────────────────────────────────────────────

  // Scrubs legacy WordPress /popular_broker/ and /popular-broker/ URLs from
  // article HTML content, replacing them with canonical /broker/:slug paths.
  // Called automatically on every article create/update so no broken links
  // ever reach the DB.
  const wpBrokerSlugMapInline: Record<string, string> = {
    'xm-broker-review-2026': 'xm', 'xm-broker-review-2025': 'xm',
    'ic-markets-broker-review-2026': 'ic-markets', 'ic-markets-broker-review-2025': 'ic-markets',
    'pepperstone-broker-review-2026': 'pepperstone', 'pepperstone-broker-review-2025': 'pepperstone',
    'cmc-markets-broker-review-2026': 'cmc-markets', 'cmc-markets-broker-review-2025': 'cmc-markets',
    'ig-broker-review-2026': 'ig-group', 'ig-broker-review-2025': 'ig-group',
    'saxo-bank-broker-review-2026': 'saxo-bank', 'saxo-bank-broker-review-2025': 'saxo-bank',
    'avatrade-broker-review-2026': 'avatrade', 'avatrade-broker-review-2025': 'avatrade',
    'fp-markets-broker-review-2026': 'fp-markets', 'fp-markets-broker-review-2025': 'fp-markets',
    'octafx-broker-review-2026': 'octafx', 'octafx-broker-review-2025': 'octafx',
  };
  function sanitiseArticleContent(content: string): string {
    if (!content) return content;
    return content.replace(
      /https?:\/\/(?:entrylab\.io)?\/popular[_-]broker\/([^/"'\s<>]+?)\/?(?=["'\s<>]|$)/gi,
      (_match, rawSlug) => {
        const clean = rawSlug.replace(/\/$/, '').toLowerCase();
        const mapped = wpBrokerSlugMapInline[clean] ||
          clean.replace(/-broker-review-\d{4}$/, '').replace(/-review-\d{4}$/, '') || clean;
        return `https://entrylab.io/broker/${mapped}`;
      }
    ).replace(
      /href="\/popular[_-]broker\/([^"]+?)\/?">/gi,
      (_match, rawSlug) => {
        const clean = rawSlug.replace(/\/$/, '').toLowerCase();
        const mapped = wpBrokerSlugMapInline[clean] ||
          clean.replace(/-broker-review-\d{4}$/, '').replace(/-review-\d{4}$/, '') || clean;
        return `href="/broker/${mapped}">`;
      }
    );
  }

  // Pings Google and Bing to notify them the sitemap has been updated.
  // Non-blocking — fires and forgets, never throws.
  function pingSitemaps(): void {
    // Bust the in-memory sitemap cache so the next request rebuilds it fresh
    apiCache.delete('sitemap:xml');
    const sitemapUrl = encodeURIComponent('https://entrylab.io/sitemap.xml');
    const endpoints = [
      `https://www.google.com/ping?sitemap=${sitemapUrl}`,
      `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
    ];
    for (const url of endpoints) {
      import('https').then(({ get }) => {
        const req = get(url, (res) => { res.resume(); });
        req.on('error', () => {});
        req.setTimeout(5000, () => req.destroy());
      }).catch(() => {});
    }
  }

  // ─── Admin auth endpoints ──────────────────────────────────────────────────

  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });
    if (!ADMIN_PASSWORD) {
      console.error("[Admin] ADMIN_PASSWORD env var not set");
      return res.status(500).json({ error: "Admin not configured" });
    }
    const valid = password === ADMIN_PASSWORD;
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "8h" });
    res.cookie("admin_token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({ ok: true });
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_token");
    return res.json({ ok: true });
  });

  app.get("/api/admin/me", adminAuth, (req, res) => {
    return res.json({ ok: true });
  });

  // ─── Admin broker CRUD ────────────────────────────────────────────────────

  app.post("/api/admin/brokers", adminAuth, async (req, res) => {
    try {
      const body = req.body;
      if (!body.name) return res.status(400).json({ error: "Name required" });
      if (!body.slug) body.slug = slugify(body.name);
      const [broker] = await db
        .insert(brokersTable)
        .values({ ...body, lastUpdated: new Date() })
        .returning();
      apiCache.delete('brokers:list');
      // Clear comparison hub SSR caches so new broker appears immediately
      apiCache.delete('ssr:comparison-hub:broker');
      invalidateInternalLinksCache();
      // Auto-generate all vs-pair comparisons (published immediately)
      onEntityCreated("broker", broker.id).catch(() => {});
      pingSitemaps();
      return res.status(201).json(broker);
    } catch (err: any) {
      console.error("[Admin] Error creating broker:", err);
      return res.status(500).json({ error: err.message || "Failed to create broker" });
    }
  });

  app.get("/api/admin/brokers/:slug", adminAuth, async (req, res) => {
    try {
      const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, req.params.slug));
      if (!broker) return res.status(404).json({ error: "Broker not found" });
      return res.json(broker);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch broker" });
    }
  });

  app.put("/api/admin/brokers/:slug", adminAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      const { id, createdAt, slug: _slug, ...updates } = req.body;
      const [broker] = await db
        .update(brokersTable)
        .set({ ...updates, lastUpdated: new Date() })
        .where(eq(brokersTable.slug, slug))
        .returning();
      if (!broker) return res.status(404).json({ error: "Broker not found" });
      apiCache.delete(`broker:${slug}`);
      apiCache.delete('brokers:list');
      invalidateInternalLinksCache();
      return res.json(broker);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to update broker" });
    }
  });

  app.delete("/api/admin/brokers/:slug", adminAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      await db.delete(brokersTable).where(eq(brokersTable.slug, slug));
      apiCache.delete(`broker:${slug}`);
      apiCache.delete('brokers:list');
      invalidateInternalLinksCache();
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to delete broker" });
    }
  });

  // ─── Admin prop firm CRUD ─────────────────────────────────────────────────

  app.post("/api/admin/prop-firms", adminAuth, async (req, res) => {
    try {
      const body = req.body;
      if (!body.name) return res.status(400).json({ error: "Name required" });
      if (!body.slug) body.slug = slugify(body.name);
      const [firm] = await db
        .insert(propFirmsTable)
        .values({ ...body, lastUpdated: new Date() })
        .returning();
      apiCache.delete('prop-firms:list');
      // Clear comparison hub SSR caches so new firm appears immediately
      apiCache.delete('ssr:comparison-hub:prop-firm');
      invalidateInternalLinksCache();
      // Auto-generate all vs-pair comparisons (published immediately)
      onEntityCreated("prop_firm", firm.id).catch(() => {});
      pingSitemaps();
      return res.status(201).json(firm);
    } catch (err: any) {
      console.error("[Admin] Error creating prop firm:", err);
      return res.status(500).json({ error: err.message || "Failed to create prop firm" });
    }
  });

  app.get("/api/admin/prop-firms/:slug", adminAuth, async (req, res) => {
    try {
      const [firm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, req.params.slug));
      if (!firm) return res.status(404).json({ error: "Prop firm not found" });
      return res.json(firm);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch prop firm" });
    }
  });

  app.put("/api/admin/prop-firms/:slug", adminAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      const { id, createdAt, slug: _slug, ...updates } = req.body;
      const [firm] = await db
        .update(propFirmsTable)
        .set({ ...updates, lastUpdated: new Date() })
        .where(eq(propFirmsTable.slug, slug))
        .returning();
      if (!firm) return res.status(404).json({ error: "Prop firm not found" });
      apiCache.delete(`prop-firm:${slug}`);
      apiCache.delete('prop-firms:list');
      invalidateInternalLinksCache();
      return res.json(firm);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to update prop firm" });
    }
  });

  app.delete("/api/admin/prop-firms/:slug", adminAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      await db.delete(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      apiCache.delete(`prop-firm:${slug}`);
      apiCache.delete('prop-firms:list');
      invalidateInternalLinksCache();
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to delete prop firm" });
    }
  });

  // ─── Admin reviews (DB-backed) ───────────────────────────────────────────

  app.get("/api/admin/reviews", adminAuth, async (req, res) => {
    try {
      const { type, status: statusFilter } = req.query as Record<string, string>;
      let query = db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
      const rows = await query;
      const filtered = rows.filter((r) => {
        if (type && r.firmType !== type) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
      });
      return res.json(filtered.map((r) => ({
        id: r.id,
        firm: r.firmName || r.firmSlug,
        firmType: r.firmType,
        firmSlug: r.firmSlug,
        author: r.reviewerName,
        rating: parseFloat(String(r.rating)) || 0,
        status: r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
        excerpt: (r.reviewText || "").substring(0, 180),
        title: r.title || "",
        email: r.reviewerEmail,
        legacyPostId: r.legacyPostId,
        createdAt: r.createdAt,
      })));
    } catch (err: any) {
      console.error("[Admin] Error fetching reviews:", err);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.put("/api/admin/reviews/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["approved", "pending", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await db.update(reviewsTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(reviewsTable.id, id));
      const [updated] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
      return res.json({ ok: true, review: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/reviews/:id", adminAuth, async (req, res) => {
    try {
      await db.delete(reviewsTable).where(eq(reviewsTable.id, req.params.id));
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Admin article CRUD ────────────────────────────────────────────────────

  app.get("/api/admin/articles", adminAuth, async (req, res) => {
    try {
      const dbArticles = await db
        .select({
          id: articlesTable.id,
          title: articlesTable.title,
          slug: articlesTable.slug,
          category: articlesTable.category,
          status: articlesTable.status,
          author: articlesTable.author,
          publishedAt: articlesTable.publishedAt,
          createdAt: articlesTable.createdAt,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .orderBy(desc(articlesTable.createdAt));

      return res.json(dbArticles);
    } catch (err) {
      console.error("[Admin] Error fetching articles:", err);
      return res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // ─── Static pages — hardcoded list ───────────────────────────────────────
  app.get("/api/admin/pages", adminAuth, async (_req, res) => {
    const staticPages = [
      { id: "about", slug: "about", title: "About EntryLab", status: "published", link: "https://entrylab.io/about", date: null, modified: null },
      { id: "terms",  slug: "terms",  title: "Terms & Conditions", status: "published", link: "https://entrylab.io/terms",  date: null, modified: null },
      { id: "privacy", slug: "privacy", title: "Privacy Policy", status: "published", link: "https://entrylab.io/privacy", date: null, modified: null },
      { id: "signals", slug: "signals", title: "Premium Signals", status: "published", link: "https://entrylab.io/signals", date: null, modified: null },
    ];
    return res.json(staticPages);
  });

  // ─── Static page SEO admin endpoints ─────────────────────────────────────────
  app.get("/api/admin/static-page-seo", adminAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(staticPageSeoTable).orderBy(asc(staticPageSeoTable.slug));
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch static page SEO" });
    }
  });

  app.put("/api/admin/static-page-seo/:slug", adminAuth, async (req, res) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      const { seoTitle, seoDescription } = req.body as { seoTitle?: string; seoDescription?: string };
      const [updated] = await db
        .update(staticPageSeoTable)
        .set({ seoTitle: seoTitle || null, seoDescription: seoDescription || null, updatedAt: new Date() })
        .where(eq(staticPageSeoTable.slug, slug))
        .returning();
      if (!updated) return res.status(404).json({ error: "Entry not found" });
      apiCache.delete(`static-seo:${slug}`);
      apiCache.delete('static-seo:all');
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: "Failed to update static page SEO" });
    }
  });

  app.get("/api/admin/articles/:id", adminAuth, async (req, res) => {
    try {
      const [article] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, req.params.id));
      if (article) return res.json(article);
      return res.status(404).json({ error: "Not found" });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/admin/articles", adminAuth, async (req, res) => {
    try {
      const body = req.body;
      if (!body.title) return res.status(400).json({ error: "Title required" });
      if (!body.slug) body.slug = slugify(body.title);
      if (body.status === "published" && !body.publishedAt) {
        body.publishedAt = new Date();
      }
      // Scrub any legacy WordPress broker links before persisting
      if (body.content) body.content = sanitiseArticleContent(body.content);
      const [article] = await db
        .insert(articlesTable)
        .values({
          ...body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      // Ping search engines when a new article is published
      if (article.status === "published") pingSitemaps();
      return res.status(201).json(article);
    } catch (err: any) {
      if (err.code === "23505") return res.status(409).json({ error: "Slug already exists" });
      console.error("[Admin] Error creating article:", err);
      return res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/admin/articles/:id", adminAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      delete body.id;
      delete body.createdAt;
      if (body.status === "published" && !body.publishedAt) {
        body.publishedAt = new Date();
      }
      body.updatedAt = new Date();
      // Scrub any legacy WordPress broker links before persisting
      if (body.content) body.content = sanitiseArticleContent(body.content);
      const [article] = await db
        .update(articlesTable)
        .set(body)
        .where(eq(articlesTable.id, req.params.id))
        .returning();
      if (!article) return res.status(404).json({ error: "Not found" });
      // Clear both API cache and SSR cache for this article
      apiCache.delete(`article:${article.slug}`);
      apiCache.delete(`ssr:article:${article.slug}`);
      apiCache.delete('articles:list:all');
      if (article.category) apiCache.delete(`articles:list:${article.category}`);
      // Ping search engines when an article is published/updated
      if (article.status === "published") pingSitemaps();
      return res.json(article);
    } catch (err: any) {
      if (err.code === "23505") return res.status(409).json({ error: "Slug already exists" });
      return res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", adminAuth, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(articlesTable)
        .where(eq(articlesTable.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Not found" });
      apiCache.delete(`article:${deleted.slug}`);
      apiCache.delete('articles:list:all');
      if (deleted.category) apiCache.delete(`articles:list:${deleted.category}`);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // ─── Admin category CRUD endpoints ───────────────────────────────────────────

  app.get("/api/admin/categories", adminAuth, async (req, res) => {
    try {
      const { type } = req.query;
      let query = db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
      const rows = await query;
      const filtered = type ? rows.filter((r) => r.type === type) : rows;
      return res.json(filtered);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/categories", adminAuth, async (req, res) => {
    try {
      const { name, slug, type, description, sortOrder } = req.body;
      if (!name || !slug || !type) return res.status(400).json({ error: "name, slug, type required" });
      const [row] = await db.insert(categoriesTable).values({ name, slug, type, description, sortOrder: sortOrder ?? 0 }).returning();
      return res.json(row);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/categories/:id", adminAuth, async (req, res) => {
    try {
      const { name, slug, description, sortOrder } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;
      const [row] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/categories/:id", adminAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Used platforms & instruments (aggregate unique values from all firms) ────

  app.get("/api/admin/used-platforms", adminAuth, async (req, res) => {
    try {
      const [brokerRows, propRows] = await Promise.all([
        db.select({ v: brokersTable.platformsList }).from(brokersTable),
        db.select({ v: propFirmsTable.platformsList }).from(propFirmsTable),
      ]);
      const all = new Set<string>();
      [...brokerRows, ...propRows].forEach(r => (r.v || []).forEach((p: string) => all.add(p)));
      res.json([...all].sort());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/used-instruments", adminAuth, async (req, res) => {
    try {
      const [brokerRows, propRows] = await Promise.all([
        db.select({ v: brokersTable.instruments }).from(brokersTable),
        db.select({ v: propFirmsTable.instruments }).from(propFirmsTable),
      ]);
      const all = new Set<string>();
      [...brokerRows, ...propRows].forEach(r => (r.v || []).forEach((p: string) => all.add(p)));
      res.json([...all].sort());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Broker category assignments ──────────────────────────────────────────────

  app.get("/api/admin/brokers/:slug/categories", adminAuth, async (req, res) => {
    try {
      const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, req.params.slug));
      if (!broker) return res.status(404).json({ error: "Broker not found" });
      const assignments = await db
        .select({ category: categoriesTable })
        .from(brokerCategoriesTable)
        .innerJoin(categoriesTable, eq(brokerCategoriesTable.categoryId, categoriesTable.id))
        .where(eq(brokerCategoriesTable.brokerId, broker.id));
      return res.json(assignments.map((a) => a.category));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/brokers/:slug/categories", adminAuth, async (req, res) => {
    try {
      const { categoryIds } = req.body as { categoryIds: string[] };
      const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, req.params.slug));
      if (!broker) return res.status(404).json({ error: "Broker not found" });
      await db.delete(brokerCategoriesTable).where(eq(brokerCategoriesTable.brokerId, broker.id));
      if (categoryIds && categoryIds.length > 0) {
        await db.insert(brokerCategoriesTable).values(categoryIds.map((cid) => ({ brokerId: broker.id, categoryId: cid })));
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Prop firm category assignments ──────────────────────────────────────────

  app.get("/api/admin/prop-firms/:slug/categories", adminAuth, async (req, res) => {
    try {
      const [firm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, req.params.slug));
      if (!firm) return res.status(404).json({ error: "Prop firm not found" });
      const assignments = await db
        .select({ category: categoriesTable })
        .from(propFirmCategoriesTable)
        .innerJoin(categoriesTable, eq(propFirmCategoriesTable.categoryId, categoriesTable.id))
        .where(eq(propFirmCategoriesTable.propFirmId, firm.id));
      return res.json(assignments.map((a) => a.category));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/prop-firms/:slug/categories", adminAuth, async (req, res) => {
    try {
      const { categoryIds } = req.body as { categoryIds: string[] };
      const [firm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, req.params.slug));
      if (!firm) return res.status(404).json({ error: "Prop firm not found" });
      await db.delete(propFirmCategoriesTable).where(eq(propFirmCategoriesTable.propFirmId, firm.id));
      if (categoryIds && categoryIds.length > 0) {
        await db.insert(propFirmCategoriesTable).values(categoryIds.map((cid) => ({ propFirmId: firm.id, categoryId: cid })));
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Admin comparison endpoints ───────────────────────────────────────────

  app.get("/api/admin/comparisons", adminAuth, async (req, res) => {
    try {
      const { status, entityType, q, sort } = req.query as Record<string, string>;
      let query = db.select().from(comparisonsTable);
      const conditions: any[] = [];
      if (status && status !== "all") conditions.push(eq(comparisonsTable.status, status));
      if (entityType && entityType !== "all") conditions.push(eq(comparisonsTable.entityType, entityType));
      if (q) conditions.push(or(ilike(comparisonsTable.entityAName, `%${q}%`), ilike(comparisonsTable.entityBName ?? "", `%${q}%`)));
      const rows = await (conditions.length
        ? db.select().from(comparisonsTable).where(and(...conditions))
        : db.select().from(comparisonsTable));
      let sorted = rows;
      if (sort === "alpha") sorted = rows.sort((a, b) => a.entityAName.localeCompare(b.entityAName));
      else if (sort === "status") sorted = rows.sort((a, b) => a.status.localeCompare(b.status));
      else sorted = rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(sorted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/comparisons/stats", adminAuth, async (req, res) => {
    try {
      const rows = await db.select({ status: comparisonsTable.status }).from(comparisonsTable);
      const stats = { draft: 0, published: 0, updated: 0, archived: 0 };
      rows.forEach((r) => { if (r.status in stats) (stats as any)[r.status]++; });
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/comparisons/generate-all", adminAuth, async (_req, res) => {
    try {
      const [pairs, alts] = await Promise.all([
        generateAllMissingPairs(),
        generateAllAlternatives(),
      ]);
      return res.json({
        ok: true,
        brokers: pairs.brokers,
        propFirms: pairs.propFirms,
        brokerAlternatives: alts.brokers,
        propFirmAlternatives: alts.propFirms,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Per-entity progress stats (for the entity-centric admin view)
  app.get("/api/admin/comparisons/entity-stats/:entityType", adminAuth, async (req, res) => {
    try {
      const { entityType } = req.params as { entityType: string };
      if (entityType !== "broker" && entityType !== "prop_firm") {
        return res.status(400).json({ error: "Invalid entityType" });
      }
      const stats = await getEntityComparisonStats(entityType);
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Generate the next missing comparison for a specific entity (one at a time)
  app.post("/api/admin/comparisons/generate-next/:entityType/:entityId", adminAuth, async (req, res) => {
    try {
      const { entityType, entityId } = req.params as { entityType: string; entityId: string };
      if (entityType !== "broker" && entityType !== "prop_firm") {
        return res.status(400).json({ error: "Invalid entityType" });
      }
      const result = await generateNextForEntity(entityType, entityId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get all vs comparisons for a specific entity (for accordion expansion)
  app.get("/api/admin/comparisons/for-entity/:entityType/:entityId", adminAuth, async (req, res) => {
    try {
      const { entityType, entityId } = req.params as { entityType: string; entityId: string };
      const rows = await db
        .select()
        .from(comparisonsTable)
        .where(
          and(
            eq(comparisonsTable.entityType, entityType),
            eq(comparisonsTable.comparisonType, "vs"),
            or(
              eq(comparisonsTable.entityAId, entityId),
              eq(comparisonsTable.entityBId as any, entityId)
            )
          )
        )
        .orderBy(asc(comparisonsTable.slug));
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/comparisons/bulk", adminAuth, async (req, res) => {
    try {
      const { ids, action } = req.body as { ids: string[]; action: "publish" | "archive" | "regenerate" };
      if (!ids?.length || !action) return res.status(400).json({ error: "ids and action required" });
      if (action === "regenerate") {
        await regenerateComparisons(ids);
      } else {
        const status = action === "publish" ? "published" : "archived";
        const now = new Date();
        for (const id of ids) {
          const upd: any = { status, updatedAt: now };
          if (action === "publish") upd.publishedAt = now;
          await db.update(comparisonsTable).set(upd).where(eq(comparisonsTable.id, id));
        }
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/comparisons/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body as { action: "publish" | "archive" | "draft" };
      const now = new Date();
      const upd: any = { status: action === "publish" ? "published" : action, updatedAt: now };
      if (action === "publish") upd.publishedAt = now;
      await db.update(comparisonsTable).set(upd).where(eq(comparisonsTable.id, id));
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/comparisons/:id/regenerate", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await regenerateComparisons([id]);
      const [updated] = await db.select().from(comparisonsTable).where(eq(comparisonsTable.id, id));
      return res.json(updated ?? { ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Public article endpoints ──────────────────────────────────────────────

  app.get("/api/articles", async (req, res) => {
    try {
      const { category } = req.query;
      const catSlug = category && typeof category === "string" ? category.trim() : null;
      const cacheKey = `articles:list:${catSlug || "all"}`;
      const cached = apiCache.get(cacheKey);
      if (cached && !apiCache.isStale(cacheKey)) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      const query = db.select().from(articlesTable)
        .where(catSlug
          ? and(eq(articlesTable.status, "published"), eq(articlesTable.category, catSlug))
          : eq(articlesTable.status, "published"))
        .orderBy(desc(articlesTable.publishedAt));
      const results = await query;
      const payload = results.map(articleToListApi);
      apiCache.set(cacheKey, payload, 300, 600);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'MISS');
      return res.json(payload);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const cacheKey = `article:${req.params.slug}`;
      const cached = apiCache.get(cacheKey);
      if (cached && !apiCache.isStale(cacheKey)) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      const [article] = await db
        .select()
        .from(articlesTable)
        .where(and(eq(articlesTable.slug, req.params.slug), eq(articlesTable.status, "published")));
      if (!article) return res.status(404).json({ error: "Not found" });
      const result = articleToApi(article);
      if (article.relatedBroker) {
        try {
          const [brokerRow] = await db.select().from(brokersTable).where(eq(brokersTable.slug, article.relatedBroker));
          if (brokerRow) result.relatedBroker = brokerDbToApi(brokerRow);
        } catch (_) {}
      }
      if (article.relatedPropFirm) {
        try {
          const [pfRow] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, article.relatedPropFirm));
          if (pfRow) result.relatedPropFirm = propFirmDbToApi(pfRow);
        } catch (_) {}
      }
      const selfUrl = `/${article.category || 'news'}/${article.slug}`;
      if (result.content) {
        result.content = await addInternalLinks(result.content, selfUrl);
      }
      apiCache.set(cacheKey, result, 300, 600);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'MISS');
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // ─── Public category/content endpoints ────────────────────────────────────

  app.get("/api/categories", async (req, res) => {
    try {
      const { slug } = req.query;
      const cacheKey = "categories:article";
      let results = apiCache.get(cacheKey);
      if (!results || apiCache.isStale(cacheKey)) {
        const dbCats = await db.select().from(categoriesTable)
          .where(eq(categoriesTable.type, "article"))
          .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
        results = dbCats.map((c) => ({ id: c.legacyId ?? c.id, name: c.name, slug: c.slug, count: 1 }));
        apiCache.set(cacheKey, results, 300, 600);
      }
      if (slug && typeof slug === "string") {
        results = results.filter((c: any) => c.slug === slug);
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json(results);
    } catch (error) {
      handleApiError(error, res, "fetch categories");
    }
  });

  app.get("/api/broker-categories", async (req, res) => {
    try {
      const cacheKey = "categories:broker";
      let cached = apiCache.get(cacheKey);
      if (!cached || apiCache.isStale(cacheKey)) {
        const dbCats = await db.select().from(categoriesTable).where(eq(categoriesTable.type, "broker")).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
        cached = dbCats.map((c) => ({ id: c.legacyId ?? c.id, name: c.name, slug: c.slug, count: 1 }));
        apiCache.set(cacheKey, cached, 300, 600);
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json(cached);
    } catch (error) {
      console.error("Error fetching broker categories:", error);
      res.json([]);
    }
  });

  app.get("/api/prop-firm-categories", async (req, res) => {
    try {
      const cacheKey = "categories:prop_firm";
      let cached = apiCache.get(cacheKey);
      if (!cached || apiCache.isStale(cacheKey)) {
        const dbCats = await db.select().from(categoriesTable).where(eq(categoriesTable.type, "prop_firm")).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
        cached = dbCats.map((c) => ({ id: c.legacyId ?? c.id, name: c.name, slug: c.slug, count: 1 }));
        apiCache.set(cacheKey, cached, 300, 600);
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json(cached);
    } catch (error) {
      console.error("Error fetching prop firm categories:", error);
      res.json([]);
    }
  });

  app.get("/api/category-content", async (req, res) => {
    try {
      const { category } = req.query;
      if (!category) return res.status(400).json({ error: "Category parameter required" });
      const catSlug = typeof category === 'string' ? category : String(category);

      const [brokerCatRows, propFirmCatRows] = await Promise.all([
        db.select().from(categoriesTable).where(and(eq(categoriesTable.slug, catSlug), eq(categoriesTable.type, "broker"))),
        db.select().from(categoriesTable).where(and(eq(categoriesTable.slug, catSlug), eq(categoriesTable.type, "prop_firm"))),
      ]);
      const brokerCat = brokerCatRows[0] || null;
      const propFirmCat = propFirmCatRows[0] || null;

      const [dbBrokerRows, dbPropFirmRows, dbArticleRows] = await Promise.all([
        brokerCat
          ? db.select({ broker: brokersTable }).from(brokerCategoriesTable)
              .innerJoin(brokersTable, eq(brokerCategoriesTable.brokerId, brokersTable.id))
              .where(eq(brokerCategoriesTable.categoryId, brokerCat.id))
          : Promise.resolve([]),
        propFirmCat
          ? db.select({ firm: propFirmsTable }).from(propFirmCategoriesTable)
              .innerJoin(propFirmsTable, eq(propFirmCategoriesTable.propFirmId, propFirmsTable.id))
              .where(eq(propFirmCategoriesTable.categoryId, propFirmCat.id))
          : Promise.resolve([]),
        db.select().from(articlesTable)
          .where(and(eq(articlesTable.status, "published"), eq(articlesTable.category, catSlug)))
          .orderBy(desc(articlesTable.publishedAt)),
      ]);

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json({
        articles: dbArticleRows.map(articleToListApi),
        brokers: dbBrokerRows.map((r: any) => brokerDbToApi(r.broker)),
        propFirms: dbPropFirmRows.map((r: any) => propFirmDbToApi(r.firm)),
      });
    } catch (error) {
      handleApiError(error, res, "fetch category content");
    }
  });

  app.get("/api/trust-signals", (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    res.json([
      { icon: "users",   value: "50,000+", label: "Active Traders" },
      { icon: "trending", value: "$2.5B+", label: "Trading Volume" },
      { icon: "award",   value: "100+",    label: "Verified Brokers" },
      { icon: "shield",  value: "2020",    label: "Trusted Since" },
    ]);
  });

  app.get("/api/reviews/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

      let firmSlug: string | null = null;
      if (/^\d+$/.test(itemId)) {
        const legacyNumericId = parseInt(itemId, 10);
        const brokerMatch = await db.select({ slug: brokersTable.slug }).from(brokersTable).where(eq(brokersTable.legacyPostId, legacyNumericId));
        if (brokerMatch.length > 0) {
          firmSlug = brokerMatch[0].slug;
        } else {
          const propMatch = await db.select({ slug: propFirmsTable.slug }).from(propFirmsTable).where(eq(propFirmsTable.legacyPostId, legacyNumericId));
          if (propMatch.length > 0) firmSlug = propMatch[0].slug;
        }
      } else {
        firmSlug = itemId;
      }

      if (firmSlug) {
        const dbReviews = await db.select().from(reviewsTable)
          .where(and(eq(reviewsTable.firmSlug, firmSlug), eq(reviewsTable.status, "approved")))
          .orderBy(desc(reviewsTable.createdAt));
        return res.json(dbReviews.map((r) => ({
          id: r.id,
          rating: r.rating ? parseFloat(String(r.rating)) : 0,
          title: r.title || "",
          reviewText: r.reviewText || "",
          reviewerName: r.reviewerName || "Anonymous",
          date: r.createdAt,
          status: "approved",
        })));
      }

      res.json([]);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.json([]);
    }
  });

  // ─── Public comparison endpoints ─────────────────────────────────────────────

  // Hub endpoint: published comparisons for a given entity type
  // MUST be before /:entityType/:slug to avoid route collision
  app.get("/api/comparisons/hub/:entityType", async (req, res) => {
    try {
      const { entityType } = req.params;
      const rows = await db.select().from(comparisonsTable)
        .where(and(
          eq(comparisonsTable.entityType, entityType),
          eq(comparisonsTable.status, "published"),
          eq(comparisonsTable.comparisonType, "vs")
        ))
        .orderBy(desc(comparisonsTable.publishedAt));
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Related comparisons — MUST be before /:entityType/:slug to avoid "related" being captured as entityType
  app.get("/api/comparisons/related/:entityType/:slug", async (req, res) => {
    try {
      const { entityType, slug } = req.params;
      const rows = await db.select().from(comparisonsTable)
        .where(and(
          eq(comparisonsTable.entityType, entityType),
          eq(comparisonsTable.status, "published"),
          or(
            eq(comparisonsTable.entityASlug, slug),
            eq(comparisonsTable.entityBSlug as any, slug)
          )
        ))
        .orderBy(desc(comparisonsTable.publishedAt));
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Single comparison page by type and slug
  app.get("/api/comparisons/:entityType/:slug", async (req, res) => {
    try {
      const { entityType, slug } = req.params;
      const [row] = await db.select().from(comparisonsTable)
        .where(and(eq(comparisonsTable.slug, slug), eq(comparisonsTable.entityType, entityType)));
      if (!row) return res.status(404).json({ error: "Comparison not found" });
      // Only return published comparisons to the public
      if (row.status !== "published" && row.status !== "updated") {
        return res.status(404).json({ error: "Not found" });
      }
      return res.json(row);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── DB-backed broker endpoints ─────────────────────────────────────────────

  app.get("/api/brokers", async (req, res) => {
    try {
      const cacheKey = "brokers:list";
      let cached = apiCache.get(cacheKey);
      if (!cached || apiCache.isStale(cacheKey)) {
        const rows = await db.select().from(brokersTable).orderBy(asc(brokersTable.name));
        // Strip heavy fields not needed by any list or comparison view — saves ~90KB per response
        cached = rows.map(row => {
          const { content, seoTitle, seoDescription, ...slim } = brokerDbToApi(row) as any;
          return slim;
        });
        apiCache.set(cacheKey, cached, 300, 600);
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', apiCache.isStale(cacheKey) ? 'MISS' : 'HIT');
      res.json(cached);
    } catch (error) {
      handleApiError(error, res, "fetch brokers from DB");
    }
  });

  app.get("/api/brokers/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const cacheKey = `broker:${slug}`;
      let cached = apiCache.get(cacheKey);
      if (cached && !apiCache.isStale(cacheKey)) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      const [row] = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
      if (!row) return res.status(404).json({ error: "Broker not found" });
      cached = brokerDbToApi(row);
      apiCache.set(cacheKey, cached, 300, 600);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'MISS');
      return res.json(cached);
    } catch (error) {
      handleApiError(error, res, "fetch broker from DB");
    }
  });

  app.put("/api/brokers/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const updates = req.body;
      await db.update(brokersTable).set({ ...updates, lastUpdated: new Date() }).where(eq(brokersTable.slug, slug));
      const rows = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
      apiCache.delete(`broker:${slug}`);
      apiCache.delete(`ssr:broker:${slug}`);
      apiCache.delete('brokers:list');
      apiCache.delete('ssr:comparison-hub:broker');
      if (rows[0]) onEntityUpdated("broker", rows[0].id).catch(() => {});
      res.json(rows[0] ? brokerDbToApi(rows[0]) : { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── DB-backed prop firm endpoints ───────────────────────────────────────────

  app.get("/api/prop-firms", async (req, res) => {
    try {
      const cacheKey = "prop-firms:list";
      let cached = apiCache.get(cacheKey);
      if (!cached || apiCache.isStale(cacheKey)) {
        const rows = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));
        const catRows = await db
          .select({ propFirmId: propFirmCategoriesTable.propFirmId, legacyId: categoriesTable.legacyId, dbId: categoriesTable.id })
          .from(propFirmCategoriesTable)
          .innerJoin(categoriesTable, eq(propFirmCategoriesTable.categoryId, categoriesTable.id));
        const catMap = new Map<number, (number | string)[]>();
        for (const r of catRows) {
          const publicId = r.legacyId ?? r.dbId;
          if (!catMap.has(r.propFirmId)) catMap.set(r.propFirmId, []);
          catMap.get(r.propFirmId)!.push(publicId);
        }
        // Strip heavy fields not needed by list/comparison views
        cached = rows.map(row => {
          const { content, seoTitle, seoDescription, ...slim } = propFirmDbToApi(row) as any;
          return { ...slim, categoryIds: catMap.get(row.id) || [] };
        });
        apiCache.set(cacheKey, cached, 300, 600);
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(cached);
    } catch (error) {
      handleApiError(error, res, "fetch prop firms from DB");
    }
  });

  app.get("/api/prop-firms/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const cacheKey = `prop-firm:${slug}`;
      let cached = apiCache.get(cacheKey);
      if (cached && !apiCache.isStale(cacheKey)) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      const [row] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      if (!row) return res.status(404).json({ error: "Prop firm not found" });
      cached = propFirmDbToApi(row);
      apiCache.set(cacheKey, cached, 300, 600);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'MISS');
      return res.json(cached);
    } catch (error) {
      handleApiError(error, res, "fetch prop firm from DB");
    }
  });

  app.put("/api/prop-firms/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const updates = req.body;
      await db.update(propFirmsTable).set({ ...updates, lastUpdated: new Date() }).where(eq(propFirmsTable.slug, slug));
      const rows = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      apiCache.delete(`prop-firm:${slug}`);
      apiCache.delete(`ssr:prop-firm:${slug}`);
      apiCache.delete('prop-firms:list');
      apiCache.delete('ssr:comparison-hub:prop-firm');
      if (rows[0]) onEntityUpdated("prop_firm", rows[0].id).catch(() => {});
      res.json(rows[0] ? propFirmDbToApi(rows[0]) : { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ─── Admin email leads ────────────────────────────────────────────────────

  app.get("/api/admin/email-leads", adminAuth, async (req, res) => {
    try {
      const leads = await db
        .select()
        .from(emailCaptures)
        .orderBy(desc(emailCaptures.createdAt));
      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/email-leads/:id", adminAuth, async (req, res) => {
    try {
      await db.delete(emailCaptures).where(eq(emailCaptures.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Redirect /home to / (301 permanent redirect)
  app.get("/home", (req, res) => {
    console.log('[Redirect] /home → /');
    res.redirect(301, '/');
  });

  // 301 redirects for old prop firm slugs → clean slugs
  const propFirmSlugRedirects: Record<string, string> = {
    'crypto-fund-trader-review-2026': 'crypto-fund-trader',
    'e8-markets-review-2026': 'e8-markets',
    'ftmo-review-2026': 'ftmo',
    'fintokei-review-2026': 'fintokei',
    'fundednext-review-2026': 'fundednext',
    'funderpro-review': 'funderpro',
    'funderpro': 'funderpro',
    'funding-pips-review-2026': 'funding-pips',
    'goat-funded-trader-review-2026': 'goat-funded-trader',
    'lux-trading-firm-review-2026': 'lux-trading-firm',
    'rebelsfunding-review-2026': 'rebelsfunding',
    'the5ers-review-2026': 'the5ers',
    'wall-street-funded-review-2026': 'wall-street-funded',
  };

  app.get("/prop-firm/:slug", (req, res, next) => {
    const { slug } = req.params;
    const newSlug = propFirmSlugRedirects[slug];
    if (newSlug && newSlug !== slug) {
      console.log(`[Redirect] /prop-firm/${slug} → /prop-firm/${newSlug}`);
      return res.redirect(301, `/prop-firm/${newSlug}`);
    }
    next();
  });

  // Redirect old /article/:slug URLs to new /:category/:slug URLs (301 permanent redirect)
  app.get("/article/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const [article] = await db.select({ category: articlesTable.category })
        .from(articlesTable).where(eq(articlesTable.slug, slug));
      if (!article) return res.status(404).send('Article not found');
      const categorySlug = article.category || "uncategorized";
      return res.redirect(301, `/${categorySlug}/${slug}`);
    } catch (error) {
      console.error("[Redirect] Error:", error);
      res.status(500).send('Redirect failed');
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email, source, utmCampaign, utmSource, utmMedium, utmContent, utmTerm, gclid, fbclid } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket?.remoteAddress || null;

      // Write to DB (upsert by email — silently ignore duplicate)
      await db.insert(emailCaptures).values({
        email,
        source: source || "newsletter",
        utmCampaign: utmCampaign || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        gclid: gclid || null,
        fbclid: fbclid || null,
        ipAddress,
        userAgent: req.headers['user-agent'] || null,
      }).onConflictDoNothing();

      res.json({ success: true });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Broker-specific alert subscriptions
  app.post("/api/broker-alerts/subscribe", async (req, res) => {
    try {
      const validationResult = insertBrokerAlertSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.errors 
        });
      }

      const { email, firstName, brokerId, brokerName } = validationResult.data;

      // Capture email in newsletter DB (non-blocking)
      db.insert(emailCaptures).values({
        email,
        source: brokerName || "broker-alert",
      }).onConflictDoNothing().catch((e: any) =>
        console.error("[Broker Alert] Email capture failed:", e)
      );

      // Store in our database
      await db.insert(brokerAlerts).values({
        email,
        firstName,
        brokerId,
        brokerName,
      });

      res.json({ 
        success: true, 
        message: `You'll be notified about exclusive ${brokerName} bonuses and news!` 
      });
    } catch (error) {
      console.error("Error storing broker alert:", error);
      res.status(500).json({ error: "Failed to subscribe to alerts" });
    }
  });

  // Endpoint to get reCAPTCHA site key
  app.get("/api/recaptcha/site-key", (req, res) => {
    const siteKey = process.env.RECAPTCHA_SITE_KEY;
    console.log("[reCAPTCHA] Site key requested, returning:", siteKey ? "***key***" : "null");
    res.setHeader('Content-Type', 'application/json');
    if (siteKey) {
      return res.json({ siteKey });
    } else {
      return res.json({ siteKey: null });
    }
  });

  app.post("/api/reviews/submit", async (req, res) => {
    try {
      const { rating, title, reviewText, name, email, newsletterOptin, brokerId, brokerName, itemType, recaptchaToken } = req.body;

      // Verify reCAPTCHA
      const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidCaptcha) {
        return res.status(400).json({ error: "reCAPTCHA verification failed" });
      }

      // Validate required fields
      if (!rating || !title || !reviewText || !name || !email || !brokerId || !itemType) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Resolve firm name from DB if not provided
      let resolvedFirmName = brokerName || brokerId;
      try {
        if (itemType === "broker") {
          const [b] = await db.select({ name: brokersTable.name }).from(brokersTable).where(eq(brokersTable.slug, brokerId));
          if (b) resolvedFirmName = b.name;
        } else {
          const [pf] = await db.select({ name: propFirmsTable.name }).from(propFirmsTable).where(eq(propFirmsTable.slug, brokerId));
          if (pf) resolvedFirmName = pf.name;
        }
      } catch (_) {}

      // Write review to DB
      const [savedReview] = await db.insert(reviewsTable).values({
        firmType: itemType === "broker" ? "broker" : "prop_firm",
        firmSlug: brokerId,
        firmName: resolvedFirmName,
        reviewerName: name,
        reviewerEmail: email,
        rating: String(rating),
        title,
        reviewText,
        newsletterOptin: !!newsletterOptin,
        status: "pending",
      }).returning();

      // Send Telegram notification (non-blocking)
      sendReviewNotification({
        postId: savedReview.id,
        brokerName: resolvedFirmName,
        rating: parseFloat(String(rating) || '0'),
        author: name || 'Anonymous',
        excerpt: (reviewText || '').substring(0, 200),
        reviewLink: `https://entrylab.io/admin/reviews`,
      }).catch((e: any) => console.error('[Telegram] Review notification failed:', e));

      // Newsletter opt-in — capture in DB (non-blocking)
      if (newsletterOptin && email) {
        db.insert(emailCaptures).values({
          email,
          source: resolvedFirmName ? `${resolvedFirmName} Review` : "Review Page",
        }).onConflictDoNothing().catch((e: any) =>
          console.error("[Review] Email capture failed:", e)
        );
      }

      res.json({ success: true, review: { id: savedReview.id } });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });


  app.get("/api/forex/quotes", async (req, res) => {
    try {
      const apiKey = process.env.FOREX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Forex API key not configured" });
      }

      const symbols = ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "BTC/USD"];
      const forexSymbols = ["OANDA:EUR_USD", "OANDA:GBP_USD", "OANDA:USD_JPY"];
      const cryptoSymbols = ["BINANCE:BTCUSDT"];
      const commoditySymbols = ["OANDA:XAU_USD"];

      const allSymbols = [...forexSymbols, ...cryptoSymbols, ...commoditySymbols];
      
      const responses = await Promise.all(
        allSymbols.map(symbol =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
            .then(res => res.json())
            .catch(() => null)
        )
      );

      const quotes = [
        {
          pair: "EUR/USD",
          price: responses[0]?.c?.toFixed(4) || "1.0842",
          change: responses[0]?.dp?.toFixed(2) || "0.12"
        },
        {
          pair: "GBP/USD",
          price: responses[1]?.c?.toFixed(4) || "1.2634",
          change: responses[1]?.dp?.toFixed(2) || "-0.08"
        },
        {
          pair: "USD/JPY",
          price: responses[2]?.c?.toFixed(2) || "149.85",
          change: responses[2]?.dp?.toFixed(2) || "0.24"
        },
        {
          pair: "GOLD",
          price: responses[4]?.c ? `${Math.round(responses[4].c).toLocaleString()}` : "2,018",
          change: responses[4]?.dp?.toFixed(2) || "0.56"
        },
        {
          pair: "BTC/USD",
          price: responses[3]?.c ? `${Math.round(responses[3].c).toLocaleString()}` : "43,250",
          change: responses[3]?.dp?.toFixed(2) || "-1.23"
        }
      ];

      res.json(quotes);
    } catch (error) {
      console.error("Error fetching forex quotes:", error);
      res.status(500).json({ error: "Failed to fetch forex data" });
    }
  });

  // llms.txt — AI/LLM-readable site index (llmstxt.org standard)
  app.get('/llms.txt', async (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    try {
      const [brokers, propFirms, recentArticles] = await Promise.all([
        db.select({ name: brokersTable.name, slug: brokersTable.slug, tagline: brokersTable.tagline })
          .from(brokersTable).orderBy(asc(brokersTable.name)),
        db.select({ name: propFirmsTable.name, slug: propFirmsTable.slug, tagline: propFirmsTable.tagline })
          .from(propFirmsTable).orderBy(asc(propFirmsTable.name)),
        db.select({ title: articlesTable.title, slug: articlesTable.slug, category: articlesTable.category, excerpt: articlesTable.excerpt, publishedAt: articlesTable.publishedAt })
          .from(articlesTable)
          .where(eq(articlesTable.status, 'published'))
          .orderBy(desc(articlesTable.publishedAt))
          .limit(20),
      ]);

      const baseUrl = 'https://entrylab.io';

      const brokerLines = brokers.map(b => {
        const tagline = b.tagline ? `: ${b.tagline.replace(/\n/g, ' ').slice(0, 120)}` : '';
        return `- [${b.name} Review](${baseUrl}/broker/${b.slug})${tagline}`;
      }).join('\n');

      const propFirmLines = propFirms.map(p => {
        const tagline = p.tagline ? `: ${p.tagline.replace(/\n/g, ' ').slice(0, 120)}` : '';
        return `- [${p.name} Review](${baseUrl}/prop-firm/${p.slug})${tagline}`;
      }).join('\n');

      const articleLines = recentArticles.map(a => {
        const excerpt = a.excerpt ? ` — ${a.excerpt.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120)}` : '';
        const cat = a.category || 'news';
        return `- [${a.title}](${baseUrl}/${cat}/${a.slug})${excerpt}`;
      }).join('\n');

      const output = `# EntryLab
> Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals for retail traders worldwide.

EntryLab is an independent trading intelligence platform. We publish unbiased forex broker reviews, proprietary trading firm evaluations, and curated gold (XAU/USD) trading signals. All content is researched independently — EntryLab is not affiliated with any broker or firm it covers.

## What EntryLab Covers

- **Forex Broker Reviews**: Spreads, leverage, regulation, minimum deposits, MetaTrader 4/5, trading conditions.
- **Prop Firm Reviews**: Evaluation rules, profit splits, drawdown limits, payout policies, scaling plans.
- **Broker & Prop Firm News**: Breaking news and regulatory updates affecting the forex industry.
- **XAU/USD Trading Signals**: Real-time gold trading signals with entry, stop-loss, and take-profit levels via Telegram.
- **Market Analysis**: Educational content and trading guides for forex and commodity markets.

## Key Pages

- [Homepage](${baseUrl}/): Latest forex news and trading intelligence
- [Broker Reviews](${baseUrl}/brokers): Compare all reviewed forex brokers
- [Prop Firm Reviews](${baseUrl}/prop-firms): Evaluate proprietary trading firms
- [Broker News](${baseUrl}/broker-news): Latest broker industry news
- [Prop Firm News](${baseUrl}/prop-firm-news): Latest prop firm industry news
- [Trading Signals](${baseUrl}/signals): Premium XAU/USD trading signals
- [Subscribe](${baseUrl}/subscribe): Premium signal subscription ($49/month or $319/year)
- [Broker Comparison](${baseUrl}/compare): Side-by-side broker comparison tool
- [Sitemap](${baseUrl}/sitemap.xml)

## Forex Broker Reviews (${brokers.length} brokers)

${brokerLines}

## Prop Firm Reviews (${propFirms.length} firms)

${propFirmLines}

## Recent Articles (latest ${recentArticles.length})

${articleLines}

## What EntryLab Does NOT Cover

- Cryptocurrency or DeFi trading
- Stock market or equity investing
- Personalised financial or investment advice
- Real-time market data feeds

## About

EntryLab was founded in 2024. All reviews are independently researched. Ratings use objective criteria: regulation, trading costs, platform quality, user experience. EntryLab is not affiliated with any broker or prop firm it reviews.

## Contact

- Website: ${baseUrl}
- Telegram Community: https://t.me/entrylabs
`;
      res.send(output);
    } catch (err) {
      console.error('[llms.txt] Error generating:', err);
      res.status(500).send('# EntryLab\n> Forex broker reviews and trading signals.\n\nSee https://entrylab.io/sitemap.xml for content index.\n');
    }
  });


  // Robots.txt
  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://entrylab.io/sitemap.xml`
    );
  });

  // RSS Feed - for Google News, Google Discover, Feedly and other aggregators
  app.get('/feed.xml', async (_req, res) => {
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    try {
      const articles = await db
        .select({
          slug: articlesTable.slug,
          title: articlesTable.title,
          excerpt: articlesTable.excerpt,
          category: articlesTable.category,
          author: articlesTable.author,
          featuredImage: articlesTable.featuredImage,
          publishedAt: articlesTable.publishedAt,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .where(eq(articlesTable.status, 'published'))
        .orderBy(desc(articlesTable.publishedAt))
        .limit(50);

      const categoryLabels: Record<string, string> = {
        'broker-news': 'Broker News', 'prop-firm-news': 'Prop Firm News',
        'broker-guides': 'Broker Guides', 'prop-firm-guides': 'Prop Firm Guides',
        'trading-tools': 'Trading Tools', 'news': 'News',
      };

      const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').trim();

      const items = articles.map(a => {
        const catSlug = a.category || 'news';
        const link = `https://entrylab.io/${catSlug}/${a.slug}`;
        const title = escape(stripTags(a.title || ''));
        const desc = escape(stripTags(a.excerpt || '').substring(0, 280));
        const pubDate = (a.publishedAt || a.updatedAt || new Date()).toUTCString();
        const category = escape(categoryLabels[catSlug] || catSlug);
        const author = escape(a.author || 'EntryLab Editorial Team');
        const imageTag = a.featuredImage
          ? `\n        <enclosure url="${escape(a.featuredImage)}" type="image/jpeg" length="0"/>`
          : '';
        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${category}</category>
      <author>editorial@entrylab.io (${author})</author>${imageTag}
    </item>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EntryLab — Forex News &amp; Trading Intelligence</title>
    <link>https://entrylab.io</link>
    <description>Forex broker news, prop firm updates, and XAU/USD trading analysis for retail traders worldwide.</description>
    <language>en-us</language>
    <managingEditor>editorial@entrylab.io (EntryLab)</managingEditor>
    <webMaster>editorial@entrylab.io (EntryLab)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    <image>
      <url>https://entrylab.io/assets/entrylab-logo-green.png</url>
      <title>EntryLab</title>
      <link>https://entrylab.io</link>
    </image>
    <atom:link href="https://entrylab.io/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

      res.send(xml);
    } catch (err) {
      console.error('[RSS] Feed generation error:', err);
      res.status(500).send('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>');
    }
  });

  // Dynamic Sitemap XML - CRITICAL: Set headers FIRST before any async operations
  app.get('/sitemap.xml', async (_req, res) => {
    // Set XML headers IMMEDIATELY - this prevents Express from serving HTML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');

    // Serve from memory cache if fresh (< 1 hour old)
    const cached = apiCache.get('sitemap:xml');
    if (cached && !apiCache.isStale('sitemap:xml')) {
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached);
    }

    try {
      const [posts, brokers, propFirms, categories, comparisons] = await Promise.all([
        db.select({ slug: articlesTable.slug, category: articlesTable.category, publishedAt: articlesTable.publishedAt, updatedAt: articlesTable.updatedAt, featuredImage: articlesTable.featuredImage, title: articlesTable.title })
          .from(articlesTable).where(eq(articlesTable.status, "published")).orderBy(desc(articlesTable.publishedAt)),
        db.select({ slug: brokersTable.slug, lastUpdated: brokersTable.lastUpdated }).from(brokersTable),
        db.select({ slug: propFirmsTable.slug, lastUpdated: propFirmsTable.lastUpdated }).from(propFirmsTable),
        db.select({ slug: categoriesTable.slug, name: categoriesTable.name }).from(categoriesTable)
          .where(eq(categoriesTable.type, "article")),
        db.select({ slug: comparisonsTable.slug, entityType: comparisonsTable.entityType, publishedAt: comparisonsTable.publishedAt, updatedAt: comparisonsTable.updatedAt })
          .from(comparisonsTable).where(inArray(comparisonsTable.status, ["published", "updated"])),
      ]);

      const baseUrl = 'https://entrylab.io';
      const currentDate = new Date().toISOString();

      // Build sitemap XML — with image extension for faster Google image indexing
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
      sitemap += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

      // Homepage
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>1.0</priority>\n`;
      sitemap += `  </url>\n`;

      // News archive (Recent Posts)
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/news</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Category archive pages (broker-news, prop-firm-news, etc)
      const excludedCategories = ['uncategorized', 'uncategorised', 'home'];
      categories.forEach((category) => {
        if (!excludedCategories.includes(category.slug.toLowerCase())) {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/${category.slug}</loc>\n`;
          sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
          sitemap += `    <changefreq>daily</changefreq>\n`;
          sitemap += `    <priority>0.9</priority>\n`;
          sitemap += `  </url>\n`;
        }
      });

      // Brokers index
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/brokers</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Prop Firms index
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/prop-firms</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Signals page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/signals</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;

      // Compare hub pages
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/compare</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/compare/broker</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/compare/prop-firm</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;

      // Individual comparison pages (published/updated only)
      comparisons.forEach((comp) => {
        const urlSegment = comp.entityType === 'broker' ? 'broker' : 'prop-firm';
        const modifiedDate = comp.updatedAt
          ? new Date(comp.updatedAt).toISOString()
          : comp.publishedAt
          ? new Date(comp.publishedAt).toISOString()
          : currentDate;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/compare/${urlSegment}/${comp.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Articles — include image:image for featured images so Google indexes them faster
      posts.forEach((post) => {
        const modifiedDate = (post.updatedAt || post.publishedAt) ? new Date(post.updatedAt || post.publishedAt!).toISOString() : currentDate;
        const categorySlug = post.category || 'uncategorized';
        const cleanTitle = (post.title || '').replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/${categorySlug}/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        if (post.featuredImage) {
          sitemap += `    <image:image>\n`;
          sitemap += `      <image:loc>${post.featuredImage}</image:loc>\n`;
          if (cleanTitle) sitemap += `      <image:title>${cleanTitle}</image:title>\n`;
          sitemap += `    </image:image>\n`;
        }
        sitemap += `  </url>\n`;
      });

      // Brokers
      brokers.forEach((broker: any) => {
        const modifiedDate = broker.lastUpdated
          ? new Date(broker.lastUpdated).toISOString()
          : broker.modified
          ? new Date(broker.modified).toISOString()
          : currentDate;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/broker/${broker.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Prop Firms
      propFirms.forEach((firm: any) => {
        const modifiedDate = firm.lastUpdated
          ? new Date(firm.lastUpdated).toISOString()
          : firm.modified
          ? new Date(firm.modified).toISOString()
          : currentDate;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/prop-firm/${firm.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      sitemap += '</urlset>';

      // Cache for 1 hour (3600s TTL, 7200s stale-while-revalidate)
      apiCache.set('sitemap:xml', sitemap, 3600, 7200);
      res.setHeader('X-Cache', 'MISS');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      
      // Even on error, send valid XML (not HTML)
      const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://entrylab.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
      
      res.status(500).send(errorSitemap);
    }
  });

  // Telegram webhook endpoint - receives commands from Telegram
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const update = req.body;
      console.log('[Telegram Bot] Webhook received update:', JSON.stringify(update, null, 2));
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
      const bot = getTelegramBot();
      
      // Handle callback queries (button clicks)
      if (update.callback_query) {
        const callbackData = update.callback_query.data;
        const chatId = update.callback_query.message.chat.id.toString();
        
        console.log(`[Telegram Bot] Button clicked: ${callbackData} from chat ${chatId}`);
        
        // SECURITY: Verify request is from authorized channel
        if (chatId !== TELEGRAM_CHANNEL_ID) {
          console.warn(`Unauthorized callback query from chat ${chatId}`);
          bot?.answerCallbackQuery(update.callback_query.id, { text: 'Unauthorized' });
          return res.sendStatus(403);
        }
        
        // Parse callback data — supports UUID and legacy numeric IDs
        const approveMatch = callbackData?.match(/^approve_([a-zA-Z0-9\-]+)$/);
        const rejectMatch  = callbackData?.match(/^reject_([a-zA-Z0-9\-]+)$/);
        const viewMatch    = callbackData?.match(/^view_([a-zA-Z0-9\-]+)$/);

        // Helper: look up review by DB UUID or legacy numeric ID
        const findReview = async (id: string) => {
          const isNumeric = /^\d+$/.test(id);
          if (isNumeric) {
            const [r] = await db.select().from(reviewsTable).where(eq(reviewsTable.legacyPostId, Number(id)));
            return r || null;
          }
          const [r] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
          return r || null;
        };
        
        if (approveMatch) {
          const reviewId = approveMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '✅ Approving review...' });
          try {
            const review = await findReview(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found in DB`);
            await db.update(reviewsTable)
              .set({ status: "approved", updatedAt: new Date() })
              .where(eq(reviewsTable.id, review.id));
            console.log('[Reviews] Approved review', review.id);
            await sendTelegramMessage(
              `✅ *Review Approved\\!*\n\n*Reviewer:* ${review.reviewerName}\n*Firm:* ${review.firmName || review.firmSlug}\n*Rating:* ${review.rating}/10\n\nThe review is now live on the site\\.`,
              'MarkdownV2'
            );
          } catch (error: any) {
            console.error('Error approving review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error approving review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (rejectMatch) {
          const reviewId = rejectMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '🗑️ Rejecting review...' });
          try {
            const review = await findReview(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found in DB`);
            await db.update(reviewsTable)
              .set({ status: "rejected", updatedAt: new Date() })
              .where(eq(reviewsTable.id, review.id));
            console.log('[Reviews] Rejected review', review.id);
            await sendTelegramMessage(`🗑️ *Review Rejected*\n\n*Reviewer:* ${review.reviewerName}\n*Firm:* ${review.firmName || review.firmSlug}\n\nThe review has been rejected\\.`, 'MarkdownV2');
          } catch (error: any) {
            console.error('Error rejecting review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error rejecting review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (viewMatch) {
          const reviewId = viewMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '👁️ Fetching details...' });
          try {
            const review = await findReview(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found`);
            const escapeText = (t: string) => (t || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(
              `📄 *Full Review Details*\n\n*Firm:* ${escapeText(review.firmName || review.firmSlug)}\n*Rating:* ${review.rating || '?'}/10\n*Author:* ${escapeText(review.reviewerName)}\n\n*Title:* ${escapeText(review.title || '')}\n\n*Review:*\n${escapeText((review.reviewText || '').substring(0, 500))}${(review.reviewText || '').length > 500 ? '...' : ''}`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error fetching review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error fetching review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else {
          bot?.answerCallbackQuery(update.callback_query.id, { text: 'Unknown command' });
        }
        
        return res.sendStatus(200);
      }
      
      // Handle text messages (commands)
      if (update.message && update.message.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id.toString();
        
        // SECURITY: Verify request is from authorized channel
        if (chatId !== TELEGRAM_CHANNEL_ID) {
          console.warn(`Unauthorized command from chat ${chatId}: ${text}`);
          return res.sendStatus(403);
        }
        
        // Parse commands like /approve_<id>, /reject_<id>, /view_<id> (UUID or numeric)
        const approveMatch = text.match(/^\/approve_([a-zA-Z0-9\-]+)$/);
        const rejectMatch  = text.match(/^\/reject_([a-zA-Z0-9\-]+)$/);
        const viewMatch    = text.match(/^\/view_([a-zA-Z0-9\-]+)$/);

        const findReviewById = async (id: string) => {
          const isNumeric = /^\d+$/.test(id);
          if (isNumeric) {
            const [r] = await db.select().from(reviewsTable).where(eq(reviewsTable.legacyPostId, Number(id)));
            return r || null;
          }
          const [r] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
          return r || null;
        };
        
        if (approveMatch) {
          const reviewId = approveMatch[1];
          try {
            const review = await findReviewById(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found in DB`);
            await db.update(reviewsTable)
              .set({ status: "approved", updatedAt: new Date() })
              .where(eq(reviewsTable.id, review.id));
            console.log('[Reviews] Approved review via command', review.id);
            await sendTelegramMessage(
              `✅ *Review Approved!*\n\n*Reviewer:* ${review.reviewerName}\n*Firm:* ${review.firmName || review.firmSlug}\n\nThe review is now live on the site.`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error approving review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error approving review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (rejectMatch) {
          const reviewId = rejectMatch[1];
          try {
            const review = await findReviewById(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found in DB`);
            await db.update(reviewsTable)
              .set({ status: "rejected", updatedAt: new Date() })
              .where(eq(reviewsTable.id, review.id));
            console.log('[Reviews] Rejected review via command', review.id);
            await sendTelegramMessage(
              `🗑️ *Review Rejected*\n\n*Reviewer:* ${review.reviewerName}\n*Firm:* ${review.firmName || review.firmSlug}\n\nThe review has been rejected.`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error rejecting review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error rejecting review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (viewMatch) {
          const reviewId = viewMatch[1];
          try {
            const review = await findReviewById(reviewId);
            if (!review) throw new Error(`Review ${reviewId} not found`);
            const escapeText = (t: string) => (t || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(
              `📄 *Full Review Details*\n\n*Firm:* ${escapeText(review.firmName || review.firmSlug)}\n*Rating:* ${review.rating || '?'}/10\n*Author:* ${escapeText(review.reviewerName)}\n\n*Title:* ${escapeText(review.title || '')}\n\n*Review:*\n${escapeText((review.reviewText || '').substring(0, 500))}${(review.reviewText || '').length > 500 ? '...' : ''}`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error fetching review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error fetching review ${reviewId}*\n\n${errorMsg}`, 'Markdown');
          }
        }
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.sendStatus(500);
    }
  });

  // Test endpoint to manually trigger a review notification
  app.post("/api/telegram/test-notification", async (req, res) => {
    try {
      await sendReviewNotification({
        postId: "test-review-id-9999",
        brokerName: "Test Broker",
        rating: 4.5,
        author: "Test User",
        excerpt: "This is a test review notification to verify the Telegram bot integration is working correctly.",
        reviewLink: "https://entrylab.io/admin/broker-reviews"
      });
      
      res.json({ success: true, message: "Test notification sent to Telegram channel" });
    } catch (error: any) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: error.message });
    }
  });


  // Legacy /category/* URL Redirects
  // Redirect legacy /category/* URLs to new format (without /category/ prefix)
  // This must run BEFORE SEO middleware
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url;
    
    if (url.startsWith('/category/')) {
      const newPath = url.replace('/category/', '/');
      console.log(`[REDIRECT] Old category URL: ${url} → ${newPath}`);
      
      // 301 permanent redirect
      return res.redirect(301, newPath);
    }
    
    next();
  });

  // Server-Side SEO Injection Middleware
  // Injects title, meta description, and content for Google to see without waiting for JavaScript
  // This runs BEFORE Vite/static middleware
  
  // Helper: load all static page SEO from DB, with caching
  async function loadAllStaticPageSeo(): Promise<Record<string, { title: string; description: string }>> {
    const cacheKey = 'static-seo:all';
    const cached = apiCache.get<Record<string, { title: string; description: string }>>(cacheKey);
    if (cached && !apiCache.isStale(cacheKey)) return cached;
    try {
      const rows = await db.select().from(staticPageSeoTable);
      const map: Record<string, { title: string; description: string }> = {};
      for (const row of rows) {
        if (row.seoTitle || row.seoDescription) {
          map[row.slug] = { title: row.seoTitle || '', description: row.seoDescription || '' };
        }
      }
      apiCache.set(cacheKey, map, 300, 600);
      return map;
    } catch {
      return {};
    }
  }

  app.use(async (req, res, next) => {
    const url = req.originalUrl || req.url;
    
    // Only process HTML requests for specific page types
    const isHtmlRequest = !url.includes('.') || url.endsWith('.html');
    
    const cleanUrlForCheck = url.split('?')[0];
    const needsSEO = cleanUrlForCheck === '/' ||
                     cleanUrlForCheck === '/brokers' ||
                     cleanUrlForCheck === '/prop-firms' ||
                     cleanUrlForCheck === '/compare' ||
                     cleanUrlForCheck === '/compare/broker' ||
                     cleanUrlForCheck === '/compare/prop-firm' ||
                     url.startsWith('/compare/broker/') ||
                     url.startsWith('/compare/prop-firm/') ||
                     cleanUrlForCheck === '/signals' ||
                     cleanUrlForCheck === '/subscribe' ||
                     cleanUrlForCheck === '/success' ||
                     url.startsWith('/article/') || 
                     url.startsWith('/broker/') ||
                     url.startsWith('/prop-firm/') ||
                     !!url.match(/^\/(news|broker-news|broker-guides|prop-firm-news|prop-firm-guides|trading-tools)/) ||
                     url.startsWith('/broker-categories/') ||
                     url.startsWith('/prop-firm-categories/');
    
    if (isHtmlRequest && needsSEO) {
      // Pre-fetch page data to inject into HTML
      let pageData: any = null;
      try {
        const cleanUrl = url.split('?')[0];
        
        // Static pages + category archives — load from DB (cached)
        const allStaticSeo = await loadAllStaticPageSeo();
        const staticEntry = allStaticSeo[cleanUrl]                              // e.g. "/brokers"
                         || allStaticSeo[cleanUrl.slice(1)];                   // e.g. "broker-news"
        if (staticEntry) {
          pageData = {
            seoTitle: staticEntry.title,
            seoDescription: staticEntry.description,
            name: staticEntry.title,
            tagline: staticEntry.description,
          };
          // Augment listing pages with entity/article data for SSR body
          if (cleanUrl === '/brokers') {
            const brokers = await db.select({
              name: brokersTable.name, slug: brokersTable.slug,
              rating: brokersTable.rating, regulation: brokersTable.regulation,
            }).from(brokersTable).orderBy(asc(brokersTable.name));
            pageData.entities = brokers;
            pageData.entityPath = 'broker';
            pageData.isListing = true;
          } else if (cleanUrl === '/prop-firms') {
            const firms = await db.select({
              name: propFirmsTable.name, slug: propFirmsTable.slug,
              rating: propFirmsTable.rating,
            }).from(propFirmsTable).orderBy(asc(propFirmsTable.name));
            pageData.entities = firms;
            pageData.entityPath = 'prop-firm';
            pageData.isListing = true;
          } else if (['/broker-guides', '/broker-news', '/prop-firm-news', '/prop-firm-guides', '/trading-tools', '/news'].includes(cleanUrl)) {
            const catSlug = cleanUrl.slice(1);
            const catArticles = await db.select({
              title: articlesTable.title, slug: articlesTable.slug,
              category: articlesTable.category, publishedAt: articlesTable.publishedAt,
            }).from(articlesTable)
              .where(and(eq(articlesTable.status, 'published'), eq(articlesTable.category, catSlug)))
              .orderBy(desc(articlesTable.publishedAt))
              .limit(40);
            pageData.articles = catArticles;
            pageData.catSlug = catSlug;
            pageData.isCategoryArchive = true;
            if (cleanUrl.startsWith('/broker')) {
              const brokers = await db.select({ name: brokersTable.name, slug: brokersTable.slug })
                .from(brokersTable).orderBy(asc(brokersTable.name)).limit(15);
              pageData.relatedEntities = brokers;
              pageData.entityPath = 'broker';
            } else if (cleanUrl.startsWith('/prop-firm')) {
              const firms = await db.select({ name: propFirmsTable.name, slug: propFirmsTable.slug })
                .from(propFirmsTable).orderBy(asc(propFirmsTable.name)).limit(15);
              pageData.relatedEntities = firms;
              pageData.entityPath = 'prop-firm';
            }
          }
        } else if (url.startsWith('/broker/')) {
          const slug = url.replace('/broker/', '').split('?')[0];
          const ssrKey = `ssr:broker:${slug}`;
          pageData = apiCache.get(ssrKey);
          if (!pageData || apiCache.isStale(ssrKey)) {
            const [dbBroker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
            if (dbBroker) {
              pageData = {
                seoTitle: (dbBroker as any).seoTitle || null,
                seoDescription: (dbBroker as any).seoDescription || null,
                name: dbBroker.name,
                tagline: dbBroker.tagline || "",
                rating: dbBroker.rating?.toString() || "",
                regulation: dbBroker.regulation || "",
                minDeposit: (dbBroker as any).minDeposit || "",
                maxLeverage: (dbBroker as any).maxLeverage || "",
                spreadFrom: (dbBroker as any).spreadFrom || "",
                platforms: (dbBroker as any).platforms || "",
                paymentMethods: (dbBroker as any).paymentMethods || "",
                headquarters: (dbBroker as any).headquarters || "",
                yearFounded: (dbBroker as any).yearFounded || "",
                highlights: ((dbBroker as any).highlights || []).join(", "),
                pros: (dbBroker as any).pros || [],
                cons: (dbBroker as any).cons || [],
                content: (dbBroker as any).content || "",
                logoUrl: dbBroker.logoUrl || "",
              };
              apiCache.set(ssrKey, pageData, 300, 600);
            }
          }
        } else if (url.startsWith('/prop-firm/')) {
          const slug = url.replace('/prop-firm/', '').split('?')[0];
          const ssrKey = `ssr:prop-firm:${slug}`;
          pageData = apiCache.get(ssrKey);
          if (!pageData || apiCache.isStale(ssrKey)) {
            const [dbFirm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
            if (dbFirm) {
              pageData = {
                seoTitle: (dbFirm as any).seoTitle || null,
                seoDescription: (dbFirm as any).seoDescription || null,
                name: dbFirm.name,
                tagline: dbFirm.tagline || "",
                rating: dbFirm.rating?.toString() || "",
                profitSplit: (dbFirm as any).profitSplit || "",
                maxFundingSize: (dbFirm as any).maxFundingSize || "",
                evaluationFee: (dbFirm as any).evaluationFee || "",
                maxDrawdown: (dbFirm as any).maxDrawdown || "",
                headquarters: (dbFirm as any).headquarters || "",
                payoutMethods: Array.isArray((dbFirm as any).payoutMethods)
                  ? ((dbFirm as any).payoutMethods as string[]).join(', ')
                  : (dbFirm as any).payoutMethods || "",
                platformsList: Array.isArray((dbFirm as any).platformsList)
                  ? ((dbFirm as any).platformsList as string[]).join(', ')
                  : (dbFirm as any).platformsList || "",
                instruments: Array.isArray((dbFirm as any).instruments)
                  ? ((dbFirm as any).instruments as string[]).join(', ')
                  : (dbFirm as any).instruments || "",
                support: (dbFirm as any).support || "",
                totalUsers: (dbFirm as any).totalUsers || "",
                highlights: ((dbFirm as any).highlights || []).join(", "),
                pros: (dbFirm as any).pros || [],
                cons: (dbFirm as any).cons || [],
                content: (dbFirm as any).content || "",
                logoUrl: dbFirm.logoUrl || "",
              };
              apiCache.set(ssrKey, pageData, 300, 600);
            }
          }
        } else if (cleanUrl === '/compare/broker') {
          const ssrKey = 'ssr:comparison-hub:broker';
          pageData = apiCache.get(ssrKey);
          if (!pageData || apiCache.isStale(ssrKey)) {
            const hubComps = await db.select({
              slug: comparisonsTable.slug,
              entityAName: comparisonsTable.entityAName,
              entityBName: comparisonsTable.entityBName,
            }).from(comparisonsTable)
              .where(and(
                inArray(comparisonsTable.status, ['published', 'updated']),
                eq(comparisonsTable.entityType, 'broker')
              ))
              .orderBy(desc(comparisonsTable.updatedAt))
              .limit(150);
            pageData = {
              seoTitle: 'Broker Comparisons — Side-by-Side Forex Broker Analysis | EntryLab',
              seoDescription: 'Compare forex brokers head-to-head across regulation, fees, platforms, spreads and more. In-depth broker comparisons to help you choose the right account.',
              name: 'Broker Comparisons',
              isComparisonHub: true,
              entityPath: 'broker',
              comparisons: hubComps,
            };
            apiCache.set(ssrKey, pageData, 300, 600);
          }
        } else if (cleanUrl === '/compare/prop-firm') {
          const ssrKey = 'ssr:comparison-hub:prop-firm';
          pageData = apiCache.get(ssrKey);
          if (!pageData || apiCache.isStale(ssrKey)) {
            const hubComps = await db.select({
              slug: comparisonsTable.slug,
              entityAName: comparisonsTable.entityAName,
              entityBName: comparisonsTable.entityBName,
            }).from(comparisonsTable)
              .where(and(
                inArray(comparisonsTable.status, ['published', 'updated']),
                eq(comparisonsTable.entityType, 'prop_firm')
              ))
              .orderBy(desc(comparisonsTable.updatedAt))
              .limit(150);
            pageData = {
              seoTitle: 'Prop Firm Comparisons — Find the Best Funded Trader Programme | EntryLab',
              seoDescription: 'Compare the top prop trading firms side by side. Challenges, profit splits, drawdown limits and payouts — all analysed so you can find the best funded account.',
              name: 'Prop Firm Comparisons',
              isComparisonHub: true,
              entityPath: 'prop-firm',
              comparisons: hubComps,
            };
            apiCache.set(ssrKey, pageData, 300, 600);
          }
        } else if (url.startsWith('/compare/broker/') || url.startsWith('/compare/prop-firm/')) {
          // Comparison pages: /compare/broker/:slug or /compare/prop-firm/:slug
          const compSlug = url.replace(/^\/compare\/(broker|prop-firm)\//, '').split('?')[0];
          const compEntityType = url.startsWith('/compare/broker/') ? 'broker' : 'prop_firm';
          const ssrKey = `ssr:comparison:${compSlug}`;
          pageData = apiCache.get(ssrKey);
          if (!pageData || apiCache.isStale(ssrKey)) {
            const [comp] = await db.select().from(comparisonsTable)
              .where(and(eq(comparisonsTable.slug, compSlug), eq(comparisonsTable.entityType, compEntityType)));
            if (comp && (comp.status === 'published' || comp.status === 'updated')) {
              const winnerName = comp.overallWinnerId === comp.entityAId
                ? comp.entityAName
                : comp.overallWinnerId === comp.entityBId
                ? comp.entityBName
                : null;
              // categoryWinners is stored as an object keyed by category, convert to array
              const rawWinners = comp.categoryWinners as Record<string, any> | any[] | null;
              const winnersArr: any[] = Array.isArray(rawWinners)
                ? rawWinners
                : rawWinners && typeof rawWinners === 'object'
                ? Object.values(rawWinners)
                : [];
              const faqArr: any[] = Array.isArray(comp.faqData) ? comp.faqData : [];
              pageData = {
                seoTitle: `${comp.entityAName} vs ${comp.entityBName} Compared (2026) | EntryLab`,
                seoDescription: winnerName
                  ? `${comp.entityAName} vs ${comp.entityBName}: ${winnerName} comes out on top in our in-depth comparison of regulation, fees, platforms and more.`
                  : `${comp.entityAName} vs ${comp.entityBName} — an in-depth comparison of regulation, fees, platforms and more to help you choose the right account.`,
                name: `${comp.entityAName} vs ${comp.entityBName}`,
                entityAName: comp.entityAName,
                entityBName: comp.entityBName,
                winnerName,
                overallScore: comp.overallScore,
                categoryWinners: winnersArr,
                faqData: faqArr,
                publishedAt: comp.publishedAt,
                updatedAt: comp.updatedAt,
                isComparison: true,
              };
              apiCache.set(ssrKey, pageData, 300, 600);
            }
          }
        } else if (url.match(/\/[^/]+\/[^/]+$/)) {
          // Article format: /category/slug
          const parts = url.split('/').filter(Boolean);
          if (parts.length === 2) {
            const slug = parts[1].split('?')[0];
            const ssrKey = `ssr:article:${slug}`;
            pageData = apiCache.get(ssrKey);
            if (!pageData || apiCache.isStale(ssrKey)) {
              const [dbArticle] = await db.select().from(articlesTable)
                .where(and(eq(articlesTable.slug, slug), eq(articlesTable.status, "published")));
              if (dbArticle) {
                pageData = articleToApi(dbArticle);
                apiCache.set(ssrKey, pageData, 300, 600);
              }
            }
          }
        }
      } catch (error) {
        console.error('[SEO] Failed to fetch page data:', error);
      }
      
      // Wrap res.end and res.send to intercept HTML response
      // Use a flag to prevent double-injection: res.send (production) internally calls
      // res.end, so without the flag injectSEO would run twice on the same response.
      const originalEnd = res.end;
      const originalSend = res.send;
      let seoInjected = false;
      
      // Sanitize HTML for SSR injection — strips dangerous tags but keeps semantic structure
      function sanitizeForSSR(rawHtml: string): string {
        return rawHtml
          // Remove script, style, iframe, noscript blocks entirely (including content)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
          // Strip all inline style attributes
          .replace(/\s+style="[^"]*"/gi, '')
          .replace(/\s+style='[^']*'/gi, '')
          // Strip class attributes (will conflict with site CSS)
          .replace(/\s+class="[^"]*"/gi, '')
          .replace(/\s+class='[^']*'/gi, '')
          // Strip data-* attributes
          .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
          // Strip onclick and other event handlers
          .replace(/\s+on\w+="[^"]*"/gi, '')
          // Keep only safe tags — strip everything else not in whitelist
          .replace(/<(?!\/?(?:h[1-6]|p|ul|ol|li|strong|em|b|i|a|br|table|thead|tbody|tr|th|td|blockquote|figure|figcaption|dl|dt|dd)\b)[^>]+>/gi, '')
          // Rewrite old WordPress URL paths to current EntryLab routes
          .replace(/href="https?:\/\/(?:entrylab\.io)?\/popular-broker\//gi, 'href="/broker/')
          .replace(/href="\/popular-broker\//gi, 'href="/broker/')
          // Clean up multiple blank lines
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      // Build SSR body content from DB data
      function buildSSRContent(pageData: any, pageUrl: string): string {
        if (!pageData) return '';

        const cleanUrl = pageUrl.split('?')[0];
        const title = (pageData.name || pageData.title || '').replace(/<[^>]+>/g, '');
        const excerpt = (pageData.tagline || pageData.excerpt || '').replace(/<[^>]+>/g, '').trim();

        let html = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}#ssr-content dt{font-weight:600;color:#555}#ssr-content dd{color:#222}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}#ssr-nav{padding:16px;border-top:1px solid #eee;margin-top:24px}#ssr-nav ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}#ssr-nav a{color:#2bb32a;text-decoration:none;font-size:0.9rem}</style>`;
        html += `<div id="ssr-content">`;

        // H1 title
        if (title) {
          html += `<h1>${title}</h1>`;
        }

        // Excerpt / description
        if (excerpt) {
          html += `<p>${excerpt}</p>`;
        }

        const cleanStr = (val: any): string =>
          val ? String(val)
            .replace(/<[^>]+>/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .trim()
          : '';

        // Broker-specific fields
        if (cleanUrl.startsWith('/broker/')) {
          const fields: [string, any][] = [
            ['Rating', pageData.rating],
            ['Regulation', pageData.regulation],
            ['Minimum Deposit', pageData.minDeposit],
            ['Maximum Leverage', pageData.maxLeverage],
            ['Spreads From', pageData.spreadFrom],
            ['Trading Platforms', pageData.platforms],
            ['Deposit Methods', pageData.paymentMethods],
            ['Founded', pageData.yearFounded],
            ['Headquarters', pageData.headquarters],
          ].filter(([, v]) => v);

          if (fields.length > 0) {
            html += `<dl>`;
            for (const [label, value] of fields) {
              html += `<dt>${label}</dt><dd>${String(value)}</dd>`;
            }
            html += `</dl>`;
          }

          const intro = cleanStr(pageData.tagline);
          const highlights = cleanStr(pageData.highlights);

          if (intro) html += `<h2>Overview</h2><p>${intro}</p>`;
          if (highlights) html += `<p>${highlights}</p>`;

          const pros = pageData.pros;
          const cons = pageData.cons;
          if (pros) {
            html += `<h2>Pros</h2><ul>`;
            const prosList = Array.isArray(pros) ? pros : String(pros).split(/[,\n]+/);
            prosList.forEach((p: any) => { const t = cleanStr(p); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }
          if (cons) {
            html += `<h2>Cons</h2><ul>`;
            const consList = Array.isArray(cons) ? cons : String(cons).split(/[,\n]+/);
            consList.forEach((c: any) => { const t = cleanStr(c); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }

          if (pageData.content) {
            const bodyHtml = sanitizeForSSR(pageData.content).substring(0, 60000);
            html += bodyHtml;
          }
        }

        // Prop firm-specific fields
        else if (cleanUrl.startsWith('/prop-firm/')) {
          const fields: [string, any][] = [
            ['Rating', pageData.rating],
            ['Profit Split', pageData.profitSplit],
            ['Max Funding Size', pageData.maxFundingSize],
            ['Evaluation Fee', pageData.evaluationFee],
            ['Maximum Drawdown', pageData.maxDrawdown],
            ['Trading Platforms', pageData.platformsList],
            ['Tradable Instruments', pageData.instruments],
            ['Payout Methods', pageData.payoutMethods],
            ['Customer Support', pageData.support],
            ['Total Users', pageData.totalUsers],
            ['Headquarters', pageData.headquarters],
          ].filter(([, v]) => v);

          if (fields.length > 0) {
            html += `<dl>`;
            for (const [label, value] of fields) {
              html += `<dt>${label}</dt><dd>${String(value)}</dd>`;
            }
            html += `</dl>`;
          }

          const intro = cleanStr(pageData.tagline);
          const highlights = cleanStr(pageData.highlights);

          if (intro) html += `<h2>Overview</h2><p>${intro}</p>`;
          if (highlights) html += `<p>${highlights}</p>`;

          const pros = pageData.pros;
          const cons = pageData.cons;
          if (pros) {
            html += `<h2>Pros</h2><ul>`;
            const prosList = Array.isArray(pros) ? pros : String(pros).split(/[,\n]+/);
            prosList.forEach((p: any) => { const t = cleanStr(p); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }
          if (cons) {
            html += `<h2>Cons</h2><ul>`;
            const consList = Array.isArray(cons) ? cons : String(cons).split(/[,\n]+/);
            consList.forEach((c: any) => { const t = cleanStr(c); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }

          if (pageData.content) {
            const bodyHtml = sanitizeForSSR(pageData.content).substring(0, 60000);
            html += bodyHtml;
          }
        }

        // Comparison hub pages: /compare/broker, /compare/prop-firm
        else if (pageData.isComparisonHub) {
          if (pageData.seoDescription) html += `<p>${pageData.seoDescription}</p>`;
          const hubComps = Array.isArray(pageData.comparisons) ? pageData.comparisons : [];
          if (hubComps.length > 0) {
            html += `<h2>All ${pageData.name}</h2><ul>`;
            for (const comp of hubComps) {
              if (comp.slug && comp.entityAName && comp.entityBName) {
                html += `<li><a href="/compare/${pageData.entityPath}/${comp.slug}">${comp.entityAName} vs ${comp.entityBName}</a></li>`;
              }
            }
            html += `</ul>`;
          }
        }

        // Individual comparison pages
        else if (pageData.isComparison) {
          if (pageData.winnerName) {
            html += `<p><strong>Overall winner: ${pageData.winnerName}</strong>${pageData.overallScore ? ` — score: ${pageData.overallScore}` : ''}</p>`;
          }
          const date = pageData.updatedAt
            ? new Date(pageData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          if (date) html += `<p>Last updated: ${date}</p>`;

          if (pageData.seoDescription) html += `<p>${pageData.seoDescription}</p>`;

          // Category-by-category breakdown (categoryWinners is an array after conversion)
          const winners = Array.isArray(pageData.categoryWinners) ? pageData.categoryWinners : [];
          if (winners.length > 0) {
            html += `<h2>Head-to-Head Category Breakdown</h2><ul>`;
            for (const cat of winners) {
              const label = cat.label || cat.category || '';
              const winnerName = cat.winnerName || cat.winnerSlug || '';
              const scoreA = cat.scoreA !== undefined ? cat.scoreA : '';
              const scoreB = cat.scoreB !== undefined ? cat.scoreB : '';
              const scoreStr = scoreA !== '' && scoreB !== ''
                ? ` (${pageData.entityAName}: ${scoreA} — ${pageData.entityBName}: ${scoreB})`
                : '';
              if (label) html += `<li><strong>${label}:</strong> ${winnerName} wins${scoreStr}</li>`;
              if (cat.text) html += `<li style="list-style:none;padding-left:1em;color:#555;font-size:0.9em">${cleanStr(cat.text)}</li>`;
            }
            html += `</ul>`;
          }

          // FAQ section
          const faqs = Array.isArray(pageData.faqData) ? pageData.faqData : [];
          if (faqs.length > 0) {
            html += `<h2>Frequently Asked Questions</h2>`;
            for (const faq of faqs) {
              if (faq.q && faq.a) {
                html += `<h3>${cleanStr(faq.q)}</h3><p>${cleanStr(faq.a)}</p>`;
              }
            }
          }
        }

        // Listing pages: /brokers, /prop-firms
        else if (pageData.isListing && Array.isArray(pageData.entities)) {
          if (pageData.tagline) html += `<p>${cleanStr(pageData.tagline)}</p>`;
          html += `<ul>`;
          for (const e of pageData.entities) {
            const rating = e.rating ? ` — Rating: ${e.rating}/5` : '';
            const reg = e.regulation ? ` — ${e.regulation}` : '';
            html += `<li><a href="/${pageData.entityPath}/${e.slug}">${e.name}</a>${rating}${reg}</li>`;
          }
          html += `</ul>`;
        }

        // Category archive pages: /broker-guides, /broker-news, etc.
        else if (pageData.isCategoryArchive) {
          if (pageData.tagline) html += `<p>${cleanStr(pageData.tagline)}</p>`;
          const arts = Array.isArray(pageData.articles) ? pageData.articles : [];
          if (arts.length > 0) {
            html += `<h2>Latest Articles</h2><ul>`;
            for (const art of arts) {
              const date = art.publishedAt ? ` — ${new Date(art.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : '';
              html += `<li><a href="/${pageData.catSlug}/${art.slug}">${art.title}</a>${date}</li>`;
            }
            html += `</ul>`;
          }
          const rels = Array.isArray(pageData.relatedEntities) ? pageData.relatedEntities : [];
          if (rels.length > 0) {
            const entityLabel = pageData.entityPath === 'broker' ? 'Brokers Covered' : 'Prop Firms Covered';
            html += `<h2>${entityLabel}</h2><ul>`;
            for (const e of rels) {
              html += `<li><a href="/${pageData.entityPath}/${e.slug}">${e.name}</a></li>`;
            }
            html += `</ul>`;
          }
        }

        // Article pages
        else {
          const author = pageData.author;
          const date = pageData.publishedAt ? new Date(pageData.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

          if (author || date) {
            html += `<p><small>${[author, date].filter(Boolean).join(' · ')}</small></p>`;
          }

          if (pageData.content) {
            const bodyHtml = sanitizeForSSR(pageData.content).substring(0, 30000);
            html += bodyHtml;
          }
        }

        html += `</div>`;
        return html;
      }

      const injectSEO = async (html: string): Promise<string> => {
        let modifiedHtml = html;
        const cleanUrl = url.split('?')[0];
        
        // Inject structured data
        try {
          const structuredData = await generateStructuredData(url);
          modifiedHtml = modifiedHtml.replace('<script id="ssr-structured-data"></script>', structuredData);
        } catch (error) {
          console.error('[SEO] Structured data error:', error);
        }
        
        // Inject title and meta tags if we have page data
        if (pageData) {
          // Get SEO title from DB seoTitle field or generate from name
          const seoTitle = pageData.seoTitle ||
                          `${(pageData.name || pageData.title || '').replace(/<[^>]+>/g, '')} | EntryLab`;

          const rawName = (pageData.name || pageData.title || '').replace(/<[^>]+>/g, '');

          // Build rich fallback description from DB fields
          let generatedDescription = '';
          if (cleanUrl.startsWith('/broker/')) {
            const parts = [
              rawName ? `Read our expert ${rawName} review.` : '',
              pageData.rating ? `Rating: ${pageData.rating}/5.` : '',
              pageData.regulation ? `Regulated by ${pageData.regulation}.` : '',
              pageData.minDeposit ? `Min deposit: ${pageData.minDeposit}.` : '',
              pageData.maxLeverage ? `Leverage up to ${pageData.maxLeverage}.` : '',
            ].filter(Boolean).join(' ');
            generatedDescription = parts || `${rawName} broker review — ratings, fees, regulation, and trading conditions on EntryLab.`;
          } else if (cleanUrl.startsWith('/prop-firm/')) {
            const parts = [
              rawName ? `Read our ${rawName} review.` : '',
              pageData.rating ? `Rating: ${pageData.rating}/5.` : '',
              pageData.profitSplit ? `Profit split: ${pageData.profitSplit}.` : '',
              pageData.maxFundingSize ? `Max funding: ${pageData.maxFundingSize}.` : '',
              pageData.maxDrawdown ? `Max drawdown: ${pageData.maxDrawdown}.` : '',
            ].filter(Boolean).join(' ');
            generatedDescription = parts || `${rawName} prop firm review — payouts, rules, evaluation process on EntryLab.`;
          }

          const seoDescription = pageData.seoDescription ||
                                (pageData.excerpt || '').replace(/<[^>]*>/g, '').substring(0, 160) ||
                                (pageData.tagline || '').replace(/<[^>]*>/g, '').substring(0, 160) ||
                                generatedDescription;
          
          // Inject title tag
          if (seoTitle) {
            modifiedHtml = modifiedHtml.replace(
              /<title>[^<]*<\/title>/,
              `<title>${seoTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`
            );
          }
          
          // Inject/update meta description
          if (seoDescription) {
            const cleanDesc = seoDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            if (modifiedHtml.includes('<meta name="description"')) {
              modifiedHtml = modifiedHtml.replace(
                /<meta name="description" content="[^"]*"/,
                `<meta name="description" content="${cleanDesc}"`
              );
            } else {
              modifiedHtml = modifiedHtml.replace(
                '</head>',
                `  <meta name="description" content="${cleanDesc}">\n  </head>`
              );
            }
          }
          
          // Inject Open Graph tags + canonical
          const ogTitle = seoTitle.replace(/"/g, '&quot;');
          const ogDesc = seoDescription.replace(/"/g, '&quot;');
          // Ensure OG image is always an absolute URL — relative paths break social sharing
          const rawOgImage = pageData.featuredImage || pageData.logoUrl || 'https://entrylab.io/assets/entrylab-logo-green.png';
          const ogImage = rawOgImage.startsWith('/') ? `https://entrylab.io${rawOgImage}` : rawOgImage;
          const ogUrl = `https://entrylab.io${cleanUrl}`;
          
          const ogType = cleanUrl.match(/^\/[^/]+\/[^/]+$/) && !cleanUrl.startsWith('/broker/') && !cleanUrl.startsWith('/prop-firm/')
            ? 'article'
            : 'website';

          // Article-specific OG tags (og:article:* namespace)
          const catLabelMap: Record<string, string> = {
            'broker-news': 'Broker News', 'prop-firm-news': 'Prop Firm News',
            'broker-guides': 'Broker Guides', 'prop-firm-guides': 'Prop Firm Guides',
            'trading-tools': 'Trading Tools', 'news': 'News',
          };
          let articleOgTags = '';
          if (ogType === 'article' && pageData) {
            const pub = pageData.publishedAt ? new Date(pageData.publishedAt).toISOString() : '';
            const mod = pageData.updatedAt ? new Date(pageData.updatedAt).toISOString() : pub;
            const catRaw = pageData.category || '';
            const sec = catLabelMap[catRaw] || catRaw;
            const auth = pageData.author || 'EntryLab Editorial Team';
            if (pub) articleOgTags += `\n    <meta property="article:published_time" content="${pub}">`;
            if (mod) articleOgTags += `\n    <meta property="article:modified_time" content="${mod}">`;
            if (sec) articleOgTags += `\n    <meta property="article:section" content="${sec}">`;
            if (auth) articleOgTags += `\n    <meta property="article:author" content="${auth}">`;
          }

          const twitterCreator = ogType === 'article' ? '\n    <meta name="twitter:creator" content="@entrylabio">' : '';

          const ogTags = `
    <!-- Open Graph / SEO -->
    <meta property="og:locale" content="en_US">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="EntryLab">${articleOgTags}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@entrylabio">${twitterCreator}
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDesc}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ogUrl}">
    <link rel="alternate" type="application/rss+xml" title="EntryLab Forex News" href="https://entrylab.io/feed.xml">`;
          
          modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}\n  </head>`);

          // T001: Inject real body content so Googlebot sees text on first-pass crawl
          try {
            const ssrContent = buildSSRContent(pageData, url);
            if (ssrContent) {
              modifiedHtml = modifiedHtml.replace('<div id="root">', `<div id="root">${ssrContent}`);
            }
          } catch (err) {
            console.error('[SEO] SSR content injection error:', err);
          }

          // FAQ JSON-LD for broker review pages — used by AI tools (Perplexity, ChatGPT) for cited Q&A
          if (cleanUrl.startsWith('/broker/') && pageData.name) {
            try {
              const brokerName = pageData.name.replace(/<[^>]+>/g, '');
              const faqItems: Array<{ q: string; a: string }> = [];

              if (pageData.regulation) faqItems.push({
                q: `Is ${brokerName} regulated?`,
                a: (pageData.regulation === 'No Regulation' || pageData.regulation === 'Unregulated')
                  ? `${brokerName} is not regulated by a major financial authority and operates as an offshore broker.`
                  : `${brokerName} is regulated by ${pageData.regulation}.`
              });
              if (pageData.minDeposit) faqItems.push({
                q: `What is the minimum deposit for ${brokerName}?`,
                a: `The minimum deposit for ${brokerName} is ${pageData.minDeposit}.`
              });
              if (pageData.maxLeverage) faqItems.push({
                q: `What leverage does ${brokerName} offer?`,
                a: `${brokerName} offers leverage up to ${pageData.maxLeverage}.`
              });
              if (pageData.platforms) faqItems.push({
                q: `What trading platforms does ${brokerName} support?`,
                a: `${brokerName} supports: ${pageData.platforms}.`
              });
              if (pageData.rating) faqItems.push({
                q: `What is ${brokerName}'s rating on EntryLab?`,
                a: `${brokerName} has an overall rating of ${pageData.rating} out of 5 on EntryLab.`
              });
              if (pageData.spreadFrom) faqItems.push({
                q: `What are ${brokerName}'s spreads?`,
                a: `${brokerName} offers spreads from ${pageData.spreadFrom}.`
              });
              if (pageData.paymentMethods) faqItems.push({
                q: `What deposit methods does ${brokerName} accept?`,
                a: `${brokerName} accepts the following deposit methods: ${pageData.paymentMethods}.`
              });

              if (faqItems.length >= 2) {
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqItems.map(item => ({
                    "@type": "Question",
                    "name": item.q,
                    "acceptedAnswer": { "@type": "Answer", "text": item.a }
                  }))
                };
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n  </head>`
                );
              }
            } catch (err) {
              console.error('[SEO] FAQ schema injection error:', err);
            }
          }

          // FAQ JSON-LD for prop-firm review pages
          if (cleanUrl.startsWith('/prop-firm/') && pageData.name) {
            try {
              const firmName = pageData.name.replace(/<[^>]+>/g, '');
              const faqItems: Array<{ q: string; a: string }> = [];

              if (pageData.profitSplit) faqItems.push({
                q: `What is ${firmName}'s profit split?`,
                a: `${firmName} offers a profit split of ${pageData.profitSplit}.`
              });
              if (pageData.evaluationFee) faqItems.push({
                q: `How much does the ${firmName} evaluation cost?`,
                a: `The ${firmName} evaluation fee starts from ${pageData.evaluationFee}.`
              });
              if (pageData.maxFundingSize) faqItems.push({
                q: `What is the maximum funding ${firmName} provides?`,
                a: `${firmName} provides a maximum funded account size of ${pageData.maxFundingSize}.`
              });
              if (pageData.platformsList) faqItems.push({
                q: `What trading platforms does ${firmName} support?`,
                a: `${firmName} supports: ${Array.isArray(pageData.platformsList) ? pageData.platformsList.join(', ') : pageData.platformsList}.`
              });
              if (pageData.rating) faqItems.push({
                q: `What is ${firmName}'s rating on EntryLab?`,
                a: `${firmName} has an overall rating of ${pageData.rating} out of 5 on EntryLab.`
              });
              if (pageData.countries && Array.isArray(pageData.countries) && pageData.countries.length > 0) faqItems.push({
                q: `Is ${firmName} available in my country?`,
                a: `${firmName} is available in: ${pageData.countries.slice(0, 8).join(', ')}${pageData.countries.length > 8 ? ', and more' : ''}.`
              });

              if (faqItems.length >= 2) {
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqItems.map(item => ({
                    "@type": "Question",
                    "name": item.q,
                    "acceptedAnswer": { "@type": "Answer", "text": item.a }
                  }))
                };
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n  </head>`
                );
              }
            } catch (err) {
              console.error('[SEO] Prop-firm FAQ schema injection error:', err);
            }
          }

          // FAQ JSON-LD for comparison pages — uses pre-generated faqData from the comparison engine
          if (cleanUrl.startsWith('/compare/') && cleanUrl.split('/').length === 4 && pageData.faqData) {
            try {
              const rawFaq = Array.isArray(pageData.faqData)
                ? pageData.faqData
                : (typeof pageData.faqData === 'string' ? JSON.parse(pageData.faqData) : []);
              const faqItems = rawFaq.filter((f: any) => f.q && f.a);

              if (faqItems.length >= 2) {
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqItems.map((item: any) => ({
                    "@type": "Question",
                    "name": item.q,
                    "acceptedAnswer": { "@type": "Answer", "text": item.a }
                  }))
                };
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n  </head>`
                );
              }
            } catch (err) {
              console.error('[SEO] Comparison FAQ schema injection error:', err);
            }
          }

        } else {
          // T002: For pages without pageData (homepage, /brokers, /prop-firms, category archives)
          // inject canonical + robots so Google doesn't treat query variants as duplicates
          const canonicalUrl = `https://entrylab.io${cleanUrl}`;
          const headTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">`;

          if (!modifiedHtml.includes('<meta name="robots"')) {
            modifiedHtml = modifiedHtml.replace('</head>', `${headTags}\n  </head>`);
          } else if (!modifiedHtml.includes('rel="canonical"')) {
            modifiedHtml = modifiedHtml.replace(
              '</head>',
              `  <link rel="canonical" href="${canonicalUrl}">\n  </head>`
            );
          }

          // Homepage, /brokers, /prop-firms: inject SSR content + internal links for crawlers
          if (cleanUrl === '/') {
            try {
              const homepageDesc = 'EntryLab provides expert forex broker reviews, prop firm analysis, and trading news. Compare brokers by regulation, spreads, leverage, and platforms.';
              const homepageOgImage = 'https://entrylab.io/assets/entrylab-logo-green.png';
              // Inject full OG + Twitter + meta description for homepage
              if (!modifiedHtml.includes('og:title')) {
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <meta property="og:title" content="EntryLab \u2014 Forex Broker Reviews &amp; Trading News">
  <meta property="og:description" content="${homepageDesc}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${homepageOgImage}">
  <meta property="og:url" content="https://entrylab.io/">
  <meta property="og:site_name" content="EntryLab">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@entrylabio">
  <meta name="twitter:title" content="EntryLab \u2014 Forex Broker Reviews &amp; Trading News">
  <meta name="twitter:description" content="${homepageDesc}">
  <meta name="twitter:image" content="${homepageOgImage}">
  <meta name="description" content="${homepageDesc}">
\n  </head>`
                );
              }

              const [allBrokers, allPropFirms, recentPosts] = await Promise.all([
                db.select().from(brokersTable).orderBy(asc(brokersTable.name)),
                db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name)),
                db.select().from(articlesTable)
                  .where(eq(articlesTable.status, 'published'))
                  .orderBy(desc(articlesTable.publishedAt))
                  .limit(50),
              ]);

              // SSR content block with broker ratings (readable by AI crawlers)
              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}#ssr-nav{padding:16px;border-top:1px solid #eee;margin-top:24px}#ssr-nav ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}#ssr-nav a{color:#2bb32a;text-decoration:none;font-size:0.9rem}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>EntryLab — Forex Broker Reviews &amp; Trading News</h1>`;
              ssrHtml += `<p>${homepageDesc}</p>`;

              ssrHtml += `<h2>Top Forex Broker Reviews</h2><ul>`;
              for (const b of allBrokers.slice(0, 20)) {
                if (b.slug && b.name) {
                  ssrHtml += `<li><a href="/broker/${b.slug}">${b.name}</a>${b.rating ? ` — Rating: ${b.rating}/5` : ''}${b.regulation ? ` — ${b.regulation}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul>`;

              ssrHtml += `<h2>Top Prop Firm Reviews</h2><ul>`;
              for (const f of allPropFirms.slice(0, 10)) {
                if (f.slug && f.name) {
                  ssrHtml += `<li><a href="/prop-firm/${f.slug}">${f.name}</a>${f.rating ? ` — Rating: ${f.rating}/5` : ''}</li>`;
                }
              }
              ssrHtml += `</ul>`;

              ssrHtml += `<h2>Latest Broker News</h2><ul>`;
              for (const p of recentPosts.slice(0, 15)) {
                if (p.slug && p.title) {
                  ssrHtml += `<li><a href="/${p.category || 'news'}/${p.slug}">${p.title}</a></li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              // Full nav for link discovery
              let navHtml = `<nav id="ssr-nav" aria-label="Site navigation"><ul>`;
              for (const b of allBrokers) {
                if (b.slug && b.name) navHtml += `<li><a href="/broker/${b.slug}">${b.name}</a></li>`;
              }
              for (const f of allPropFirms) {
                if (f.slug && f.name) navHtml += `<li><a href="/prop-firm/${f.slug}">${f.name}</a></li>`;
              }
              for (const p of recentPosts) {
                if (p.slug && p.title) navHtml += `<li><a href="/${p.category || 'news'}/${p.slug}">${p.title}</a></li>`;
              }
              navHtml += `</ul></nav>`;

              modifiedHtml = modifiedHtml.replace('<div id="root">', `<div id="root">${ssrHtml}${navHtml}`);
              console.log('[SEO] Injected homepage SSR content + nav');
            } catch (err) {
              console.error('[SEO] Homepage SSR injection error:', err);
            }

          } else if (cleanUrl === '/brokers') {
            try {
              const brokers = await db.select().from(brokersTable).orderBy(asc(brokersTable.name));

              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>Forex Broker Reviews</h1>`;
              ssrHtml += `<p>EntryLab reviews forex brokers across regulation, spreads, leverage, platforms, and deposit methods. Compare top regulated and offshore brokers side by side.</p>`;
              ssrHtml += `<ul>`;
              for (const b of brokers) {
                if (b.slug && b.name) {
                  const details = [b.rating ? `Rating: ${b.rating}/5` : '', b.regulation || '', b.minDeposit ? `Min deposit: ${b.minDeposit}` : '', b.maxLeverage ? `Leverage: ${b.maxLeverage}` : ''].filter(Boolean).join(' · ');
                  ssrHtml += `<li><a href="/broker/${b.slug}">${b.name}</a>${details ? ` — ${details}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              modifiedHtml = modifiedHtml.replace('<div id="root">', `<div id="root">${ssrHtml}`);
              console.log('[SEO] Injected /brokers SSR content');
            } catch (err) {
              console.error('[SEO] /brokers SSR injection error:', err);
            }

          } else if (cleanUrl === '/prop-firms') {
            try {
              const firms = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));

              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>Prop Firm Reviews</h1>`;
              ssrHtml += `<p>Compare the best proprietary trading firms. EntryLab reviews evaluation processes, profit splits, drawdown rules, payout speeds, and account sizes for every major prop firm.</p>`;
              ssrHtml += `<ul>`;
              for (const f of firms) {
                if (f.slug && f.name) {
                  const details = [f.rating ? `Rating: ${f.rating}/5` : '', f.profitSplit ? `Profit split: ${f.profitSplit}` : '', f.maxFundingSize ? `Accounts: ${f.maxFundingSize}` : ''].filter(Boolean).join(' · ');
                  ssrHtml += `<li><a href="/prop-firm/${f.slug}">${f.name}</a>${details ? ` — ${details}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              modifiedHtml = modifiedHtml.replace('<div id="root">', `<div id="root">${ssrHtml}`);
              console.log('[SEO] Injected /prop-firms SSR content');
            } catch (err) {
              console.error('[SEO] /prop-firms SSR injection error:', err);
            }

          } else {
            // Category archive pages: /broker-guides, /broker-news, /prop-firm-news, etc.
            const catArchiveMap: Record<string, { label: string; entityType: 'broker' | 'prop_firm' | null }> = {
              '/broker-guides':    { label: 'Broker Guides',      entityType: 'broker' },
              '/broker-news':      { label: 'Broker News',         entityType: 'broker' },
              '/prop-firm-guides': { label: 'Prop Firm Guides',    entityType: 'prop_firm' },
              '/prop-firm-news':   { label: 'Prop Firm News',      entityType: 'prop_firm' },
              '/trading-tools':    { label: 'Trading Tools',       entityType: null },
              '/news':             { label: 'Forex News',          entityType: null },
            };
            const catMeta = catArchiveMap[cleanUrl];
            if (catMeta) {
              try {
                const catSlug = cleanUrl.replace('/', '');
                const [catArticles, relatedEntities] = await Promise.all([
                  db.select().from(articlesTable)
                    .where(and(
                      eq(articlesTable.status, 'published'),
                      eq(articlesTable.category, catSlug)
                    ))
                    .orderBy(desc(articlesTable.publishedAt))
                    .limit(40),
                  catMeta.entityType === 'broker'
                    ? db.select().from(brokersTable).orderBy(asc(brokersTable.name)).limit(20)
                    : catMeta.entityType === 'prop_firm'
                    ? db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name)).limit(20)
                    : Promise.resolve([]),
                ]);

                const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}#ssr-content a{color:#2bb32a;text-decoration:none}</style>`;
                let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
                ssrHtml += `<h1>${catMeta.label}</h1>`;

                if (catArticles.length > 0) {
                  ssrHtml += `<h2>Latest Articles</h2><ul>`;
                  for (const art of catArticles) {
                    if (art.slug && art.title) {
                      const date = art.publishedAt ? ` — ${new Date(art.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : '';
                      ssrHtml += `<li><a href="/${catSlug}/${art.slug}">${art.title}</a>${date}</li>`;
                    }
                  }
                  ssrHtml += `</ul>`;
                }

                if (Array.isArray(relatedEntities) && relatedEntities.length > 0) {
                  const entityLabel = catMeta.entityType === 'broker' ? 'Brokers Covered' : 'Prop Firms Covered';
                  const entityPath = catMeta.entityType === 'broker' ? 'broker' : 'prop-firm';
                  ssrHtml += `<h2>${entityLabel}</h2><ul>`;
                  for (const e of relatedEntities as any[]) {
                    if (e.slug && e.name) {
                      ssrHtml += `<li><a href="/${entityPath}/${e.slug}">${e.name}</a></li>`;
                    }
                  }
                  ssrHtml += `</ul>`;
                }

                ssrHtml += `</div>`;
                modifiedHtml = modifiedHtml.replace('<div id="root">', `<div id="root">${ssrHtml}`);
                console.log(`[SEO] Injected ${cleanUrl} category archive SSR content (${catArticles.length} articles)`);
              } catch (err) {
                console.error(`[SEO] Category archive SSR injection error for ${cleanUrl}:`, err);
              }
            }
          }
        }
        
        return modifiedHtml;
      }
      
      // Intercept res.end (used by Vite dev — chunk can be a Buffer or string)
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        // Skip if already injected (res.send in production calls res.end internally)
        if (seoInjected) {
          return originalEnd.call(res, chunk, encoding, callback);
        }

        let htmlStr: string | null = null;
        if (typeof chunk === 'string') {
          htmlStr = chunk;
        } else if (Buffer.isBuffer(chunk)) {
          htmlStr = chunk.toString('utf8');
        }

        if (htmlStr && (htmlStr.includes('<html') || htmlStr.includes('<!DOCTYPE'))) {
          seoInjected = true;
          console.log('[SEO] Injecting SEO tags into HTML');
          injectSEO(htmlStr)
            .then(modifiedHtml => {
              console.log('[SEO] Successfully injected SEO tags');
              if (!res.getHeader('Cache-Control')) {
                res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
              }
              originalEnd.call(res, modifiedHtml, encoding, callback);
            })
            .catch(error => {
              console.error('[SEO] Injection error:', error);
              originalEnd.call(res, chunk, encoding, callback);
            });
        } else {
          originalEnd.call(res, chunk, encoding, callback);
        }
        return res;
      };
      
      // Intercept res.send (used by static serving in production)
      res.send = function(data: any) {
        // Skip if already injected
        if (seoInjected) {
          return originalSend.call(res, data);
        }

        if (typeof data === 'string' && (data.includes('<html') || data.includes('<!DOCTYPE'))) {
          seoInjected = true;
          console.log('[SEO] Injecting SEO tags into HTML (send)');
          injectSEO(data)
            .then(modifiedHtml => {
              console.log('[SEO] Successfully injected SEO tags (send)');
              res.type('html');
              if (!res.getHeader('Cache-Control')) {
                res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
              }
              originalSend.call(res, modifiedHtml);
            })
            .catch(error => {
              console.error('[SEO] Injection error (send):', error);
              originalSend.call(res, data);
            });
        } else {
          originalSend.call(res, data);
        }
        return res;
      };
    }
    
    next();
  });

  // Email capture endpoint
  app.post('/api/capture-email', async (req, res) => {
    try {
      const { 
        email, 
        source, 
        utm_campaign, 
        utm_source, 
        utm_medium,
        utm_content,
        utm_term,
        gclid,
        fbclid
      } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Get IP address from request
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() 
        || req.socket.remoteAddress 
        || '';

      const userAgent = req.headers['user-agent'] || '';

      // Find or create user
      let [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        [user] = await db.insert(signalUsers)
          .values({ email })
          .returning();
      }

      // Log email capture for analytics
      await db.insert(emailCaptures).values({
        email,
        source: source || 'direct',
        utmCampaign: utm_campaign,
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmContent: utm_content,
        utmTerm: utm_term,
        gclid: gclid || null,
        fbclid: fbclid || null,
        ipAddress,
        userAgent,
      });

      console.log(`Email captured: ${email} from ${source || 'direct'}`);

      const FALLBACK_CHANNEL_LINK = 'https://t.me/entrylabs';
      let channelLink = FALLBACK_CHANNEL_LINK;

      // Get dynamic invite link from PromoStack
      try {
        const { promostackClient } = await import('./promostackClient');
        const inviteLink = await promostackClient.addFreeUser({
          email,
          name: '',
          source: source || 'signals_landing',
          utmSource: utm_source,
          utmMedium: utm_medium,
          utmCampaign: utm_campaign,
          utmContent: utm_content,
          utmTerm: utm_term,
          gclid: gclid || '',
          fbclid: fbclid || '',
        });
        if (inviteLink) {
          channelLink = inviteLink;
        }
        console.log(`PromoStack free lead: ${email} (link: ${channelLink}, utm_source: ${utm_source}, utm_campaign: ${utm_campaign})`);
      } catch (promostackError) {
        console.error('PromoStack tracking error:', promostackError);
      }

      // Send welcome email with the invite link (non-blocking, with retry)
      try {
        const { getUncachableResendClient } = await import('./resendClient');
        const { getFreeChannelEmailHtml } = await import('./emailTemplates');
        const { sendEmailWithRetry } = await import('./emailUtils');
        
        const { fromEmail } = await getUncachableResendClient();
        const emailHtml = getFreeChannelEmailHtml(channelLink);
        
        const result = await sendEmailWithRetry({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: 'Welcome to EntryLab - Join Our Free Channel!',
          html: emailHtml,
        });
        
        if (result.success) {
          console.log(`Free channel welcome email sent to: ${email}`);
        } else {
          console.error(`Free channel email failed for ${email}:`, result.error);
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      res.json({
        success: true,
        redirect_url: channelLink,
        message: 'Success! Click the button to join our free Telegram channel.',
      });

    } catch (error: any) {
      console.error('Email capture error:', error);
      res.status(500).json({ error: 'Failed to process email' });
    }
  });

  // Free signup endpoint - called when users submit the free signals form
  app.post('/api/free-signup', async (req, res) => {
    try {
      const { email, name, source, gclid, fbclid } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const FALLBACK_LINK = 'https://t.me/entrylabs';
      let channelLink = FALLBACK_LINK;

      try {
        const { promostackClient } = await import('./promostackClient');
        const inviteLink = await promostackClient.addFreeUser({
          email,
          name: name || '',
          source: source || 'Free Gold Signals',
          gclid: gclid || '',
          fbclid: fbclid || '',
        });
        if (inviteLink) {
          channelLink = inviteLink;
        }
        console.log(`Free signup registered: ${email} (link: ${channelLink})`);
      } catch (promostackError) {
        console.error(`PromoStack tracking error for ${email}:`, promostackError);
      }

      res.json({
        success: true,
        message: 'Free signup registered successfully',
        inviteLink: channelLink
      });

    } catch (error: any) {
      console.error('Free signup error:', error);
      res.status(500).json({ error: 'Failed to process free signup' });
    }
  });

  // Create Stripe checkout session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { email, priceId, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid } = req.body;

      if (!email || !priceId) {
        return res.status(400).json({ error: 'Email and price ID required' });
      }

      const stripe = await getUncachableStripeClient();

      // Find or create user
      let [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        [user] = await db.insert(signalUsers)
          .values({ email })
          .returning();
      }

      // Find or create Stripe customer (with validation that customer still exists)
      let customerId = user.stripeCustomerId;
      
      // Verify existing customer still exists in Stripe
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (customerError: any) {
          if (customerError.code === 'resource_missing') {
            console.log(`Customer ${customerId} no longer exists in Stripe, creating new one`);
            customerId = null;
          } else {
            throw customerError;
          }
        }
      }
      
      // Create new customer if needed
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;

        await db.update(signalUsers)
          .set({ stripeCustomerId: customerId })
          .where(eq(signalUsers.id, user.id));
      }

      // Determine success/cancel URLs based on environment
      const baseUrl = req.protocol + '://' + req.get('host');
      const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscribe`;

      // Get the price to determine if it's recurring or one-time
      const price = await stripe.prices.retrieve(priceId);
      const isOneTime = price.type === 'one_time';
      const mode = isOneTime ? 'payment' : 'subscription';

      console.log(`Creating ${mode} checkout for price ${priceId} (type: ${price.type})`);

      // Create checkout session with appropriate mode
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          email,
          planType: isOneTime ? 'lifetime' : 'subscription',
          ...(utm_source && { utm_source }),
          ...(utm_medium && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
          ...(utm_content && { utm_content }),
          ...(utm_term && { utm_term }),
          ...(gclid && { gclid }),
          ...(fbclid && { fbclid }),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        ...(isOneTime ? { invoice_creation: { enabled: true } } : {}),
      });

      console.log(`Checkout session created for ${email}: ${session.id}`);

      res.json({ 
        checkout_url: session.url,
        session_id: session.id 
      });

    } catch (error: any) {
      console.error('Checkout session error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Get invite link by session ID (for success page)
  app.get('/api/invite-link/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const stripe = await getUncachableStripeClient();

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session || !session.customer_email) {
        // Try to get email from metadata
        const email = session?.metadata?.email;
        if (!email) {
          return res.status(404).json({ error: 'Session not found or no email associated' });
        }
      }

      const email = session.customer_email || session.metadata?.email;

      // Look up user's invite link
      const [user] = await db.select({
        telegramInviteLink: signalUsers.telegramInviteLink,
        welcomeEmailSent: signalUsers.welcomeEmailSent,
      })
        .from(signalUsers)
        .where(eq(signalUsers.email, email as string));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return the invite link if available
      res.json({
        success: true,
        inviteLink: user.telegramInviteLink || null,
        emailSent: user.welcomeEmailSent || false,
      });

    } catch (error: any) {
      console.error('Invite link lookup error:', error);
      // Don't expose internal errors, just return not found
      res.status(404).json({ error: 'Unable to retrieve invite link' });
    }
  });

  // Get subscription status
  app.post('/api/subscription-status', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user || !user.stripeSubscriptionId) {
        return res.json({ 
          hasSubscription: false,
          status: null 
        });
      }

      // Query subscription from our subscriptions table
      const [subscription] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, user.stripeSubscriptionId));

      res.json({
        hasSubscription: true,
        status: subscription?.status || 'unknown',
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        telegramConnected: !!user.telegramUserId,
        email: user.email,
      });

    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Admin endpoint to manually resend welcome email (protected by admin key)
  app.post('/api/admin/resend-welcome-email', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      // Simple admin key protection - check against env var
      const expectedKey = process.env.ADMIN_API_KEY || 'entrylab-admin-2024';
      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get invite link (use existing or fallback)
      const telegramLink = user.telegramInviteLink || 'https://t.me/+TbJsf9xRrNkwN2E0';

      // Use static imports (defined at top of file)
      const { fromEmail } = await getUncachableResendClient();
      const { sendEmailWithRetry } = await import('./emailUtils');
      
      const emailHtml = getWelcomeEmailHtml(telegramLink);
      console.log('Email HTML preview (first 500 chars):', emailHtml.substring(0, 500));
      
      // Use retry logic for rate limit resilience
      const result = await sendEmailWithRetry({
        from: fromEmail,
        to: email,
        subject: 'Welcome to EntryLab Premium Signals!',
        html: emailHtml,
        text: `Welcome to EntryLab Premium Signals!\n\nYour subscription is now active. Join our private Telegram channel: ${telegramLink}\n\nQuestions? Contact us at support@entrylab.io`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      // Update the flag
      await db.update(signalUsers)
        .set({ welcomeEmailSent: true })
        .where(eq(signalUsers.id, user.id));

      console.log(`Admin: Welcome email manually sent to ${email}`);

      res.json({ 
        success: true, 
        message: `Welcome email sent to ${email}`,
        inviteLink: telegramLink
      });

    } catch (error: any) {
      console.error('Admin resend email error:', error);
      res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }
  });

  // Admin endpoint to send test emails (all 3 types)
  app.post('/api/admin/send-test-emails', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      const expectedKey = process.env.ADMIN_API_KEY || 'entrylab-admin-2024';
      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const { client, fromEmail } = await getUncachableResendClient();
      const results: string[] = [];

      // Helper to delay between sends (Resend rate limit is 2/sec)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Welcome Email (Premium)
      try {
        const welcomeHtml = getWelcomeEmailHtml('https://t.me/+TestInviteLink123');
        const welcomeResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Welcome to EntryLab Premium Signals!',
          html: welcomeHtml,
        });
        if (welcomeResult.error) {
          results.push(`Welcome email failed: ${welcomeResult.error.message}`);
        } else {
          results.push('Welcome email sent');
        }
      } catch (e: any) {
        results.push(`Welcome email failed: ${e.message}`);
      }

      await delay(600); // Wait to avoid rate limit

      // 2. Cancellation Email
      try {
        const cancelHtml = getCancellationEmailHtml();
        const cancelResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Subscription Cancelled - EntryLab',
          html: cancelHtml,
        });
        if (cancelResult.error) {
          results.push(`Cancellation email failed: ${cancelResult.error.message}`);
        } else {
          results.push('Cancellation email sent');
        }
      } catch (e: any) {
        results.push(`Cancellation email failed: ${e.message}`);
      }

      await delay(600); // Wait to avoid rate limit

      // 3. Free Channel Email
      try {
        const freeHtml = getFreeChannelEmailHtml('https://t.me/entrylabs');
        const freeResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Welcome to EntryLab Free Channel!',
          html: freeHtml,
        });
        if (freeResult.error) {
          results.push(`Free channel email failed: ${freeResult.error.message}`);
        } else {
          results.push('Free channel email sent');
        }
      } catch (e: any) {
        results.push(`Free channel email failed: ${e.message}`);
      }

      console.log(`Admin: Test emails sent to ${email}:`, results);
      res.json({ success: true, results });

    } catch (error: any) {
      console.error('Admin test emails error:', error);
      res.status(500).json({ error: 'Failed to send test emails: ' + error.message });
    }
  });

  // Email preview endpoints (for testing)
  // Use local logo URL for previews so they work in browser
  const getPreviewLogoUrl = (req: any) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    return `${protocol}://${host}/api/admin/logo-proxy`;
  };

  // ─── Logo upload endpoint ─────────────────────────────────────────────────

  const logosDir = path.join(process.cwd(), "uploads", "logos");
  if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

  const logoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, logosDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".png";
      const safe = Date.now() + "-" + Math.round(Math.random() * 1e6) + ext;
      cb(null, safe);
    },
  });

  const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post("/api/admin/upload-logo", adminAuth, logoUpload.single("logo"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file or unsupported type. Use PNG, JPG, SVG or WebP." });
    const url = `/uploads/logos/${req.file.filename}`;
    return res.json({ url });
  });

  // Logo proxy to avoid CORS issues in preview
  app.get('/api/admin/logo-proxy', async (req, res) => {
    try {
      const response = await fetch('https://entrylab.io/assets/entrylab-logo-green.png');
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(buffer));
    } catch (error) {
      res.status(500).send('Failed to load logo');
    }
  });

  app.get('/api/admin/preview-email/welcome', (req, res) => {
    let html = getWelcomeEmailHtml('https://t.me/+TestInviteLink123');
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/admin/preview-email/cancellation', (req, res) => {
    let html = getCancellationEmailHtml();
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/admin/preview-email/free', (req, res) => {
    let html = getFreeChannelEmailHtml('https://t.me/entrylabs');
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // ─── Page view tracking ──────────────────────────────────────────────────
  // Simple in-memory dedup: same IP + slug → only 1 row per 30 min
  const viewDedup = new Map<string, number>();
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [key, ts] of viewDedup.entries()) {
      if (ts < cutoff) viewDedup.delete(key);
    }
  }, 5 * 60 * 1000);

  app.post("/api/views/track", async (req, res) => {
    try {
      const { slug, name, type } = req.body || {};
      if (!slug || !name || !type) return res.status(400).json({ error: "Missing fields" });
      const allowedTypes = ["broker", "prop_firm", "article"];
      if (!allowedTypes.includes(type)) return res.status(400).json({ error: "Invalid type" });

      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown").split(",")[0].trim();
      const dedupKey = `${ip}:${slug}`;
      if (viewDedup.has(dedupKey)) return res.json({ ok: true, deduped: true });

      viewDedup.set(dedupKey, Date.now());
      await db.insert(pageViewsTable).values({ slug, name, type });
      return res.json({ ok: true });
    } catch (err: any) {
      console.error("[views] Track error:", err.message);
      return res.status(500).json({ error: "Failed to track view" });
    }
  });

  app.get("/api/admin/stats/top-firms", adminAuth, async (req, res) => {
    try {
      const { rows } = await db.execute(
        sql`SELECT slug, name, type, COUNT(*)::int AS views
            FROM page_views
            WHERE type IN ('broker', 'prop_firm')
            GROUP BY slug, name, type
            ORDER BY views DESC
            LIMIT 10`
      );
      return res.json(rows);
    } catch (err: any) {
      console.error("[stats] top-firms error:", err.message);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/stats/top-pages", adminAuth, async (req, res) => {
    try {
      const { rows } = await db.execute(
        sql`SELECT slug, name, type, COUNT(*)::int AS views
            FROM page_views
            WHERE type = 'article'
            GROUP BY slug, name, type
            ORDER BY views DESC
            LIMIT 10`
      );
      return res.json(rows);
    } catch (err: any) {
      console.error("[stats] top-pages error:", err.message);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
