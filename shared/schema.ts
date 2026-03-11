import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
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

// Signals subscription tables
export const signalUsers = pgTable("signal_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  telegramUserId: varchar("telegram_user_id", { length: 255 }).unique(),
  telegramUsername: varchar("telegram_username", { length: 255 }),
  telegramInviteLink: text("telegram_invite_link"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  welcomeEmailSent: boolean("welcome_email_sent").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSignalUserSchema = createInsertSchema(signalUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSignalUser = z.infer<typeof insertSignalUserSchema>;
export type SignalUser = typeof signalUsers.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => signalUsers.id, { onDelete: 'cascade' }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  status: varchar("status", { length: 50 }).notNull(),
  planType: varchar("plan_type", { length: 50 }).default('premium'),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const emailCaptures = pgTable("email_captures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  gclid: varchar("gclid", { length: 255 }),
  fbclid: varchar("fbclid", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailCaptureSchema = createInsertSchema(emailCaptures).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailCapture = z.infer<typeof insertEmailCaptureSchema>;
export type EmailCapture = typeof emailCaptures.$inferSelect;

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  stripeEventId: varchar("stripe_event_id", { length: 255 }).unique(),
  payload: jsonb("payload"),
  processed: boolean("processed").default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

export const brokerAlerts = pgTable("broker_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  brokerId: varchar("broker_id", { length: 255 }).notNull(),
  brokerName: varchar("broker_name", { length: 255 }).notNull(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
});

export const insertBrokerAlertSchema = createInsertSchema(brokerAlerts).omit({
  id: true,
  subscribedAt: true,
});

export type InsertBrokerAlert = z.infer<typeof insertBrokerAlertSchema>;
export type BrokerAlert = typeof brokerAlerts.$inferSelect;

// ─── Broker reviews DB table ───────────────────────────────────────────────
export const brokersTable = pgTable("brokers_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  affiliateLink: text("affiliate_link"),
  rating: text("rating"),
  regulation: text("regulation"),
  minDeposit: text("min_deposit"),
  minWithdrawal: text("min_withdrawal"),
  maxLeverage: text("max_leverage"),
  spreadFrom: text("spread_from"),
  platforms: text("platforms"),
  paymentMethods: text("payment_methods"),
  headquarters: text("headquarters"),
  support: text("support"),
  yearFounded: text("year_founded"),
  pros: text("pros").array(),
  cons: text("cons").array(),
  highlights: text("highlights").array(),
  tagline: text("tagline"),
  bonusOffer: text("bonus_offer"),
  content: text("content"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(true),
  popularity: text("popularity"),
  countries: text("countries").array(),
  platformsList: text("platforms_arr").array(),
  instruments: text("instruments").array(),
  wpPostId: integer("wp_post_id"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBrokerDataSchema = createInsertSchema(brokersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBrokerData = z.infer<typeof insertBrokerDataSchema>;
export type BrokerData = typeof brokersTable.$inferSelect;

// ─── Prop firm reviews DB table ────────────────────────────────────────────
export const propFirmsTable = pgTable("prop_firms_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  affiliateLink: text("affiliate_link"),
  rating: text("rating"),
  profitSplit: text("profit_split"),
  maxFundingSize: text("max_funding_size"),
  evaluationFee: text("evaluation_fee"),
  discountCode: text("discount_code"),
  discountAmount: text("discount_amount"),
  propFirmUsp: text("prop_firm_usp"),
  pros: text("pros").array(),
  cons: text("cons").array(),
  highlights: text("highlights").array(),
  tagline: text("tagline"),
  bonusOffer: text("bonus_offer"),
  content: text("content"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(true),
  popularity: text("popularity"),
  countries: text("countries").array(),
  platformsList: text("platforms_arr").array(),
  instruments: text("instruments").array(),
  wpPostId: integer("wp_post_id"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropFirmDataSchema = createInsertSchema(propFirmsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPropFirmData = z.infer<typeof insertPropFirmDataSchema>;
export type PropFirmData = typeof propFirmsTable.$inferSelect;

// ─── Articles DB table ──────────────────────────────────────────────────────
export const articlesTable = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  category: text("category"),
  status: text("status").default("draft").notNull(),
  featuredImage: text("featured_image"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  author: text("author").default("EntryLab"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;

// ─── Page views tracking table ──────────────────────────────────────────────
export const pageViewsTable = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "broker" | "prop_firm" | "article"
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

export const insertPageViewSchema = createInsertSchema(pageViewsTable).omit({
  id: true,
  viewedAt: true,
});

export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViewsTable.$inferSelect;

// ─── Category taxonomy tables ────────────────────────────────────────────────
export const categoriesTable = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // "article" | "broker" | "prop_firm"
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  wpId: integer("wp_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

export const brokerCategoriesTable = pgTable("broker_categories", {
  brokerId: varchar("broker_id").notNull().references(() => brokersTable.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
});

export const propFirmCategoriesTable = pgTable("prop_firm_categories", {
  propFirmId: varchar("prop_firm_id").notNull().references(() => propFirmsTable.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
});

// ─── Legacy TypeScript interfaces (still used by frontend transforms) ───────
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
  discountAmount?: string;
  features?: Array<{ icon: string; text: string }>;
  featuredHighlights?: string[];

  slug?: string;
  content?: string;
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

  // Prop firm extras
  profitSplit?: string;
  maxFundingSize?: string;
  evaluationFee?: string;
  propFirmUsp?: string;
}
