import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketData {
  pair: string;
  price: string;
  change: number;
}

export function MarketTicker() {
  const marketData: MarketData[] = [
    { pair: "EUR/USD", price: "1.0842", change: 0.12 },
    { pair: "GBP/USD", price: "1.2634", change: -0.08 },
    { pair: "USD/JPY", price: "149.85", change: 0.24 },
    { pair: "GOLD", price: "2,018.50", change: 0.56 },
    { pair: "BTC/USD", price: "43,250", change: -1.23 },
  ];

  return (
    <div className="border-b bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {marketData.map((data) => (
            <div key={data.pair} className="flex items-center gap-3 whitespace-nowrap" data-testid={`market-${data.pair}`}>
              <span className="text-sm font-medium text-foreground">{data.pair}</span>
              <span className="text-sm font-mono text-muted-foreground">{data.price}</span>
              <span
                className={`flex items-center gap-1 text-sm font-mono ${
                  data.change >= 0 ? "text-chart-2" : "text-destructive"
                }`}
              >
                {data.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {data.change >= 0 ? "+" : ""}
                {data.change}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
