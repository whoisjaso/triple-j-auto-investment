# Phase 6: Rental Management Core - Research

**Researched:** 2026-02-12
**Domain:** Rental management system (database schema, calendar UI, PDF agreements, payment tracking)
**Confidence:** HIGH

## Summary

Phase 6 adds a complete rental management system to an existing Supabase/React/Tailwind auto dealer app. The codebase already has established patterns for database tables (registration_ledger.sql), service layers (registrationService.ts with snake_case-to-camelCase transformers), PDF generation (jsPDF with branded templates in pdfService.ts), and modal-based admin workflows (BillOfSaleModal.tsx). The rental system should follow all of these patterns exactly.

The core technical challenges are: (1) a database-level double-booking prevention constraint using PostgreSQL's `EXCLUDE USING GiST` with `btree_gist` extension on daterange columns, (2) a custom calendar grid built with Tailwind CSS (no third-party calendar library -- the existing codebase avoids heavy UI libraries and uses Tailwind for everything), (3) extending the existing jsPDF-based PDF generation to produce comprehensive rental agreements with signature capture support, and (4) a new `services/rentalService.ts` following the exact same service pattern as `registrationService.ts`.

**Primary recommendation:** Build five new Supabase tables (`rental_config`, `rental_bookings`, `rental_customers`, `rental_payments`, `rental_condition_reports`), extend the existing `vehicles` table with rental fields, create a `rentalService.ts` service layer, and add a new admin page at `/admin/rentals` with sub-views for calendar, active rentals, and booking management. Use `react-signature-canvas` (the only new npm dependency) for digital signatures. Build the monthly calendar grid from scratch with Tailwind CSS `grid-cols-7`.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.87.1 | Database, auth, storage, realtime | Already the entire backend |
| `jspdf` | ^3.0.4 | PDF generation for rental agreements | Already used for Bill of Sale, As-Is, Registration Guide, Form 130-U |
| `react` | ^19.2.0 | UI framework | Already the entire frontend |
| `tailwindcss` | ^3.4.19 | Styling | Already used for all UI |
| `framer-motion` | ^12.23.26 | Animations, modal transitions | Already used for BillOfSaleModal |
| `lucide-react` | ^0.554.0 | Icons | Already used throughout |

### New (Single addition)
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| `react-signature-canvas` | ^1.1.0-alpha.2 | Digital signature capture on rental agreements | 383K+ weekly downloads, TypeScript support, wraps signature_pad, provides `toDataURL()` for base64 export to jsPDF `addImage()`. No alternative exists in the current stack. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-signature-canvas | Raw Canvas API | 10x more code, no smoothing, no pressure sensitivity |
| Custom calendar grid | react-big-calendar | Heavy dependency (70KB+), overkill for monthly grid, hard to match existing Tailwind aesthetic |
| Custom calendar grid | @demark-pro/react-booking-calendar | Last published 2 years ago, unmaintained |
| jsPDF (existing) | pdf-lib (existing) | pdf-lib is for form-filling only (used for 130-U); jsPDF is for drawing custom layouts. Rental agreement needs custom layout like Bill of Sale. |
| Supabase Storage | Base64 in JSONB | Photos need dedicated storage; base64 in DB is a known anti-pattern for images |

**Installation:**
```bash
npm install react-signature-canvas
npm install --save-dev @types/react-signature-canvas
```

## Architecture Patterns

### Recommended Project Structure
```
triple-j-auto-investment-main/
  types.ts                              # Add: RentalBooking, RentalCustomer, RentalPayment, etc.
  services/
    rentalService.ts                    # NEW: Full CRUD service (follows registrationService.ts pattern)
  lib/store/
    rentals.ts                          # NEW: Store module (follows vehicles.ts pattern)
    types.ts                            # Extend: RentalState, RentalSetters
  context/
    Store.tsx                           # Extend: Add rental state + wrappers (thin facade)
  pages/admin/
    Rentals.tsx                         # NEW: Main rental management page
  components/admin/
    RentalCalendar.tsx                  # NEW: Monthly grid calendar
    RentalBookingModal.tsx              # NEW: Create/edit booking modal
    RentalAgreementModal.tsx            # NEW: Agreement generation (like BillOfSaleModal)
    RentalConditionReport.tsx           # NEW: Walk-around checklist + photos
    SignatureCapture.tsx                 # NEW: Reusable signature pad component
  supabase/
    rental_schema.sql                   # NEW: Migration script for rental tables
```

