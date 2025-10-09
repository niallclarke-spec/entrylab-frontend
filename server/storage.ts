import { type User, type InsertUser, type Broker, type ArticleView, articleViews } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBrokers(): Promise<Broker[]>;
  incrementArticleView(slug: string): Promise<number>;
  getArticleViewCount(slug: string): Promise<number>;
  getArticleViewCountsBatch(slugs: string[]): Promise<Record<string, number>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private brokers: Broker[];

  constructor() {
    this.users = new Map();
    this.brokers = [
      {
        id: "1",
        name: "GatesFX",
        logo: "https://placehold.co/200x200/A855F7/ffffff?text=GatesFX",
        verified: true,
        rating: 4.8,
        pros: ["Scalping friendly with no restrictions", "Ultra-low spreads from 0.0 pips", "Massive 1:1000 leverage available"],
        highlights: ["No Deposit Fees", "24/7 Support", "Instant Withdrawals"],
        link: "https://secure.gatesfx.com/links/go/427",
        featured: true,
        tagline: "Professional Trading Without Limits",
        bonusOffer: "Get 100% Deposit Bonus",
        features: [
          { icon: "trending", text: "Low spreads from 0.0 pips" },
          { icon: "shield", text: "Regulated & Secure Platform" },
          { icon: "zap", text: "Lightning-fast execution" },
          { icon: "dollar", text: "No deposit or withdrawal fees" },
        ],
        featuredHighlights: [
          "Trade 200+ instruments including Forex, Indices, and Commodities",
          "Advanced trading platforms: MT4, MT5, and cTrader",
          "Dedicated account manager for serious traders",
          "Instant deposits and same-day withdrawals",
        ],
      },
      {
        id: "2",
        name: "HeroFX",
        logo: "https://placehold.co/200x200/10b981/ffffff?text=HeroFX",
        verified: true,
        rating: 4.6,
        pros: ["Up to 1:500 leverage for maximum potential", "Crypto deposits accepted (BTC, ETH, USDT)", "Modern TradeLocker platform"],
        highlights: ["Copy Trading", "Mobile Apps", "Educational Resources"],
        link: "https://herofx.co/?partner_code=7167829",
      },
      {
        id: "3",
        name: "TradePro Markets",
        logo: "https://placehold.co/200x200/3b82f6/ffffff?text=TPM",
        verified: true,
        rating: 4.7,
        pros: ["ECN pricing with no dealing desk", "0% commission on major pairs", "Swap-free Islamic accounts available"],
        highlights: ["Social Trading", "VPS Hosting", "Market Analysis"],
        link: "https://example.com/tradepro",
      },
      {
        id: "4",
        name: "AlphaFX",
        logo: "https://placehold.co/200x200/f59e0b/ffffff?text=AlphaFX",
        verified: true,
        rating: 4.5,
        pros: ["Professional-grade tools and indicators", "Multi-asset trading (Forex, Stocks, Crypto)", "Competitive spreads starting at 0.1 pips"],
        highlights: ["API Trading", "Expert Advisors", "Premium Support"],
        link: "https://example.com/alphafx",
      },
    ];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBrokers(): Promise<Broker[]> {
    return this.brokers;
  }

  async incrementArticleView(slug: string): Promise<number> {
    // Try to increment existing record
    const existing = await db.select().from(articleViews).where(eq(articleViews.articleSlug, slug)).limit(1);
    
    if (existing.length > 0) {
      const updated = await db
        .update(articleViews)
        .set({ 
          viewCount: sql`${articleViews.viewCount} + 1`,
          lastViewed: new Date()
        })
        .where(eq(articleViews.articleSlug, slug))
        .returning();
      return updated[0].viewCount;
    } else {
      // Create new record
      const created = await db
        .insert(articleViews)
        .values({ articleSlug: slug, viewCount: 1 })
        .returning();
      return created[0].viewCount;
    }
  }

  async getArticleViewCount(slug: string): Promise<number> {
    const result = await db.select().from(articleViews).where(eq(articleViews.articleSlug, slug)).limit(1);
    return result.length > 0 ? result[0].viewCount : 0;
  }

  async getArticleViewCountsBatch(slugs: string[]): Promise<Record<string, number>> {
    if (slugs.length === 0) return {};
    
    const results = await db
      .select()
      .from(articleViews)
      .where(sql`${articleViews.articleSlug} = ANY(${slugs})`);
    
    const viewCounts: Record<string, number> = {};
    results.forEach(result => {
      viewCounts[result.articleSlug] = result.viewCount;
    });
    
    return viewCounts;
  }
}

export const storage = new MemStorage();
