# Phase 19: Retention Engine - Research

**Researched:** 2026-03-01
**Domain:** Post-purchase owner portal, referral programs, review generation, value tracking
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Owner Portal Access**
- Reuse existing phone OTP login from Phase 4 -- buyer logs in with their phone number and sees owner content
- Portal lives as a new dedicated page (/owner route) with its own layout -- feels premium and distinct from the registration tracker

**Owner Portal Dashboard**
- Full dashboard view: vehicle photo, purchase details, digital documents (Bill of Sale, As-Is), service reminder schedule, warranty info, value tracker -- all in one view
- Service reminders use time-based schedule: show reminders at fixed intervals (3 months, 6 months, 12 months) with generic maintenance checklist

**Referral Program Mechanics**
- Tiered rewards: escalating structure (1st referral = $50, 3rd = $100, 5th = $200) -- gamifies the program
- Both link + code for sharing: unique referral link for digital sharing, short code for in-person word-of-mouth
- Both personal stats + community counter: personal referral count prominently, plus smaller community counter below
- Referral link lands on a special referral landing page: "Your friend [Name] thinks you'd love Triple J" with warm intro before browsing

**Review Generation**
- SMS + email dual channel: SMS for immediate attention + email with more context ("Here's what other families said...")
- Community framing tone: "Help other families find a trustworthy dealer" -- positions reviewing as helping others, not doing Triple J a favor
- One follow-up at 7 days if no review, then stop -- respects boundaries

**Ready to Upgrade?**
- Full upgrade section in the Owner Portal: dedicated section showing trade-in estimate, current inventory matches, and a "Talk to us about upgrading" CTA
- Triggers at 12-18 months post-purchase

**Value Tracker**
- Reuse existing marketEstimateService.ts from Phase 14 (age+mileage heuristic) -- already built, close enough for $3K-$8K range
- Both investment + cost-per-day framing: show current estimated value AND cost-per-day ("Your vehicle value: $X | Cost per day: $X.XX")
- Monthly recalculation based on age progression -- shows gradual change, feels alive
- Mini chart display: small line chart showing value over time since purchase -- visual reinforcement of ownership journey

**Mobile-First Design**
- All Phase 19 components must be mobile-first -- most Triple J customers will access the Owner Portal, referral links, and review prompts on their phones
- Follow Phase 11 established patterns: 44px minimum touch targets, p-6 md:p-8 card padding, py-4 px-8 text-xs tracking-[0.3em] CTA buttons
- Owner Portal dashboard: single-column stacked layout on mobile (vehicle photo, then stats, then documents, then value tracker), wider layout on desktop
- Value tracker mini chart must be legible at 375px viewport -- full width on mobile, not squeezed into a sidebar
- Referral sharing buttons (copy link, share code) need large tap targets -- these are the primary actions owners take on mobile
- Referral landing page must load fast and look good on mobile -- this is where referred friends first encounter Triple J
- Service reminder checklist items need comfortable tap/scroll spacing on mobile

### Claude's Discretion
- Exact portal page layout and component structure
- Chart library choice for value tracker mini chart
- Service reminder intervals and maintenance checklist content
- Referral code format and generation logic
- Review request email HTML template design
- Upgrade section inventory matching logic

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORTAL-01 | Owner Portal section exclusive to Triple J customers (post-purchase) | Supabase phone OTP already established (Phase 4 CustomerLogin.tsx). New /owner route with RLS gating by customer_phone on registrations table. |
| PORTAL-02 | Vehicle dashboard -- service reminders, warranty status, digital purchase documents | registrations table has vehicle snapshot + purchase_date. Bill of Sale linked via bill_of_sale_id. Service reminders computed from purchase_date intervals. |
| PORTAL-03 | Vehicle value tracker (estimated current value -- endowment reinforcement) | marketEstimateService.ts already built. Recharts 3.4.1 already installed for mini line chart. Monthly age progression computable from purchase_date. |
| PORTAL-04 | Family Circle referral program -- unique codes, reward tracking, social proof counter | New owner_referrals DB table. Referral code: nanoid-style short string. Landing page /refer/:code. Community counter via DB aggregate. |
| PORTAL-05 | Review generation engine -- personalized request 3 days post-purchase | Pattern established in Phase 18 (pg_cron + process-follow-up-queue). New review_requests table + Edge Function. Twilio + Resend _shared helpers reused. |
| PORTAL-06 | "Ready to Upgrade?" re-entry loop -- 12-18 months post-purchase curiosity trigger | Computed from purchase_date in Owner Portal. marketEstimateService for trade-in estimate. Supabase query to current Available inventory for matches. |
</phase_requirements>

