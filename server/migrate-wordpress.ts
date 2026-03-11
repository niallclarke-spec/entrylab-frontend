import https from "https";
import { db } from "./db";
import { brokersTable, propFirmsTable } from "../shared/schema";
import { sql } from "drizzle-orm";

function fetchWP(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 EntryLab-Migrator/1.0",
          Accept: "application/json",
          Host: urlObj.hostname,
        },
        rejectUnauthorized: true,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Invalid JSON from ${url}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error("Request timeout"));
    });
    req.end();
  });
}

async function fetchAllPages(baseUrl: string): Promise<any[]> {
  const first = await fetchWP(`${baseUrl}&page=1&per_page=100`);
  if (!Array.isArray(first)) return [];
  if (first.length < 100) return first;
  const all = [...first];
  let page = 2;
  while (true) {
    const next = await fetchWP(`${baseUrl}&page=${page}&per_page=100`);
    if (!Array.isArray(next) || next.length === 0) break;
    all.push(...next);
    if (next.length < 100) break;
    page++;
  }
  return all;
}

function splitText(val: string | null | undefined): string[] {
  if (!val) return [];
  return val
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function migrateBrokers(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  const wpBrokers = await fetchAllPages(
    "https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&acf_format=standard"
  );

  console.log(`[Migrate] Found ${wpBrokers.length} brokers in WordPress`);

  for (const wp of wpBrokers) {
    try {
      const acf = wp.acf || {};
      const logoUrl =
        acf.broker_logo?.url ||
        wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        null;

      const pros = splitText(acf.pros || acf.broker_usp || acf.why_choose);
      const cons = splitText(acf.cons);
      const highlights = splitText(acf.broker_usp || acf.why_choose);

      await db
        .insert(brokersTable)
        .values({
          slug: wp.slug,
          name: wp.title?.rendered || wp.slug,
          logoUrl,
          affiliateLink: acf.affiliate_link || null,
          rating: acf.rating ? String(acf.rating) : null,
          regulation: acf.regulation || null,
          minDeposit: acf.min_deposit || null,
          minWithdrawal: acf.minimum_withdrawal || null,
          maxLeverage: acf.max_leverage || null,
          spreadFrom: acf.spread_from || null,
          platforms: acf.trading_platforms || null,
          paymentMethods: acf.deposit_methods || null,
          headquarters: acf.headquarters || null,
          support: acf.support || null,
          yearFounded: acf.year_founded || null,
          pros,
          cons,
          highlights,
          tagline: acf.broker_intro || null,
          bonusOffer: acf.bonus_offer || null,
          content: acf.review_summary || null,
          seoTitle: acf.seo_title || null,
          seoDescription: acf.seo_description || null,
          isFeatured: acf.is_featured === true || acf.is_featured === "1",
          isVerified: true,
          popularity: acf.popularity || null,
          wpPostId: wp.id || null,
          lastUpdated: wp.modified ? new Date(wp.modified) : null,
        })
        .onConflictDoUpdate({
          target: brokersTable.slug,
          set: {
            name: sql`excluded.name`,
            logoUrl: sql`excluded.logo_url`,
            affiliateLink: sql`excluded.affiliate_link`,
            rating: sql`excluded.rating`,
            regulation: sql`excluded.regulation`,
            minDeposit: sql`excluded.min_deposit`,
            minWithdrawal: sql`excluded.min_withdrawal`,
            maxLeverage: sql`excluded.max_leverage`,
            spreadFrom: sql`excluded.spread_from`,
            platforms: sql`excluded.platforms`,
            paymentMethods: sql`excluded.payment_methods`,
            headquarters: sql`excluded.headquarters`,
            support: sql`excluded.support`,
            yearFounded: sql`excluded.year_founded`,
            pros: sql`excluded.pros`,
            cons: sql`excluded.cons`,
            highlights: sql`excluded.highlights`,
            tagline: sql`excluded.tagline`,
            bonusOffer: sql`excluded.bonus_offer`,
            content: sql`excluded.content`,
            seoTitle: sql`excluded.seo_title`,
            seoDescription: sql`excluded.seo_description`,
            isFeatured: sql`excluded.is_featured`,
            popularity: sql`excluded.popularity`,
            wpPostId: sql`excluded.wp_post_id`,
            lastUpdated: sql`excluded.last_updated`,
          },
        });

      count++;
    } catch (err: any) {
      errors.push(`Broker ${wp.slug}: ${err.message}`);
      console.error(`[Migrate] Broker error for ${wp.slug}:`, err.message);
    }
  }

  return { count, errors };
}

export async function migratePropFirms(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  const wpFirms = await fetchAllPages(
    "https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&acf_format=standard"
  );

  console.log(`[Migrate] Found ${wpFirms.length} prop firms in WordPress`);

  for (const wp of wpFirms) {
    try {
      const acf = wp.acf || {};
      const logoUrl =
        acf.prop_firm_logo?.url ||
        wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        null;

      const pros = splitText(acf.pros || acf.prop_firm_usp);
      const cons = splitText(acf.cons);
      const highlights = splitText(acf.prop_firm_usp);

      await db
        .insert(propFirmsTable)
        .values({
          slug: wp.slug,
          name: wp.title?.rendered || wp.slug,
          logoUrl,
          affiliateLink: acf.affiliate_link || null,
          rating: acf.rating ? String(acf.rating) : null,
          profitSplit: acf.profit_split || null,
          maxFundingSize: acf.max_funding || acf.max_account_size || null,
          evaluationFee: acf.evaluation_fee || null,
          discountCode: acf.discount_code || null,
          discountAmount: acf.discount_amount ? String(acf.discount_amount).trim() : null,
          propFirmUsp: acf.prop_firm_usp || null,
          pros,
          cons,
          highlights,
          tagline: acf.prop_firm_usp
            ? acf.prop_firm_usp.split(/[,\n]+/)[0]?.trim()
            : null,
          bonusOffer: acf.discount_code || null,
          content: acf.review_summary || null,
          seoTitle: acf.seo_title || null,
          seoDescription: acf.seo_description || null,
          support: acf.support || acf.support_hours || null,
          headquarters: acf.headquarters || null,
          paymentMethods: acf.deposit_methods || acf.payment_methods || null,
          payoutMethods: acf.payout_methods || acf.withdrawal_methods || null,
          isFeatured: acf.is_featured === true || acf.is_featured === "1",
          isVerified: true,
          popularity: acf.popularity || null,
          wpPostId: wp.id || null,
          lastUpdated: wp.modified ? new Date(wp.modified) : null,
        })
        .onConflictDoUpdate({
          target: propFirmsTable.slug,
          set: {
            name: sql`excluded.name`,
            logoUrl: sql`excluded.logo_url`,
            affiliateLink: sql`excluded.affiliate_link`,
            rating: sql`excluded.rating`,
            profitSplit: sql`excluded.profit_split`,
            maxFundingSize: sql`excluded.max_funding_size`,
            evaluationFee: sql`excluded.evaluation_fee`,
            discountCode: sql`excluded.discount_code`,
            discountAmount: sql`excluded.discount_amount`,
            propFirmUsp: sql`excluded.prop_firm_usp`,
            pros: sql`excluded.pros`,
            cons: sql`excluded.cons`,
            highlights: sql`excluded.highlights`,
            tagline: sql`excluded.tagline`,
            bonusOffer: sql`excluded.bonus_offer`,
            content: sql`excluded.content`,
            seoTitle: sql`excluded.seo_title`,
            seoDescription: sql`excluded.seo_description`,
            support: sql`excluded.support`,
            headquarters: sql`excluded.headquarters`,
            paymentMethods: sql`excluded.payment_methods`,
            payoutMethods: sql`excluded.payout_methods`,
            isFeatured: sql`excluded.is_featured`,
            popularity: sql`excluded.popularity`,
            wpPostId: sql`excluded.wp_post_id`,
            lastUpdated: sql`excluded.last_updated`,
          },
        });

      count++;
    } catch (err: any) {
      errors.push(`PropFirm ${wp.slug}: ${err.message}`);
      console.error(`[Migrate] PropFirm error for ${wp.slug}:`, err.message);
    }
  }

  return { count, errors };
}
