import { FeaturedBroker } from '../FeaturedBroker';

export default function FeaturedBrokerExample() {
  return (
    <FeaturedBroker
      name="GatesFX"
      logo="https://placehold.co/200x200/A855F7/ffffff?text=GatesFX"
      tagline="Professional Trading Without Limits"
      rating={4.8}
      features={[
        { icon: "trending", text: "Low spreads from 0.0 pips" },
        { icon: "shield", text: "Regulated & Secure Platform" },
        { icon: "zap", text: "Lightning-fast execution" },
        { icon: "dollar", text: "No deposit or withdrawal fees" },
      ]}
      highlights={[
        "Trade 200+ instruments including Forex, Indices, and Commodities",
        "Advanced trading platforms: MT4, MT5, and cTrader",
        "Dedicated account manager for serious traders",
        "Instant deposits and same-day withdrawals",
      ]}
      bonusOffer="Get 100% Deposit Bonus"
      link="https://example.com"
    />
  );
}
