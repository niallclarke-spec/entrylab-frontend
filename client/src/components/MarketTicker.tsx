import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface MarketData {
  pair: string;
  price: string;
  change: string;
}

const fallbackData: MarketData[] = [
  { pair: "EUR/USD", price: "1.0842", change: "0.12" },
  { pair: "GBP/USD", price: "1.2634", change: "-0.08" },
  { pair: "USD/JPY", price: "149.85", change: "0.24" },
  { pair: "GOLD", price: "2,018", change: "0.56" },
  { pair: "BTC/USD", price: "43,250", change: "-1.23" },
];

export function MarketTicker() {
  const { data: marketData } = useQuery<MarketData[]>({
    queryKey: ["/api/forex/quotes"],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const displayData = marketData ?? fallbackData;

  return (
    <div className="border-b bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {displayData.map((data) => {
            const changeValue = parseFloat(data.change);
            return (
              <div key={data.pair} className="flex items-center gap-3 whitespace-nowrap" data-testid={`market-${data.pair}`}>
                <span className="text-sm font-medium text-foreground">{data.pair}</span>
                <span className="text-sm font-mono text-muted-foreground">{data.price}</span>
                <span
                  className={`flex items-center gap-1 text-sm font-mono ${
                    changeValue >= 0 ? "text-chart-2" : "text-destructive"
                  }`}
                >
                  {changeValue >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {changeValue >= 0 ? "+" : ""}
                  {data.change}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
