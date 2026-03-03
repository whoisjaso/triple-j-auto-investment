# Phase 15: Engagement Spectrum - Research

**Completed:** 2026-02-19

## Current State Analysis

### Existing Lead Pipeline
- **leads table** in Supabase: `id, name, email, phone, interest, status ('New'|'Contacted'|'Closed'), date, created_at`
- **RLS**: Anyone can INSERT leads (public forms); admins have full CRUD
- **addLead()** in Store.tsx writes to Supabase + fires EmailJS notification + optionally triggers Retell AI outbound call
- **Real-time subscriptions** on leads table already active (auto-refresh on INSERT/UPDATE/DELETE)
- Contact.tsx and Finance.tsx both use addLead() -- no setTimeout mocks remain

### Existing Vehicle Detail Page (VehicleDetail.tsx)
- 9-section psychological flow: back nav, hero gallery, identity headline, verified badge, price block, vehicle story, specs, social proof, CTAs
- Current CTAs: "Schedule a Visit" (links to /contact), "Call Us" (tel:), "Apply for Financing" (links to /finance)
- No interactive payment calculator
- No save/favorite functionality
- No phone-capture forms on the page

### Existing Inventory Page (Inventory.tsx)
- Vehicle cards with: Express Interest, Book Now, View Details buttons
- Modal with tabs: Overview, Specs, Transparency, Purchase, Rent
- Purchase/Rent tabs have name/phone/email forms → addLead() + Retell AI
- No save/favorite functionality on cards

### Existing Payment Estimation
- `marketEstimateService.ts` has `estimateMonthlyPayment(price, downPayment=500, termMonths=24)` -- simple division, no interactive UI
- `estimateMarketValue(price, year, mileage)` -- markup-based estimate

### Existing Types
- `Vehicle` interface has 52 fields including Phase 14 additions (slug, identityHeadline, vehicleStory, isVerified, marketEstimate)
- `Lead` interface: `{ id, name, email, phone, interest, date, status }`
- Lead.interest stores either a VIN (vehicle inquiry) or "General Inquiry: message" (contact form)

## Design Decisions

### Database Approach: Extend Existing leads Table
**Decision**: Add columns to existing `leads` table rather than creating a new table.
**Rationale**:
- Admin dashboard already shows leads -- new vehicle-specific leads appear automatically
- Real-time subscriptions already active -- no new channel setup
- EmailJS notification already fires -- new leads get emailed to admin
- Simpler data model, one place for all leads
- New columns are nullable for backward compatibility with Contact/Finance forms

**New columns needed**:
- `vehicle_id UUID REFERENCES vehicles(id)` -- which vehicle this lead is about (nullable for general inquiries)
- `action_type TEXT` -- what the visitor did: 'contact', 'finance', 'price_alert', 'similar_vehicles', 'vehicle_report', 'schedule_visit', 'ask_question', 'reserve'
- `commitment_level INTEGER` -- 1, 2, or 3 (Level 0 actions don't create leads)
- `message TEXT` -- free-text for ask-a-question (replaces stuffing into interest field)

### Save/Favorite: localStorage with Heart Icon
**Decision**: localStorage-based persistence, no account required.
**Rationale**:
- Phase scope says "no login, no form" for Level 0
- No customer account system for anonymous visitors
- localStorage persists across browser sessions on same device
- Simple array of vehicle IDs stored as JSON
- Heart icon on both cards and detail page
- Saved vehicles accessible via filter/tab on inventory page

### Payment Calculator: Inline Expandable on Detail Page
**Decision**: Expandable section below the price block, not a modal.
**Rationale**:
- Keeps visitor on the page (no context switch)
- Interactive sliders for down payment ($0-$2000) and term (12/18/24/36 months)
- Updates in real-time as sliders move
- No personal info required (pure calculation)
- Uses existing estimateMonthlyPayment logic

### Phone Capture: Inline Expansion Pattern
**Decision**: Clicking a Level 1 action expands an inline phone input below the button.
**Rationale**:
- Lower friction than modal (no overlay dismissal)
- Phone-only means single input field + submit button
- Feels casual, not form-like
- Success state replaces form with checkmark + "We'll be in touch"
- Reusable component across all Level 1 actions

### Level 2 Forms: In-Page Sections
**Decision**: Schedule Visit and Ask Question are sections on the vehicle detail page, not separate page navigations.
**Rationale**:
- Current CTAs link away to /contact -- breaks the vehicle context
- In-page forms keep the visitor engaged with the specific vehicle
- Name + phone fields (phone required, name for personalization)
- Vehicle context auto-attached (not re-entered by visitor)
- Success state replaces form with confirmation

### Reserve Vehicle: Declarative Section
**Decision**: Simple interest-hold form, not a checkout flow.
**Rationale**:
- Per user decision: "interest hold with no money"
- Visitor provides name + phone + optional message
- Creates lead with action_type='reserve', commitment_level=3
- Confirmation message explains next steps ("We'll hold this vehicle and call you within the hour")
- Visual distinction (gold border, slightly more prominent) to signal higher commitment

### COMMIT-09: Already Satisfied
**Analysis**: Contact.tsx and Finance.tsx already use addLead() which writes to Supabase. No setTimeout mocks exist in the codebase. However, the new action_type column will retroactively categorize these as 'contact' and 'finance' type leads for better pipeline visibility. The existing forms should be updated to include the action_type when creating leads.

### Visual Layout on Vehicle Detail Page
The commitment spectrum replaces the existing 3-CTA section (Section 9) with a structured commitment ladder:

```
[Save/Favorite Heart Button] -- floating in hero area (Level 0)

Section 5.5: Payment Calculator (Level 0)
  - Expandable below price block
  - Sliders for down payment + term
  - Real-time monthly estimate

Section 9: Engagement Spectrum (replaces old CTAs)
  Level 1 actions (phone only):
    [Get Price Alert] [Similar Vehicles] [Vehicle Report]

  Level 2 actions (name + phone):
    [Schedule a Visit] [Ask a Question]

  Level 3 action (highest commitment):
    [Reserve This Vehicle]

  Direct contact (always available):
    [Call Us: (832) 400-9760]
```

## Plan Breakdown

### Plan 15-01: CRM Pipeline + Persistence Foundation (Wave 1)
- Database migration: add columns to leads table
- Extend Lead TypeScript interface with new fields
- Create vehicleLeadService.ts for structured lead creation
- Create savedVehiclesService.ts (localStorage hook)
- Add bilingual translation keys for all engagement components

### Plan 15-02: Level 0 + Level 1 Components (Wave 2)
- SaveButton component (heart icon, localStorage)
- PaymentCalculator component (interactive, inline)
- PhoneCaptureForm reusable component
- Level 1 action wrappers (PriceAlert, SimilarVehicles, VehicleReport)
- SavedVehiclesFilter on inventory page

### Plan 15-03: Level 2 + Level 3 + Integration (Wave 3)
- ScheduleVisitForm component
- AskQuestionForm component
- ReserveVehicleSection component
- CommitmentSpectrum layout assembly on VehicleDetail.tsx
- Existing form updates (Contact/Finance add action_type)
- Integration into VehicleDetail.tsx replacing old CTAs

---

*Phase: 15-engagement-spectrum*
*Research completed: 2026-02-19*
