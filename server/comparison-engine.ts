import { db } from "./db";
import { brokersTable, propFirmsTable, comparisonsTable } from "@shared/schema";
import { eq, and, or, ne } from "drizzle-orm";
import type { BrokerData, PropFirmData, ComparisonRecord } from "@shared/schema";

// ─── Regulation tier classification ──────────────────────────────────────────

const TIER1_REGULATORS = [
  "fca", "asic", "cysec", "bafin", "mas", "finma", "fma", "jfsa", "fsca-tier1",
  "sec", "cftc", "nfa", "iiroc", "dfsa", "hkma", "monetary authority",
];
const TIER2_REGULATORS = [
  "fsa", "fsca", "fsb", "fsc mauritius", "ifsc", "vfsc", "svgfsa", "cima",
  "sib", "cbcs", "fsrc", "frsa", "lfsa",
];

function regulationTier(reg: string | null): 1 | 2 | 3 {
  if (!reg) return 3;
  const lower = reg.toLowerCase();
  if (TIER1_REGULATORS.some((r) => lower.includes(r))) return 1;
  if (TIER2_REGULATORS.some((r) => lower.includes(r))) return 2;
  return 3;
}

function regulatorCount(reg: string | null): number {
  if (!reg) return 0;
  return (reg.match(/,/g) || []).length + 1;
}

// ─── Helper parsers ───────────────────────────────────────────────────────────

