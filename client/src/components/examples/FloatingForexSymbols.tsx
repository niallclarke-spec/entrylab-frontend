import { FloatingForexSymbols } from '../FloatingForexSymbols';

export default function FloatingForexSymbolsExample() {
  return (
    <div className="relative h-96 bg-gradient-to-br from-primary/20 via-background to-chart-2/20 overflow-hidden">
      <FloatingForexSymbols />
      <div className="relative z-10 flex items-center justify-center h-full">
        <p className="text-foreground text-2xl font-bold">Floating Forex Animation</p>
      </div>
    </div>
  );
}
