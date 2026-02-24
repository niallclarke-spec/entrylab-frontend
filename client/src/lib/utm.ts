const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CLICK_ID_KEYS = ['gclid', 'fbclid'] as const;

export type UTMKey = typeof UTM_KEYS[number];
export type ClickIdKey = typeof CLICK_ID_KEYS[number];

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface ClickIdParams {
  gclid?: string;
  fbclid?: string;
}

export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams(window.location.search);
  
  UTM_KEYS.forEach(key => {
    const value = params.get(key);
    if (value) {
      localStorage.setItem(key, value);
    }
  });

  CLICK_ID_KEYS.forEach(key => {
    const value = params.get(key);
    if (value) {
      sessionStorage.setItem(key, value);
    }
  });
}

export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  const utmParams: UTMParams = {};
  
  UTM_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  return utmParams;
}

export function getStoredClickIds(): ClickIdParams {
  if (typeof window === 'undefined') return {};
  
  const clickIds: ClickIdParams = {};
  
  CLICK_ID_KEYS.forEach(key => {
    const value = sessionStorage.getItem(key);
    if (value) {
      clickIds[key] = value;
    }
  });
  
  return clickIds;
}

export function clearUTMParams(): void {
  if (typeof window === 'undefined') return;
  
  UTM_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  CLICK_ID_KEYS.forEach(key => {
    sessionStorage.removeItem(key);
  });
}

export function hasStoredUTMParams(): boolean {
  if (typeof window === 'undefined') return false;
  
  return UTM_KEYS.some(key => localStorage.getItem(key) !== null);
}
