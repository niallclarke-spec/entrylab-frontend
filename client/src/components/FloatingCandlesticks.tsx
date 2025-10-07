export function FloatingCandlesticks() {
  const candlesticks = [
    { type: 'bullish', x: 5, bottom: 25, high: 8, low: 4, open: 6, close: 7.5 },
    { type: 'bearish', x: 12, bottom: 32, high: 7, low: 4, open: 6.5, close: 5 },
    { type: 'bullish', x: 19, bottom: 30, high: 10, low: 4, open: 5, close: 9 },
    { type: 'bullish', x: 26, bottom: 38, high: 9, low: 5, open: 6, close: 8.5 },
    { type: 'bearish', x: 33, bottom: 45, high: 8, low: 5, open: 7.5, close: 6 },
    { type: 'bullish', x: 40, bottom: 43, high: 11, low: 5, open: 6.5, close: 10 },
    { type: 'bullish', x: 47, bottom: 52, high: 10, low: 6, open: 7, close: 9.5 },
    { type: 'bearish', x: 54, bottom: 60, high: 7, low: 4, open: 6.5, close: 5.5 },
    { type: 'bullish', x: 61, bottom: 58, high: 12, low: 6, open: 7, close: 11 },
    { type: 'bullish', x: 68, bottom: 67, high: 10, low: 6, open: 7.5, close: 9.5 },
    { type: 'bullish', x: 75, bottom: 75, high: 11, low: 7, open: 8, close: 10.5 },
    { type: 'bearish', x: 82, bottom: 83, high: 8, low: 5, open: 7.5, close: 6 },
    { type: 'bullish', x: 89, bottom: 81, high: 13, low: 7, open: 8, close: 12 },
    { type: 'bullish', x: 96, bottom: 92, high: 11, low: 8, open: 9, close: 10.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent"></div>
      
      <svg 
        className="absolute inset-0 w-full h-full opacity-40" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="transparent" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" className="text-primary" />
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
            <animate
              attributeName="x1"
              values="-100%;100%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="0%;200%"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>

        <polyline
          points={candlesticks.map(c => `${c.x},${100 - c.bottom - (c.open + c.close) / 2}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-primary"
          opacity="0.5"
        />
        
        {candlesticks.map((candle, index) => {
          const bodyTop = 100 - candle.bottom - Math.max(candle.open, candle.close);
          const bodyHeight = Math.abs(candle.close - candle.open);
          const wickTop = 100 - candle.bottom - candle.high;
          const wickBottom = 100 - candle.bottom - candle.low;
          
          const isBullish = candle.type === 'bullish';
          const color = isBullish ? '#10b981' : '#ef4444';
          
          return (
            <g 
              key={index}
              style={{
                animation: `candleGlow 4s ease-in-out ${index * 0.28}s infinite`
              }}
            >
              <line
                x1={candle.x}
                y1={wickTop}
                x2={candle.x}
                y2={wickBottom}
                stroke={color}
                strokeWidth="0.2"
              />
              <rect
                x={candle.x - 1.5}
                y={bodyTop}
                width="3"
                height={bodyHeight}
                fill={isBullish ? color : 'none'}
                stroke={color}
                strokeWidth="0.3"
              />
            </g>
          );
        })}
        
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          fill="url(#scanGradient)" 
          pointerEvents="none"
        />
      </svg>
      
      <style>{`
        @keyframes candleGlow {
          0%, 100% {
            opacity: 0.6;
            filter: brightness(1);
          }
          50% {
            opacity: 1;
            filter: brightness(1.4) drop-shadow(0 0 4px currentColor);
          }
        }
      `}</style>
    </div>
  );
}