### Pattern 1: Service Layer with Transformers (from registrationService.ts)
**What:** All Supabase operations go through a service file with snake_case-to-camelCase transform functions
**When to use:** Every database operation for rental data
**Example:**
```typescript
// services/rentalService.ts - follows exact registrationService.ts pattern

const transformBooking = (data: any): RentalBooking => ({
  id: data.id,
  bookingId: data.booking_id,
  vehicleId: data.vehicle_id,
  customerId: data.customer_id,
  startDate: data.start_date,
  endDate: data.end_date,
  returnDate: data.return_date,
  dailyRate: data.daily_rate,
  weeklyRate: data.weekly_rate,
  totalCost: data.total_cost,
  status: data.status,
  // ... etc
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export async function getAllBookings(): Promise<RentalBooking[]> {
  const { data, error } = await supabase
    .from('rental_bookings')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  return (data || []).map(transformBooking);
}
```

### Pattern 2: Modal-Based Workflows (from BillOfSaleModal.tsx)
**What:** Full-page portal modals with createPortal, AnimatePresence, side-by-side layouts
**When to use:** Booking creation, agreement generation, condition reports
**Example:**
```typescript
// Same pattern as BillOfSaleModal: portal to document.body,
// AnimatePresence for enter/exit, split panel (form left, preview right)
// useScrollLock(isOpen) for body scroll prevention
```

### Pattern 3: PDF Generation (from pdfService.ts)
**What:** jsPDF with branded header/footer, security background, drawSection/drawDataBox primitives
**When to use:** Rental agreement PDF generation
**Key reuse:** The existing `drawSecurityBackground`, `drawHeader`, `drawSection`, `drawDataBox`, `drawFooter` functions in pdfService.ts can be imported and reused for the rental agreement PDF. The rental agreement generator should be added to pdfService.ts alongside the existing generators.

### Pattern 4: Store Module Extraction (from lib/store/vehicles.ts)
**What:** Extract rental operations to `lib/store/rentals.ts`, expose through Store.tsx facade
**When to use:** Rental state management
**Example:**
```typescript
// lib/store/rentals.ts
export async function loadBookings(
  setters: RentalSetters
): Promise<void> {
  // Same pattern as loadVehicles
}

// context/Store.tsx - add to provider
const [bookings, setBookings] = useState<RentalBooking[]>([]);
// ... wrapper functions
```

### Pattern 5: Database-Level Double Booking Prevention
**What:** PostgreSQL EXCLUDE constraint with btree_gist extension prevents overlapping bookings per vehicle
**When to use:** The `rental_bookings` table definition
**Example:**
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE rental_bookings
  ADD CONSTRAINT prevent_double_booking
  EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'returned'));
