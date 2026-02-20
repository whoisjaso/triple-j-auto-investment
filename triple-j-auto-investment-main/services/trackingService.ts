// Phase 16: Behavioral Intelligence - Event Tracking Service
//
// Buffers tracking events in memory and flushes to Supabase session_events
// table every 30 seconds. Uses localStorage for persistent session ID.
// Page unload flushes remaining events via fetch with keepalive.

import { supabase } from '../supabase/config';
import type { TrackingEvent } from '../types';

// ================================================================
// SESSION ID
// ================================================================

const SESSION_KEY = 'tj_session_id';

/**
 * Get or create a persistent session UUID.
 * Stored in localStorage so it persists across page loads for the same browser.
 */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private browsing, etc.) -- generate ephemeral ID
    return crypto.randomUUID();
  }
}

// ================================================================
// DEVICE TYPE
// ================================================================

/**
 * Detect device type from viewport width.
 * Matches Tailwind breakpoints: mobile < 768, tablet < 1024, desktop >= 1024.
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// ================================================================
// EVENT BUFFER
// ================================================================

let buffer: TrackingEvent[] = [];

type TrackEventInput = Omit<TrackingEvent, 'session_id' | 'created_at'>;

/**
 * Track an event. Adds session_id and created_at, pushes to buffer.
 * Fire-and-forget -- no async, no await. Auto-flushes at 20 events.
 */
export function trackEvent(event: TrackEventInput): void {
  const fullEvent: TrackingEvent = {
    ...event,
    session_id: getSessionId(),
    created_at: new Date().toISOString(),
  };

  buffer.push(fullEvent);

  // Auto-flush when buffer is large
  if (buffer.length >= 20) {
    flush();
  }
}

// ================================================================
// FLUSH
// ================================================================

/**
 * Flush buffered events to Supabase session_events table.
 * On error, re-queues events to the front of the buffer for retry.
 */
export async function flush(): Promise<void> {
  if (buffer.length === 0) return;

  // Copy and clear buffer atomically
  const events = [...buffer];
  buffer = [];

  try {
    const { error } = await supabase.from('session_events').insert(events);
    if (error) {
      // Re-queue failed events to front of buffer
      buffer = [...events, ...buffer];
      console.warn('Event flush failed, will retry:', error.message);
    }
  } catch {
    // Network error -- re-queue for retry
    buffer = [...events, ...buffer];
  }
}

// Periodic flush every 30 seconds
setInterval(flush, 30_000);

// ================================================================
// UNLOAD FLUSH
// ================================================================

/**
 * Flush remaining events on page unload via fetch with keepalive.
 * Uses direct REST API call (not Supabase client) because keepalive
 * requires a simple fetch. sendBeacon cannot set custom headers.
 */
function flushOnUnload(): void {
  if (buffer.length === 0) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  fetch(`${supabaseUrl}/rest/v1/session_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(buffer),
    keepalive: true,
  }).catch(() => {}); // Fire and forget

  buffer = [];
}

// ================================================================
// UNLOAD LISTENERS
// ================================================================

// Primary: visibilitychange fires reliably on tab switch/close
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushOnUnload();
    }
  });
}

// Fallback: beforeunload for page navigation
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushOnUnload);
}
