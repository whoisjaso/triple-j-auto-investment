# Phase 16: Behavioral Intelligence - Research

**Researched:** 2026-02-19
**Domain:** Anonymous visitor tracking, recommendation engine, urgency signals, conversion attribution (React SPA + Supabase)
**Confidence:** HIGH

## Summary

Phase 16 adds an intelligence layer that tracks anonymous visitor behavior, surfaces recently viewed vehicles, shows honest urgency badges, and captures conversion attribution. The existing codebase already has the foundations: `useSavedVehicles` hook uses localStorage for vehicle IDs, `vehicleLeadService.ts` creates leads with `vehicle_id`/`action_type`/`commitment_level`, and the leads table already accepts anonymous inserts via RLS (`"Anyone can create leads" ON public.leads FOR INSERT WITH CHECK (true)`).

The recommended approach uses a client-side session ID (UUID in localStorage) paired with two new Supabase tables (`session_events` and `vehicle_view_counts`) plus attribution columns on the existing `leads` table. No Supabase Anonymous Auth is needed -- the existing `anon` role RLS policies allow public inserts, and tracking events are lightweight writes that need no authentication. pg_cron IS available on Supabase Free tier for data retention cleanup (delete events older than 90 days). The 500MB database limit is generous for a single-location BHPH dealership with ~20-50 active vehicles.

**Primary recommendation:** Generate a UUID session ID on first visit (stored in localStorage as `tj_session_id`), batch tracking events client-side (flush every 30 seconds or on page unload via `sendBeacon`), and compute urgency/recommendations from existing vehicle data + view counts -- all without requiring Supabase Auth or any third-party analytics library.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | (existing) | Database writes for events, reads for counts | Already the project's data layer |
| React Context | (built-in) | Session ID propagation to all components | Pattern from Segment/PostHog anonymous tracking |
| localStorage | (Web API) | Session ID persistence, recently viewed list, event buffer | Already used for `tj_saved_vehicles` |
| sendBeacon | (Web API) | Flush event buffer on page unload | Guaranteed delivery even during navigation |

### Supporting (No New Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | (Web API) | Generate session UUID | Built into all modern browsers, no library needed |
| pg_cron | (Supabase extension) | Scheduled cleanup of old session events | Data retention, available on Free tier |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side session ID | Supabase Anonymous Auth | Anonymous Auth creates auth.users rows (bloat), counts against 50K MAU limit, rate-limited to 30/hr; client UUID is simpler and free |
| Custom tracking | PostHog / Segment | Would add dependency, bundle size, and external service; custom is better for a single dealership |
| pg_cron for cleanup | Edge Function on schedule | pg_cron is simpler (pure SQL), no invocation limits |
| localStorage for events | IndexedDB | localStorage is simpler, already used in project, and event buffer is small (<50KB) |

**Installation:** No new packages needed. Everything uses existing Supabase JS client and Web APIs.

## Architecture Patterns

### Recommended Project Structure
```
triple-j-auto-investment-main/
  services/
    trackingService.ts       # Session ID, event buffering, flush logic
    recommendationService.ts  # Vehicle similarity scoring
    urgencyService.ts         # Badge computation from real data
  hooks/
    useSessionTracking.ts     # React hook wrapping trackingService
    useRecentlyViewed.ts      # Recently viewed vehicles from localStorage
    useUrgencyBadges.ts       # Compute and cache badges per vehicle
  components/
    RecentlyViewedRow.tsx     # Horizontal scroll row of recently viewed
    UrgencyBadge.tsx          # "Just Arrived" / "Popular" / "Offer Received"
    AdminBehaviorPanel.tsx    # Admin dashboard section for session data
  lib/store/
    leads.ts                  # (modify) Add attribution fields to addLead
  supabase/
    phase-16-migration.sql    # New tables + columns + RLS + pg_cron
```