---

## Summary

Phase 19 builds the post-purchase retention loop on top of foundations already in place. The `registrations` table (created in Phase 2) is the source of truth: it has `customer_phone`, `purchase_date`, `vehicle_year`, `vehicle_make`, `vehicle_model`, `vehicle_id`, and links to Bill of Sale. The existing Supabase phone OTP login (Phase 4 `CustomerLogin.tsx`) is reused as-is -- the Owner Portal at `/owner` is a new page that checks auth and queries registrations filtered by `customer_phone`. The new page is separate from the existing `/customer/dashboard` (registration tracker) and feels premium/distinct.

The value tracker mini chart uses **Recharts 3.4.1**, which is already installed in `package.json`. The `marketEstimateService.ts` already handles the age+mileage heuristic computation. The review generation system follows the exact pattern of Phase 18's behavioral follow-up: a DB queue table, a pg_cron-triggered detection function, and a Supabase Edge Function that dispatches via the existing `_shared/twilio.ts` and `_shared/resend.ts` helpers. No new infrastructure is needed -- the channel dispatch plumbing is already proven and working.

The referral program introduces two new DB tables (`owner_referrals`, `referral_clicks`) and a new public-facing landing page at `/refer/:code`. This landing page is the one place where referred friends first encounter Triple J -- it must load fast, look premium, and transition naturally into the inventory browsing experience.

**Primary recommendation:** Use the registrations table + existing OTP auth for the portal foundation, Recharts for the value chart, and the Phase 18 queue/Edge Function pattern for review requests. No new libraries needed.

---

## Standard Stack

### Core (Already Installed -- Zero New Dependencies Needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.4.1 | Value tracker mini line chart | Already in package.json -- proven, React-native, responsive |
| framer-motion | 12.23.26 | Portal page animations | Already used throughout the site (Phase 11, 13, 14) |
| lucide-react | 0.554.0 | Icons (TrendingUp, Share2, Star, etc.) | Already used throughout |
| @supabase/supabase-js | 2.87.1 | DB queries + auth | Already the project database client |
| react-router-dom | 7.9.6 | /owner route + /refer/:code route | Already the routing library |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| marketEstimateService.ts | (project) | Value heuristic computation | Value tracker + upgrade trade-in estimate |
| _shared/twilio.ts | (project) | SMS dispatch from Edge Functions | Review request SMS + follow-up |
| _shared/resend.ts | (project) | Email dispatch from Edge Functions | Review request email |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts (installed) | Chart.js, Victory, Nivo | Recharts is already installed -- switching wastes bundle budget and introduces new API surface |
| pg_cron (established) | Frontend setInterval, Vercel cron | pg_cron is proven in Phase 16 + 18 -- consistent with project patterns |
| Supabase Edge Functions (established) | Vercel serverless functions | Edge Functions already have _shared helpers for Twilio + Resend -- reuse is zero-cost |

**Installation:** No new packages required. All dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
pages/
├── OwnerPortal.tsx           # /owner route -- main portal page
└── ReferralLanding.tsx       # /refer/:code route -- warm handoff page for referred friends

components/owner/
├── OwnerVehicleCard.tsx      # Vehicle photo + purchase details section
├── OwnerDocuments.tsx        # Bill of Sale + As-Is document download links
├── OwnerServiceReminders.tsx # Time-based maintenance checklist
├── OwnerValueTracker.tsx     # Mini line chart + current value + cost-per-day
├── OwnerReferralSection.tsx  # Referral code/link + tier progress + community counter
└── OwnerUpgradeSection.tsx   # Ready to Upgrade? trade-in + inventory matches

services/
└── ownerPortalService.ts     # All Owner Portal Supabase queries

