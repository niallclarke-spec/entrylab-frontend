import { useEffect, useState } from "react";

interface Symbol {
  id: number;
  text: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

export function FloatingForexSymbols() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  useEffect(() => {
    const forexSymbols = [
      "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "$", "¥", "£", "€",
      "1.0842", "149.85", "+0.12%", "-0.08%", "GOLD", "BTC"
    ];

    const generated = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      text: forexSymbols[Math.floor(Math.random() * forexSymbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
    }));

    setSymbols(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {symbols.map((symbol) => (
        <div
          key={symbol.id}
          className="absolute text-primary/30 font-mono text-sm md:text-base animate-float"
          style={{
            left: `${symbol.x}%`,
            top: `${symbol.y}%`,
            animation: `float ${symbol.duration}s ease-in-out ${symbol.delay}s infinite`,
          }}
        >
          {symbol.text}
        </div>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(20px) rotate(5deg);
            opacity: 0.2;
          }
          90% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
