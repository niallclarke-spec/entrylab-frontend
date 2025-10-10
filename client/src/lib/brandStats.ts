interface BrandStats {
  baseTraderCount: number;
  baseDollarValue: number;
  dailyTraderIncrease: number;
  dailyDollarIncrease: number;
}

interface BrandStatsConfig {
  [brandName: string]: BrandStats;
}

// Launch date for calculations
const LAUNCH_DATE = new Date('2025-10-10');

// Brand-specific statistics
const BRAND_STATS: BrandStatsConfig = {
  // Brokers
  'herofx': {
    baseTraderCount: 72,
    baseDollarValue: 37000,
    dailyTraderIncrease: 2,
    dailyDollarIncrease: 726,
  },
  'gatesfx': {
    baseTraderCount: 12,
    baseDollarValue: 11230,
    dailyTraderIncrease: 1,
    dailyDollarIncrease: 241,
  },
  'liquid brokers': {
    baseTraderCount: 9,
    baseDollarValue: 9230,
    dailyTraderIncrease: 1,
    dailyDollarIncrease: 381,
  },
  // Prop Firms
  'funderpro': {
    baseTraderCount: 44,
    baseDollarValue: 8730,
    dailyTraderIncrease: 2,
    dailyDollarIncrease: 178,
  },
  'tx3 funding': {
    baseTraderCount: 8,
    baseDollarValue: 1110,
    dailyTraderIncrease: 1,
    dailyDollarIncrease: 97,
  },
};

// Default values for new brands
const DEFAULT_BROKER_STATS: BrandStats = {
  baseTraderCount: 11,
  baseDollarValue: 1700,
  dailyTraderIncrease: 1,
  dailyDollarIncrease: 50,
};

const DEFAULT_PROP_FIRM_STATS: BrandStats = {
  baseTraderCount: 7,
  baseDollarValue: 680,
  dailyTraderIncrease: 1,
  dailyDollarIncrease: 30,
};

// Calculate days since launch
function getDaysSinceLaunch(): number {
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysSince); // Ensure non-negative
}

// Format dollar value with commas
function formatDollarValue(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

// Get current stats for a brand
export function getBrandStats(brandName: string, brandType: 'broker' | 'prop-firm'): {
  traderCount: number;
  dollarValue: string;
} {
  const normalizedName = brandName.toLowerCase().trim();
  const daysSince = getDaysSinceLaunch();
  
  // Get brand stats or use defaults
  const stats = BRAND_STATS[normalizedName] || 
    (brandType === 'prop-firm' ? DEFAULT_PROP_FIRM_STATS : DEFAULT_BROKER_STATS);
  
  // Calculate current values
  const traderCount = stats.baseTraderCount + (daysSince * stats.dailyTraderIncrease);
  const dollarValue = stats.baseDollarValue + (daysSince * stats.dailyDollarIncrease);
  
  return {
    traderCount,
    dollarValue: formatDollarValue(dollarValue),
  };
}

// Get message text based on brand type
export function getBrandMessage(brandType: 'broker' | 'prop-firm', traderCount: number, dollarValue: string): string {
  if (brandType === 'prop-firm') {
    return `💰 We have saved ${traderCount} traders up to ${dollarValue} in challenge fees`;
  } else {
    return `🎁 ${traderCount} traders unlocked bonuses worth ${dollarValue} through our alerts`;
  }
}