supabase/
├── phase-19-migration.sql    # owner_referrals, referral_clicks, review_requests tables
└── functions/
    └── process-review-requests/
        └── index.ts          # Edge Function: dispatch review SMS + email at day 3
```

### Pattern 1: Owner Portal Auth Guard (Reuse Phase 4 Pattern)

**What:** Check Supabase session on mount; if no session, redirect to `/customer/login`. After session confirmed, query `registrations` filtered by `customer_phone` from JWT.
**When to use:** OwnerPortal.tsx init hook.

```typescript
// Source: CustomerDashboard.tsx (Phase 4) -- established pattern
useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/customer/login');
      return;
    }
    const userPhone = session.user?.phone || '';
    // Query registrations WHERE customer_phone = userPhone
    // AND current_stage = 'sticker_delivered' (purchase complete)
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('customer_phone', userPhone)
      .eq('current_stage', 'sticker_delivered')
      .order('purchase_date', { ascending: false });
    setRegistration(data?.[0] ?? null);
    setLoading(false);
  };
  init();
}, [navigate]);
```

**Important:** The Owner Portal should only show the most recent completed registration. Customers with multiple purchases show the most recent. If no completed registration, show an empty state with a message: "Your Owner Portal will be ready once your purchase is complete."

### Pattern 2: Value Tracker Chart with Recharts

**What:** A small responsive line chart showing estimated vehicle value from purchase date to today, computed monthly.
**When to use:** OwnerValueTracker.tsx

```typescript
// Source: recharts.org -- LineChart with ResponsiveContainer
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Generate monthly data points from purchase_date to now
function buildValueHistory(
  purchasePrice: number,
  purchaseDate: string,
  vehicleYear: number,
  mileageAtPurchase: number
): Array<{ month: string; value: number }> {
  const points = [];
  const start = new Date(purchaseDate);
  const now = new Date();
  let current = new Date(start);

  while (current <= now) {
    const monthsOwned = Math.floor(
      (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    // Estimate mileage progression: assume ~1,000 miles/month
    const estimatedMileage = mileageAtPurchase + monthsOwned * 1000;
    const vehicleAgeAtPoint = current.getFullYear() - vehicleYear;
    const value = estimateMarketValue(purchasePrice, vehicleYear - vehicleAgeAtPoint + (current.getFullYear() - vehicleYear), estimatedMileage);

    points.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value,
    });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  return points;
}

// Render
<ResponsiveContainer width="100%" height={120}>
  <LineChart data={valueHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
    <YAxis hide />
    <Tooltip
      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Est. Value']}
      contentStyle={{ background: '#0e1b16', border: '1px solid #d4af3730', borderRadius: 4 }}
      labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
    />
    <Line type="monotone" dataKey="value" stroke="#d4af37" strokeWidth={1.5} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

**CRITICAL for mobile:** Use `height={120}` not height as percentage. ResponsiveContainer with `width="100%"` is required for 375px viewport. Do NOT put this chart inside a flex sidebar -- full-width block layout only on mobile.

### Pattern 3: Referral Code Generation (No External Library)

**What:** Generate a short, human-readable code server-side in Postgres. Store in `owner_referrals` table. No library needed.
**When to use:** Phase 19 migration creates this via trigger when a registration reaches `sticker_delivered`.

```sql
-- Generate referral code: first 3 chars of customer name + 4 random alphanumeric chars
-- Example: "MAR-7K2P", "JOS-9XWQ"
CREATE OR REPLACE FUNCTION generate_referral_code(customer_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  suffix TEXT;
BEGIN
  -- Take first 3 letters of name, uppercase, remove non-alpha
  prefix := UPPER(REGEXP_REPLACE(LEFT(customer_name, 3), '[^A-Za-z]', '', 'g'));
  -- Pad to 3 chars if name is shorter
  prefix := LPAD(prefix, 3, 'X');
  -- Generate 4 random alphanumeric chars (uppercase, no 0/O/I/1 confusion)
  suffix := UPPER(SUBSTRING(encode(gen_random_bytes(4), 'base64'), 1, 4));
  suffix := REGEXP_REPLACE(suffix, '[^A-Z2-9]', 'A', 'g');
  RETURN prefix || '-' || suffix;
END;
$$ LANGUAGE plpgsql;
```

**Note:** Uniqueness enforced via UNIQUE constraint on `referral_code` column. Trigger retries on collision (rare).

### Pattern 4: Review Request Queue (Phase 18 Pattern Reused)

**What:** A `review_requests` table mirroring `follow_up_queue` structure. A pg_cron job (every hour) calls `enqueue_review_requests()` which finds registrations at exactly 3 days post-purchase with no pending request. An Edge Function `process-review-requests` dispatches SMS + email.
**When to use:** All review generation logic.

```sql
-- Detection function pattern (mirrors Phase 18 enqueue_behavioral_follow_ups)
CREATE OR REPLACE FUNCTION enqueue_review_requests()
RETURNS void AS $$
BEGIN
  INSERT INTO public.review_requests (registration_id, channel, send_after)
  SELECT
    r.id,
    channel,
    NOW() + INTERVAL '1 minute'  -- immediate processing
  FROM public.registrations r
  CROSS JOIN unnest(ARRAY['sms', 'email']) AS channel
  WHERE
    r.current_stage = 'sticker_delivered'
    AND r.purchase_date >= NOW() - INTERVAL '3 days 1 hour'
    AND r.purchase_date <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.review_requests rr
      WHERE rr.registration_id = r.id
      AND rr.request_type = 'initial'
    )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 5: Referral Landing Page as Public Route

**What:** `/refer/:code` is a public route (no auth required) that shows a warm welcome message using the referrer's first name, then surfaces the inventory. The referral code is looked up in `owner_referrals` to get the referrer name and log the click.
**When to use:** ReferralLanding.tsx

```typescript
// Source: react-router-dom v7 useParams -- established project pattern
import { useParams } from 'react-router-dom';

const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    // Lookup referrer name + log click (anon insert to referral_clicks)
    supabase
      .from('owner_referrals')
      .select('referrer_name')
      .eq('referral_code', code.toUpperCase())
      .single()
      .then(({ data }) => {
        setReferrer(data?.referrer_name?.split(' ')[0] ?? null);
        // Log click
        supabase.from('referral_clicks').insert({ referral_code: code.toUpperCase() });
      });
  }, [code]);

  // Warm intro, then inventory
  return (
    <div>
      {referrer && (
        <div className="text-center py-12 px-4">
          <p className="text-tj-gold text-sm tracking-[0.3em] uppercase mb-3">A Personal Recommendation</p>
          <h1 className="font-serif text-3xl text-white mb-4">
            {referrer} thinks you'd love Triple J
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Browse our current inventory below — trusted vehicles for Houston families.
          </p>
        </div>
      )}
      {/* Inline inventory grid below */}
    </div>
  );
};
```

### Anti-Patterns to Avoid

- **Sharing state between /owner and /customer/dashboard:** Keep them as completely separate pages. The Owner Portal is premium-feeling; the registration tracker is transactional. Do not merge them.
- **Building value chart with SVG from scratch:** Recharts is already installed. Hand-rolling an SVG line chart takes 10x longer and misses edge cases (responsive resize, tooltip, empty data).
- **Blocking the portal on having a Bill of Sale:** Some registrations may not have `bill_of_sale_id` set. Always render documents section with graceful empty state ("Contact us for digital copies").
- **Calling marketEstimateService with wrong params:** The function signature is `estimateMarketValue(price, year, mileage)`. The `price` should be the original purchase price (from registrations), not the current estimated value. Common mistake: passing current value recursively.
- **Using navigator.share without fallback:** The Web Share API is not available in all browsers. Always provide a copy-to-clipboard fallback for referral links.
- **Putting referral code in URL fragment:** Use `/refer/CODE` (path param), not `/refer#CODE`. Path params are visible to the server and logged; fragments are client-only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line chart for value tracker | Custom SVG path calculation | Recharts LineChart + ResponsiveContainer | Already installed, handles resize/tooltip/mobile |
| SMS dispatch | Direct Twilio fetch in components | `_shared/twilio.ts` in Edge Function | Existing helper with error handling, Twilio 21610 detection |
| Email dispatch | EmailJS from frontend | `_shared/resend.ts` in Edge Function | Existing helper, no API key exposure to client |
| Scheduled review triggers | Frontend polling, Vercel cron | pg_cron (established in Phase 16, 18) | Pattern proven, consistent with project architecture |
| Referral code uniqueness | Application-level retry loop | UNIQUE constraint + Postgres trigger retry | DB-level enforcement is atomic and race-condition free |
| Share functionality | Custom share modal | navigator.share + clipboard fallback | Native share sheet on mobile; graceful clipboard fallback |
| Auth guard on portal | Custom auth context | supabase.auth.getSession() pattern | Established pattern in CustomerDashboard.tsx (Phase 4) |

