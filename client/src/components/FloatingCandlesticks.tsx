export function FloatingCandlesticks() {
  const candlesticks = [
    { type: 'bullish', left: '10%', delay: '0s', duration: '15s' },
    { type: 'bearish', left: '25%', delay: '3s', duration: '18s' },
    { type: 'bullish', left: '45%', delay: '1s', duration: '16s' },
    { type: 'bearish', left: '60%', delay: '4s', duration: '17s' },
    { type: 'bullish', left: '75%', delay: '2s', duration: '19s' },
    { type: 'bearish', left: '85%', delay: '5s', duration: '14s' },
    { type: 'bullish', left: '35%', delay: '6s', duration: '20s' },
    { type: 'bearish', left: '15%', delay: '7s', duration: '15s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {candlesticks.map((candle, index) => (
        <div
          key={index}
          className="absolute bottom-0 opacity-20 pointer-events-none"
          style={{
            left: candle.left,
            animationDelay: candle.delay,
            animation: `floatUp ${candle.duration} linear infinite`,
          }}
        >
          <svg
            width="20"
            height="40"
            viewBox="0 0 20 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {candle.type === 'bullish' ? (
              <>
                <line x1="10" y1="0" x2="10" y2="10" stroke="#10b981" strokeWidth="2" />
                <rect x="5" y="10" width="10" height="20" fill="#10b981" />
                <line x1="10" y1="30" x2="10" y2="40" stroke="#10b981" strokeWidth="2" />
              </>
            ) : (
              <>
                <line x1="10" y1="0" x2="10" y2="10" stroke="#ef4444" strokeWidth="2" />
                <rect x="5" y="10" width="10" height="20" fill="#ef4444" />
                <line x1="10" y1="30" x2="10" y2="40" stroke="#ef4444" strokeWidth="2" />
              </>
            )}
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          80% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