### Pattern 1: Client-Side Event Buffering with Background Flush
**What:** Accumulate tracking events in a memory buffer, flush to Supabase in batches
**When to use:** Always -- individual event writes would overwhelm the client and API
**Example:**
```typescript
// trackingService.ts
const FLUSH_INTERVAL = 30_000; // 30 seconds
const STORAGE_KEY = 'tj_session_id';
const BUFFER_KEY = 'tj_event_buffer';

interface TrackingEvent {
  session_id: string;
  event_type: 'page_view' | 'vehicle_view' | 'cta_click' | 'form_open' | 'calculator_use' | 'save_toggle' | 'dwell';
  vehicle_id?: string;
  page_path: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Get or create session ID
function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

// In-memory event buffer
let buffer: TrackingEvent[] = [];

function trackEvent(event: Omit<TrackingEvent, 'session_id' | 'created_at'>) {
  buffer.push({
    ...event,
    session_id: getSessionId(),
    created_at: new Date().toISOString(),
  });

  // Auto-flush if buffer grows large
  if (buffer.length >= 20) flush();
}

async function flush() {
  if (buffer.length === 0) return;
  const events = [...buffer];
  buffer = [];

  try {
    const { error } = await supabase.from('session_events').insert(events);
    if (error) {
      // Re-queue failed events
      buffer = [...events, ...buffer];
      console.warn('Event flush failed, will retry:', error.message);
    }
  } catch {
    buffer = [...events, ...buffer];
  }
}

// Periodic flush
setInterval(flush, FLUSH_INTERVAL);

// Flush on page unload via sendBeacon (guaranteed delivery)
window.addEventListener('beforeunload', () => {
  if (buffer.length === 0) return;
  const payload = JSON.stringify(buffer);
  // sendBeacon sends to a Supabase Edge Function endpoint
  // (or direct REST API for simple inserts)
  navigator.sendBeacon(
    `${SUPABASE_URL}/rest/v1/session_events`,
    new Blob([payload], { type: 'application/json' })
  );
});
```

### Pattern 2: Recently Viewed via localStorage (No DB Round-Trip)
**What:** Store last N viewed vehicle IDs in localStorage, resolve to Vehicle objects from the store
**When to use:** For the "You recently viewed" row -- fast, no API call needed
**Example:**
```typescript
// hooks/useRecentlyViewed.ts
const RECENTLY_VIEWED_KEY = 'tj_recently_viewed';
const MAX_RECENT = 8;

interface ViewedEntry { vehicleId: string; viewedAt: string; }

export function useRecentlyViewed() {
  const [entries, setEntries] = useState<ViewedEntry[]>(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const addViewed = useCallback((vehicleId: string) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.vehicleId !== vehicleId);
      const next = [{ vehicleId, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { entries, addViewed, vehicleIds: entries.map(e => e.vehicleId) };
}
```

### Pattern 3: Urgency Badges from Real Data
**What:** Compute badges purely from existing vehicle data (date_added, view counts, lead commitment_levels)
**When to use:** On inventory cards and vehicle detail pages
**Example:**
```typescript
// services/urgencyService.ts
type UrgencyBadge =
  | { type: 'just_arrived'; label: string; labelEs: string }
  | { type: 'popular'; label: string; labelEs: string; viewCount: number }
  | { type: 'offer_received'; label: string; labelEs: string };

function computeBadges(vehicle: Vehicle, viewCount: number, hasOffer: boolean): UrgencyBadge[] {
  const badges: UrgencyBadge[] = [];
  const daysListed = vehicle.dateAdded
    ? Math.floor((Date.now() - new Date(vehicle.dateAdded).getTime()) / 86400000)
    : null;

  // Just Arrived: listed within last 7 days
  if (daysListed !== null && daysListed <= 7) {
    badges.push({ type: 'just_arrived', label: 'Just Arrived', labelEs: 'Recien Llegado' });
  }

  // Popular: 10+ views in last 7 days
  if (viewCount >= 10) {
    badges.push({ type: 'popular', label: `Popular - ${viewCount} views`, labelEs: `Popular - ${viewCount} vistas`, viewCount });
  }

  // Offer Received: has a lead with commitment_level >= 3 (reserve)
  if (hasOffer) {
    badges.push({ type: 'offer_received', label: 'Offer Received', labelEs: 'Oferta Recibida' });
  }

  return badges;
}
```

