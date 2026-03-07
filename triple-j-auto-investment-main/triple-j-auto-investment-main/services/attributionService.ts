import { Attribution } from '../types';

const UTM_STORAGE_KEY = 'tj_utm';
const SESSION_ID_KEY = 'tj_session_id';

/**
 * Capture UTM parameters from the landing URL and persist in sessionStorage.
 * Call ONCE on app initialization. Only captures on initial page load --
 * SPA navigation won't have UTM params in the URL.
 */
export function captureInitialUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');

    if (utmSource) {
      const utmData = {
        utm_source: utmSource,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
      };
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
    }
  } catch {
    // sessionStorage unavailable (private browsing, etc.) -- silently ignore
  }
}

/**
 * Determine device type from viewport width.
 * < 768 = mobile, < 1024 = tablet, else desktop.
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get or create a persistent session ID.
 * Uses the same localStorage key as trackingService (tj_session_id)
 * to avoid cross-service dependency.
 */
function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // localStorage unavailable -- generate ephemeral ID
    return crypto.randomUUID();
  }
}

/**
 * Assemble full attribution data for the current page view.
 * Returns an Attribution object ready to be mapped onto a Lead.
 */
export function captureAttribution(): Attribution {
  let utmData: { utm_source?: string; utm_medium?: string; utm_campaign?: string } = {};

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      utmData = JSON.parse(stored);
    }
  } catch {
    // sessionStorage unavailable or malformed data -- proceed without UTM
  }

  return {
    session_id: getSessionId(),
    page_path: window.location.pathname,
    referrer: document.referrer || '',
    utm_source: utmData.utm_source,
    utm_medium: utmData.utm_medium,
    utm_campaign: utmData.utm_campaign,
    device_type: getDeviceType(),
  };
}
