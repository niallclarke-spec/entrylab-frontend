import type { Broker } from "@shared/schema";

/**
 * Add IDs to headings in HTML content for Table of Contents navigation
 */
export function addHeadingIds(content: string): string {
  if (!content) return content;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const headingElements = doc.querySelectorAll("h2, h3, h4");
  
  headingElements.forEach((heading, index) => {
    heading.id = `section-${index}`;
  });
  
  return doc.body.innerHTML;
}

/**
 * Transform WordPress broker data to Broker interface (simple version for listings)
 */
export function transformBroker(wpBroker: any): Broker | null {
  const acf = wpBroker.acf || {};
  const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const name = wpBroker.title?.rendered;
  if (!name) return null;

  const isFeatured = acf.is_featured === true || acf.is_featured === "1";
  const keyFeatures = acf.broker_usp 
    ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
    : ["Ultra-low spreads", "Fast execution", "Regulated broker", "24/7 support"];
  const whyChoose = acf.why_choose 
    ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
    : keyFeatures;

  return {
    id: wpBroker.id.toString(),
    slug: wpBroker.slug,
    name: name,
    logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
    rating: parseFloat(acf.rating) || 4.5,
    verified: true,
    featured: isFeatured,
    tagline: acf.broker_intro || "Trusted forex broker",
    bonusOffer: acf.bonus_offer || "",
    link: acf.affiliate_link || wpBroker.link || "#",
    reviewLink: wpBroker.slug ? `/broker/${wpBroker.slug}` : undefined,
    pros: whyChoose.slice(0, 3),
    highlights: whyChoose,
    features: keyFeatures.map((f: string) => ({ icon: "trending", text: f })),
    featuredHighlights: keyFeatures,
  };
}

/**
 * Transform WordPress broker data to Broker interface (detailed version for review pages)
 */
export function transformBrokerDetailed(wpBroker: any): Broker | null {
  const acf = wpBroker.acf || {};
  const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const name = wpBroker.title?.rendered;
  if (!name) return null;

  const isFeatured = acf.is_featured === true || acf.is_featured === "1";
  
  const brokerUsp = acf.broker_usp 
    ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
    : [];
  
  const whyChoose = acf.why_choose 
    ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
    : [];
  
  const prosList = acf.pros 
    ? acf.pros.split(/[,\n]+/).map((p: string) => p.trim()).filter((p: string) => p)
    : whyChoose;
  
  const consList = acf.cons 
    ? acf.cons.split(/[,\n]+/).map((c: string) => c.trim()).filter((c: string) => c)
    : [];

  const modifiedDate = wpBroker.modified ? new Date(wpBroker.modified) : null;

  return {
    id: wpBroker.id.toString(),
    slug: wpBroker.slug,
    name: name,
    logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
    rating: parseFloat(acf.rating) || 4.5,
    verified: true,
    featured: isFeatured,
    tagline: acf.broker_intro || "",
    bonusOffer: acf.bonus_offer || "",
    link: acf.affiliate_link || wpBroker.link || "#",
    pros: prosList,
    highlights: brokerUsp,
    features: brokerUsp.map((f: string) => ({ icon: "trending", text: f })),
    featuredHighlights: brokerUsp,
    content: acf.review_summary || "",
    minDeposit: acf.min_deposit,
    minWithdrawal: acf.minimum_withdrawal,
    maxLeverage: acf.max_leverage,
    spreadFrom: acf.spread_from,
    regulation: acf.regulation,
    cons: consList,
    platforms: acf.trading_platforms,
    paymentMethods: acf.deposit_methods,
    headquarters: acf.headquarters,
    support: acf.support,
    totalUsers: acf.popularity,
    lastUpdated: modifiedDate,
    seoTitle: acf.seo_title,
    seoDescription: acf.seo_description,
  };
}

/**
 * Transform WordPress prop firm data to Broker interface (simple version for listings)
 */
