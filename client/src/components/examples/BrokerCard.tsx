import { BrokerCard } from '../BrokerCard';

export default function BrokerCardExample() {
  return (
    <div className="max-w-md">
      <BrokerCard
        name="GatesFX"
        logo="https://placehold.co/200x200/3b82f6/ffffff?text=GatesFX"
        verified={true}
        pros={["Scalping friendly", "Low spreads", "1:1000 Leverage"]}
        link="https://example.com/broker"
      />
    </div>
  );
}
