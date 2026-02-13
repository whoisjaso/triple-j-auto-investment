# Phase 7: Plate Tracking - Research

**Researched:** 2026-02-13
**Domain:** Dealer plate management (first-class entities, assignment history, customer tracking, dashboard, alerts)
**Confidence:** HIGH

## Summary

Phase 7 adds a plate tracking system to an existing Supabase/React/Tailwind auto dealer app that already has a complete rental management system (Phase 6) and notification infrastructure (Phase 4). The core challenge is elevating plates from a simple `plate_number` varchar field on the `registrations` table to first-class entities with their own lifecycle, assignment history, and real-time tracking across rental bookings and vehicle sales.

The system tracks three plate types -- dealer plates (metal, dealership-owned, 10-25 fleet), buyer's tags (60-day temporary, state-issued numbers from txDMV), and permanent plates (post-registration, customer-owned). Each plate has a profile (number, type, status, expiration, notes, photo) and an assignment history showing which vehicle/customer had it and when. The technical architecture is straightforward: two new database tables (`plates`, `plate_assignments`), a new service layer (`plateService.ts`), modifications to the existing RentalBookingModal (add plate selection step), modifications to the return flow in Rentals.tsx (add "confirm plate returned" checkbox), a new admin page at `/admin/plates`, and a "Plates" summary tab in the existing Rentals page.

The alert system leverages the existing Phase 4 notification infrastructure (Edge Functions, Twilio SMS, Resend email) via a new or extended Edge Function that checks for overdue rentals, expiring buyer's tags, and unaccounted plates. Alert deduplication prevents spamming the admin with repeated notifications for the same condition.

**Primary recommendation:** Create two new tables (`plates` and `plate_assignments`), a `plateService.ts` service layer following the existing transformer pattern, modify `RentalBookingModal` to add plate selection, modify the return flow to include plate confirmation, add a new `/admin/plates` page with split-view dashboard, add a "Plates" tab to the Rentals page, and create a `check-plate-alerts` Edge Function that runs on pg_cron schedule to detect and notify about overdue/expiring/unaccounted conditions.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in project -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.87.1 | Database, auth, storage | Already the entire backend |
| `react` | ^19.2.0 | UI framework | Already the entire frontend |
| `tailwindcss` | ^3.4.19 | Styling | Already used for all UI |
| `framer-motion` | ^12.23.26 | Animations, modal transitions | Already used for modals |
| `lucide-react` | ^0.554.0 | Icons | Already used throughout |

### New Dependencies
None. Phase 7 requires zero new npm packages. All functionality is achievable with the existing stack. Plate photo uploads use Supabase Storage (same as condition report photos from Phase 6).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage for plate photos | Base64 in JSONB | Anti-pattern; existing codebase stores URLs not base64 |
| pg_cron Edge Function for alerts | Client-side polling | Polling is wasteful and only works when admin has page open |
| Assignment history table | JSONB array on plates table | Loses queryability, harder to audit, can grow unbounded |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
triple-j-auto-investment-main/
  types.ts                              # Add: Plate, PlateAssignment, PlateType, PlateStatus
  services/
    plateService.ts                     # NEW: Full CRUD + assignment + alert service
  pages/admin/
    Plates.tsx                          # NEW: Dedicated plate management page
    Rentals.tsx                         # MODIFY: Add "Plates" tab with summary view
  components/admin/
    RentalBookingModal.tsx              # MODIFY: Add plate selection step
    PlateAssignmentHistory.tsx          # NEW: Timeline/table of plate assignments
  supabase/
    migrations/
      07_plate_tracking.sql             # NEW: plates + plate_assignments tables
    functions/
      check-plate-alerts/index.ts       # NEW: Cron-triggered alert checker
      _shared/
        email-templates/
          plate-alert.tsx               # NEW: Alert email template
