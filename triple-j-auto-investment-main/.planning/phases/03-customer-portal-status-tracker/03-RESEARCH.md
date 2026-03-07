# Phase 3: Customer Portal - Status Tracker - Research

**Researched:** 2026-02-05
**Domain:** Customer-facing registration tracker, SVG animations, token-based access, responsive UI
**Confidence:** HIGH

## Summary

This research investigated how to implement the customer-facing status tracker portal with animated progress visualization (arc + road + car), token-based access, and mobile-responsive design. The codebase already has a working `RegistrationTracker.tsx` that displays registration status with stage pipeline, but it uses order ID lookup (not secure tokens) and lacks the animated visualizations specified in CONTEXT.md.

**Key findings:**
1. **Existing foundation is solid** - `RegistrationTracker.tsx` already handles order ID lookup via `getRegistrationByOrderId()`, has stage pipeline rendering, and error states. The structure can be extended.
2. **Framer Motion is already installed** (v12.23.26) and heavily used in codebase - perfect for arc/car animations with `motion.div`, SVG path animations, and spring physics.
3. **Token-based access requires database changes** - Current RLS allows public SELECT with `USING (true)`. CONTEXT.md specifies `/track/{orderID}-{token}` format with 30-day expiry. Need `access_token` and `token_expires_at` columns.
4. **Car icons by vehicle type require BodyClass mapping** - NHTSA API returns `VehicleType` (e.g., "PASSENGER CAR") and `BodyClass` (e.g., "Sedan", "SUV", "Pickup"). Registration records should store body type at creation time.
5. **Codebase has proven SVG animation patterns** - `SplashScreen.tsx` and `CrestLoader.tsx` demonstrate stroke-dasharray/dashoffset animations for arc tracing, which can be adapted for progress arc.

**Primary recommendation:** Create new `CustomerStatusTracker.tsx` page (separate from admin-oriented `RegistrationTracker.tsx`), add access token fields to registrations table, use Framer Motion for coordinated arc-fill + car-drive animations, and create reusable SVG components for vehicle type icons.

---

## Existing Code Analysis

### Current RegistrationTracker.tsx (389 lines)

**Location:** `pages/RegistrationTracker.tsx`

**Current functionality:**
- URL patterns: `/track` (search form) and `/track/:orderId` (direct lookup)
- Uses `getRegistrationByOrderId()` from `registrationService.ts` to fetch data
- Displays stage pipeline with icons (CheckCircle, Clock, AlertCircle, Circle)
- Shows vehicle info, order ID, purchase date
- Contact card with phone and email links
- Error handling for not found, loading states

**What it lacks (per CONTEXT.md):**
- Token-based access (currently just order ID)
- Animated arc progress with logo
- Road visualization with driving car
- Vehicle type-specific car icons
- Gold/amber color scheme (currently green/amber/red)
- Mobile vertical road layout
- Link expiry handling
- Stage tap for description (mobile)
- Share button functionality

**Reusable patterns:**
```typescript
// Stage status icons - can adapt colors
const getStatusIcon = (status: RegistrationStageStatus) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="text-green-400" size={20} />;
    case 'pending':
      return <Clock className="text-amber-400 animate-pulse" size={20} />;
    // ...
  }
};

// Date formatting - reuse exactly
const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
```

### Current Route Configuration (App.tsx lines 471-472)

```typescript
<Route path="/track" element={<RegistrationTracker />} />
<Route path="/track/:orderId" element={<RegistrationTracker />} />
```

**For Phase 3:** Add new route pattern:
```typescript
<Route path="/track/:accessKey" element={<CustomerStatusTracker />} />
```

Where `accessKey` = `{orderId}-{token}` (e.g., `TJ-2026-0001-a1b2c3d4`)

### Current Registration Service

**File:** `services/registrationService.ts` (725 lines)

**Relevant function:**
```typescript
// Line 105-124
export async function getRegistrationByOrderId(orderId: string): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('order_id', orderId.toUpperCase())
    .eq('is_archived', false)
    .single();
  // ...
}
```

