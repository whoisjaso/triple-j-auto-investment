// Phase 16: Behavioral Intelligence - Session Tracking Hook
//
// Tracks page_view events on every route change. Re-exports trackEvent
// and getSessionId for convenience so components can import from here
// or directly from trackingService.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, getSessionId, getDeviceType } from '../services/trackingService';

/**
 * React hook that tracks page_view events on route changes.
 *
 * Usage: Call once in your top-level App component (inside Router).
 *
 * ```tsx
 * function AppContent() {
 *   useSessionTracking();
 *   return <Routes>...</Routes>;
 * }
 * ```
 *
 * Does NOT track vehicle_view -- that happens in VehicleDetail.tsx (Plan 03).
 */
export function useSessionTracking(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    trackEvent({
      event_type: 'page_view',
      page_path: pathname,
      referrer: document.referrer || undefined,
      device_type: getDeviceType(),
    });
  }, [pathname]);
}

// Re-export for convenience
export { trackEvent, getSessionId };