### Pattern 4: Attribution Capture on Lead Creation
**What:** Enrich every lead with source data (page, vehicle, device, referrer, UTM params)
**When to use:** When any lead-creating form is submitted
**Example:**
```typescript
// Extend createVehicleLead to capture attribution
interface Attribution {
  page_path: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  session_id: string;
}

function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const width = window.innerWidth;
  return {
    page_path: window.location.pathname,
    referrer: document.referrer || '',
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    device_type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
    session_id: getSessionId(),
  };
}
```

### Pattern 5: Simple Vehicle Recommendations (Content-Based Filtering)
**What:** Score vehicles by attribute similarity to what the visitor has viewed
**When to use:** For "You might also like" section on vehicle detail page
**Example:**
```typescript
// services/recommendationService.ts
function scoreSimilarity(a: Vehicle, b: Vehicle): number {
  let score = 0;
  // Same make = strong signal
  if (a.make === b.make) score += 3;
  // Price within 20% = moderate signal
  const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
  if (priceDiff <= 0.2) score += 2;
  // Year within 3 = mild signal
  if (Math.abs(a.year - b.year) <= 3) score += 1;
  // Similar mileage (within 20K)
  if (Math.abs(a.mileage - b.mileage) <= 20000) score += 1;
  return score;
}

function getRecommendations(viewedVehicles: Vehicle[], allVehicles: Vehicle[], limit = 4): Vehicle[] {
  const viewedIds = new Set(viewedVehicles.map(v => v.id));
  const candidates = allVehicles.filter(v =>
    !viewedIds.has(v.id) && v.status === 'Available'
  );

  // Score each candidate against the user's viewing history
  const scored = candidates.map(candidate => ({
    vehicle: candidate,
    score: viewedVehicles.reduce((sum, viewed) => sum + scoreSimilarity(viewed, candidate), 0),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.vehicle);
}
```

### Anti-Patterns to Avoid
- **Individual event writes:** Never write each click/view as a separate Supabase call. Buffer and batch.
- **Supabase Anonymous Auth for tracking:** Creates real user rows in auth.users. Use client-side UUID instead.
- **Real-time subscriptions for event data:** Don't subscribe to session_events changes. This table will be write-heavy; admins read it on demand.
- **Fake urgency badges:** Never show "Popular" for zero views or "Offer Received" without a real commitment_level >= 3 lead. The architecture spec explicitly requires honest signals.
- **Blocking the main thread:** All tracking writes must be fire-and-forget. Never await a tracking call in a user-facing flow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session ID generation | Custom random string | `crypto.randomUUID()` | Built-in, RFC 4122 compliant, available in all modern browsers |
| Page unload event flush | Custom fetch + keepalive | `navigator.sendBeacon()` | Designed specifically for this use case, guaranteed delivery |
| Periodic data cleanup | Manual admin SQL or Edge Function | pg_cron (available on Free tier) | Runs inside Postgres, zero external dependencies, zero invocation limits |
| View count aggregation | Real-time counter table | Materialized count from `session_events` via SQL query with date filter | Avoid complex triggers; simple COUNT query with index is fast enough for <50 vehicles |
| Device type detection | User-agent parsing library | `window.innerWidth` breakpoints | Matches Tailwind breakpoints already in use (768/1024), no library needed |
| UTM parameter parsing | UTM parsing library | `URLSearchParams` (built-in) | 3 lines of code, no dependency |

**Key insight:** This entire phase uses zero new dependencies. Everything is built on existing Supabase JS client, Web APIs (localStorage, sendBeacon, crypto.randomUUID, URLSearchParams, IntersectionObserver), and pg_cron.

## Common Pitfalls

### Pitfall 1: Database Bloat from Unbounded Event Storage
**What goes wrong:** session_events table grows indefinitely, hitting the 500MB Supabase Free tier limit
**Why it happens:** A single-location dealership gets modest traffic (~100-500 visitors/day), but each visitor generates 5-20 events per session. At 500 visitors/day * 15 events/visit, that is 7,500 rows/day or ~225K rows/month.
**How to avoid:**
1. Use pg_cron to delete events older than 90 days: `DELETE FROM session_events WHERE created_at < NOW() - INTERVAL '90 days'`
2. Keep event payload small (no large JSON blobs in metadata)
3. Pre-aggregate view counts into `vehicle_view_counts` table (daily rollups via pg_cron)
**Warning signs:** Check `pg_total_relation_size('session_events')` periodically in admin