```

### Anti-Patterns to Avoid
- **Application-only overlap checking:** The CONTEXT.md explicitly requires "database constraint, not just UI warning" for double-booking prevention. The EXCLUDE constraint handles this at the database level.
- **Separate rental vehicles table:** Do NOT create a separate table for rental vehicles. Extend the existing `vehicles` table with `listing_type` and rental rate columns. The vehicle is the same entity whether for sale or rent.
- **Base64 photos in database columns:** Condition report photos must go to Supabase Storage bucket, with only the URL stored in the database. The existing codebase stores image URLs (not base64) for vehicle galleries.
- **New third-party calendar library:** The codebase has zero third-party UI component libraries (everything is hand-built with Tailwind). The calendar grid MUST be custom-built to match the existing aesthetic.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double-booking prevention | Application-level date overlap checks | PostgreSQL `EXCLUDE USING gist` constraint | Race conditions, concurrent requests, DB is source of truth |
| Signature smoothing | Raw canvas drawing with mousemove | `react-signature-canvas` (wraps signature_pad) | Bezier interpolation, pressure sensitivity, mobile touch support |
| PDF branded template | New PDF layout system | Existing `pdfService.ts` primitives (`drawHeader`, `drawSection`, `drawDataBox`, `drawFooter`) | Already branded, tested, consistent with Bill of Sale look |
| Snake/camel case transform | Manual field mapping | Follow `transformBooking` pattern from `transformRegistration` in registrationService.ts | Established pattern, consistent, maintainable |
| Modal with scroll lock | Custom modal implementation | Follow `BillOfSaleModal` pattern with `createPortal` + `useScrollLock` + `AnimatePresence` | Already handles nested modals, body scroll, escape key |
| Order/Booking ID generation | UUID-only approach | PostgreSQL function like `generate_order_id()` (already exists for registrations) | Human-readable IDs for rental agreements: `TJ-R-2026-0001` |
| Image upload to cloud | Custom upload logic | Supabase Storage `.from('bucket').upload()` + `.getPublicUrl()` | Already configured, handles auth, CDN delivery |
| Realtime updates | Polling | Supabase realtime subscription (already used for vehicles channel) | Existing pattern in Store.tsx, instant updates |

**Key insight:** The codebase already has solutions for 80% of what the rental system needs. The primary engineering work is data modeling and UI composition, not building infrastructure.

## Common Pitfalls

### Pitfall 1: Vehicle Status Enum Collision
**What goes wrong:** Adding "Rented" to the existing `VehicleStatus` enum breaks the `vehicles` table CHECK constraint and all existing status filters.
**Why it happens:** The existing status field has a strict CHECK constraint: `status IN ('Available', 'Pending', 'Sold', 'Wholesale')`.
**How to avoid:** Do NOT modify the existing `status` column. Instead, add a new `listing_type` column (`sale_only`, `rental_only`, `both`) and track rental status in the `rental_bookings` table. The vehicle's current rental state is derived from active bookings, not stored as a vehicle status.
**Warning signs:** Wanting to add 'Rented' to VehicleStatus enum or the vehicles.status CHECK constraint.

### Pitfall 2: Calendar Month Boundary Rendering
**What goes wrong:** Bookings that span month boundaries (e.g., Jan 28 - Feb 3) disappear from one month's view.
**Why it happens:** Naive filtering only shows bookings where start_date is in the visible month.
**How to avoid:** Query for bookings where the date range overlaps with the visible month range: `WHERE start_date <= month_end AND end_date >= month_start`. The `&&` (overlaps) operator on daterange handles this at the DB level.
**Warning signs:** Bookings appearing to vanish when navigating months.

### Pitfall 3: btree_gist Extension Not Enabled
**What goes wrong:** The EXCLUDE constraint fails with "operator class not loaded" error.
**Why it happens:** `btree_gist` must be explicitly enabled in Supabase before creating the exclusion constraint.
**How to avoid:** The migration SQL MUST include `CREATE EXTENSION IF NOT EXISTS btree_gist;` BEFORE the table creation. Supabase supports this extension but it's not enabled by default.
**Warning signs:** SQL migration errors mentioning "gist" or "operator class".

### Pitfall 4: Timezone Issues with Date-Only Bookings
**What goes wrong:** Rental that starts "Jan 15" shows as "Jan 14" in some timezones.
**Why it happens:** Using `TIMESTAMPTZ` for rental dates when the business logic is date-only (not time-specific).
**How to avoid:** Use `DATE` type (not `TIMESTAMPTZ`) for `start_date` and `end_date` in rental bookings. The dealer operates in a single timezone (Houston, TX). Use `daterange` (not `tstzrange`) for the exclusion constraint.
**Warning signs:** Off-by-one date displays, timezone conversion artifacts.

### Pitfall 5: Condition Report Photos Blocking UI
**What goes wrong:** Uploading 8-12 photos during a walk-around inspection freezes the UI.
**Why it happens:** Synchronous upload of large images blocks the main thread.
**How to avoid:** Use the existing `resizeImage()` utility from admin/Inventory.tsx (compresses to 800x600 JPEG 0.5 quality) before uploading. Upload photos in parallel with `Promise.all()`. Show progress indicators per photo. Store in a dedicated Supabase Storage bucket.
**Warning signs:** UI becoming unresponsive during photo upload, large payloads failing.

### Pitfall 6: Late Fee Calculation on Stale Data
**What goes wrong:** Late fees show incorrect amounts because they're calculated from cached booking data.
**Why it happens:** Store state may be stale; late fees need real-time calculation.
**How to avoid:** Calculate late fees client-side from `endDate` and current date (pure function, not stored). Store only admin overrides/waivers. The displayed late fee is always `max(0, daysPastDue) * dailyRate` unless overridden.
**Warning signs:** Late fee amounts not updating, disagreement between dashboard and booking detail.

### Pitfall 7: AdminHeader Duplication
**What goes wrong:** The new Rentals page defines its own AdminHeader, creating a third copy.
**Why it happens:** Each admin page (Dashboard.tsx, Inventory.tsx) currently defines its own AdminHeader component -- they're already duplicated.
**How to avoid:** For Phase 6, follow the existing pattern (include AdminHeader in the Rentals page) and add "Rentals" to the navItems array. Extracting AdminHeader to a shared component is desirable but is a refactoring concern, not a Phase 6 blocker.
**Warning signs:** N/A -- just follow existing pattern.

## Code Examples

### Database Schema: Rental Tables
```sql
-- Source: Derived from registration_ledger.sql pattern + Supabase range columns docs

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Extend vehicles table with rental fields
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale_only'
    CHECK (listing_type IN ('sale_only', 'rental_only', 'both')),
  ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS min_rental_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_days INTEGER DEFAULT 30;

