import { BrokerCardEnhanced } from '../BrokerCardEnhanced';

export default function BrokerCardEnhancedExample() {
  return (
    <div className="max-w-md">
      <BrokerCardEnhanced
        name="HeroFX"
        logo="https://placehold.co/200x200/10b981/ffffff?text=HeroFX"
        verified={true}
        rating={4.6}
        pros={["Up to 1:500 leverage", "Crypto deposits accepted", "Modern TradeLocker platform"]}
        highlights={["Copy Trading", "Mobile Apps", "Educational Resources"]}
        link="https://example.com"
      />
    </div>
  );
}