### Pitfall 2: sendBeacon Header Limitations
**What goes wrong:** sendBeacon to Supabase REST API fails because you cannot set custom headers (like `apikey` and `Authorization`)
**Why it happens:** sendBeacon only supports limited Content-Type headers and cannot add arbitrary headers
**How to avoid:** Two options:
1. Use a Supabase Edge Function endpoint that accepts the beacon payload (preferred)
2. Use `fetch` with `keepalive: true` instead of sendBeacon (works in modern browsers, allows headers)
3. Fallback: just flush buffer on `visibilitychange` event (when tab becomes hidden) using normal fetch
**Warning signs:** Events missing on page navigation

### Pitfall 3: RLS Policy Blocking Anonymous Event Inserts
**What goes wrong:** Tracking events fail to insert because the table requires authentication
**Why it happens:** New tables default to restrictive RLS. The existing leads table already has `FOR INSERT WITH CHECK (true)` but new tables won't.
**How to avoid:** Create explicit RLS policies for `session_events`:
```sql
-- Allow anonymous inserts (anyone can track)
CREATE POLICY "Anyone can insert session events" ON public.session_events
  FOR INSERT TO anon WITH CHECK (true);
-- Only admins can read (privacy)
CREATE POLICY "Admins can read session events" ON public.session_events
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```
**Warning signs:** 403 errors in console on non-authenticated pages

### Pitfall 4: Recently Viewed Showing Sold/Removed Vehicles
**What goes wrong:** User returns and sees "Recently Viewed" with vehicles that are now sold
**Why it happens:** localStorage stores vehicle IDs but doesn't know about status changes
**How to avoid:** When rendering the recently viewed row, filter against the current vehicles list from the store. If a vehicle is not in the store or has status `Sold`, show it grayed out with "Sold" label or omit it entirely.
**Warning signs:** Dead links in recently viewed row

### Pitfall 5: Over-Tracking Causing Performance Issues
**What goes wrong:** Tracking every mouse move, scroll pixel, or intersection creates massive event volume
**Why it happens:** The spec mentions "hesitation points" which could be interpreted as granular mouse tracking
**How to avoid:** Track only meaningful events:
- `vehicle_view`: once per vehicle per session (deduplicate in buffer)
- `cta_click`: on button clicks (phone, form, calculator, save)
- `form_open`: when engagement forms expand
- `dwell`: single event per page with total time spent (computed on departure)
- Do NOT track: scroll position, mouse movements, hover states
**Warning signs:** Event buffer growing faster than 1 event/second sustained

### Pitfall 6: Attribution Data Lost Due to SPA Navigation
**What goes wrong:** UTM parameters from the initial landing URL are lost when the user navigates to a vehicle detail page
**Why it happens:** React Router client-side navigation doesn't preserve query parameters
**How to avoid:** Capture UTM params on app initialization and store in sessionStorage:
```typescript
// In App.tsx or StoreProvider initialization
const params = new URLSearchParams(window.location.search);
if (params.get('utm_source')) {
  sessionStorage.setItem('tj_utm', JSON.stringify({
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  }));
}
```
**Warning signs:** All leads showing empty attribution

## Database Schema Design

### New Table: `session_events`
```sql
CREATE TABLE public.session_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,                    -- client-generated UUID
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'vehicle_view', 'cta_click', 'form_open',
    'calculator_use', 'save_toggle', 'dwell'
  )),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,          -- flexible: { button: 'reserve', dwell_seconds: 45 }
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_session_events_session ON session_events(session_id);
CREATE INDEX idx_session_events_vehicle ON session_events(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_session_events_type ON session_events(event_type);
CREATE INDEX idx_session_events_created ON session_events(created_at DESC);
CREATE INDEX idx_session_events_vehicle_type_date ON session_events(vehicle_id, event_type, created_at)
  WHERE event_type = 'vehicle_view';  -- For popular badge counting

-- RLS
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON public.session_events
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins read events" ON public.session_events
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```