-- Rental customers (separate from leads -- renters have more info)
CREATE TABLE IF NOT EXISTS public.rental_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  drivers_license_number TEXT NOT NULL,
  address TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  employer_name TEXT,
  employer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental bookings (core entity)
CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id VARCHAR(20) UNIQUE NOT NULL, -- TJ-R-2026-0001
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  customer_id UUID NOT NULL REFERENCES public.rental_customers(id),

  -- Dates (DATE type, not TIMESTAMPTZ -- single-timezone business)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,          -- Planned return
  actual_return_date DATE,         -- When actually returned (NULL = still out)

  -- Rates (snapshot at booking time)
  daily_rate DECIMAL(10, 2) NOT NULL,
  weekly_rate DECIMAL(10, 2),
  total_cost DECIMAL(10, 2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'active', 'returned', 'cancelled', 'overdue')),

  -- Agreement
  agreement_signed BOOLEAN DEFAULT false,
  agreement_pdf_url TEXT,
  signature_data TEXT,             -- Base64 from signature pad

  -- Authorized drivers (JSONB array of names)
  authorized_drivers JSONB DEFAULT '[]'::jsonb,

  -- Geographic permissions
  out_of_state_permitted BOOLEAN DEFAULT false,
  permitted_states JSONB DEFAULT '[]'::jsonb,

  -- Mileage tracking
  mileage_out INTEGER,
  mileage_in INTEGER,
  mileage_limit INTEGER,

  -- Late fee management
  late_fee_override DECIMAL(10, 2),  -- NULL = auto-calculate, 0 = waived
  late_fee_notes TEXT,

  -- Admin notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Double-booking prevention at database level
  CONSTRAINT prevent_double_booking
    EXCLUDE USING gist (
      vehicle_id WITH =,
      daterange(start_date, end_date, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'returned'))
);

-- Rental payments
CREATE TABLE IF NOT EXISTS public.rental_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'zelle', 'cashapp')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by TEXT,  -- Admin who recorded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Condition reports (per booking, checkout and return)
CREATE TABLE IF NOT EXISTS public.rental_condition_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('checkout', 'return')),

  -- Checklist (JSONB -- flexible for categories)
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{category: "Exterior", item: "Front bumper", condition: "good"|"fair"|"damaged", notes: ""}]

  fuel_level TEXT CHECK (fuel_level IN ('empty', '1/4', '1/2', '3/4', 'full')),
  mileage INTEGER NOT NULL,

  -- Photos (array of Supabase Storage URLs)
  photo_urls JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  completed_by TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Layer: Booking ID Generator