export function transformPropFirm(wpPropFirm: any): (Broker & { categoryIds: number[] }) | null {
  const acf = wpPropFirm.acf || {};
  const logo = acf.prop_firm_logo?.url || wpPropFirm._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const name = wpPropFirm.title?.rendered;
  if (!name) return null;

  const isFeatured = acf.is_featured === true || acf.is_featured === "1";
  const keyFeatures = acf.prop_firm_usp 
    ? acf.prop_firm_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
    : ["Funded accounts up to $200K", "Profit split 80/20", "Quick evaluation", "Professional support"];
  const prosText = acf.pros 
    ? acf.pros.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
    : keyFeatures;

  const categoryIds = wpPropFirm["prop-firm-category"] || [];

  return {
    id: wpPropFirm.id.toString(),
    slug: wpPropFirm.slug,
    name: name,
    logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
    rating: parseFloat(acf.rating) || 4.5,
    verified: true,
    featured: isFeatured,
    tagline: acf.prop_firm_usp ? acf.prop_firm_usp.split(/[,\n]+/)[0] : "Trusted prop trading firm",
    bonusOffer: acf.discount_code || "",
    discountAmount: acf.discount_amount || "",
    link: acf.affiliate_link || wpPropFirm.link || "#",
    reviewLink: wpPropFirm.slug ? `/prop-firm/${wpPropFirm.slug}` : undefined,
    pros: prosText.slice(0, 3),
    highlights: prosText,
    features: keyFeatures.map((f: string) => ({ icon: "trending", text: f })),
    featuredHighlights: keyFeatures,
    categoryIds,
  };
}

/**
 * Transform WordPress prop firm data to Broker interface (detailed version for review pages)
 */
export function transformPropFirmDetailed(wpPropFirm: any): Broker | null {
  const acf = wpPropFirm.acf || {};
  const logo = acf.prop_firm_logo?.url || wpPropFirm._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const name = wpPropFirm.title?.rendered;
  if (!name) return null;

  const isFeatured = acf.is_featured === true || acf.is_featured === "1";
  const keyFeatures = acf.prop_firm_usp 
    ? acf.prop_firm_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
    : [];
  const prosText = acf.pros 
    ? acf.pros.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
    : keyFeatures;
  const consList = acf.cons 
    ? acf.cons.split(/[,\n]+/).map((c: string) => c.trim()).filter((c: string) => c)
    : [];
  const awardsList = acf.awards 
    ? acf.awards.split(/[,\n]+/).map((a: string) => a.trim()).filter((a: string) => a)
    : [];

  const modifiedDate = wpPropFirm.modified ? new Date(wpPropFirm.modified) : null;

  return {
    id: wpPropFirm.id.toString(),
    slug: wpPropFirm.slug,
    name: name,
    logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
    rating: parseFloat(acf.rating) || 4.5,
    verified: true,
    featured: isFeatured,
    tagline: acf.prop_firm_usp ? acf.prop_firm_usp.split(/[,\n]+/)[0] : "Trusted prop trading firm",
    bonusOffer: acf.discount_code || "",
    discountAmount: acf.discount_amount || "",
    link: acf.affiliate_link || wpPropFirm.link || "#",
    pros: prosText,
    highlights: keyFeatures,
    features: keyFeatures.map((f: string) => ({ icon: "trending", text: f })),
    featuredHighlights: keyFeatures,
    content: acf.review_summary || wpPropFirm.content?.rendered || "",
    minDeposit: acf.min_deposit,
    maxLeverage: acf.max_leverage,
    spreadFrom: acf.spread_from,
    regulation: acf.regulation,
    instrumentsCount: acf.instruments_count,
    supportHours: acf.support_hours,
    cons: consList,
    bestFor: acf.best_for,
    platforms: acf.trading_platforms || acf.platforms,
    accountTypes: acf.account_types,
    paymentMethods: acf.payment_methods,
    yearFounded: acf.year_founded,
    headquarters: acf.headquarters,
    regulationDetails: acf.regulation_details,
    withdrawalTime: acf.payout_methods || acf.withdrawal_time,
    trustScore: acf.trust_score ? parseInt(acf.trust_score) : undefined,
    totalUsers: acf.popularity,
    awards: awardsList,
    support: acf.support,
    lastUpdated: modifiedDate,
    seoTitle: acf.seo_title,
    seoDescription: acf.seo_description,
  };
}