### New Table: `vehicle_view_counts` (Aggregated by pg_cron)
```sql
CREATE TABLE public.vehicle_view_counts (
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE PRIMARY KEY,
  views_7d INTEGER DEFAULT 0,              -- views in last 7 days
  views_30d INTEGER DEFAULT 0,             -- views in last 30 days
  unique_sessions_7d INTEGER DEFAULT 0,    -- unique visitors in 7 days
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicle_view_counts ENABLE ROW LEVEL SECURITY;
-- Public can read (needed for urgency badges on public pages)
CREATE POLICY "Public reads view counts" ON public.vehicle_view_counts
  FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage view counts" ON public.vehicle_view_counts
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```

### Modify Existing Table: `leads` (Add Attribution Columns)
```sql
-- Attribution columns on leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Index for attribution queries
CREATE INDEX idx_leads_session ON leads(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_leads_utm ON leads(utm_source) WHERE utm_source IS NOT NULL;
```

### pg_cron Jobs
```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Daily view count aggregation (2 AM UTC)
SELECT cron.schedule(
  'aggregate-view-counts',
  '0 2 * * *',
  $$
  INSERT INTO vehicle_view_counts (vehicle_id, views_7d, views_30d, unique_sessions_7d, last_updated)
  SELECT
    vehicle_id,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as views_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as views_30d,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as unique_sessions_7d,
    NOW()
  FROM session_events
  WHERE event_type = 'vehicle_view' AND vehicle_id IS NOT NULL
  GROUP BY vehicle_id
  ON CONFLICT (vehicle_id) DO UPDATE SET
    views_7d = EXCLUDED.views_7d,
    views_30d = EXCLUDED.views_30d,
    unique_sessions_7d = EXCLUDED.unique_sessions_7d,
    last_updated = NOW()
  $$
);

-- 2. Weekly cleanup of old events (Saturday 3:30 AM UTC)
SELECT cron.schedule(
  'cleanup-old-events',
  '30 3 * * 6',
  $$ DELETE FROM session_events WHERE created_at < NOW() - INTERVAL '90 days' $$
);

-- 3. Weekly cleanup of cron run history
SELECT cron.schedule(
  'cleanup-cron-history',
  '0 4 * * 6',
  $$ DELETE FROM cron.job_run_details WHERE end_time < NOW() - INTERVAL '30 days' $$
);
```

### Database Size Estimation (Free Tier Viability)
| Data | Row Size (est.) | Rows/Month | Monthly Growth |
|------|----------------|------------|----------------|
| session_events | ~200 bytes/row | 225,000 (500 visits * 15 events * 30 days) | ~45 MB |
| vehicle_view_counts | ~50 bytes/row | 50 (1 per vehicle) | negligible |
| leads attribution columns | ~150 bytes added | 100-500 leads | negligible |
| With 90-day retention | | | ~135 MB peak |

**Verdict:** ~135 MB peak is well within the 500 MB free tier limit, leaving 365 MB for the rest of the database (vehicles, leads, registrations, rentals, plates, etc.). This is viable.

## Code Examples

### sendBeacon Workaround for Supabase Auth Headers
```typescript
// Use fetch with keepalive instead of sendBeacon to include auth headers
function flushOnUnload() {
  if (buffer.length === 0) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  fetch(`${supabaseUrl}/rest/v1/session_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',  // Don't wait for response body
    },
    body: JSON.stringify(buffer),
    keepalive: true,  // Survives page unload like sendBeacon
  }).catch(() => {}); // Fire and forget

  buffer = [];
}