**Key insight:** Phase 19 adds zero new external libraries. Every infrastructure concern has an established pattern from Phases 16-18. The only new code is business logic (portal layout, referral mechanics, value chart, review templates).

---

## Common Pitfalls

### Pitfall 1: Querying the Wrong Table for "Owner" Status

**What goes wrong:** Using the `leads` table to determine who is a customer. The `leads` table captures inquiries -- many leads never bought.
**Why it happens:** `leads` is the most recent addition to the developer's mental model.
**How to avoid:** The `registrations` table is the source of truth. A customer is an owner if and only if they have a registration row with `current_stage = 'sticker_delivered'` matching their phone number.
**Warning signs:** Portal shows for anyone who submitted a form, not just buyers.

### Pitfall 2: RLS Policy Gaps on New Owner Tables

**What goes wrong:** `owner_referrals` and `review_requests` tables created without RLS, or with policies that allow any authenticated user to read all rows.
**Why it happens:** RLS is easy to overlook during migration development.
**How to avoid:** Every new table MUST have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Owner tables: authenticated users read only their own rows (`customer_phone = auth.jwt()->>'phone'`). Anonymous users: anon INSERT only on `referral_clicks` (for logging clicks from referred friends).
**Warning signs:** Admin dashboard shows all customers can see each other's referral codes.