function parseNumber(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function platformCount(platforms: string | null, arr: string[] | null): number {
  const fromArr = arr ? arr.length : 0;
  if (fromArr > 0) return fromArr;
  if (!platforms) return 0;
  return platforms.split(/,|\//).filter(Boolean).length;
}

function paymentMethodCount(methods: string | null): number {
  if (!methods) return 0;
  return methods.split(/,|\//).filter(Boolean).length;
}

function hasCrypto(methods: string | null): boolean {
  if (!methods) return false;
  return /bitcoin|crypto|btc|eth|usdt|usdc/i.test(methods);
}

function hasLiveChat(support: string | null): boolean {
  if (!support) return false;
  return /live\s*chat|24\/7|livechat/i.test(support);
}

// ─── Category winner interfaces ───────────────────────────────────────────────

export interface CategoryResult {
  category: string;
  label: string;
  winnerId: string | null; // null = tie
  winnerSlug: string | null;
  text: string;
  scoreA: number;
  scoreB: number;
}

export interface ComparisonData {
  entityType: "broker" | "prop_firm";
  entityAId: string;
  entityBId: string;
  entityASlug: string;
  entityBSlug: string;
  entityAName: string;
  entityBName: string;
  slug: string;
  categoryWinners: Record<string, CategoryResult>;
  overallWinnerId: string | null;
  overallScore: string;
  faqData: Array<{ q: string; a: string }>;
}

// ─── Broker comparison logic ──────────────────────────────────────────────────

function compareBrokerRegulation(a: BrokerData, b: BrokerData): CategoryResult {
  const tierA = regulationTier(a.regulation);
  const tierB = regulationTier(b.regulation);
  const countA = regulatorCount(a.regulation);
  const countB = regulatorCount(b.regulation);

  let scoreA = (4 - tierA) * 10 + countA;
  let scoreB = (4 - tierB) * 10 + countB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;
  const winnerTierLabel = ["", "top-tier", "mid-tier", "offshore"][regulationTier(winner.regulation)];

  const text = winnerId
    ? `When it comes to regulation, ${winner.name} holds the edge. ${winner.name} is regulated by ${winner.regulation || "multiple bodies"}, a ${winnerTierLabel} authority, while ${loser.name} operates under ${loser.regulation || "less scrutinised oversight"}. For traders who prioritise safety and fund protection, ${winner.name} is the stronger choice in this category.`
    : `Both ${a.name} and ${b.name} operate under comparable regulatory frameworks. ${a.name} is regulated by ${a.regulation || "N/A"}, while ${b.name} is regulated by ${b.regulation || "N/A"}. Traders should independently verify the regulatory details relevant to their jurisdiction.`;

  return { category: "regulation", label: "Regulation & Safety", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerCosts(a: BrokerData, b: BrokerData): CategoryResult {
  const spreadA = parseNumber(a.spreadFrom);
  const spreadB = parseNumber(b.spreadFrom);
  const commA = parseNumber(a.commission);
  const commB = parseNumber(b.commission);

  let scoreA = 0, scoreB = 0;
  if (spreadA > 0 && spreadB > 0) {
    if (spreadA < spreadB) scoreA += 10;
    else if (spreadB < spreadA) scoreB += 10;
  } else if (spreadA > 0) scoreA += 5;
  else if (spreadB > 0) scoreB += 5;

  if (commA < commB) scoreA += 3;
  else if (commB < commA) scoreB += 3;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} offers more competitive trading costs overall. With EUR/USD spreads ${winner.spreadFrom ? `from ${winner.spreadFrom}` : "that are tighter"} and commissions of ${winner.commission || "commission-free"}, it undercuts ${loser.name}, which charges spreads of ${loser.spreadFrom || "N/A"} with ${loser.commission || "commission-free"} commission. Cost-conscious traders will find ${winner.name} more attractive.`
    : `${a.name} and ${b.name} are evenly matched on trading costs. Both offer comparable spreads and commissions, so this category comes down to your specific account type and trading volume.`;

  return { category: "trading_costs", label: "Trading Costs", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerPlatforms(a: BrokerData, b: BrokerData): CategoryResult {
  const countA = platformCount(a.platforms, a.platformsList);
  const countB = platformCount(b.platforms, b.platformsList);
  const hasProprietaryA = /proprietary|own platform|web trader/i.test((a.platforms || "") + (a.platformsList || []).join(" "));
  const hasProprietaryB = /proprietary|own platform|web trader/i.test((b.platforms || "") + (b.platformsList || []).join(" "));
  const hasCopyA = /copy|social trading|mirror/i.test((a.platforms || "") + (a.platformsList || []).join(" "));
  const hasCopyB = /copy|social trading|mirror/i.test((b.platforms || "") + (b.platformsList || []).join(" "));

  let scoreA = countA * 3 + (hasProprietaryA ? 2 : 0) + (hasCopyA ? 2 : 0);
  let scoreB = countB * 3 + (hasProprietaryB ? 2 : 0) + (hasCopyB ? 2 : 0);

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} provides a broader range of trading platforms. It supports ${winner.platforms || winner.platformsList?.join(", ") || "multiple platforms"}, giving traders more flexibility in how they access the markets. ${loser.name} offers ${loser.platforms || loser.platformsList?.join(", ") || "standard platform access"}, which covers the essentials but falls short on variety.`
    : `Both brokers offer a similar platform suite, so neither has a clear advantage here. Traders using MT4 or MT5 will be equally well-served by either.`;

  return { category: "platforms", label: "Platforms & Tools", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerDeposit(a: BrokerData, b: BrokerData): CategoryResult {
  const depA = parseNumber(a.minDeposit);
  const depB = parseNumber(b.minDeposit);
  const accountCountA = (a.accountTypes || []).length;
  const accountCountB = (b.accountTypes || []).length;

  let scoreA = 0, scoreB = 0;
  if (depA === 0 && depB > 0) scoreA += 8;
  else if (depB === 0 && depA > 0) scoreB += 8;
  else if (depA < depB) scoreA += 8;
  else if (depB < depA) scoreB += 8;
  if (accountCountA > accountCountB) scoreA += 2;
  else if (accountCountB > accountCountA) scoreB += 2;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} is the more accessible choice for traders getting started. With a minimum deposit of ${winner.minDeposit || "$0"}, it requires less capital to open an account than ${loser.name}, which requires ${loser.minDeposit || "a higher amount"}. Lower barriers to entry make ${winner.name} the winner in this category.`
    : `Both brokers have similar minimum deposit requirements, so neither has a notable advantage here for new traders.`;

  return { category: "account_deposit", label: "Account Types & Min Deposit", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerPayments(a: BrokerData, b: BrokerData): CategoryResult {
  const countA = paymentMethodCount(a.paymentMethods);
  const countB = paymentMethodCount(b.paymentMethods);
  const cryptoA = hasCrypto(a.paymentMethods);
  const cryptoB = hasCrypto(b.paymentMethods);
  const withdrawA = parseNumber(a.minWithdrawal);
  const withdrawB = parseNumber(b.minWithdrawal);

  let scoreA = countA * 2 + (cryptoA ? 3 : 0) + (withdrawA === 0 || withdrawA < withdrawB ? 2 : 0);
  let scoreB = countB * 2 + (cryptoB ? 3 : 0) + (withdrawB === 0 || withdrawB < withdrawA ? 2 : 0);

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} supports a wider range of deposit and withdrawal options. It accepts ${winner.paymentMethods || "multiple payment methods"}${cryptoA && winner === a ? ", including cryptocurrency" : ""}${cryptoB && winner === b ? ", including cryptocurrency" : ""}, giving traders more flexibility. ${loser.name} offers ${loser.paymentMethods || "standard payment options"}, which may not suit all traders.`
    : `Both brokers offer comparable deposit and withdrawal options. Neither has a significant advantage in this category.`;

  return { category: "payments", label: "Deposit & Withdrawal", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerLeverage(a: BrokerData, b: BrokerData): CategoryResult {
  const levA = parseNumber(a.maxLeverage);
  const levB = parseNumber(b.maxLeverage);
  const instA = (a.instruments || []).length;
  const instB = (b.instruments || []).length;

  let scoreA = (levA > 0 ? levA / 100 : 0) + instA;
  let scoreB = (levB > 0 ? levB / 100 : 0) + instB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} offers greater trading power with maximum leverage of ${winner.maxLeverage || "N/A"}. This gives active traders more flexibility to size positions. ${loser.name} caps leverage at ${loser.maxLeverage || "N/A"}, which may limit scalability for experienced traders looking for higher exposure.`
    : `Both brokers offer equivalent maximum leverage, so neither has a distinct advantage for traders who rely on leveraged positions.`;

  return { category: "leverage", label: "Leverage & Instruments", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function compareBrokerSupport(a: BrokerData, b: BrokerData): CategoryResult {
  const liveA = hasLiveChat(a.support);
  const liveB = hasLiveChat(b.support);
  const ratingA = parseFloat(String(a.rating ?? "0"));
  const ratingB = parseFloat(String(b.rating ?? "0"));

  let scoreA = (liveA ? 5 : 0) + ratingA * 2;
  let scoreB = (liveB ? 5 : 0) + ratingB * 2;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} has a slight edge in customer support and overall reputation. It holds an EntryLab rating of ${winner.rating ?? "N/A"}/10${liveA && winner === a || liveB && winner === b ? " and offers live chat support" : ""}. ${loser.name} scores ${loser.rating ?? "N/A"}/10 on our platform, which is respectable but trails behind.`
    : `Both brokers are closely matched on support quality and reputation. Traders should read recent user reviews to determine which aligns best with their customer service expectations.`;

  return { category: "support", label: "Customer Support & Reputation", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

// ─── Prop firm comparison logic ────────────────────────────────────────────────

function comparePropChallenge(a: PropFirmData, b: PropFirmData): CategoryResult {
  const typesA = (a.challengeTypes || "").split(/,|\//).filter(Boolean).length;
  const typesB = (b.challengeTypes || "").split(/,|\//).filter(Boolean).length;
  const targetA = parseNumber(a.profitTarget);
  const targetB = parseNumber(b.profitTarget);

  let scoreA = typesA * 3 + (targetA > 0 && (targetB === 0 || targetA < targetB) ? 4 : 0);
  let scoreB = typesB * 3 + (targetB > 0 && (targetA === 0 || targetB < targetA) ? 4 : 0);

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} provides more flexibility in how traders can get funded. It offers ${winner.challengeTypes || "multiple challenge types"}, compared to ${loser.name}'s ${loser.challengeTypes || "standard evaluation"}. With a profit target of ${winner.profitTarget || "N/A"}, ${winner.name} also sets a more achievable bar for traders looking to pass their evaluation.`
    : `Both firms offer comparable challenge structures. The choice between them may come down to the specific challenge format you prefer.`;

  return { category: "challenge_structure", label: "Challenge Structure", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropPricing(a: PropFirmData, b: PropFirmData): CategoryResult {
  const feeA = parseNumber(a.evaluationFee);
  const feeB = parseNumber(b.evaluationFee);

  let scoreA = feeA === 0 ? 5 : feeB === 0 ? 0 : feeA < feeB ? 5 : 0;
  let scoreB = feeB === 0 ? 5 : feeA === 0 ? 0 : feeB < feeA ? 5 : 0;
  const tie = feeA === feeB;

  const winnerId = tie ? null : scoreA > scoreB ? a.id : b.id;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `On pricing, ${winner.name} offers better value. Its challenge fee starts at ${winner.evaluationFee || "N/A"}, which is lower than ${loser.name}'s ${loser.evaluationFee || "N/A"}. For traders watching their costs, ${winner.name} represents a more affordable path to funded trading.`
    : `Both firms charge comparable challenge fees, so pricing alone should not be the deciding factor in your choice.`;

  return { category: "pricing", label: "Pricing", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropProfit(a: PropFirmData, b: PropFirmData): CategoryResult {
  const splitA = parseNumber(a.profitSplit);
  const splitB = parseNumber(b.profitSplit);
  const freqScore = (freq: string | null) => {
    if (!freq) return 0;
    const f = freq.toLowerCase();
    if (f.includes("weekly")) return 4;
    if (f.includes("bi-weekly") || f.includes("biweekly")) return 3;
    if (f.includes("monthly")) return 2;
    return 1;
  };

  let scoreA = splitA + freqScore(a.payoutFrequency);
  let scoreB = splitB + freqScore(b.payoutFrequency);

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} offers a superior profit-sharing arrangement. Traders keep up to ${winner.profitSplit || "N/A"} of profits, with payouts ${winner.payoutFrequency || "on a regular schedule"}. ${loser.name} offers ${loser.profitSplit || "N/A"} with ${loser.payoutFrequency || "standard"} payouts, which is less favourable for traders maximising their earnings.`
    : `Both firms offer comparable profit splits, making this a tie. Review the full payout terms including withdrawal minimums before deciding.`;

  return { category: "profit_split", label: "Profit Split & Payouts", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropDrawdown(a: PropFirmData, b: PropFirmData): CategoryResult {
  const dailyA = parseNumber(a.dailyDrawdown);
  const dailyB = parseNumber(b.dailyDrawdown);
  const maxA = parseNumber(a.maxDrawdown);
  const maxB = parseNumber(b.maxDrawdown);

  let scoreA = dailyA + maxA;
  let scoreB = dailyB + maxB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} applies more lenient drawdown rules, giving traders more room to manage losing periods. Its daily drawdown limit is ${winner.dailyDrawdown || "N/A"} and maximum drawdown is ${winner.maxDrawdown || "N/A"}. By contrast, ${loser.name} enforces a ${loser.dailyDrawdown || "N/A"} daily limit and ${loser.maxDrawdown || "N/A"} max, which is stricter and can lead to more failed challenges.`
    : `Both firms apply similar drawdown rules. Neither has a meaningful edge in this category.`;

  return { category: "drawdown", label: "Drawdown Rules", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropPlatforms(a: PropFirmData, b: PropFirmData): CategoryResult {
  const countA = platformCount(null, a.platformsList);
  const countB = platformCount(null, b.platformsList);

  let scoreA = countA;
  let scoreB = countB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} supports more trading platforms, giving traders greater choice in how they execute their strategy. It offers ${winner.platformsList?.join(", ") || "multiple platforms"}, while ${loser.name} offers ${loser.platformsList?.join(", ") || "standard platform access"}.`
    : `Both firms offer the same platform options, so neither has an advantage in this category.`;

  return { category: "platforms", label: "Trading Platforms", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropFunding(a: PropFirmData, b: PropFirmData): CategoryResult {
  const fundA = parseNumber(a.maxFundingSize);
  const fundB = parseNumber(b.maxFundingSize);

  let scoreA = fundA;
  let scoreB = fundB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} offers higher maximum funding, making it the better choice for traders looking to scale up. Funded accounts can reach ${winner.maxFundingSize || "N/A"}, compared to ${loser.name}'s maximum of ${loser.maxFundingSize || "N/A"}. For serious traders focused on growing their account size, ${winner.name} has the edge.`
    : `Both firms offer equivalent maximum funding levels. Neither has an advantage for traders looking to scale.`;

  return { category: "max_funding", label: "Scaling & Max Funding", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

function comparePropReputation(a: PropFirmData, b: PropFirmData): CategoryResult {
  const ratingA = parseFloat(String(a.rating ?? "0"));
  const ratingB = parseFloat(String(b.rating ?? "0"));

  let scoreA = ratingA;
  let scoreB = ratingB;

  const winnerId = scoreA > scoreB ? a.id : scoreB > scoreA ? b.id : null;
  const winner = scoreA >= scoreB ? a : b;
  const loser = scoreA >= scoreB ? b : a;

  const text = winnerId
    ? `${winner.name} has built a stronger reputation among funded traders. With an EntryLab rating of ${winner.rating ?? "N/A"}/10, it outperforms ${loser.name}, which scores ${loser.rating ?? "N/A"}/10 on our platform. Reputation matters especially in the prop trading space where payout reliability is paramount.`
    : `Both firms have comparable reputations based on our rating data. We recommend reading recent trader reviews to gauge payout consistency and support quality.`;

  return { category: "reputation", label: "Reputation & Trust", winnerId, winnerSlug: winner.slug, text, scoreA, scoreB };
}

// ─── Overall winner calculation ────────────────────────────────────────────────

function calculateOverallWinner(
  results: CategoryResult[],
  entityAId: string,
  entityBId: string
): { winnerId: string | null; score: string } {
  let winsA = 0, winsB = 0;
  for (const r of results) {
    if (r.winnerId === entityAId) winsA++;
    else if (r.winnerId === entityBId) winsB++;
  }
  const winnerId = winsA > winsB ? entityAId : winsB > winsA ? entityBId : null;
  return { winnerId, score: `${winsA}-${winsB}` };
}

// ─── FAQ generation ───────────────────────────────────────────────────────────

function generateBrokerFaqs(
  a: BrokerData,
  b: BrokerData,
  categories: CategoryResult[],
  overallWinnerId: string | null
): Array<{ q: string; a: string }> {
  const winner = overallWinnerId === a.id ? a : overallWinnerId === b.id ? b : null;
  const loser = winner === a ? b : winner === b ? a : null;
  const costCat = categories.find((c) => c.category === "trading_costs");
  const regCat = categories.find((c) => c.category === "regulation");
  const depCat = categories.find((c) => c.category === "account_deposit");

  return [
    {
      q: `Is ${a.name} better than ${b.name}?`,
      a: winner
        ? `Based on our analysis across 7 key categories, ${winner.name} wins with a score of ${categories.filter((c) => c.winnerId === winner.id).length}–${categories.filter((c) => c.winnerId === loser!.id).length}. However, the best broker for you depends on your specific trading style and priorities.`
        : `${a.name} and ${b.name} are closely matched overall, with neither broker winning outright. The better choice depends on which features matter most to you.`,
    },
    {
      q: `Which has lower spreads, ${a.name} or ${b.name}?`,
      a: costCat?.winnerId
        ? `${costCat.winnerId === a.id ? a.name : b.name} offers lower trading costs. ${a.name} spreads start from ${a.spreadFrom || "N/A"} while ${b.name} starts from ${b.spreadFrom || "N/A"}.`
        : `Both brokers offer similar spread levels. ${a.name} charges ${a.spreadFrom || "N/A"} and ${b.name} charges ${b.spreadFrom || "N/A"}.`,
    },
    {
      q: `Is ${a.name} safer than ${b.name}?`,
      a: regCat?.winnerId
        ? `${regCat.winnerId === a.id ? a.name : b.name} is regulated by a higher-tier authority. ${a.name} is regulated by ${a.regulation || "N/A"}, while ${b.name} is regulated by ${b.regulation || "N/A"}.`
        : `Both brokers operate under comparable regulatory oversight. Always verify the specific regulatory licences that apply in your country.`,
    },
    {
      q: `Can I use MT5 with both ${a.name} and ${b.name}?`,
      a: `${a.name} supports ${a.platforms || a.platformsList?.join(", ") || "standard platforms"} and ${b.name} supports ${b.platforms || b.platformsList?.join(", ") || "standard platforms"}. Check each broker's platform page for the latest availability.`,
    },
    {
      q: `Which has a lower minimum deposit, ${a.name} or ${b.name}?`,
      a: depCat?.winnerId
        ? `${depCat.winnerId === a.id ? a.name : b.name} has the lower minimum deposit requirement. ${a.name} requires ${a.minDeposit || "$0"} while ${b.name} requires ${b.minDeposit || "$0"}.`
        : `Both brokers have similar minimum deposit requirements — ${a.name} requires ${a.minDeposit || "$0"} and ${b.name} requires ${b.minDeposit || "$0"}.`,
    },
    {
      q: `Is ${a.name} regulated?`,
      a: `Yes, ${a.name} is regulated by ${a.regulation || "regulatory authorities"}. Regulation provides traders with a level of protection including segregated funds and dispute resolution mechanisms.`,
    },
    {
      q: `Which broker is better for beginners, ${a.name} or ${b.name}?`,
      a: winner
        ? `For beginners, ${winner.name} is generally the stronger choice due to its lower minimum deposit${parseNumber(winner.minDeposit) <= parseNumber(loser?.minDeposit ?? "999") ? "" : " and broader educational resources"}. However, both brokers offer standard tools suitable for newer traders.`
        : `Both brokers offer beginner-friendly features. We recommend comparing their educational resources and account types to find the best fit.`,
    },
  ];
}

function generatePropFirmFaqs(
  a: PropFirmData,
  b: PropFirmData,
  categories: CategoryResult[],
  overallWinnerId: string | null
): Array<{ q: string; a: string }> {
  const winner = overallWinnerId === a.id ? a : overallWinnerId === b.id ? b : null;
  const loser = winner === a ? b : winner === b ? a : null;
  const profitCat = categories.find((c) => c.category === "profit_split");
  const priceCat = categories.find((c) => c.category === "pricing");

  return [
    {
      q: `Is ${a.name} better than ${b.name}?`,
      a: winner
        ? `Based on our analysis across 7 categories, ${winner.name} wins overall. It outperforms ${loser!.name} in areas including ${categories.filter((c) => c.winnerId === winner.id).map((c) => c.label).slice(0, 2).join(" and ")}. That said, both firms are reputable options for funded traders.`
        : `${a.name} and ${b.name} are evenly matched across our 7 comparison categories. The better firm depends on your specific trading goals and risk tolerance.`,
    },
    {
      q: `Which has better profit split, ${a.name} or ${b.name}?`,
      a: profitCat?.winnerId
        ? `${profitCat.winnerId === a.id ? a.name : b.name} offers the higher profit split. ${a.name} offers up to ${a.profitSplit || "N/A"} while ${b.name} offers ${b.profitSplit || "N/A"}.`
        : `Both firms offer similar profit splits — ${a.name} offers ${a.profitSplit || "N/A"} and ${b.name} offers ${b.profitSplit || "N/A"}.`,
    },
    {
      q: `Is ${a.name} trustworthy?`,
      a: `${a.name} holds an EntryLab rating of ${a.rating ?? "N/A"}/10 based on our editorial review. We evaluate prop firms on payouts, challenge fairness, support quality, and regulatory standing. Always conduct your own due diligence before funding a challenge.`,
    },
    {
      q: `Which has a cheaper challenge fee, ${a.name} or ${b.name}?`,
      a: priceCat?.winnerId
        ? `${priceCat.winnerId === a.id ? a.name : b.name} offers the more affordable challenge. ${a.name} starts at ${a.evaluationFee || "N/A"} and ${b.name} starts at ${b.evaluationFee || "N/A"}.`
        : `Both firms charge comparable fees — ${a.name} starts at ${a.evaluationFee || "N/A"} and ${b.name} at ${b.evaluationFee || "N/A"}.`,
    },
    {
      q: `What is the maximum funding at ${a.name} vs ${b.name}?`,
      a: `${a.name} offers maximum funded accounts of ${a.maxFundingSize || "N/A"}, while ${b.name} offers up to ${b.maxFundingSize || "N/A"}. Both allow traders to scale their accounts over time.`,
    },
    {
      q: `Which is better for beginner traders, ${a.name} or ${b.name}?`,
      a: winner
        ? `${winner.name} may be more beginner-friendly due to ${(winner as PropFirmData).challengeTypes?.includes("Instant") ? "its Instant Funding option" : "its lower entry fee and clear challenge structure"}. Both firms have challenges suitable for traders at different skill levels.`
        : `Both firms offer accessible challenge structures for newer funded traders. Review the profit targets and drawdown rules carefully before committing.`,
    },
  ];
}

// ─── Main entry points ─────────────────────────────────────────────────────────

export function computeBrokerComparison(a: BrokerData, b: BrokerData): Omit<ComparisonData, "slug"> {
  const categories = [
    compareBrokerRegulation(a, b),
    compareBrokerCosts(a, b),
    compareBrokerPlatforms(a, b),
    compareBrokerDeposit(a, b),
    compareBrokerPayments(a, b),
    compareBrokerLeverage(a, b),
    compareBrokerSupport(a, b),
  ];

  const { winnerId: overallWinnerId, score: overallScore } = calculateOverallWinner(categories, a.id, b.id);
  const categoryWinners: Record<string, CategoryResult> = {};
  for (const c of categories) categoryWinners[c.category] = c;

  const faqData = generateBrokerFaqs(a, b, categories, overallWinnerId);

  return {
    entityType: "broker",
    entityAId: a.id,
    entityBId: b.id,
    entityASlug: a.slug,
    entityBSlug: b.slug,
    entityAName: a.name,
    entityBName: b.name,
    categoryWinners,
    overallWinnerId,
    overallScore,
    faqData,
  };
}

export function computePropFirmComparison(a: PropFirmData, b: PropFirmData): Omit<ComparisonData, "slug"> {
  const categories = [
    comparePropChallenge(a, b),
    comparePropPricing(a, b),
    comparePropProfit(a, b),
    comparePropDrawdown(a, b),
    comparePropPlatforms(a, b),
    comparePropFunding(a, b),
    comparePropReputation(a, b),
  ];

  const { winnerId: overallWinnerId, score: overallScore } = calculateOverallWinner(categories, a.id, b.id);
  const categoryWinners: Record<string, CategoryResult> = {};
  for (const c of categories) categoryWinners[c.category] = c;

  const faqData = generatePropFirmFaqs(a, b, categories, overallWinnerId);

  return {
    entityType: "prop_firm",
    entityAId: a.id,
    entityBId: b.id,
    entityASlug: a.slug,
    entityBSlug: b.slug,
    entityAName: a.name,
    entityBName: b.name,
    categoryWinners,
    overallWinnerId,
    overallScore,
    faqData,
  };
}

export function makeComparisonSlug(slugA: string, slugB: string): string {
  const [first, second] = [slugA, slugB].sort();
  return `${first}-vs-${second}`;
}

// ─── Alternatives page generation ────────────────────────────────────────────

export interface AlternativeEntry {
  entityId: string;
  entitySlug: string;
  entityName: string;
  rating: number;
  wins: number;
  score: string;
  winCategoryLabels: string[];
  summary: string;
}

function computeBrokerAlternatives(
  main: BrokerData,
  others: BrokerData[]
): { alternatives: AlternativeEntry[]; faqData: Array<{ q: string; a: string }> } {
  const sorted = [...others].sort((a, b) => {
    const ra = parseFloat(String(a.rating ?? 0));
    const rb = parseFloat(String(b.rating ?? 0));
    return rb - ra;
  });
  const top = sorted.slice(0, 6);

  const alternatives: AlternativeEntry[] = top.map((alt) => {
    const [a, b] = main.slug < alt.slug ? [main, alt] : [alt, main];
    const data = computeBrokerComparison(a, b);
    const cats = Object.values(data.categoryWinners) as CategoryResult[];
    const altWins = cats.filter((c) => c.winnerId === alt.id).length;
    const mainWins = cats.filter((c) => c.winnerId === main.id).length;
    const winCategoryLabels = cats.filter((c) => c.winnerId === alt.id).map((c) => c.label);

    let summary = `${alt.name} is a strong alternative to ${main.name}`;
    if (winCategoryLabels.length > 0) {
      summary += `, particularly if you prioritise ${winCategoryLabels.slice(0, 2).join(" and ").toLowerCase()}`;
    }
    if (alt.regulation) summary += `. It is regulated by ${alt.regulation}`;
    if (alt.spreadFrom) summary += ` with spreads from ${alt.spreadFrom}`;
    summary += ".";

    return {
      entityId: alt.id,
      entitySlug: alt.slug,
      entityName: alt.name,
      rating: parseFloat(String(alt.rating ?? 0)),
      wins: altWins,
      score: `${altWins}-${mainWins}`,
      winCategoryLabels,
      summary,
    };
  });

  const faqData: Array<{ q: string; a: string }> = [
    {
      q: `What are the best alternatives to ${main.name}?`,
      a: `The top alternatives to ${main.name} are ${top.slice(0, 3).map((b) => b.name).join(", ")}. Each offers competitive trading conditions across regulation, spreads, and platform support.`,
    },
    {
      q: `Why might I choose a different broker over ${main.name}?`,
      a: `Traders may prefer alternatives if they need ${top[0] ? `features that ${top[0].name} excels in, such as its ${alternatives[0]?.winCategoryLabels[0]?.toLowerCase() ?? "trading conditions"}` : "different regulatory coverage or trading platforms"}. Comparing brokers helps find the best fit for your trading style.`,
    },
    {
      q: `Is ${main.name} the cheapest broker?`,
      a: `${main.name} has spreads from ${main.spreadFrom || "N/A"}. ${top[0]?.name ? `${top[0].name} starts from ${top[0].spreadFrom || "N/A"}, making it${parseFloat(String(top[0].spreadFrom ?? "99")) < parseFloat(String(main.spreadFrom ?? "99")) ? " potentially cheaper" : " comparable"}.` : "Compare brokers to find the lowest spreads for your preferred instruments."}`,
    },
    {
      q: `How does ${main.name} compare to ${top[0]?.name ?? "other brokers"}?`,
      a: alternatives[0]?.summary ?? `Both are well-regulated brokers offering retail and professional trading accounts. Key differences lie in spreads, minimum deposits, and platform selection.`,
    },
  ];

  return { alternatives, faqData };
}

function computePropFirmAlternatives(
  main: PropFirmData,
  others: PropFirmData[]
): { alternatives: AlternativeEntry[]; faqData: Array<{ q: string; a: string }> } {
  const sorted = [...others].sort((a, b) => {
    const ra = parseFloat(String(a.rating ?? 0));
    const rb = parseFloat(String(b.rating ?? 0));
    return rb - ra;
  });
  const top = sorted.slice(0, 6);

  const alternatives: AlternativeEntry[] = top.map((alt) => {
    const [a, b] = main.slug < alt.slug ? [main, alt] : [alt, main];
    const data = computePropFirmComparison(a, b);
    const cats = Object.values(data.categoryWinners) as CategoryResult[];
    const altWins = cats.filter((c) => c.winnerId === alt.id).length;
    const mainWins = cats.filter((c) => c.winnerId === main.id).length;
    const winCategoryLabels = cats.filter((c) => c.winnerId === alt.id).map((c) => c.label);

    let summary = `${alt.name} is a top alternative to ${main.name}`;
    if (winCategoryLabels.length > 0) {
      summary += `, especially for traders who value ${winCategoryLabels.slice(0, 2).join(" and ").toLowerCase()}`;
    }
    if (alt.profitSplit) summary += `. It offers up to ${alt.profitSplit} profit split`;
    if (alt.maxFundingSize) summary += ` with accounts up to ${alt.maxFundingSize}`;
    summary += ".";

    return {
      entityId: alt.id,
      entitySlug: alt.slug,
      entityName: alt.name,
      rating: parseFloat(String(alt.rating ?? 0)),
      wins: altWins,
      score: `${altWins}-${mainWins}`,
      winCategoryLabels,
      summary,
    };
  });

  const faqData: Array<{ q: string; a: string }> = [
    {
      q: `What are the best alternatives to ${main.name}?`,
      a: `The top alternatives to ${main.name} are ${top.slice(0, 3).map((f) => f.name).join(", ")}. All offer funded trading accounts with competitive profit splits and clear challenge rules.`,
    },
    {
      q: `Why would a trader choose an alternative to ${main.name}?`,
      a: `Reasons vary — some traders prefer lower challenge fees, higher profit splits, or more flexible drawdown rules. ${top[0]?.name ? `For example, ${top[0].name} may offer ${alternatives[0]?.winCategoryLabels[0]?.toLowerCase() ?? "competitive advantages"} compared to ${main.name}.` : "Compare the alternatives to find the firm that best matches your trading style."}`,
    },
    {
      q: `How does ${main.name} compare to ${top[0]?.name ?? "other prop firms"}?`,
      a: alternatives[0]?.summary ?? `Both are reputable prop trading firms. Evaluate their challenge types, profit targets, and drawdown limits to find the right fit.`,
    },
    {
      q: `Is ${main.name} a good prop firm?`,
      a: `${main.name} holds an EntryLab rating of ${main.rating ?? "N/A"}/10. Key strengths include ${main.profitSplit ? `profit split up to ${main.profitSplit}` : "competitive challenge structure"}${main.maxFundingSize ? ` and funding up to ${main.maxFundingSize}` : ""}. Check our full review for a detailed breakdown.`,
    },
  ];

  return { alternatives, faqData };
}

/**
 * Generate the next missing vs comparison for a single entity.
 * Returns the newly created record, plus progress counts.
 */
export async function generateNextForEntity(
  entityType: "broker" | "prop_firm",
  entityId: string
): Promise<{
  created: boolean;
  comparison: typeof comparisonsTable.$inferSelect | null;
  generated: number;
  total: number;
  remaining: number;
}> {
  if (entityType === "broker") {
    const [main] = await db.select().from(brokersTable).where(eq(brokersTable.id, entityId));
    if (!main) throw new Error("Entity not found");

    const others = (await db.select().from(brokersTable)).filter((b) => b.id !== entityId);
    const existing = await db
      .select({ slug: comparisonsTable.slug })
      .from(comparisonsTable)
      .where(
        and(
          eq(comparisonsTable.entityType, "broker"),
          eq(comparisonsTable.comparisonType, "vs")
        )
      );
    const existingSlugs = new Set(existing.map((c) => c.slug));

    // Sort others alphabetically so generation is deterministic
    const sorted = [...others].sort((a, b) => a.slug.localeCompare(b.slug));
    const total = sorted.length;
    let generated = 0;
    let nextOpponent: typeof brokersTable.$inferSelect | null = null;

    for (const other of sorted) {
      const slug = makeComparisonSlug(main.slug, other.slug);
      if (existingSlugs.has(slug)) {
        generated++;
      } else if (!nextOpponent) {
        nextOpponent = other;
      }
    }

    if (!nextOpponent) {
      return { created: false, comparison: null, generated, total, remaining: 0 };
    }

    const [a, b] = [main, nextOpponent].sort((x, y) => x.slug.localeCompare(y.slug));
    const slug = makeComparisonSlug(a.slug, b.slug);
    const data = computeBrokerComparison(a, b);

    const [inserted] = await db
      .insert(comparisonsTable)
      .values({
        entityType: "broker",
        comparisonType: "vs",
        entityAId: a.id,
        entityBId: b.id,
        entityASlug: a.slug,
        entityBSlug: b.slug,
        entityAName: a.name,
        entityBName: b.name,
        slug,
        status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null,
        updatedAt: new Date(),
      })
      .returning();

    return {
      created: true,
      comparison: inserted,
      generated: generated + 1,
      total,
      remaining: total - generated - 1,
    };
  } else {
    const [main] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, entityId));
    if (!main) throw new Error("Entity not found");

    const others = (await db.select().from(propFirmsTable)).filter((f) => f.id !== entityId);
    const existing = await db
      .select({ slug: comparisonsTable.slug })
      .from(comparisonsTable)
      .where(
        and(
          eq(comparisonsTable.entityType, "prop_firm"),
          eq(comparisonsTable.comparisonType, "vs")
        )
      );
    const existingSlugs = new Set(existing.map((c) => c.slug));

    const sorted = [...others].sort((a, b) => a.slug.localeCompare(b.slug));
    const total = sorted.length;
    let generated = 0;
    let nextOpponent: typeof propFirmsTable.$inferSelect | null = null;

    for (const other of sorted) {
      const slug = makeComparisonSlug(main.slug, other.slug);
      if (existingSlugs.has(slug)) {
        generated++;
      } else if (!nextOpponent) {
        nextOpponent = other;
      }
    }

    if (!nextOpponent) {
      return { created: false, comparison: null, generated, total, remaining: 0 };
    }

    const [a, b] = [main, nextOpponent].sort((x, y) => x.slug.localeCompare(y.slug));
    const slug = makeComparisonSlug(a.slug, b.slug);
    const data = computePropFirmComparison(a, b);

    const [inserted] = await db
      .insert(comparisonsTable)
      .values({
        entityType: "prop_firm",
        comparisonType: "vs",
        entityAId: a.id,
        entityBId: b.id,
        entityASlug: a.slug,
        entityBSlug: b.slug,
        entityAName: a.name,
        entityBName: b.name,
        slug,
        status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null,
        updatedAt: new Date(),
      })
      .returning();

    return {
      created: true,
      comparison: inserted,
      generated: generated + 1,
      total,
      remaining: total - generated - 1,
    };
  }
}

/**
 * Get per-entity comparison progress stats for all entities of a given type.
 */
export async function getEntityComparisonStats(
  entityType: "broker" | "prop_firm"
): Promise<
  Array<{
    entityId: string;
    entitySlug: string;
    entityName: string;
    generated: number;
    published: number;
    total: number;
  }>
> {
  const entities =
    entityType === "broker"
      ? await db.select().from(brokersTable)
      : await db.select().from(propFirmsTable);

  const allComparisons = await db
    .select()
    .from(comparisonsTable)
    .where(
      and(
        eq(comparisonsTable.entityType, entityType),
        eq(comparisonsTable.comparisonType, "vs")
      )
    );

  const total = entities.length - 1;

  return entities
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entity) => {
      const entityComparisons = allComparisons.filter(
        (c) => c.entityAId === entity.id || c.entityBId === entity.id
      );
      const published = entityComparisons.filter((c) => c.status === "published").length;
      return {
        entityId: entity.id,
        entitySlug: entity.slug,
        entityName: entity.name,
        generated: entityComparisons.length,
        published,
        total,
      };
    });
}

export async function generateAllAlternatives(): Promise<{ brokers: number; propFirms: number }> {
  const [brokers, propFirms] = await Promise.all([
    db.select().from(brokersTable),
    db.select().from(propFirmsTable),
  ]);

  const existingAlt = await db
    .select({ slug: comparisonsTable.slug })
    .from(comparisonsTable)
    .where(eq(comparisonsTable.comparisonType, "alternatives"));
  const existingAltSlugs = new Set(existingAlt.map((c) => c.slug));

  let brokerCount = 0;
  let propFirmCount = 0;
  const now = new Date();

  for (const broker of brokers) {
    const altSlug = `${broker.slug}-alternatives`;
    if (existingAltSlugs.has(altSlug)) continue;

    const others = brokers.filter((b) => b.id !== broker.id);
    const { alternatives, faqData } = computeBrokerAlternatives(broker, others);

    await db.insert(comparisonsTable).values({
      entityType: "broker",
      comparisonType: "alternatives",
      entityAId: broker.id,
      entityBId: null,
      entityASlug: broker.slug,
      entityBSlug: null,
      entityAName: broker.name,
      entityBName: null,
      slug: altSlug,
      status: "draft",
      categoryWinners: { alternatives } as any,
      overallWinnerId: null,
      overallScore: null,
      faqData: faqData as any,
      publishedAt: null,
      updatedAt: now,
    });
    existingAltSlugs.add(altSlug);
    brokerCount++;
  }

  for (const firm of propFirms) {
    const altSlug = `${firm.slug}-alternatives`;
    if (existingAltSlugs.has(altSlug)) continue;

    const others = propFirms.filter((f) => f.id !== firm.id);
    const { alternatives, faqData } = computePropFirmAlternatives(firm, others);

    await db.insert(comparisonsTable).values({
      entityType: "prop_firm",
      comparisonType: "alternatives",
      entityAId: firm.id,
      entityBId: null,
      entityASlug: firm.slug,
      entityBSlug: null,
      entityAName: firm.name,
      entityBName: null,
      slug: altSlug,
      status: "draft",
      categoryWinners: { alternatives } as any,
      overallWinnerId: null,
      overallScore: null,
      faqData: faqData as any,
      publishedAt: null,
      updatedAt: now,
    });
    existingAltSlugs.add(altSlug);
    propFirmCount++;
  }

  return { brokers: brokerCount, propFirms: propFirmCount };
}

export async function generateAllMissingPairs(): Promise<{ brokers: number; propFirms: number }> {
  const [brokers, propFirms, existingComparisons] = await Promise.all([
    db.select().from(brokersTable),
    db.select().from(propFirmsTable),
    db.select({ slug: comparisonsTable.slug }).from(comparisonsTable).where(
      eq(comparisonsTable.comparisonType, "vs")
    ),
  ]);

  const existingSlugs = new Set(existingComparisons.map((c) => c.slug));

  let brokerCount = 0;
  let propFirmCount = 0;
  const now = new Date();

  for (let i = 0; i < brokers.length; i++) {
    for (let j = i + 1; j < brokers.length; j++) {
      const [aRaw, bRaw] = [brokers[i], brokers[j]].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = makeComparisonSlug(aRaw.slug, bRaw.slug);
      if (existingSlugs.has(slug)) continue;

      const data = computeBrokerComparison(aRaw, bRaw);
      await db.insert(comparisonsTable).values({
        entityType: "broker",
        comparisonType: "vs",
        entityAId: aRaw.id,
        entityBId: bRaw.id,
        entityASlug: aRaw.slug,
        entityBSlug: bRaw.slug,
        entityAName: aRaw.name,
        entityBName: bRaw.name,
        slug,
        status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null,
        updatedAt: now,
      });
      existingSlugs.add(slug);
      brokerCount++;
    }
  }

  for (let i = 0; i < propFirms.length; i++) {
    for (let j = i + 1; j < propFirms.length; j++) {
      const [aRaw, bRaw] = [propFirms[i], propFirms[j]].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = makeComparisonSlug(aRaw.slug, bRaw.slug);
      if (existingSlugs.has(slug)) continue;

      const data = computePropFirmComparison(aRaw, bRaw);
      await db.insert(comparisonsTable).values({
        entityType: "prop_firm",
        comparisonType: "vs",
        entityAId: aRaw.id,
        entityBId: bRaw.id,
        entityASlug: aRaw.slug,
        entityBSlug: bRaw.slug,
        entityAName: aRaw.name,
        entityBName: bRaw.name,
        slug,
        status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null,
        updatedAt: now,
      });
      existingSlugs.add(slug);
      propFirmCount++;
    }
  }

  return { brokers: brokerCount, propFirms: propFirmCount };
}

export async function regenerateComparisons(ids: string[]): Promise<void> {
  for (const id of ids) {
    const [record] = await db.select().from(comparisonsTable).where(eq(comparisonsTable.id, id));
    if (!record) continue;

    let data: Omit<ComparisonData, "slug"> | null = null;

    if (record.entityType === "broker" && record.entityAId && record.entityBId) {
      const [a] = await db.select().from(brokersTable).where(eq(brokersTable.id, record.entityAId));
      const [b] = await db.select().from(brokersTable).where(eq(brokersTable.id, record.entityBId));
      if (a && b) data = computeBrokerComparison(a, b);
    } else if (record.entityType === "prop_firm" && record.entityAId && record.entityBId) {
      const [a] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, record.entityAId));
      const [b] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, record.entityBId));
      if (a && b) data = computePropFirmComparison(a, b);
    }

    if (!data) continue;

    await db.update(comparisonsTable)
      .set({
        entityAName: data.entityAName,
        entityBName: data.entityBName,
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        updatedAt: new Date(),
      })
      .where(eq(comparisonsTable.id, id));
  }
}

export async function onEntityUpdated(entityType: "broker" | "prop_firm", entityId: string): Promise<void> {
  const records = await db.select().from(comparisonsTable).where(
    and(
      eq(comparisonsTable.entityType, entityType),
      or(eq(comparisonsTable.entityAId, entityId), eq(comparisonsTable.entityBId ?? "", entityId))
    )
  );

  for (const record of records) {
    if (!record.entityBId) continue;
    let data: Omit<ComparisonData, "slug"> | null = null;

    if (entityType === "broker") {
      const [a] = await db.select().from(brokersTable).where(eq(brokersTable.id, record.entityAId));
      const [b] = await db.select().from(brokersTable).where(eq(brokersTable.id, record.entityBId));
      if (a && b) data = computeBrokerComparison(a, b);
    } else {
      const [a] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, record.entityAId));
      const [b] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, record.entityBId));
      if (a && b) data = computePropFirmComparison(a, b);
    }

    if (!data) continue;

    const updatePayload: Partial<typeof comparisonsTable.$inferInsert> = {
      categoryWinners: data.categoryWinners as any,
      overallWinnerId: data.overallWinnerId,
      overallScore: data.overallScore,
      faqData: data.faqData as any,
      updatedAt: new Date(),
    };
    if (record.status === "published") {
      updatePayload.status = "updated";
    }

    await db.update(comparisonsTable).set(updatePayload).where(eq(comparisonsTable.id, record.id));
  }
}

export async function onEntityCreated(entityType: "broker" | "prop_firm", entityId: string): Promise<void> {
  if (entityType === "broker") {
    const [newBroker] = await db.select().from(brokersTable).where(eq(brokersTable.id, entityId));
    if (!newBroker) return;
    const others = await db.select().from(brokersTable).where(ne(brokersTable.id, entityId));
    for (const other of others) {
      const [a, b] = [newBroker, other].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = makeComparisonSlug(a.slug, b.slug);
      const existing = await db.select().from(comparisonsTable).where(eq(comparisonsTable.slug, slug));
      if (existing.length > 0) continue;
      const data = computeBrokerComparison(a, b);
      await db.insert(comparisonsTable).values({
        entityType: "broker", comparisonType: "vs",
        entityAId: a.id, entityBId: b.id,
        entityASlug: a.slug, entityBSlug: b.slug,
        entityAName: a.name, entityBName: b.name,
        slug, status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null, updatedAt: new Date(),
      });
    }
  } else {
    const [newFirm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.id, entityId));
    if (!newFirm) return;
    const others = await db.select().from(propFirmsTable).where(ne(propFirmsTable.id, entityId));
    for (const other of others) {
      const [a, b] = [newFirm, other].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = makeComparisonSlug(a.slug, b.slug);
      const existing = await db.select().from(comparisonsTable).where(eq(comparisonsTable.slug, slug));
      if (existing.length > 0) continue;
      const data = computePropFirmComparison(a, b);
      await db.insert(comparisonsTable).values({
        entityType: "prop_firm", comparisonType: "vs",
        entityAId: a.id, entityBId: b.id,
        entityASlug: a.slug, entityBSlug: b.slug,
        entityAName: a.name, entityBName: b.name,
        slug, status: "draft",
        categoryWinners: data.categoryWinners as any,
        overallWinnerId: data.overallWinnerId,
        overallScore: data.overallScore,
        faqData: data.faqData as any,
        publishedAt: null, updatedAt: new Date(),
      });
    }
  }
}