```

### Pattern 1: First-Class Entity with Assignment History
**What:** Plates are independent database entities linked to vehicles and customers via an assignment history table, not embedded as columns on other tables.
**When to use:** The `plates` table stores the plate profile; `plate_assignments` stores every assignment/unassignment event as an immutable log.
**Why:** The existing `registrations.plate_number` field is a simple varchar snapshot. Phase 7 needs plates as entities that exist independently of any vehicle or registration -- they can be reassigned, lost, expire, etc. The assignment history creates a complete audit trail.

**Database Design:**
```sql
-- plates: First-class plate entity
CREATE TABLE IF NOT EXISTS public.plates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  plate_type TEXT NOT NULL CHECK (plate_type IN ('dealer', 'buyer_tag', 'permanent')),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'expired', 'lost')),
  expiration_date DATE,                    -- Required for buyer_tag, optional for dealer
  photo_url TEXT,                          -- Supabase Storage URL
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- plate_assignments: Immutable assignment log
CREATE TABLE IF NOT EXISTS public.plate_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id UUID NOT NULL REFERENCES public.plates(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  booking_id UUID REFERENCES public.rental_bookings(id),
  registration_id UUID REFERENCES public.registrations(id),
  customer_name TEXT,                      -- Denormalized for dashboard queries
  customer_phone TEXT,                     -- Denormalized for dashboard queries
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('rental', 'sale', 'inventory')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,               -- For rentals: booking end_date
  returned_at TIMESTAMPTZ,                 -- NULL = still out
  return_confirmed BOOLEAN DEFAULT false,  -- Admin confirmed physical return
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pattern 2: Service Layer with Transformers (follows registrationService.ts, rentalService.ts)
**What:** All Supabase operations go through `plateService.ts` with snake_case-to-camelCase transform functions.
**When to use:** Every database operation for plate data.
**Example:**
```typescript
// services/plateService.ts

export interface Plate {
  id: string;
  plateNumber: string;
  plateType: PlateType;
  status: PlateStatus;
  expirationDate?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Derived from current active assignment (optional join)
  currentAssignment?: PlateAssignment;
}

const transformPlate = (data: any): Plate => ({
  id: data.id,
  plateNumber: data.plate_number,
  plateType: data.plate_type as PlateType,
  status: data.status as PlateStatus,
  expirationDate: data.expiration_date ?? undefined,
  photoUrl: data.photo_url ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  currentAssignment: data.plate_assignments?.[0]
    ? transformAssignment(data.plate_assignments[0])
    : undefined,
});
```

### Pattern 3: Modify Existing RentalBookingModal (add plate selection)
**What:** Add a plate selection substep to the "Vehicle & Dates" section of the existing 4-section modal. After selecting a vehicle, admin selects an available dealer plate from a filtered list.
**When to use:** During rental booking creation.
**Integration approach:** The RentalBookingModal already has a `SectionKey = 'customer' | 'vehicle' | 'terms' | 'review'` type. Plate selection should be an inline subsection within the 'vehicle' section (after vehicle selection, before terms). This avoids changing the section navigation structure. Add state for `selectedPlateId` and fetch available plates when a vehicle is selected.

```typescript
// In RentalBookingModal.tsx, within the 'vehicle' section:
// After vehicle selection, show plate selection dropdown
// Filter: plates WHERE plate_type = 'dealer' AND status = 'available'
```

### Pattern 4: Modify Return Flow (add plate confirmation)
**What:** Extend the existing return flow in BookingDetail with a "Plate Returned" checkbox.
**When to use:** When admin processes a rental return.
**Integration approach:** The return flow currently has returnDate and returnMileage fields. Add a `plateReturned` checkbox (defaults to checked). When return is processed, if checked, the plate_assignment.returned_at is set and plate status flips to 'available'. If unchecked, plate stays assigned and an alert condition is created.

### Pattern 5: Split-View Dashboard
**What:** The dedicated `/admin/plates` page uses a two-panel layout: left side shows plates currently out (urgent/actionable), right side shows full plate inventory.
**When to use:** The main plate management page.
**Responsive behavior:** On desktop, side-by-side (lg:grid-cols-5 with 3 left, 2 right). On mobile, stacked vertically (plates-out on top, then full inventory below). This follows the natural priority: "where are my plates RIGHT NOW" is the first thing the dealer checks.

### Pattern 6: Alert Edge Function with Deduplication
**What:** A Supabase Edge Function triggered by pg_cron checks for alert conditions and sends notifications, with deduplication to avoid re-alerting for the same condition.
**When to use:** Recurring alert checking.
**Deduplication strategy:** Add a `plate_alerts` table (or JSONB column on plates) that tracks `last_alert_sent_at` per alert type. The Edge Function only sends a new alert if:
  - The condition is NEW (wasn't present at last check), OR
  - Enough time has passed since last alert (escalation: first alert immediately, then daily for ongoing conditions)

```sql
CREATE TABLE IF NOT EXISTS public.plate_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id UUID NOT NULL REFERENCES public.plates(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('overdue_rental', 'expiring_buyer_tag', 'unaccounted')),
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (plate_id, alert_type)  -- Partial: only one active alert per type per plate
);
```

### Anti-Patterns to Avoid
- **Modifying registration.plate_number directly:** The existing `plate_number` varchar on registrations should remain as-is for backward compatibility. The new `plate_assignments` table handles the relationship going forward. Future work can migrate the existing field to reference the plates table.
- **Storing assignment history as JSONB array on the plate:** This loses queryability ("which plates has this customer had?") and makes the array grow unbounded.
- **Client-side-only alerts:** Alerts must work even when no admin has the page open. Use pg_cron + Edge Function, not client-side polling.
- **Creating a shared AdminHeader component:** Per research pitfall #7, each admin page defines its own AdminHeader. The Plates page should follow this pattern.
- **Adding plate_id as a required column on rental_bookings:** Instead, use the `plate_assignments` table to link plates to bookings. This keeps the rental_bookings table clean and allows plates to be assigned to non-rental scenarios (sales, inventory parking).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snake/camel case transform | Manual per-field mapping | Follow `transformPlate` pattern from `transformBooking` in rentalService.ts | Established pattern, consistent |
| Plate photo upload | Custom upload logic | Supabase Storage `.from('plate-photos').upload()` + `.getPublicUrl()` | Same pattern as condition report photos |
| SMS/Email alerts | New notification pipeline | Extend Phase 4 infrastructure (_shared/twilio.ts, _shared/resend.ts) | Already configured, tested |
| Admin page layout | New layout system | Follow AdminHeader duplication pattern from Rentals.tsx | Established pattern |
| Tab navigation | Custom tab system | Follow `RentalTab` segmented control pattern from Rentals.tsx | border-b-2 active indicator already established |
| Modal workflows | New modal pattern | Follow `createPortal` + `useScrollLock` + `AnimatePresence` from BillOfSaleModal | Established pattern |
| Date calculations | Custom date math | Follow `calculateLateFee` pure function pattern from rentalService.ts | Days-remaining calculation is analogous |

**Key insight:** Phase 7 is primarily a data modeling and UI composition exercise. The infrastructure (service layer pattern, notification system, admin page structure, modal patterns) is already built. The work is designing the plate entity model, building the assignment flow, creating the dashboard view, and wiring alerts to the existing notification infrastructure.

## Common Pitfalls

### Pitfall 1: Circular Plate Assignment on Booking Creation
**What goes wrong:** The booking is created successfully but the plate assignment fails, leaving an inconsistent state (booking exists with no plate assigned).
**Why it happens:** Two separate database operations (create booking, create plate assignment) without a transaction.
**How to avoid:** Use a PostgreSQL function or Supabase RPC call that creates the booking and the plate assignment atomically. Alternatively, make the plate assignment from the client side immediately after booking creation, with error handling that warns the admin if the assignment step fails (graceful degradation -- the booking still exists, admin can manually assign later).
**Warning signs:** Bookings without plate assignments, plates showing as "available" when they should be "assigned".

### Pitfall 2: Stale Available Plates List
**What goes wrong:** Two admins creating bookings at the same time both select the same dealer plate.
**Why it happens:** The available plates query runs when the modal opens, but another admin assigns the plate between query and submission.
**How to avoid:** Add a UNIQUE constraint on `plate_assignments` that prevents multiple active assignments (WHERE returned_at IS NULL) for the same plate. The insert will fail with a constraint violation, which the client handles gracefully with a "plate already assigned" error message and a prompt to refresh available plates.
**Warning signs:** Constraint violation errors on plate_assignments insertion.

### Pitfall 3: Buyer's Tag Expiration Date Calculation
**What goes wrong:** Buyer's tags show incorrect "days remaining" because the 60-day countdown is calculated from the wrong reference date.
**Why it happens:** The 60-day countdown starts from the **sale date** (when the tag is issued), not from when it's entered into the system.
**How to avoid:** The `expiration_date` on the plate is explicitly set by the admin (or auto-calculated from sale date + 60 days) when the buyer's tag is created. The "days remaining" display is `expiration_date - today`, a pure client-side calculation. Do not calculate from `created_at`.
**Warning signs:** Tags showing expired when they shouldn't be, or showing more days remaining than expected.

### Pitfall 4: Plate Assignment vs. Plate Status Inconsistency
**What goes wrong:** A plate's status says "available" but it has an active (unreturned) assignment, or vice versa.
**Why it happens:** Status is updated separately from assignments without using a database trigger to keep them in sync.
**How to avoid:** Use a database trigger on `plate_assignments` that automatically updates `plates.status` to 'assigned' on INSERT (when returned_at IS NULL) and to 'available' on UPDATE (when returned_at is set). This ensures consistency at the database level regardless of how the assignment is created.
**Warning signs:** Dashboard counts disagreeing (e.g., 5 plates "out" but 3 plates with status "assigned").

### Pitfall 5: Alert Notification Spam
**What goes wrong:** The admin gets 50 SMS messages in one morning because every plate alert triggers individually.
**Why it happens:** The alert Edge Function fires per-plate without batching or deduplication.
**How to avoid:** Batch alert notifications. The Edge Function should:
  1. Collect ALL current alert conditions (overdue, expiring, unaccounted)
  2. Compare against `plate_alerts` table to find NEW or ESCALATED conditions
  3. Send ONE summary SMS/email with all alerts, not one per plate
  4. Update `last_notified_at` for all alerted conditions
**Warning signs:** Multiple rapid-fire SMS messages, admin complaining about notification volume.

### Pitfall 6: Return Flow Not Unassigning Plate
**What goes wrong:** A rental is returned but the plate stays in "assigned" status.
**Why it happens:** The existing `returnBooking` function in rentalService.ts updates booking status but knows nothing about plates.
**How to avoid:** The return flow handler (in BookingDetail) must call the plate service to record the return AND update the plate status. This is an application-level orchestration: first call `returnBooking()`, then call `returnPlateAssignment()`. The "plate returned" checkbox determines whether the assignment is closed (returned_at set) or left open (plate not physically returned, triggers alert).
**Warning signs:** Plates accumulating in "assigned" status even after bookings are returned.

### Pitfall 7: AdminHeader Missing "Plates" Nav Item
**What goes wrong:** The Plates page is accessible via URL but not discoverable in navigation.
**Why it happens:** Each admin page has its own AdminHeader with a hardcoded navItems array.
**How to avoid:** When creating the Plates page, add `{ path: '/admin/plates', label: 'Plates', icon: CreditCard }` to the navItems array. Also add it to the AdminHeaders in Dashboard.tsx, Inventory.tsx, Registrations.tsx, and Rentals.tsx. Use a distinctive Lucide icon (CreditCard or Disc or Tag).
**Warning signs:** Users not finding the Plates page, only accessible via direct URL.

## Code Examples

### Database Schema: Plates and Assignments
```sql
-- Source: Derived from existing rental_schema.sql patterns

-- 1. PLATES TABLE (first-class entity)
CREATE TABLE IF NOT EXISTS public.plates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number VARCHAR(20) NOT NULL,
  plate_type TEXT NOT NULL
    CHECK (plate_type IN ('dealer', 'buyer_tag', 'permanent')),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'expired', 'lost')),
  expiration_date DATE,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT plates_plate_number_unique UNIQUE (plate_number)
);

-- 2. PLATE_ASSIGNMENTS TABLE (immutable history log)
CREATE TABLE IF NOT EXISTS public.plate_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id UUID NOT NULL REFERENCES public.plates(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  booking_id UUID REFERENCES public.rental_bookings(id),
  registration_id UUID REFERENCES public.registrations(id),
  customer_name TEXT,
  customer_phone TEXT,
  assignment_type TEXT NOT NULL
    CHECK (assignment_type IN ('rental', 'sale', 'inventory')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,
  returned_at TIMESTAMPTZ,
  return_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique: only one active assignment per plate
CREATE UNIQUE INDEX IF NOT EXISTS uq_plate_active_assignment
  ON public.plate_assignments (plate_id) WHERE (returned_at IS NULL);

-- 3. PLATE_ALERTS TABLE (deduplication)
CREATE TABLE IF NOT EXISTS public.plate_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id UUID NOT NULL REFERENCES public.plates(id),
  alert_type TEXT NOT NULL
    CHECK (alert_type IN ('overdue_rental', 'expiring_buyer_tag', 'unaccounted')),
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('warning', 'urgent')),
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active (unresolved) alert per plate per type
CREATE UNIQUE INDEX IF NOT EXISTS uq_plate_active_alert
  ON public.plate_alerts (plate_id, alert_type) WHERE (resolved_at IS NULL);

-- 4. AUTO-UPDATE PLATE STATUS TRIGGER
CREATE OR REPLACE FUNCTION update_plate_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.returned_at IS NULL THEN
    UPDATE public.plates SET status = 'assigned', updated_at = NOW()
    WHERE id = NEW.plate_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    -- Check if plate has any other active assignments
    IF NOT EXISTS (
      SELECT 1 FROM public.plate_assignments
      WHERE plate_id = NEW.plate_id AND returned_at IS NULL AND id != NEW.id
    ) THEN
      UPDATE public.plates SET status = 'available', updated_at = NOW()
      WHERE id = NEW.plate_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Service Layer: plateService.ts
```typescript
// services/plateService.ts - follows rentalService.ts pattern

import { supabase } from '../supabase/config';
import { Plate, PlateAssignment, PlateType, PlateStatus } from '../types';

const transformPlate = (data: any): Plate => ({
  id: data.id,
  plateNumber: data.plate_number,
  plateType: data.plate_type as PlateType,
  status: data.status as PlateStatus,
  expirationDate: data.expiration_date ?? undefined,
  photoUrl: data.photo_url ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  currentAssignment: data.plate_assignments?.[0]
    ? transformAssignment(data.plate_assignments[0])
    : undefined,
});

const transformAssignment = (data: any): PlateAssignment => ({
  id: data.id,
  plateId: data.plate_id,
  vehicleId: data.vehicle_id ?? undefined,
  bookingId: data.booking_id ?? undefined,
  registrationId: data.registration_id ?? undefined,
  customerName: data.customer_name ?? undefined,
  customerPhone: data.customer_phone ?? undefined,
  assignmentType: data.assignment_type,
  assignedAt: data.assigned_at,
  expectedReturnDate: data.expected_return_date ?? undefined,
  returnedAt: data.returned_at ?? undefined,
  returnConfirmed: data.return_confirmed ?? false,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
});

// Fetch all plates with current assignment (if any)
export async function getAllPlates(): Promise<Plate[]> {
  const { data, error } = await supabase
    .from('plates')
    .select('*, plate_assignments!left(*)')
    .order('plate_number', { ascending: true });
  // Note: Filter plate_assignments to only active (returned_at IS NULL) client-side
  // or use a view
}

// Fetch plates currently out (have active assignment)
export async function getPlatesOut(): Promise<Plate[]> {
  // Query plates with status = 'assigned'
  // Join plate_assignments WHERE returned_at IS NULL
  // Join booking for expected_return_date + vehicle info
}

// Assign plate to a rental booking
export async function assignPlateToBooking(
  plateId: string,
  bookingId: string,
  vehicleId: string,
  customerName: string,
  customerPhone: string,
  expectedReturnDate: string
): Promise<PlateAssignment | null> { ... }

// Return a plate (mark assignment as returned)
export async function returnPlateAssignment(
  assignmentId: string,
  returnConfirmed: boolean
): Promise<boolean> { ... }

// Get assignment history for a plate
export async function getPlateHistory(plateId: string): Promise<PlateAssignment[]> { ... }

// Get available dealer plates (status = 'available', type = 'dealer')
export async function getAvailableDealerPlates(): Promise<Plate[]> { ... }
```

### Plate Selection in RentalBookingModal
```typescript
// Addition to RentalBookingModal.tsx vehicle section
// After vehicle selection, before moving to terms:

// State additions:
const [availablePlates, setAvailablePlates] = useState<Plate[]>([]);
const [selectedPlateId, setSelectedPlateId] = useState('');
const [loadingPlates, setLoadingPlates] = useState(false);

// Effect: fetch available plates when vehicle is selected
useEffect(() => {
  if (!selectedVehicleId) return;
  setLoadingPlates(true);
  getAvailableDealerPlates().then(plates => {
    setAvailablePlates(plates);
    setLoadingPlates(false);
    // Auto-select if only one available
    if (plates.length === 1) setSelectedPlateId(plates[0].id);
  });
}, [selectedVehicleId]);

// In submit handler, after createBooking:
// Call assignPlateToBooking(selectedPlateId, booking.id, vehicleId, ...)
```

### Return Flow with Plate Confirmation
```typescript
// Addition to BookingDetail return flow in Rentals.tsx

// State addition:
const [plateReturned, setPlateReturned] = useState(true);

// In the return flow UI (after mileage input):
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={plateReturned}
    onChange={e => setPlateReturned(e.target.checked)}
    className="w-4 h-4 accent-tj-gold"
    id="plate-returned"
  />
  <label htmlFor="plate-returned" className="text-sm text-gray-300">
    Dealer plate physically returned
  </label>
</div>
{!plateReturned && (
  <p className="text-xs text-red-400 flex items-center gap-1">
    <AlertTriangle size={12} />
    Plate will be flagged for follow-up
  </p>
)}

// In handleProcessReturn, after returnBooking:
// if (plateReturned) await returnPlateAssignment(assignmentId, true);
// else: leave assignment open, alert will be generated
```

### Plates Dashboard Split View
```typescript
// pages/admin/Plates.tsx - Split view pattern

// Left panel (3/5 width): Plates currently out
// - Each entry: plate number, type badge, customer name, phone,
//   vehicle (year/make/model), assigned date, expected return,
//   days remaining/overdue indicator, notes
// - Sorted: overdue first (red), then by expected return date ascending

// Right panel (2/5 width): Full plate inventory
// - Table: plate number, type, status badge, expiration, current vehicle, actions
// - Filters: by type (dealer/buyer_tag/permanent), by status
// - Add plate button opens inline form or modal

// Responsive: On mobile (< lg), stack vertically
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">
    {/* Plates Out Panel */}
  </div>
  <div className="lg:col-span-2">
    {/* Full Inventory Panel */}
  </div>
</div>
```

### Alert Edge Function
```typescript
// supabase/functions/check-plate-alerts/index.ts
// Triggered by pg_cron every 15 minutes (or hourly, depending on urgency needs)

// 1. Query overdue rentals: rental_bookings WHERE status IN ('active','overdue')
//    AND end_date < CURRENT_DATE, joined to plate_assignments
// 2. Query expiring buyer's tags: plates WHERE plate_type = 'buyer_tag'
//    AND expiration_date - CURRENT_DATE <= 14 (warning) or <= 7 (urgent)
// 3. Query unaccounted: plates WHERE status = 'assigned'
//    AND no active booking or registration linked
// 4. For each condition, upsert into plate_alerts (idempotent)
// 5. Collect NEW alerts (last_notified_at IS NULL) + escalated alerts
// 6. Send ONE batched SMS/email to admin with summary
// 7. Update last_notified_at on all notified alerts

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';
```

### Buyer's Tag Expiration Display
```typescript
// Pure function for buyer's tag countdown
export function calculateTagExpiry(expirationDate: string): {
  daysRemaining: number;
  severity: 'ok' | 'warning' | 'urgent' | 'expired';
} {
  const expiry = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let severity: 'ok' | 'warning' | 'urgent' | 'expired';
  if (daysRemaining <= 0) severity = 'expired';
  else if (daysRemaining <= 7) severity = 'urgent';
  else if (daysRemaining <= 14) severity = 'warning';
  else severity = 'ok';

  return { daysRemaining, severity };
}

// UI color mapping (follows existing color pattern):
// ok: text-green-400, bg-green-500/20
// warning: text-amber-400, bg-amber-500/20 (yellow tier)
// urgent: text-red-400, bg-red-500/20 (red tier)
// expired: text-red-500, bg-red-500/30 + pulse animation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| plate_number as varchar on registrations | First-class plates table with assignment history | Phase 7 | Full lifecycle tracking, audit trail |
| No plate tracking during rentals | Plate selection required during booking | Phase 7 | Dealer knows exactly which plate is out |
| Manual plate checking | Automated alerts via pg_cron + Edge Functions | Phase 7 | Proactive detection of overdue/expiring |
| Single plate-number field | Full plate profile (type, status, expiry, photo, notes) | Phase 7 | Complete plate management |

**Existing system elements preserved:**
- `registrations.plate_number` varchar field remains as-is (backward compatible)
- `rental_bookings` table structure unchanged (plate link is via `plate_assignments`)
- All existing services and UIs continue to work unchanged

## Open Questions

Things that couldn't be fully resolved:

1. **Permanent Plate Tracking Depth**
   - What we know: The CONTEXT.md mentions three plate types including permanent plates (post-registration, customer-owned).
   - What's unclear: Whether permanent plates need active tracking (assignment history, alerts) or are just recorded for reference. Once a customer gets their permanent plates, the dealer's involvement typically ends.
   - Recommendation: Track permanent plates as reference-only records (no active assignment tracking, no alerts). The plate is created when registration reaches 'sticker_delivered' stage with the permanent plate number recorded. Status is always 'assigned' (to customer) with no return expected. This satisfies the "first-class entity" requirement without unnecessary complexity.

2. **Plate Photo Storage Bucket**
   - What we know: Phase 6 planned for a 'rental-photos' bucket. Plate photos need similar storage.
   - What's unclear: Whether to reuse the 'rental-photos' bucket or create a dedicated 'plate-photos' bucket.
   - Recommendation: Create a separate 'plate-photos' bucket. Different access patterns, different retention needs. Plate photos are long-lived reference images; rental condition photos are per-booking transient records.

3. **Direct Plate Swap Atomicity**
   - What we know: CONTEXT.md says "Direct swap is allowed -- admin can move a plate from Vehicle A to Vehicle B in one step without returning first."
   - What's unclear: Whether the swap should be truly atomic (single database transaction) or two sequential operations (close old assignment, create new one).
   - Recommendation: Implement as two sequential operations in a single service function (`swapPlateAssignment`). The partial unique index on plate_assignments ensures only one active assignment exists, so the old assignment must be closed (returned_at set) before the new one is created. The service function handles both steps, and if the second fails, the plate is in 'available' state (safe). This is simpler than a PostgreSQL stored procedure and consistent with the existing client-side service pattern.

4. **Admin Phone Number for Alert SMS**
   - What we know: Alerts should go to the admin via SMS and email. Phase 4 sends notifications to customers, not to the admin.
   - What's unclear: Where the admin's phone number and email are stored for alert delivery.
   - Recommendation: Store admin alert preferences in a simple `plate_alert_config` table or as environment variables in the Edge Function. For v1, hardcode the admin's phone/email as Edge Function environment variables (ADMIN_PHONE, ADMIN_EMAIL). This can be upgraded to a settings table later.

5. **Migration of Existing Registration plate_number Data**
   - What we know: Some registrations may already have `plate_number` values entered as free text.
   - What's unclear: Whether to migrate existing plate_number values into the new plates table.
   - Recommendation: Do NOT auto-migrate. The existing plate_number field may have inconsistent formats. Leave it as-is. Going forward, new registrations will use the plates system. A future data cleanup task can reconcile the two.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `services/rentalService.ts` - Service layer / transformer pattern (23 functions, transformBooking, transformCustomer, etc.)
- Existing codebase: `supabase/migrations/06_rental_schema.sql` - Table creation pattern (568 lines), RLS policies, triggers, indexes
- Existing codebase: `components/admin/RentalBookingModal.tsx` - 4-section modal pattern (1120 lines), section navigation, vehicle selection flow
- Existing codebase: `pages/admin/Rentals.tsx` - Tab navigation pattern (1885 lines), BookingDetail inline expansion, return flow
- Existing codebase: `supabase/functions/process-notification-queue/index.ts` - Edge Function pattern, SMS/email sending
- Existing codebase: `supabase/functions/_shared/twilio.ts` - SMS helper (no SDK, direct REST API)
- Existing codebase: `supabase/migrations/04_notification_system.sql` - Notification queue, debounce, pg_cron pattern
- Existing codebase: `types.ts` - Type definition patterns (Registration has plateNumber, RentalBooking structure)
- Existing codebase: `App.tsx` - Route registration pattern (ProtectedRoute wrapper, lazy loading)

### Secondary (MEDIUM confidence)
- PostgreSQL partial unique indexes: Used in existing codebase (04_notification_system.sql `uq_pending_notification`)
- Supabase Storage upload pattern: Referenced in Phase 6 research, used for condition report photos
- pg_cron scheduling: Already configured in Phase 4 for notification queue processing

### Tertiary (LOW confidence)
- Split-view dashboard proportions: 3/5 + 2/5 split is a judgment call based on information density needs; may need adjustment based on actual content
- Alert frequency tuning: "Every 15 minutes" is a starting estimate; may need adjustment based on dealer's urgency needs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies; all existing libraries verified in package.json
- Database design: HIGH - Tables follow exact patterns from 06_rental_schema.sql; partial unique indexes from 04_notification_system.sql; triggers follow existing patterns
- Architecture: HIGH - Service layer, modal integration, tab navigation, return flow all directly observed in existing codebase
- Alert system: MEDIUM - Leverages existing Edge Function infrastructure, but alert deduplication and batching strategy is new (no existing pattern in codebase)
- Dashboard UI: MEDIUM - Split view is a new layout pattern not used elsewhere in the codebase, though it follows standard Tailwind grid patterns
- Pitfalls: HIGH - Based on direct analysis of existing return flow, booking creation flow, and plate_number field usage

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (stable domain -- no fast-moving dependencies)