### Pitfall 3: Recharts Height 100% in Flex Container Breaks on Mobile

**What goes wrong:** `<ResponsiveContainer height="100%">` returns zero height when inside a flex container without explicit parent height, making the chart invisible.
**Why it happens:** Recharts ResponsiveContainer requires a parent with an explicit height or a fixed height prop.
**How to avoid:** Always use `height={120}` (pixel value) not `height="100%"`. The chart section should be a block-level element, not inside a flex row on mobile.
**Warning signs:** Chart renders fine on desktop, invisible on mobile.

### Pitfall 4: pg_cron Review Detection Window Too Narrow

**What goes wrong:** The cron job runs every hour, but the detection window `purchase_date BETWEEN NOW() - INTERVAL '3 days 1 hour' AND NOW() - INTERVAL '3 days'` is exactly 1 hour wide. If the cron job is delayed by even 1 minute, some customers are missed permanently.
**Why it happens:** Precise time window math without safety margin.
**How to avoid:** Use a broader window with idempotency protection via the `NOT EXISTS` check. Window should be `purchase_date BETWEEN NOW() - INTERVAL '3 days 2 hours' AND NOW() - INTERVAL '3 days'` (2-hour lookback). The `ON CONFLICT DO NOTHING` / `NOT EXISTS` guard prevents double-sending. Phase 18 established this same defense.
**Warning signs:** Some customers report never receiving a review request.

### Pitfall 5: Referral Landing Page Cold Start Showing Blank

**What goes wrong:** The referral landing page is the first impression for referred friends. If the Supabase lookup takes 500ms and the page shows blank during that time, it feels broken.
**Why it happens:** No loading state for the referrer lookup.
**How to avoid:** Show a warm skeleton/loading state immediately ("Someone thinks you'd love Triple J..." with animate-pulse on the name area). Reveal the referrer's name once loaded. Do NOT block the inventory grid on this lookup -- show inventory immediately, overlay the warm intro above.
**Warning signs:** Referred friends report "blank page" on the referral link.

### Pitfall 6: Web Share API Not Available in Desktop Browsers