```sql
-- Source: Derived from existing generate_order_id() function
CREATE OR REPLACE FUNCTION generate_rental_booking_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(booking_id FROM 11) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.rental_bookings
    WHERE booking_id LIKE 'TJ-R-' || year_part || '-%';

    new_id := 'TJ-R-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

### Signature Capture Component
```typescript
// components/admin/SignatureCapture.tsx
// Source: react-signature-canvas GitHub docs
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureCaptureProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  width = 500,
  height = 200,
}) => {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleClear = () => sigRef.current?.clear();
  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onSave(sigRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="border border-white/20 bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{ width, height, className: 'w-full' }}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleClear} className="...">Clear</button>
        <button onClick={handleSave} className="...">Accept Signature</button>
      </div>
    </div>
  );
};
```

### Adding Signature to jsPDF
```typescript
// Source: jsPDF addImage docs + existing pdfService.ts pattern
// Inside generateRentalAgreementPDF():
if (signatureDataUrl) {
  doc.addImage(signatureDataUrl, 'PNG', MARGIN, signatureY, 60, 25);
}
```

### Calendar Grid Month View
```typescript
// components/admin/RentalCalendar.tsx
// Source: Custom build following Tailwind grid-cols-7 pattern

// Core calendar math:
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay();

// Render: grid grid-cols-7 with empty cells for offset + day cells
// Each day cell shows bookings that overlap with that date
// Bookings query: WHERE start_date <= month_end AND end_date >= month_start
```

### Availability Check Query
```typescript
// services/rentalService.ts
export async function getAvailableVehicles(
  startDate: string,
  endDate: string
): Promise<Vehicle[]> {
  // Get all rental-eligible vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .in('listing_type', ['rental_only', 'both']);

  // Get bookings that overlap the requested period
  const { data: conflicting } = await supabase
    .from('rental_bookings')
    .select('vehicle_id')
    .not('status', 'in', '("cancelled","returned")')
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  const busyIds = new Set((conflicting || []).map(b => b.vehicle_id));
  return (vehicles || [])
    .filter(v => !busyIds.has(v.id))
    .map(transformVehicle);
}
```

### Late Fee Calculation (Pure Function)
```typescript
// Pure function -- no DB dependency, always current
export function calculateLateFee(
  endDate: string,
  actualReturnDate: string | null,
  dailyRate: number,
  override: number | null
): { amount: number; days: number; isOverridden: boolean } {
  if (override !== null) {
    return { amount: override, days: 0, isOverridden: true };
  }

  const due = new Date(endDate);
  const now = actualReturnDate ? new Date(actualReturnDate) : new Date();
  const diffMs = now.getTime() - due.getTime();
  const daysPastDue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    amount: daysPastDue * dailyRate,
    days: daysPastDue,
    isOverridden: false,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Application-level overlap check | PostgreSQL EXCLUDE constraint with btree_gist | PostgreSQL 9.2+ | Eliminates race conditions entirely |
| TIMESTAMPTZ for date-only data | DATE type + daterange | N/A | Eliminates timezone bugs for single-location business |
| Third-party calendar widgets | Custom Tailwind grid | Current practice in this codebase | Consistent aesthetic, no dependency bloat |
| Separate rental vehicle table | Extended vehicles table with `listing_type` | Design decision | Single source of truth for vehicle data |

**Deprecated/outdated:**
- `react-availability-calendar`: Last published 5 years ago, do not use
- `@demark-pro/react-booking-calendar`: Last published 2 years ago, do not use

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase Storage Bucket Configuration**
   - What we know: Supabase supports storage buckets with public/private access. The existing app stores vehicle images as URLs (likely external Unsplash URLs or direct image_url fields), not via Supabase Storage.
   - What's unclear: Whether a Supabase Storage bucket already exists for this project, and what the current storage quotas are.
   - Recommendation: Create a new `rental-photos` bucket. Use public access for condition report photos (they're business records, not sensitive). Configure `allowedMimeTypes: ['image/jpeg', 'image/png']` and `maxFileSize: 2MB`. If Supabase Storage is not yet configured, this is a prerequisite task.

2. **AdminHeader Component Duplication**
   - What we know: Dashboard.tsx and Inventory.tsx each define their own AdminHeader with different navItems arrays (Dashboard has Registrations, Inventory does not).
   - What's unclear: Whether the user wants a shared AdminHeader refactor as part of this phase.
   - Recommendation: Add "Rentals" to all AdminHeader navItems arrays. Follow the existing duplication pattern for now. Do not refactor AdminHeader extraction unless explicitly requested.

3. **Public Inventory Display of Rented "Both" Vehicles**
   - What we know: CONTEXT.md says "show as unavailable in public inventory with expected return date (not hidden)."
   - What's unclear: The public Inventory page (pages/Inventory.tsx) currently filters by status. How to show a vehicle as "unavailable" when its status is still "Available" but it has an active booking.
   - Recommendation: Add a derived `isCurrentlyRented` flag computed from active bookings. Public inventory shows a "Currently Rented - Available [date]" badge instead of hiding the vehicle.

4. **Rental Agreement Legal Content**
   - What we know: CONTEXT.md lists comprehensive clauses (geographic restrictions, liability, mileage limits, etc.). The user wants "a cohesive in-depth rental agreement" that protects the dealer.
   - What's unclear: The exact legal language for Texas car rental agreements.
   - Recommendation: Structure the agreement sections clearly. Use placeholder legal language that the dealer can customize. The system should make it easy to update clause text without code changes (potentially store clause templates in a config table or constants file).

## Condition Report Checklist Categories

Based on industry standards for vehicle rental condition reports, use these categories:

**Exterior (13 items):**
Front bumper, Rear bumper, Hood, Trunk/Hatch, Roof, Left front fender, Left rear fender, Right front fender, Right rear fender, Windshield, Rear window, Left side windows, Right side windows

**Interior (8 items):**
Driver seat, Passenger seat, Rear seats, Dashboard, Steering wheel, Floor mats/carpet, Headliner, Center console

**Mechanical/Functional (6 items):**
All lights working, Horn, Wipers, AC/Heat, Radio/Infotainment, Spare tire/Jack

**Condition options per item:** Good, Fair, Damaged (with notes field)

**Plus:** Fuel level (E, 1/4, 1/2, 3/4, F), Odometer reading, Photo slots per section

## Sources

### Primary (HIGH confidence)
- Existing codebase: `services/pdfService.ts` - PDF generation patterns
- Existing codebase: `services/registrationService.ts` - Service layer / transformer patterns
- Existing codebase: `components/admin/BillOfSaleModal.tsx` - Modal workflow patterns
- Existing codebase: `supabase/registration_ledger.sql` - Database migration patterns
- Existing codebase: `supabase/schema.sql` - Table structure, RLS policies, triggers
- Existing codebase: `types.ts` - Type definition patterns
- Existing codebase: `context/Store.tsx` - State management facade pattern
- Existing codebase: `lib/store/vehicles.ts` - Module extraction pattern
- [Supabase Range Columns Blog](https://supabase.com/blog/range-columns) - EXCLUDE constraint with btree_gist
- [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas) - API: isEmpty(), clear(), toDataURL(), fromDataURL()

### Secondary (MEDIUM confidence)
- [PostgreSQL btree_gist docs](https://www.postgresql.org/docs/current/btree-gist.html) - Extension capabilities
- [Supabase Extensions docs](https://supabase.com/docs/guides/database/extensions) - btree_gist is supported
- [Supabase Storage docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads) - Upload API
- [Vehicle condition report industry templates](https://record360.com/blog/what-to-check-when-renting-a-car-an-inspection-checklist/) - Checklist categories

### Tertiary (LOW confidence)
- Calendar grid implementation approach from community tutorials - Tailwind `grid-cols-7` pattern is straightforward but specific implementation details are from training data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All existing libraries verified in package.json; react-signature-canvas verified via npm/GitHub
- Architecture: HIGH - All patterns directly observed in existing codebase (registrationService.ts, pdfService.ts, BillOfSaleModal.tsx, Store.tsx)
- Database design: HIGH - EXCLUDE constraint with btree_gist verified via Supabase official blog and PostgreSQL docs; migration pattern follows registration_ledger.sql
- Pitfalls: HIGH - Based on direct codebase analysis (VehicleStatus enum, timezone types, AdminHeader duplication)
- Calendar UI: MEDIUM - Custom grid approach is standard Tailwind but no existing calendar component in codebase to reference
- Rental agreement content: MEDIUM - Structure is clear but legal clause wording needs dealer input

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable domain -- no fast-moving dependencies)
