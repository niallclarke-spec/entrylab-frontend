import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, numeric, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailCaptureSchema = createInsertSchema(emailCaptures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// ─── Brokers DB table ───────────────────────────────────────────────────────
export const brokersTable = pgTable("brokers_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  affiliateLink: text("affiliate_link"),
  rating: numeric("rating", { precision: 5, scale: 2 }),
  regulation: text("regulation"),
  minDeposit: text("min_deposit"),
  minWithdrawal: text("min_withdrawal"),
  maxLeverage: text("max_leverage"),
  spreadFrom: text("spread_from"),
  commission: text("commission"),
  accountTypes: text("account_types").array(),
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
  withdrawalTime: text("withdrawal_time"),
  awards: text("awards").array(),
  bestFor: text("best_for"),
  parentCompany: text("parent_company"),
  ceo: text("ceo"),
  trustpilot: text("trustpilot"),
  isPubliclyTraded: boolean("is_publicly_traded").default(false),
  countries: text("countries").array(),
  platformsList: text("platforms_arr").array(),
  instruments: text("instruments").array(),
  legacyPostId: integer("legacy_post_id"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBrokerDataSchema = createInsertSchema(brokersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBrokerData = z.infer<typeof insertBrokerDataSchema>;
export type BrokerData = typeof brokersTable.$inferSelect;

// ─── Prop firms DB table ─────────────────────────────────────────────────────
export const propFirmsTable = pgTable("prop_firms_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  affiliateLink: text("affiliate_link"),
  rating: numeric("rating", { precision: 5, scale: 2 }),
  profitSplit: text("profit_split"),
  maxFundingSize: text("max_funding_size"),
  evaluationFee: text("evaluation_fee"),
  challengeTypes: text("challenge_types"),
  profitTarget: text("profit_target"),
  dailyDrawdown: text("daily_drawdown"),
  maxDrawdown: text("max_drawdown"),
  payoutFrequency: text("payout_frequency"),
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
  countries: text("countries").array(),
  platformsList: text("platforms_arr").array(),
  instruments: text("instruments").array(),
  support: text("support"),
  headquarters: text("headquarters"),
  paymentMethods: text("payment_methods"),
  payoutMethods: text("payout_methods"),
  minDeposit: text("min_deposit"),
  maxLeverage: text("max_leverage"),
  regulation: text("regulation"),
  yearFounded: text("year_founded"),
  parentCompany: text("parent_company"),
  ceo: text("ceo"),
  trustpilot: text("trustpilot"),
  isPubliclyTraded: boolean("is_publicly_traded").default(false),
  legacyPostId: integer("legacy_post_id"),
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
  relatedBroker: text("related_broker"),   // broker slug this article is about
  relatedPropFirm: text("related_prop_firm"), // prop firm slug this article is about
  legacyPostId: integer("legacy_post_id"),  // legacy post ID for redirect lookups
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
export type ArticleRow = typeof articlesTable.$inferSelect;

// ─── Reviews DB table ────────────────────────────────────────────────────────
// Single table for both broker and prop firm reviews.
// firmType distinguishes which kind of firm was reviewed.
export const reviewsTable = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmType: text("firm_type").notNull(),       // "broker" | "prop_firm"
  firmSlug: text("firm_slug").notNull(),        // slug of the reviewed firm
  firmName: text("firm_name"),                  // display name for quick reads
  reviewerName: text("reviewer_name").notNull(),
  reviewerEmail: text("reviewer_email"),
  rating: numeric("rating"),                    // overall rating 1–10
  title: text("title"),
  reviewText: text("review_text"),
  newsletterOptin: boolean("newsletter_optin").default(false),
  status: text("status").default("pending").notNull(), // pending | approved | rejected
  legacyPostId: integer("legacy_post_id"),     // legacy post ID for redirect lookups
  telegramMessageId: text("telegram_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

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

// ─── Static page SEO table ───────────────────────────────────────────────────
export const staticPageSeoTable = pgTable("static_page_seo", {
  slug:           text("slug").primaryKey(),          // e.g. "/brokers" or "broker-news"
  label:          text("label").notNull(),            // human-readable name for admin UI
  seoTitle:       text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
});

export const insertStaticPageSeoSchema = createInsertSchema(staticPageSeoTable).omit({ updatedAt: true });
export type InsertStaticPageSeo = z.infer<typeof insertStaticPageSeoSchema>;
export type StaticPageSeo = typeof staticPageSeoTable.$inferSelect;

// ─── Category taxonomy tables ────────────────────────────────────────────────
export const categoriesTable = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // "article" | "broker" | "prop_firm"
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  legacyId: integer("legacy_id"),
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
}, (t) => [primaryKey({ columns: [t.brokerId, t.categoryId] })]);

export const propFirmCategoriesTable = pgTable("prop_firm_categories", {
  propFirmId: varchar("prop_firm_id").notNull().references(() => propFirmsTable.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.propFirmId, t.categoryId] })]);

// ─── Comparisons table ───────────────────────────────────────────────────────
export const comparisonsTable = pgTable("comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // 'broker' | 'prop_firm'
  comparisonType: text("comparison_type").notNull().default("vs"), // 'vs' | 'alternatives'
  entityAId: text("entity_a_id").notNull(),
  entityBId: text("entity_b_id"),
  entityASlug: text("entity_a_slug").notNull(),
  entityBSlug: text("entity_b_slug"),
  entityAName: text("entity_a_name").notNull(),
  entityBName: text("entity_b_name"),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft | published | updated | archived
  categoryWinners: jsonb("category_winners"),
  overallWinnerId: text("overall_winner_id"),
  overallScore: text("overall_score"),
  faqData: jsonb("faq_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertComparisonSchema = createInsertSchema(comparisonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComparison = z.infer<typeof insertComparisonSchema>;
export type ComparisonRecord = typeof comparisonsTable.$inferSelect;

// ─── GSC Indexing Log ─────────────────────────────────────────────────────────
export const gscIndexingLog = pgTable("gsc_indexing_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("queued"), // queued | submitted | error
  submittedAt: timestamp("submitted_at"),
  httpCode: integer("http_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── GSC Page Performance ─────────────────────────────────────────────────────
export const gscPerformance = pgTable("gsc_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  ctr: numeric("ctr", { precision: 10, scale: 6 }),
  position: numeric("position", { precision: 8, scale: 2 }),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("gsc_perf_url_date_idx").on(t.url, t.date)]);

// ─── GSC Query Stats ──────────────────────────────────────────────────────────
export const gscQueries = pgTable("gsc_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  url: text("url").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  ctr: numeric("ctr", { precision: 10, scale: 6 }),
  position: numeric("position", { precision: 8, scale: 2 }),
}, (t) => [uniqueIndex("gsc_query_url_date_idx").on(t.query, t.url, t.date)]);

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  categoryName: string;
  featuredImage?: string | null;
  publishedAt: string;
  updatedAt: string;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  relatedBroker?: any;
  relatedPropFirm?: any;
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