// Listen for both events for maximum reliability
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushOnUnload();
});
window.addEventListener('beforeunload', flushOnUnload);
```

### Vehicle Dwell Time Tracking
```typescript
// In VehicleDetail.tsx - track time spent on vehicle page
useEffect(() => {
  if (!vehicle) return;
  const startTime = Date.now();

  trackEvent({
    event_type: 'vehicle_view',
    vehicle_id: vehicle.id,
    page_path: window.location.pathname,
  });

  return () => {
    const dwellSeconds = Math.round((Date.now() - startTime) / 1000);
    if (dwellSeconds >= 3) { // Only track if they stayed 3+ seconds
      trackEvent({
        event_type: 'dwell',
        vehicle_id: vehicle.id,
        page_path: window.location.pathname,
        metadata: { dwell_seconds: dwellSeconds },
      });
    }
  };
}, [vehicle?.id]);
```

### Admin Behavior Panel Query Pattern
```typescript
// Fetch session behavior data for admin dashboard
async function fetchBehaviorSummary() {
  // Top viewed vehicles (last 7 days)
  const { data: topViewed } = await supabase
    .from('vehicle_view_counts')
    .select('vehicle_id, views_7d, unique_sessions_7d')
    .order('views_7d', { ascending: false })
    .limit(10);

  // Recent sessions with activity count
  const { data: recentSessions } = await supabase
    .from('session_events')
    .select('session_id, created_at, event_type, vehicle_id')
    .order('created_at', { ascending: false })
    .limit(200);

  // Lead attribution breakdown
  const { data: attributionData } = await supabase
    .from('leads')
    .select('utm_source, utm_medium, device_type, page_path, created_at')
    .not('session_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  return { topViewed, recentSessions, attributionData };
}
```

### UrgencyBadge Component Pattern
```typescript
// components/UrgencyBadge.tsx
interface UrgencyBadgeProps {
  type: 'just_arrived' | 'popular' | 'offer_received';
  label: string;
  className?: string;
}

const BADGE_STYLES = {
  just_arrived: 'bg-green-950/60 border-green-500/40 text-green-400',
  popular: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
  offer_received: 'bg-red-950/60 border-red-500/40 text-red-400',
};

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ type, label, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[8px] font-bold uppercase tracking-[0.15em] ${BADGE_STYLES[type]} ${className}`}>
    {label}
  </span>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookie-based tracking | localStorage UUID + Privacy-first | 2023+ (GDPR/CCPA) | No cookies needed, no consent banner for analytics |
| Individual event API calls | Batched writes with buffer + flush | Standard practice | 10-50x fewer API calls |
| Server-side session management | Client-side session ID | SPA standard | No server roundtrip for session creation |
| ML recommendation engines | Content-based attribute similarity | Always valid for small catalogs | Works perfectly with <100 vehicles, no training data needed |
| Third-party analytics (GA4, etc.) | First-party tracking to own DB | 2024+ privacy trend | Full data ownership, no third-party dependency, BHPH customer privacy |

**Deprecated/outdated:**
- Cookie-based anonymous tracking: Triggers consent requirements. localStorage UUID is simpler and exempt from most cookie laws since it doesn't track across domains.
- Supabase anonymous auth for mere tracking: Overkill. Creates real users. Use client-side UUID with anon role RLS instead.

## Recommendation Decisions (Claude's Discretion Items)

### Session Tracking
- **Threshold:** Start tracking immediately on first page load (generate UUID). No minimum threshold -- even a single page view is useful data.
- **Data retention:** 90 days. BHPH sales cycle is typically 1-4 weeks; 90 days captures the full funnel with margin. pg_cron cleanup weekly.
- **Cross-device linking:** Not implemented in Phase 16. Single-browser only. When a lead is created with phone number, the session_id is captured on the lead, enabling future cross-referencing if needed.

### Recently Viewed
- **Placement:** Vehicle detail page (below engagement spectrum) and inventory page (top section for returning visitors, only shown if they have viewed vehicles before).
- **Count:** 4-6 vehicles shown (responsive: 4 on mobile, 6 on desktop).
- **Sold vehicles:** Show grayed out with "Sold" overlay. Remove from list only if vehicle is completely deleted from database.

### Urgency Badges
- **Badge types:** All three -- Just Arrived, Popular, Offer Received.
- **Thresholds:**
  - Just Arrived: `date_added` within last 7 days
  - Popular: 10+ views in last 7 days (from `vehicle_view_counts.views_7d`)
  - Offer Received: At least 1 lead with `commitment_level >= 3` (reserve action)
- **Placement:** Both inventory cards and vehicle detail page. On cards: below the status badge. On detail page: inline with the vehicle title area.
- **Visual treatment:** Bilingual text badges with color-coded borders (green/amber/red). No icons -- just uppercase text to match existing design language.
- **Honesty enforcement:** Purely data-driven. No admin override to manually add badges. If data doesn't support it, badge doesn't show.

### Attribution & Admin Visibility
- **Source data captured:** page_path, referrer, utm_source, utm_medium, utm_campaign, device_type, session_id (7 columns on leads table).
- **Admin view:** Add a "Behavior Intelligence" section to the existing admin Dashboard page. Show: top viewed vehicles (last 7 days), recent session activity feed, lead attribution breakdown (by source, device, page). View-only initially, no export.
- **Real-time vs historical:** Historical only. Data refreshes when admin loads the dashboard. No real-time subscriptions for behavior data (too expensive for free tier).

## Open Questions

1. **sendBeacon vs fetch+keepalive reliability**
   - What we know: `fetch` with `keepalive: true` supports custom headers and works in Chrome/Edge/Firefox/Safari. sendBeacon does not support custom headers.
   - What's unclear: Whether `keepalive` fetch reliably completes during page unload across all mobile browsers (especially Safari on iOS).
   - Recommendation: Use `visibilitychange` as primary flush trigger (more reliable than `beforeunload`), with `beforeunload` as fallback. Both use `fetch` with `keepalive`. Accept that some page-unload events may be lost -- this is acceptable for analytics data.

2. **Supabase REST API rate limits on Free tier**
   - What we know: Supabase Free tier has "unlimited API requests" according to pricing page, but there may be practical rate limits.
   - What's unclear: Whether batch inserting 20 rows every 30 seconds from hundreds of concurrent visitors could be throttled.
   - Recommendation: The batching approach inherently limits API calls. Even 500 concurrent visitors flushing every 30 seconds = ~17 requests/second, well within any reasonable limit. Monitor for 429 errors in production.

3. **View count freshness for urgency badges**
   - What we know: pg_cron aggregates counts daily at 2 AM UTC.
   - What's unclear: Whether day-old counts are fresh enough for "Popular" badges.
   - Recommendation: Daily aggregation is sufficient. "12 people viewed this week" doesn't need minute-level accuracy. If real-time counts are later desired, a simple COUNT query on session_events can supplement the materialized counts -- but optimize only if needed.

## Sources

### Primary (HIGH confidence)
- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase pg_cron documentation: https://supabase.com/docs/guides/cron/quickstart
- Supabase Anonymous Sign-Ins documentation: https://supabase.com/docs/guides/auth/auth-anonymous
- MDN sendBeacon documentation: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
- Existing codebase: `useSavedVehicles.ts`, `vehicleLeadService.ts`, `leads.ts`, `schema.sql`, `types.ts`, `Store.tsx`, `VehicleDetail.tsx`

### Secondary (MEDIUM confidence)
- Supabase pricing page (verified 500MB free tier, pg_cron available): https://supabase.com/pricing
- Supabase GitHub discussion confirming pg_cron on free tier: https://github.com/orgs/supabase/discussions/37405
- Segment anonymousId pattern (industry standard for client-side session IDs): https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/identity/
- Supabase RLS performance best practices: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv

### Tertiary (LOW confidence)
- WebSearch results on SPA tracking best practices (multiple sources agree on localStorage + batching pattern)
- WebSearch results on content-based vehicle recommendations (confirmed attribute similarity is standard for small catalogs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all verified against existing codebase and Supabase docs
- Architecture: HIGH - Patterns directly derived from existing codebase conventions (localStorage hooks, Supabase RLS, service modules)
- Database schema: HIGH - Verified against existing schema.sql, RLS patterns, and Supabase Free tier constraints
- Urgency logic: HIGH - Thresholds derived from existing `date_added` field, leads `commitment_level` field, and standard automotive industry practices
- Recommendation engine: MEDIUM - Content-based filtering is well-established but specific scoring weights are untested
- Performance (batching/sendBeacon): MEDIUM - Approach is industry standard but `keepalive` fetch reliability on page unload varies by browser
- pg_cron on Free tier: HIGH - Confirmed available via Supabase GitHub discussion and documentation

**Research date:** 2026-02-19
**Valid until:** 2026-04-19 (60 days - stable domain, Supabase Free tier unlikely to change)
