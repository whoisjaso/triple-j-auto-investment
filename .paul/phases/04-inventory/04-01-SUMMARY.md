# Summary: 04-01 Vehicle Listings Page

## Plan vs Actual

### Task 1: Mock data, VehicleCard, inventory page — COMPLETED AS PLANNED
- Created `src/lib/mock-vehicles.ts` with 6 vehicles matching seed.sql
- Created `src/components/inventory/VehicleCard.tsx` — server component, 4:3 image area, gold price, hover lift + gold shadow
- Created `src/app/inventory/page.tsx` — server-rendered, searchParams-driven, mock data fallback
- Created `src/app/inventory/layout.tsx` — metadata
- Added `VehicleSortOption` type and `sort` param to `src/lib/supabase/queries/vehicles.ts`

### Task 2: FilterBar, SortSelect, URL params — COMPLETED AS PLANNED
- Created `src/components/inventory/FilterBar.tsx` — collapsible on mobile, horizontal on desktop, debounced search (300ms)
- Created `src/components/inventory/SortSelect.tsx` — 6 sort options, custom-styled select

### Task 3: Human-verify checkpoint — APPROVED
- Desktop: 3-col grid, filters work (Toyota filter, Clear All), sort options update URL
- Mobile (375px): single-column, collapsible Filters toggle, 44px+ tap targets

### BONUS: VIN Decoder (added beyond plan scope)
User requested NHTSA VIN decoder integration during apply. Built:
- `src/lib/nhtsa.ts` — NHTSA API client with VIN validation, field normalization (Make title-case, BodyClass → short form, DriveType → FWD/AWD/4WD, engine string builder, plant country cleanup)
- `src/app/api/vin-decode/route.ts` — Next.js API route (proxy to NHTSA, validation, error handling)
- `src/components/inventory/VinDecoder.tsx` — Client component with `alwaysOpen` prop, collapsible toggle, input filtering (no I/O/Q), loading spinner, specs grid results
- `src/app/vin-decoder/page.tsx` — Standalone VIN Decoder page with hero layout, info cards
- `src/app/vin-decoder/layout.tsx` — SEO metadata
- Added "VIN Lookup" to navbar LEFT_LINKS
- Verified with real VINs: 2006 Chevrolet Malibu (1G1ZT53846F109149), 2018 Honda CR-V EX (2HKRW2H53JH654321)

## Acceptance Criteria Results

| AC | Description | Result |
|----|-------------|--------|
| AC-1 | Inventory page renders vehicle grid | PASS — 6 cards, responsive 1/2/3 cols |
| AC-2 | Filter by make, price, year, search | PASS — URL params, debounced search |
| AC-3 | Sort vehicles | PASS — 6 sort options, URL param driven |
| AC-4 | Mock data fallback | PASS — works without Supabase env vars |
| AC-5 | Luxury aesthetic | PASS — black bg, gold prices, cream headings, subtle hover |
| AC-6 | Build passes | PASS — `npm run build` clean, no TS errors |

## Decisions Made During Execution
- Used `-translate-y-1` + gold shadow for card hover instead of `scale` (avoids grid layout shifts)
- VIN Decoder added as both collapsible on inventory page AND standalone `/vin-decoder` page
- NHTSA API proxied through `/api/vin-decode` route (avoids CORS, adds normalization)
- VIN input strips I/O/Q characters in real-time (invalid in VIN standard)
- `alwaysOpen` prop on VinDecoder for standalone vs embedded usage

## Files Created/Modified

**Created (10):**
- `src/lib/mock-vehicles.ts`
- `src/lib/nhtsa.ts`
- `src/components/inventory/VehicleCard.tsx`
- `src/components/inventory/FilterBar.tsx`
- `src/components/inventory/SortSelect.tsx`
- `src/components/inventory/VinDecoder.tsx`
- `src/app/inventory/page.tsx`
- `src/app/inventory/layout.tsx`
- `src/app/vin-decoder/page.tsx`
- `src/app/vin-decoder/layout.tsx`
- `src/app/api/vin-decode/route.ts`

**Modified (2):**
- `src/lib/supabase/queries/vehicles.ts` — added VehicleSortOption type + sort param
- `src/components/layout/Navbar.tsx` — added "VIN Lookup" to LEFT_LINKS

## Deferred Issues
- Vehicle detail page `/inventory/[slug]` returns 404 (Plan 04-02)
- No real vehicle images yet (placeholders in use)
- No pagination (6 vehicles, not needed until inventory grows)

## Duration
Plan 04-01: ~1 session
