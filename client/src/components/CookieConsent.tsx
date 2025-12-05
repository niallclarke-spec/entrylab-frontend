import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from 'wouter';

const COOKIE_CONSENT_KEY = 'entrylab_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365;

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface ConsentData {
  status: ConsentStatus;
  timestamp: number;
  expiry: number;
}

function getStoredConsent(): ConsentData | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const data: ConsentData = JSON.parse(stored);
    
    if (Date.now() > data.expiry) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

function setStoredConsent(status: ConsentStatus): void {
  const data: ConsentData = {
    status,
    timestamp: Date.now(),
    expiry: Date.now() + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent || consent.status === 'pending') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 50);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setStoredConsent('accepted');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleReject = () => {
    setStoredConsent('rejected');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
      role="dialog"
      aria-label="Cookie consent"
      data-testid="cookie-consent-banner"
    >
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div 
          className="relative overflow-hidden rounded-xl border border-white/10 p-4 sm:p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 30, 28, 0.95) 0%, rgba(20, 24, 22, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(43, 179, 42, 0.1)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2bb32a]/5 via-transparent to-[#2bb32a]/5 pointer-events-none" />
          
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex-shrink-0 rounded-lg bg-[#2bb32a]/10 p-2">
                <Cookie className="h-5 w-5 text-[#2bb32a]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/90 leading-relaxed">
                  We use cookies to enhance your experience and analyze site traffic. 
                  <Link href="/terms" className="ml-1 text-[#2bb32a] hover:underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:flex-shrink-0">
              <button
                onClick={handleReject}
                className="flex-1 sm:w-28 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  bg-white/5 text-white/80 border border-white/10
                  hover:bg-white/10 hover:text-white hover:border-white/20
                  focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#1a1e1c]"
                data-testid="button-reject-cookies"
              >
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 sm:w-28 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  bg-[#2bb32a] text-white border border-[#2bb32a]
                  hover:bg-[#239b22] hover:border-[#239b22]
                  focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/50 focus:ring-offset-2 focus:ring-offset-[#1a1e1c]"
                data-testid="button-accept-cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored.status);
    }
  }, []);

  return consent;
}