**For Phase 3:** Add new function for token-based lookup:
```typescript
export async function getRegistrationByAccessKey(
  orderId: string,
  token: string
): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('order_id', orderId.toUpperCase())
    .eq('access_token', token)
    .eq('is_archived', false)
    .gt('token_expires_at', new Date().toISOString())
    .single();
  // ...
}
```

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.23.26 | Animation library | Already used extensively in codebase, supports SVG path animations, spring physics |
| react-router-dom | ^7.9.6 | Routing | Already handles `/track/:orderId` pattern |
| @supabase/supabase-js | ^2.87.1 | Database access | Current auth and RLS infrastructure |
| lucide-react | ^0.554.0 | Icons | Already used for stage icons, contact icons |
| tailwindcss | ^3.4.19 | Styling | Responsive utilities already configured |

### Supporting (No New Installs Needed)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| SVG (native) | Progress arc, road graphics, car icons | All visualizations |
| CSS @keyframes | Glow pulse animation | Current stage marker |
| navigator.share | Native share sheet | Mobile share button |
| navigator.vibrate | Haptic feedback | Tap interactions |

### Why No New Dependencies

The codebase already has everything needed:
- **Framer Motion** for complex animations (used in `LuxurySplashScreen.tsx`, `Home.tsx`)
- **SVG + CSS keyframes** for stroke animations (used in `SplashScreen.tsx`, `CrestLoader.tsx`)
- **Tailwind** for responsive design with sm:/md:/lg: breakpoints
- **Lucide** for icons (can use Car icon as fallback)

---

## Architecture Patterns

### Recommended Component Structure

```
pages/
  CustomerStatusTracker.tsx    # New page (token-based access)
  RegistrationTracker.tsx      # Keep existing (admin/order lookup)

components/
  tracking/
    ProgressArc.tsx           # Circular arc with logo
    ProgressRoad.tsx          # Road with car animation
    StageInfo.tsx             # Current stage description
    VehicleIcon.tsx           # Car type SVG selector
    LoadingCrest.tsx          # Pulsing logo loader
    ErrorState.tsx            # Expired/invalid link states
```

### Pattern 1: Coordinated Animation with useEffect + Framer Motion

**What:** Synchronize arc fill and car position animations
**When to use:** Page load animation, both elements move together

```typescript
// Source: Adapted from codebase patterns (SplashScreen.tsx, LuxurySplashScreen.tsx)
import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

const ProgressVisualization = ({ currentStage }: { currentStage: number }) => {
  const arcControls = useAnimation();
  const carControls = useAnimation();

  useEffect(() => {
    const progress = currentStage / 6; // 0 to 1
    const animationDuration = 2.5; // Per CONTEXT.md: 2.5-3 seconds

    // Start both animations simultaneously
    arcControls.start({
      pathLength: progress,
      transition: { duration: animationDuration, ease: 'easeInOut' }
    });

    carControls.start({
      x: `${progress * 100}%`,
      transition: { duration: animationDuration, ease: 'easeInOut' }
    });
  }, [currentStage]);

  return (/* ... */);
};
```

### Pattern 2: SVG Arc with Stroke Animation

**What:** Progress arc using stroke-dasharray technique
**When to use:** Arc element filling to show progress

```typescript
// Source: Adapted from SplashScreen.tsx stroke animation pattern
const ProgressArc = ({ progress }: { progress: number }) => {
  // Arc path for semi-circle or full circle
  const circumference = 2 * Math.PI * 80; // radius 80
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg viewBox="0 0 200 200">
      {/* Background arc - faded gold (20% opacity per CONTEXT.md) */}
      <circle
        cx="100" cy="100" r="80"
        fill="none"
        stroke="rgba(212, 175, 55, 0.2)"
        strokeWidth="12"
      />
      {/* Progress arc - filled gold */}
      <motion.circle
        cx="100" cy="100" r="80"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />
    </svg>
  );
};
```

### Pattern 3: Responsive Layout Switch

**What:** Road orientation changes based on viewport
**When to use:** Desktop = horizontal road, Mobile = vertical road

```typescript
// Source: Tailwind responsive patterns from RegistrationTracker.tsx
const ProgressRoad = ({ progress, vehicleType }: Props) => {
  return (
    <div className="relative">
      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <HorizontalRoad progress={progress} vehicleType={vehicleType} />
      </div>
      {/* Mobile: vertical */}
      <div className="block md:hidden">
        <VerticalRoad progress={progress} vehicleType={vehicleType} />
      </div>
    </div>
  );
};
```