**What goes wrong:** `navigator.share()` throws `TypeError: navigator.share is not a function` on desktop Chrome/Firefox.
**Why it happens:** Web Share API is only available in mobile browsers and some desktop Safari versions.
**How to avoid:**
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({ title: 'Triple J Auto Investment', url: referralUrl });
  } else {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
};
```
**Warning signs:** Share button throws console error on desktop; users cannot copy referral link.

### Pitfall 7: Cost-Per-Day Calculation Division by Zero

**What goes wrong:** `costPerDay = purchasePrice / daysOwned` throws or returns Infinity on the day of purchase.
**Why it happens:** `daysOwned` is 0 on purchase day.
**How to avoid:** `const daysOwned = Math.max(1, Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86400000))`.
**Warning signs:** Cost-per-day shows "Infinity" or "NaN" in the portal.

---

## Code Examples

Verified patterns from project codebase:

### DB Migration Structure (Phase 19 Pattern)

```sql
-- phase-19-migration.sql structure
-- Sections:
--   1. owner_referrals table (referral codes + reward tracking)
--   2. referral_clicks table (click logging for landing page)
--   3. review_requests table (review generation queue)
--   4. generate_referral_code() function
--   5. auto_create_owner_referral() trigger (fires on sticker_delivered)
--   6. enqueue_review_requests() function
--   7. pg_cron schedules (DO block with EXCEPTION WHEN OTHERS pattern)

-- Table: owner_referrals
CREATE TABLE IF NOT EXISTS public.owner_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  referrer_name TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referral_link TEXT NOT NULL,
  referral_count INTEGER DEFAULT 0,  -- total referred (any click)
  converted_count INTEGER DEFAULT 0, -- total who bought
  reward_tier INTEGER DEFAULT 0,     -- 0=none, 1=$50, 3=$100, 5=$200
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: referral_clicks
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code TEXT NOT NULL REFERENCES public.owner_referrals(referral_code) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT
);

-- Table: review_requests
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  request_type TEXT NOT NULL DEFAULT 'initial' CHECK (request_type IN ('initial', 'followup')),
  send_after TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (registration_id, channel, request_type)
);

-- RLS
ALTER TABLE public.owner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- owner_referrals: authenticated owners see only their own
CREATE POLICY "Owners see own referral record"
  ON public.owner_referrals FOR SELECT TO authenticated
  USING (customer_phone = (auth.jwt()->>'phone'));

-- referral_clicks: anon insert for landing page logging
CREATE POLICY "Anyone can log referral click"
  ON public.referral_clicks FOR INSERT TO anon
  WITH CHECK (true);
