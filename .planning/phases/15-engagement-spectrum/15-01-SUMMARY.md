# Plan 15-01 Summary: CRM Pipeline + Persistence Foundation

**Completed:** 2026-02-19
**Status:** All 5 tasks done

## What Was Done

### Task 1: Database Migration (Supabase)
- Added 4 columns to `leads` table: `vehicle_id` (UUID FK), `action_type` (TEXT), `commitment_level` (INTEGER), `message` (TEXT)
- Created indexes: `idx_leads_vehicle_id`, `idx_leads_action_type`
- Backfilled existing leads: Contact form leads → `action_type='contact'`, vehicle inquiry leads → `action_type='vehicle_inquiry'`
- All columns nullable for backward compatibility

### Task 2: Lead Type + Store Transform
- Extended `Lead` interface with 4 optional fields: `vehicleId`, `actionType`, `commitmentLevel`, `message`
- Added `LeadActionType` and `CommitmentLevel` type aliases
- Added `.map()` transform to `loadLeads` for snake_case → camelCase conversion
- Added 4 new fields to `addLead` insert object

### Task 3: vehicleLeadService.ts (NEW)
- `createVehicleLead()` builds Lead objects with correct action_type and commitment_level
- `formatPhoneDisplay()` formats phone numbers as (XXX) XXX-XXXX
- `isValidPhone()` validates 10-11 digit phone numbers
- ACTION_COMMITMENT map ensures consistent level assignment

### Task 4: useSavedVehicles.ts (NEW)
- localStorage-based hook (`tj_saved_vehicles` key)
- Exposes: `savedIds`, `savedCount`, `isSaved()`, `toggleSave()`, `clearAll()`
- Cross-tab sync via `storage` event listener
- No login or personal information required

### Task 5: Bilingual Translation Keys
- Added `engagement` block to both `en` and `es` translation objects
- ~55 keys covering all 4 commitment levels
- Level 0: save/favorite, payment calculator
- Level 1: phone capture, price alert, similar vehicles, vehicle report
- Level 2: schedule visit, ask question
- Level 3: reserve vehicle
- General: submit, sending, call us

## Files Modified
| File | Change |
|------|--------|
| `types.ts` | +4 Lead fields, +2 type aliases |
| `lib/store/leads.ts` | +map transform in loadLeads, +4 fields in addLead insert |
| `services/vehicleLeadService.ts` | NEW: 3 exported functions |
| `hooks/useSavedVehicles.ts` | NEW: localStorage hook with 5 return values |
| `utils/translations.ts` | +engagement block in en and es (~110 lines added) |

## Verification
- Database: 4 columns confirmed via information_schema query
- TypeScript: Zero errors in Phase 15 files (pre-existing errors in SEO.tsx, About.tsx, edge functions unchanged)
- Vite build: Succeeds in 16.8s

## Ready For
- Plan 15-02: Level 0 + Level 1 UI components (SaveButton, PaymentCalculator, PhoneCaptureForm)
- Plan 15-03: Level 2 + Level 3 forms and VehicleDetail integration

---
*Plan: 15-01 | Phase: 15-engagement-spectrum*
*Completed: 2026-02-19*