### Anti-Patterns to Avoid

- **Don't use CSS-only animations for coordinated motion** - Need JavaScript control for synchronization
- **Don't hardcode pixel sizes for SVG** - Use viewBox and let container scale
- **Don't replay animation on resize** - Per CONTEXT.md: "jump to final state (no replay)"
- **Don't store vehicle type on frontend** - Body class should be persisted in registration record at creation time

---

## Database Changes Required

### New Columns for Registrations Table

```sql
-- Token-based access (per CONTEXT.md: /track/{orderID}-{token})
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS
  access_token VARCHAR(32) NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  token_expires_at TIMESTAMPTZ;

-- Vehicle body type for car icon selection
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS
  vehicle_body_type VARCHAR(50); -- 'sedan', 'suv', 'truck', 'hatchback', etc.

-- Set token expiry on sticker_delivered (30 days after per CONTEXT.md)
CREATE OR REPLACE FUNCTION set_token_expiry_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stage = 'sticker_delivered' AND OLD.current_stage != 'sticker_delivered' THEN
    NEW.token_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registration_set_token_expiry
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION set_token_expiry_on_delivery();
```

### RLS Policy for Token Access

```sql
-- Update public SELECT policy to require valid token
DROP POLICY IF EXISTS "Public can view registration by order_id" ON public.registrations;

CREATE POLICY "Public can view registration by token" ON public.registrations
  FOR SELECT TO anon
  USING (
    -- Token not expired (NULL means never expires until delivery)
    (token_expires_at IS NULL OR token_expires_at > NOW())
  );
```

**Note:** The token check happens in application code (matching order_id + access_token). RLS ensures expired tokens can't access data.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress arc | Canvas drawing | SVG circle with stroke-dasharray | SVG is declarative, scales perfectly, animates with Framer Motion |
| Animation easing | Custom bezier curves | Framer Motion `ease: 'easeInOut'` or spring | Battle-tested, performant, handles interruption |
| Token generation | JavaScript random | PostgreSQL `gen_random_bytes()` | Cryptographically secure, DB-level consistency |
| Responsive detection | window.addEventListener resize | Tailwind `md:` breakpoints + CSS | Zero JavaScript, works with SSR |
| Share functionality | Custom share UI | `navigator.share()` API | Native OS share sheet on mobile, graceful degradation |
| Vehicle icons | Font icons or emoji | Custom SVG components | Precise control over appearance, consistent styling |

---

## Common Pitfalls

### Pitfall 1: Animation Replay on Resize

**What goes wrong:** Arc and car animations replay when window resizes or device orientation changes
**Why it happens:** Component re-renders trigger useEffect animations
**How to avoid:**
- Track if initial animation completed with useRef
- On resize/orientation: skip animation, set final position immediately
- Use `transform` for positioning (not re-animating pathLength)
**Warning signs:** Animations visually restarting during resize

```typescript
// Prevention pattern
const hasAnimated = useRef(false);

useEffect(() => {
  if (hasAnimated.current) {
    // Jump to final state immediately
    arcControls.set({ pathLength: progress });
    carControls.set({ x: `${progress * 100}%` });
  } else {
    // First render: animate
    arcControls.start({ pathLength: progress, transition: { duration: 2.5 } });
    hasAnimated.current = true;
  }
}, [progress]);
```

### Pitfall 2: Token in URL vs Order ID Confusion

**What goes wrong:** Service tries to use combined accessKey as orderId
**Why it happens:** URL param is `TJ-2026-0001-a1b2c3d4` but orderId is `TJ-2026-0001`
**How to avoid:**
- Parse accessKey into components: `const [orderId, token] = parseAccessKey(accessKey)`
- Clear function naming: `getRegistrationByAccessKey(orderId, token)`
**Warning signs:** "Registration not found" errors with valid links

```typescript
// URL: /track/TJ-2026-0001-a1b2c3d4
// accessKey = "TJ-2026-0001-a1b2c3d4"
function parseAccessKey(accessKey: string): { orderId: string; token: string } | null {
  // Order ID format: TJ-YYYY-NNNN (13 chars)
  // Token: 32 hex chars after the last hyphen
  const match = accessKey.match(/^(TJ-\d{4}-\d{4})-([a-f0-9]{32})$/i);
  if (!match) return null;
  return { orderId: match[1], token: match[2] };
}
```