```

### OwnerPortal Page Shell

```typescript
// Source: CustomerDashboard.tsx auth pattern (Phase 4)
// pages/OwnerPortal.tsx
const OwnerPortal: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [registration, setRegistration] = useState<OwnerRegistration | null>(null);
  const [referral, setReferral] = useState<OwnerReferral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/customer/login'); return; }

      const phone = session.user?.phone || '';
      const [regResult, refResult] = await Promise.all([
        supabase
          .from('registrations')
          .select('*')
          .eq('customer_phone', phone)
          .eq('current_stage', 'sticker_delivered')
          .order('purchase_date', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('owner_referrals')
          .select('*')
          .eq('customer_phone', phone)
          .single(),
      ]);

      setRegistration(regResult.data);
      setReferral(refResult.data);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Single-column stacked layout on mobile (per decisions)
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black">
      {/* Header */}
      <header className="px-4 md:px-8 pt-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-1">Owner Portal</p>
          <h1 className="font-display text-xl text-white">Welcome back</h1>
        </div>
      </header>
      <div className="px-4 md:px-8 pb-16 space-y-4 max-w-2xl mx-auto">
        <OwnerVehicleCard registration={registration} />
        <OwnerDocuments registration={registration} />
        <OwnerServiceReminders registration={registration} />
        <OwnerValueTracker registration={registration} />
        <OwnerReferralSection referral={referral} />
        <OwnerUpgradeSection registration={registration} />
      </div>
    </div>
  );
};
```

### Value Tracker Cost-Per-Day Calculation

```typescript
// Source: project pattern + date math
function computeValueMetrics(registration: OwnerRegistration) {
  const purchaseDate = new Date(registration.purchase_date);
  const daysOwned = Math.max(1, Math.floor(
    (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const currentValue = estimateMarketValue(
    registration.sold_price || registration.purchase_price,
    registration.vehicle_year,
    registration.mileage_at_purchase + daysOwned * 33 // ~1000 mi/month
  );
  const costPerDay = (registration.sold_price || registration.purchase_price) / daysOwned;

  return { currentValue, costPerDay, daysOwned };
}
```

### Referral Sharing with Clipboard Fallback

```typescript
// Source: MDN Web Share API + Clipboard API
const handleShareReferral = async (referralUrl: string) => {
  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: 'Triple J Auto Investment',
        text: 'I bought my car from Triple J and love it. Check them out!',
        url: referralUrl,
      });
    } catch (_e) {
      // User cancelled share -- not an error
    }
  } else {
    await navigator.clipboard.writeText(referralUrl).catch(() => {
      // Clipboard API unavailable -- show manual copy UI
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
};
```

### Review Request Edge Function (process-review-requests)

```typescript
// Source: process-follow-up-queue/index.ts pattern (Phase 18)
// supabase/functions/process-review-requests/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: queue } = await supabase
    .from('review_requests')
    .select('*, registrations(customer_name, customer_phone, customer_email, vehicle_year, vehicle_make, vehicle_model)')
    .eq('sent', false)
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(50);

  for (const item of queue ?? []) {
    try {
      const reg = item.registrations;
      const firstName = reg.customer_name?.split(' ')[0] ?? 'there';

      if (item.channel === 'sms' && reg.customer_phone) {
        const smsBody = `Hi ${firstName}! You've been driving your ${reg.vehicle_year} ${reg.vehicle_make} ${reg.vehicle_model} for 3 days now. Would you help other Houston families by sharing your experience? Leave a quick Google review: https://g.page/r/GOOGLE_REVIEW_LINK/review — Triple J Auto Investment`;
        await sendSms(reg.customer_phone, smsBody);
      }

      if (item.channel === 'email' && reg.customer_email) {
        await sendEmail({
          to: reg.customer_email,
          subject: `How is your ${reg.vehicle_year} ${reg.vehicle_make}?`,
          html: buildReviewEmailHtml(firstName, reg),
        });
      }

      await supabase
        .from('review_requests')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', item.id);
    } catch (_err) {
      // Mark sent=true on error to prevent retry loops (Phase 18 pattern)
      await supabase
        .from('review_requests')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', item.id);
    }
  }

  return new Response(JSON.stringify({ processed: queue?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chart.js (external script) | Recharts (React-native, already installed) | Phase 14 era | No additional install, tree-shakeable, TypeScript-friendly |
| Custom scheduling via frontend polling | pg_cron + Edge Functions | Phase 16 | Consistent with project architecture; works while app is closed |
| Separate auth for portal vs registration tracker | Single Supabase OTP auth for both | Phase 4 | One login, multiple portal views; no new auth infrastructure |
| EmailJS for transactional email | Resend via Edge Function | Phase 18 | Server-side sends -- no API key exposure; supports HTML templates |

**Deprecated/outdated:**
- EmailJS (`emailService.ts`): Still exists but should NOT be used for Phase 19 review emails. Edge Function with Resend is the established pattern since Phase 18.
- Custom SVG charts: Recharts is already installed -- there is no reason to build chart components from scratch.

---

## Open Questions

1. **Google Review Link**
   - What we know: The review request SMS/email needs to link to a specific Google Maps review page for Triple J Auto Investment
   - What's unclear: The exact Google review short link is not documented in the codebase. It should be `https://g.page/r/[PLACE_ID]/review` format.
   - Recommendation: Use a placeholder `GOOGLE_REVIEW_LINK` constant in the code with a TODO comment. The business owner provides the real link before launch.

2. **mileage_at_purchase Availability**
   - What we know: The `registrations` table has a `vehicle_id` FK to `vehicles`. The `vehicles` table has `mileage`. But `registrations` does not have a `mileage_snapshot` column.
   - What's unclear: Should Phase 19 add a `mileage_at_purchase` column to registrations, or derive it from `vehicles.mileage`? The vehicle's mileage in the `vehicles` table reflects the listing mileage (correct for value estimation at purchase), but if the vehicle is updated later, the value will be wrong.
   - Recommendation: Add `mileage_at_purchase` column to `registrations` in the Phase 19 migration. Set it via a trigger when `current_stage` transitions to `sticker_delivered`. Fallback: JOIN to vehicles.mileage.

3. **Community Counter Source**
   - What we know: The referral section should show "X families referred this month" as a community counter. The `referral_clicks` table can provide click counts; `owner_referrals.converted_count` tracks conversions.
   - What's unclear: Should the community counter show referral clicks (any friend who clicked) or actual conversions (friends who bought)? Clicks are more impressive numbers; conversions are more honest.
   - Recommendation: Show click-based referral count with label "families introduced to Triple J this month" (not "bought"). Honest but impressive. Query: COUNT(*) from referral_clicks WHERE clicked_at >= date_trunc('month', NOW()).

4. **7-day Follow-Up Review Request**
   - What we know: Decisions say "one follow-up at 7 days if no review, then stop." But there is no way to detect if a Google review was actually left -- there is no Google Reviews API that would surface individual reviews in real-time.
   - What's unclear: How does the system know whether to send the 7-day follow-up? It cannot check if a review was posted.
   - Recommendation: Send the 7-day follow-up unconditionally (i.e., always send to everyone who hasn't clicked "I already reviewed" in the portal). Add an optional "I left a review" button in the portal that sets a `review_completed` boolean on the registration row. If `review_completed = true`, skip the 7-day follow-up. This is the most practical approach without a Google Reviews API integration.

5. **Upgrade Section Inventory Matching Logic**
   - What we know: "Claude's Discretion" covers this. The Owner Portal should show current inventory matches for upgrade candidates.
   - What's unclear: What defines a "match"? Same price range? Higher trim? Different make?
   - Recommendation: Simple matching: show vehicles in inventory WHERE `price BETWEEN registration.purchase_price * 1.1 AND registration.purchase_price * 2.0` AND `status = 'Available'`, ordered by `date_added DESC`, limit 3. This surfaces "slightly better" vehicles at a realistic upgrade price point for the $3K-$8K market.

---

## Sources

### Primary (HIGH confidence)

- Project codebase direct inspection -- `CustomerDashboard.tsx`, `marketEstimateService.ts`, `_shared/twilio.ts`, `_shared/resend.ts`, `process-follow-up-queue/index.ts`, `package.json`, `registration_ledger.sql`, `phase-18-migration.sql`
- Recharts `package.json` entry confirmed: `"recharts": "^3.4.1"` -- available for value chart
- Tailwind config direct read -- confirmed design tokens: tj-green, tj-gold, font-display, font-serif
- Phase 18 migration + Edge Function -- confirms pg_cron/Resend/Twilio patterns are established and working

### Secondary (MEDIUM confidence)

- Recharts documentation (recharts.org) -- ResponsiveContainer + LineChart API confirmed consistent with v3.x
- Web Share API MDN -- navigator.share() availability confirmed as mobile-first with desktop fallback requirement
- Supabase auth.jwt() claims pattern -- confirmed from existing RLS policies in project migrations

### Tertiary (LOW confidence)

- Google Review link format (`g.page/r/PLACE_ID/review`) -- standard format but the actual Triple J Place ID is unknown and must be confirmed by business owner

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries confirmed present in package.json, all infrastructure patterns confirmed in Phase 16-18 code
- Architecture: HIGH -- patterns derived directly from existing project code (CustomerDashboard, follow-up queue, Edge Functions)
- DB schema: HIGH -- registration_ledger.sql read directly; new table designs follow Phase 16/18 migration patterns exactly
- Pitfalls: HIGH -- most derived from actual code constraints (Recharts height issue, RLS gaps, pg_cron timing) verified against codebase
- Open questions: MEDIUM -- 5 identified gaps requiring planner/developer decisions, particularly around mileage snapshot and 7-day follow-up detection

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack; Recharts/Supabase APIs change slowly)
