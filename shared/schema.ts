import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const articleViews = pgTable("article_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleSlug: text("article_slug").notNull().unique(),
  viewCount: integer("view_count").notNull().default(0),
  lastViewed: timestamp("last_viewed").defaultNow(),
});

export const insertArticleViewSchema = createInsertSchema(articleViews).pick({
  articleSlug: true,
});

export type InsertArticleView = z.infer<typeof insertArticleViewSchema>;
export type ArticleView = typeof articleViews.$inferSelect;

export interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  link: string;
  featured_media?: number;
  categories?: number[];
  author?: number;
  _embedded?: {
    author?: Array<{ name: string; avatar_urls?: { [key: string]: string } }>;
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text: string }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

export interface Broker {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  pros: string[];
  highlights?: string[];
  link: string;
  reviewLink?: string;
  featured?: boolean;
  tagline?: string;
  bonusOffer?: string;
  features?: Array<{ icon: string; text: string }>;
  featuredHighlights?: string[];
  
  // New ACF fields for detailed review
  slug?: string;
  content?: string; // WordPress post content (review body)
  minDeposit?: string;
  minWithdrawal?: string;
  maxLeverage?: string;
  spreadFrom?: string;
  regulation?: string;
  instrumentsCount?: string;
  supportHours?: string;
  cons?: string[];
  bestFor?: string;
  platforms?: string;
  accountTypes?: string;
  paymentMethods?: string;
  yearFounded?: string;
  headquarters?: string;
  support?: string;
  regulationDetails?: string;
  withdrawalTime?: string;
  trustScore?: number;
  totalUsers?: string;
  awards?: string[];
  lastUpdated?: Date | null;
  seoTitle?: string;
  seoDescription?: string;
}