### Pitfall 3: Vehicle Type Not Available

**What goes wrong:** Car icon can't be determined because body type wasn't stored
**Why it happens:** Registration created without capturing VehicleType/BodyClass from VIN decode
**How to avoid:**
- Add `vehicle_body_type` column to registrations table
- Populate at registration creation time (from NHTSA API response or manual selection)
- Default to generic "sedan" icon if null
**Warning signs:** All cars showing same icon, or icons missing

### Pitfall 4: SVG Scaling Issues

**What goes wrong:** Arc/road SVG appears tiny or huge on different screens
**Why it happens:** Using fixed width/height instead of viewBox + responsive container
**How to avoid:**
- Always use viewBox on SVG: `<svg viewBox="0 0 200 200">`
- Container controls size: `<div className="w-48 h-48 md:w-64 md:h-64">`
- Never use pixel-based stroke widths that don't scale
**Warning signs:** Visualizations look wrong on specific devices

### Pitfall 5: Share API Not Available

**What goes wrong:** Share button throws error on desktop browsers
**Why it happens:** `navigator.share()` only available on mobile + secure context
**How to avoid:**
- Feature detection: `if (navigator.share)`
- Fallback: Copy to clipboard button
- Show share button only on mobile via `md:hidden`
**Warning signs:** Console errors about share not being a function

```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: 'Registration Status',
      url: window.location.href
    });
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(window.location.href);
    // Show toast
  }
};
```

---

## Code Examples

### Framer Motion SVG Path Animation

```typescript
// Source: Framer Motion pattern used in LuxurySplashScreen.tsx
import { motion } from 'framer-motion';

// Arc fill animation
<motion.circle
  r="80"
  cx="100"
  cy="100"
  fill="none"
  stroke="#D4AF37"
  strokeWidth="12"
  strokeDasharray={circumference}
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: circumference * (1 - progress) }}
  transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
/>
```

### Loading State with Pulsing Logo

```typescript
// Source: Adapted from CrestLoader.tsx
const LoadingCrest = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <motion.img
      src="/GoldTripleJLogo.png"
      alt="Loading..."
      className="w-24 h-24"
      animate={{
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 15px rgba(212,175,55,0.4))',
          'drop-shadow(0 0 25px rgba(212,175,55,0.7))',
          'drop-shadow(0 0 15px rgba(212,175,55,0.4))'
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);
```

### Error State Component

```typescript
// Source: Adapted from NotFound.tsx patterns
const ExpiredLinkError = () => (
  <div className="text-center py-16">
    <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
    <h2 className="text-white text-xl font-display mb-2">Link Expired</h2>
    <p className="text-gray-400 mb-6">
      This tracking link has expired. Registration tracking links remain active
      for 30 days after your sticker is delivered.
    </p>
    <div className="text-sm text-gray-500">
      <p>Questions? Contact Triple J Auto Investment:</p>
      <a href="tel:+17135550192" className="text-tj-gold hover:text-white">
        (713) 555-0192
      </a>
    </div>
  </div>
);
```

### Vehicle Icon Component

```typescript
// SVG icons for common vehicle types
const VehicleIcon = ({ type, className }: { type: string; className?: string }) => {
  // Map NHTSA BodyClass to icon type
  const iconType = mapBodyClassToIcon(type); // 'sedan', 'suv', 'truck'

  const icons = {
    sedan: (
      <svg viewBox="0 0 100 40" className={className}>
        {/* Sedan outline path */}
        <path d="M10,30 L10,25 Q10,20 15,18 L25,15 L40,10 L60,10 L75,15 L85,18 Q90,20 90,25 L90,30 Z"
          fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="25" cy="30" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="75" cy="30" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    suv: (/* SUV path */),
    truck: (/* Truck path */),
  };

  return icons[iconType] || icons.sedan;
};

function mapBodyClassToIcon(bodyClass: string | undefined): 'sedan' | 'suv' | 'truck' {
  if (!bodyClass) return 'sedan';
  const lower = bodyClass.toLowerCase();
  if (lower.includes('suv') || lower.includes('sport utility')) return 'suv';
  if (lower.includes('truck') || lower.includes('pickup')) return 'truck';
  return 'sedan';
}
```

---

## State of the Art

| Old Approach (Current) | New Approach (Phase 3) | Impact |
|------------------------|------------------------|--------|
| Order ID in URL as auth | Order ID + token compound key | More secure, prevents enumeration |
| No token expiry | 30-day expiry after delivery | Compliance, reduces data exposure |
| Green/red stage colors | Gold/amber with glow | Matches brand identity |
| Static stage icons | Animated arc + road + car | Engaging visual feedback |
| Same page admin/customer | Separate CustomerStatusTracker | Cleaner UX per audience |
| Desktop-first design | Mobile-first with vertical road | Better mobile experience |

---

## Asset Requirements

### SVG Assets to Create

1. **Vehicle Type Icons** (3 minimum per CONTEXT.md)
   - `sedan-outline.svg` - Generic 4-door sedan silhouette
   - `suv-outline.svg` - SUV/crossover silhouette
   - `truck-outline.svg` - Pickup truck silhouette

2. **Road Elements**
   - `flag-start.svg` - Green start flag
   - `flag-finish.svg` - Checkered finish flag
   - Road itself is CSS (dashed line pattern)

3. **Arc Component** (procedural, not asset)
   - Generated via SVG circle in code
   - Logo loaded from existing `/GoldTripleJLogo.png`

### Existing Assets to Reuse

- `/GoldTripleJLogo.png` - Golden Crest logo (2.6MB - may want smaller version)
- Lucide icons for fallbacks and UI elements

---

## Open Questions

### Resolved During Research

1. **Animation library choice?**
   - Resolved: Use Framer Motion (already installed, extensively used)

2. **Token storage location?**
   - Resolved: Database column `access_token` on registrations table

3. **How to handle expired vs invalid links?**
   - Resolved: Check `token_expires_at` column; different error messages per CONTEXT.md

4. **Vehicle type for car icon?**
   - Resolved: Add `vehicle_body_type` column, map from NHTSA BodyClass

### For Planning Phase

1. **Token generation timing**
   - When is access_token generated? At registration creation or on-demand?
   - Recommendation: At creation (default via PostgreSQL)

2. **Link delivery mechanism**
   - Phase 3 scope: Generate and display link
   - Phase 4 (notifications): Send via SMS/email
   - Need to confirm this boundary

3. **Stage tap interaction on mobile**
   - CONTEXT.md: "Tap arc segment to see that stage's description"
   - Need to decide: Tap stage marker or tap anywhere on arc?
   - Recommendation: Tap stage marker dots around arc perimeter

---

## Sources

### Primary (HIGH confidence)
- `pages/RegistrationTracker.tsx` - Current implementation patterns
- `components/SplashScreen.tsx` - SVG stroke animation patterns
- `components/CrestLoader.tsx` - Logo loading animation
- `components/luxury/LuxurySplashScreen.tsx` - Framer Motion animation patterns
- `services/registrationService.ts` - Database access patterns
- `.planning/phases/03-customer-portal-status-tracker/03-CONTEXT.md` - User decisions
- `types.ts` - Registration and stage type definitions
- `tailwind.config.js` - Animation keyframes, color palette

### Secondary (MEDIUM confidence)
- Framer Motion docs (referenced via codebase usage patterns)
- SVG stroke-dasharray technique (standard web animation pattern)

### Tertiary (LOW confidence - awareness only)
- MDN navigator.share API docs
- NHTSA vPIC API for VehicleType/BodyClass values

---

## Metadata

**Confidence breakdown:**
- Animation approach: HIGH - Framer Motion already proven in codebase
- Database changes: HIGH - follows Phase 2 patterns
- Component structure: HIGH - extends existing RegistrationTracker
- SVG techniques: HIGH - proven in SplashScreen.tsx
- Token security: MEDIUM - standard approach but needs review
- Mobile UX: MEDIUM - patterns exist but specific interactions TBD

**Research date:** 2026-02-05
**Valid until:** Indefinite (codebase-specific research, CONTEXT.md locked decisions)
