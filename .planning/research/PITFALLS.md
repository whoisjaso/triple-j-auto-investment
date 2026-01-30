# Domain Pitfalls

**Domain:** Texas dealership operations platform (DMV registration, rental management, customer portal)
**Researched:** 2026-01-29
**Confidence:** HIGH (verified against official sources and industry patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, legal issues, or major operational failures.

### Pitfall 1: VIN Mismatch Across Documents

**What goes wrong:** VIN appears on multiple documents (Title, 130-U, Bill of Sale, Inspection) with inconsistent values. Human transcription errors, OCR mistakes, or copy-paste issues result in mismatched VINs that cause DMV rejection.

**Why it happens:**
- Manual entry of 17-character alphanumeric strings
- Multiple entry points (inventory system, document generation, external forms)
- VINs have similar-looking characters (0/O, 1/I, 8/B)
- No single source of truth enforced across document generation

**Consequences:**
- webDEALER rejection and title application return
- 30-day filing deadline pressure (5% penalty at 1-30 days late, 10% after)
- Customer frustration and registration delays
- Repeat submission labor costs

**Prevention:**
1. Establish VIN as immutable single source of truth in vehicle record
2. All document generation pulls VIN from database, never manual entry
3. Implement check-digit validation (position 9 algorithm per 49 CFR Part 565)
4. Visual confirmation UI before document generation showing VIN from all sources
5. Cross-document validation check before enabling submission workflow

**Detection (warning signs):**
- Documents generated with manually typed VINs
- VIN stored in multiple tables without foreign key enforcement
- No VIN format validation on input
- Copy-paste from external sources allowed without validation

**Phase to address:** Registration Checker phase - build VIN validation as foundation before document validation

**Confidence:** HIGH - NHTSA check digit algorithm documented, webDEALER rejection patterns confirmed

---

### Pitfall 2: Original Document Requirement Violation

**What goes wrong:** System accepts or generates documents that are copies rather than originals. webDEALER explicitly rejects applications where "scanned images cannot be copies of original documents."

**Why it happens:**
- Confusion between "scanned original" and "copy of original"
- Customer provides photocopies of title
- Re-scanning previously scanned documents
- No metadata tracking of document provenance

**Consequences:**
- Title application returned/rejected by county or TxDMV
- Must re-obtain original documents from customer
- Significant delays in registration completion
- Loss of customer trust

**Prevention:**
1. Document intake workflow explicitly flags: "Is this the ORIGINAL document?"
2. Track document provenance metadata (scan date, source, original/copy flag)
3. Validation checklist requires acknowledgment that titles are originals
4. Training/UI guidance explaining original vs. copy requirements
5. Consider document hash tracking to detect duplicate scans

**Detection:**
- No provenance tracking in document records
- Same document appearing in multiple deal jackets
- Frequent "copy of original" rejections from webDEALER

**Phase to address:** Registration Checker phase - document intake validation

**Confidence:** HIGH - webDEALER Dealer User Guide (June 2025) explicitly states requirement

---

### Pitfall 3: GPS Tracking Consent Violation (LoJack)

**What goes wrong:** GPS tracking continues after vehicle sale without explicit customer consent, violating state/federal privacy laws. Texas BHPH law requires written consent and explicit disclosure.

**Why it happens:**
- Device removal process not systematically enforced
- Consent language buried in contract fine print
- No automated tracking disable on ownership transfer
- Confusion between inventory tracking (legal) and customer tracking (requires consent)

**Consequences:**
- Individual lawsuits or class-action litigation
- FTC Section 5 violations (unfair/deceptive practices)
- Regulatory scrutiny
- Reputation damage

**Prevention:**
1. Explicit separate consent form for post-sale GPS tracking (not buried in sales contract)
2. Automatic tracking disable workflow when vehicle status changes to SOLD
3. Clear rental contract language about tracking during rental period
4. Written disclosure using language from Texas BHPH regulations
5. Audit trail of consent capture timestamps
6. 15-day auto-disable if device not explicitly transferred to customer ownership

**Detection:**
- No GPS consent field in customer records
- Tracking active on vehicles marked as SOLD
- No deactivation workflow in sale completion process
- Consent buried in general contract language

**Phase to address:** Rental Management phase - GPS integration must include consent workflows

**Confidence:** HIGH - Texas BHPH dealer regulations, FTC guidance, documented class-action patterns

---

### Pitfall 4: RLS Silent Failures Masking Data Loss

**What goes wrong:** Supabase Row Level Security (RLS) fails silently - operations appear successful but data isn't persisted or retrieved. 83% of exposed Supabase databases involve RLS misconfigurations.

**Why it happens:**
- RLS enabled without policies = deny all access silently
- Policies reference auth.uid() but anon users bypass check
- Views bypass RLS by default (security definer behavior)
- Service role key accidentally used in frontend (bypasses RLS entirely)
- January 2025 CVE: 170+ apps found with exposed databases due to RLS misconfiguration

**Consequences:**
- Data appears saved but isn't
- Users see empty lists despite data existing
- Security vulnerabilities exposing customer PII
- Inventory display loop bug (known issue in codebase)

**Prevention:**
1. Test RLS policies with Supabase dashboard user impersonation
2. Wrap all database operations in explicit error handling
3. Check `.error` property on all Supabase responses
4. Add explicit role specification to policies (use 'authenticated', not public/nothing)
5. Audit views for security_invoker setting (Postgres 15+)
6. Never use service_role key in client code
7. Add monitoring/logging for empty result sets on operations that should return data

**Detection:**
- Database operations without error checking
- Inconsistent data between admin and customer views
- Empty result sets returned without errors
- Console showing successful requests but no data updates

**Phase to address:** Reliability & Stability phase - fix RLS patterns before adding features

**Confidence:** HIGH - Supabase official docs, CVE-2025-48757, codebase analysis showing known RLS issues

---

### Pitfall 5: Unique Link Portal Security Weakness

**What goes wrong:** Customer portal using unique links (magic links) without additional authentication provides weak security. Links can be forwarded, intercepted, or compromised if customer email is breached.

**Why it happens:**
- Convenience prioritized over security
- Assumption that email is secure
- No expiration on links
- No device binding or secondary verification

**Consequences:**
- Unauthorized access to customer registration status and PII
- Account takeover via email compromise
- Customer data exposure
- Regulatory issues (handling personal data)

**Prevention:**
1. Time-limit unique links (15-30 minutes max)
2. Require secondary verification for sensitive actions (last 4 of VIN, phone number)
3. Implement link-click logging and anomaly detection
4. Offer optional account creation for returning customers
5. Use passkeys or device binding for repeat access
6. Don't expose full PII in portal - show masked data until verified

**Detection:**
- Links with no expiration
- Full customer data visible immediately on link click
- No secondary verification requirement
- Same link works from any device indefinitely

**Phase to address:** Customer Portal phase - security design from start

**Confidence:** MEDIUM - Industry best practices, SaaS authentication analysis 2025

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or poor user experience.

### Pitfall 6: Notification Fatigue Destroying Portal Value

**What goes wrong:** Customers receive excessive status update notifications, leading to opt-outs and reduced engagement. 55% of users cite "notification overwhelm" as reason for digital detoxes.

**Why it happens:**
- Every status change triggers notification
- No batching or throttling
- No customer preference capture
- Same notification channel for all updates

**Consequences:**
- 10% of users turn off notifications, 6% uninstall app entirely
- Portal becomes useless if customers ignore notifications
- Complaints about spam
- Loss of the "Domino's Tracker" value proposition

**Prevention:**
1. Design notification tiers: Tier 1 (SMS) = critical/actionable, Tier 2 (Email) = informational
2. Batch non-critical updates (e.g., daily summary)
3. Default to minimal notifications, let customers opt up
4. Only notify on meaningful stage changes, not internal status tweaks
5. Include unsubscribe/preferences link in every notification
6. Track notification engagement rates and adjust

**Detection:**
- Every database status change triggers notification
- No notification preferences in customer record
- No throttling logic
- Single channel for all notification types

**Phase to address:** Customer Portal phase - notification design

**Confidence:** HIGH - Industry research (Airship 2025, Twilio 2025)

---

### Pitfall 7: Double-Booking Rental Vehicles

**What goes wrong:** Same vehicle rented to multiple customers for overlapping periods. 91% of rental software reviewers rate calendar management for avoiding double-bookings as "important or highly important."

**Why it happens:**
- Race condition between concurrent booking attempts
- Availability check and booking creation not atomic
- Manual override capabilities without proper guards
- Mixed sales/rental inventory status not properly reconciled

**Consequences:**
- Customer shows up for unavailable vehicle
- Emergency vehicle substitution or rental from third party
- Reputation damage and potential legal issues
- Lost revenue from compensation

**Prevention:**
1. Database-level booking constraint (no overlapping dates for same vehicle_id)
2. Optimistic locking on availability check
3. Real-time availability sync via Supabase subscriptions
4. Admin override requires explicit acknowledgment of conflict
5. Buffer time between rentals (cleaning/inspection period)
6. Separate rental_status from sale_status in inventory model

**Detection:**
- No database constraint on booking date ranges
- Availability checked in app layer only
- No conflict detection on booking creation
- Single status field for both sales and rentals

**Phase to address:** Rental Management phase - booking model design

**Confidence:** HIGH - Industry patterns, database constraint best practices

---

### Pitfall 8: Monolith Feature Addition Cascade

**What goes wrong:** Adding features to Store.tsx (892 lines) causes unintended side effects. "Refactoring a React component often means risking failures in other components."

**Why it happens:**
- Deeply interconnected state and effects
- No component boundaries
- Shared contexts with implicit dependencies
- No test coverage to catch regressions

**Consequences:**
- New features break existing functionality
- Inventory display loop bug worsens
- Development velocity drops ("Year 2-3 syndrome")
- Eventual full rewrite required

**Prevention:**
1. Extract features into separate modules BEFORE adding new features
2. Use Strangler Fig pattern: new features in isolated components
3. Add test coverage for existing functionality before modifications
4. Create clear component boundaries with explicit interfaces
5. Move rental management to separate context/store
6. Document dependencies between state slices

**Detection:**
- Single file handling multiple concerns
- No unit tests for existing functionality
- New features added to same monolithic file
- Frequent regressions when adding features

**Phase to address:** Reliability & Stability phase - extract components before feature work

**Confidence:** HIGH - Codebase analysis, React architecture best practices

---

### Pitfall 9: Database Migration Breaking Live Data

**What goes wrong:** Schema changes to production Supabase database cause data loss, constraint violations, or application downtime.

**Why it happens:**
- Testing migrations against empty database, not production data volume
- Foreign key constraint order violations
- No rollback plan
- Dashboard changes in production instead of versioned migrations

**Consequences:**
- Data loss or corruption
- Extended downtime
- Migration stuck in partial state
- Customer-facing errors

**Prevention:**
1. Never test migrations in production - staging environment mandatory
2. Use Supabase CLI for all schema changes (version-controlled migrations)
3. Test migrations against production data copy
4. Write compensating migrations (rollback is a new forward migration)
5. Document foreign key dependency order
6. Add migration approval workflow before production
7. Never use Dashboard for schema changes on live system

**Detection:**
- Migrations developed against local/empty database
- Schema changes made via Dashboard in production
- No staging environment
- No rollback documentation

**Phase to address:** All phases - migration discipline from start

**Confidence:** HIGH - Supabase official docs, GitHub discussions on migration issues

---

### Pitfall 10: Form Field Fragility with 130-U Updates

**What goes wrong:** Form 130-U field positions and requirements change (Texas eliminated safety inspections January 2025, requiring VIN self-certification). Hard-coded field positions break.

**Why it happens:**
- PDF coordinates hard-coded
- No version detection
- State regulation changes occur without notice to software
- Form revision date not validated

**Consequences:**
- Generated documents rejected by webDEALER
- Data in wrong fields
- Missing required certifications
- Manual re-entry required

**Prevention:**
1. Check form revision date (visible on 130-U header) before population
2. Maintain versioned field mappings per form revision
3. Subscribe to TxDMV bulletins (govdelivery.com notifications)
4. Build flexibility for field remapping without code changes
5. Validate generated PDF against expected structure
6. Add visual review step showing populated form before finalization

**Detection:**
- Hard-coded pixel coordinates in PDF generation
- No form version validation
- Generated documents with misaligned data
- webDEALER rejections citing form errors

**Phase to address:** Registration Checker phase - document generation validation

**Confidence:** HIGH - January 2025 130-U revision documented, TxDMV bulletins

---

## Minor Pitfalls

Mistakes that cause annoyance but are recoverable.

### Pitfall 11: Over-Promising Real-Time Updates

**What goes wrong:** Portal promises "real-time" updates but actually polls infrequently or has latency. Customer expectations set incorrectly.

**Why it happens:**
- Marketing language ("real-time") vs. technical reality (subscription lag)
- Supabase subscription edge cases (reconnection, stale cache)
- Manual status updates not immediately visible

**Prevention:**
1. Use language like "updated regularly" instead of "real-time"
2. Show "last updated" timestamp on portal
3. Add manual refresh button
4. Test subscription reliability under various conditions

**Phase to address:** Customer Portal phase - UX copy and expectations

---

### Pitfall 12: API Key Exposure Escalation

**What goes wrong:** Existing API key exposure (Gemini, Retell) in frontend bundle is extended to new integrations (LoJack API keys).

**Why it happens:**
- Pattern copied from existing code
- No server-side proxy established
- Time pressure leads to shortcuts

**Prevention:**
1. Establish server-side proxy pattern before adding integrations
2. Audit existing exposures and remediate
3. Use Supabase Edge Functions for API key handling
4. Add bundle scanning to CI/CD

**Phase to address:** Reliability & Stability phase - fix before adding integrations

**Confidence:** HIGH - Codebase analysis shows existing exposure pattern

---

### Pitfall 13: Inventory State Confusion (Sale vs. Rental)

**What goes wrong:** Vehicle marked available for sale gets rented, or rented vehicle appears in sales listings. Mixed status creates operational chaos.

**Why it happens:**
- Single status field tries to represent multiple states
- No clear model for dual-purpose vehicles
- UI doesn't surface rental status to sales workflow

**Prevention:**
1. Separate sales_status and rental_status fields
2. Add availability_type: sale_only | rental_only | both
3. Sales listing query filters by rental availability
4. Visual indicator in admin UI for vehicles with active rentals

**Phase to address:** Rental Management phase - inventory model design

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| Reliability & Stability | RLS silent failures | Fix error handling, add monitoring | CRITICAL - do first |
| Reliability & Stability | Monolith cascade | Extract before adding features | HIGH |
| Registration Checker | VIN mismatch | Single source of truth, validation | HIGH |
| Registration Checker | Original document violation | Provenance tracking, UI guidance | MEDIUM |
| Registration Checker | Form field fragility | Version detection, flexible mapping | MEDIUM |
| Customer Portal | Unique link security | Time limits, secondary verification | HIGH |
| Customer Portal | Notification fatigue | Tier design, throttling | MEDIUM |
| Customer Portal | Over-promising real-time | Expectation management | LOW |
| Rental Management | GPS consent violation | Explicit consent workflow | CRITICAL - legal |
| Rental Management | Double-booking | Database constraints, atomic ops | HIGH |
| Rental Management | Inventory state confusion | Dual status model | MEDIUM |
| All Phases | API key exposure | Server-side proxy pattern | HIGH |
| All Phases | Migration breaking data | Version control, staging | HIGH |

---

## Technical Debt Interaction Warnings

The existing technical debt creates compounding risks:

| Existing Debt | New Feature Risk | Mitigation |
|--------------|------------------|------------|
| Store.tsx monolith (892 lines) | Adding rental state will worsen | Extract rental to separate context first |
| No test coverage | Can't safely refactor | Add critical path tests before changes |
| API keys in frontend | New integrations will copy pattern | Establish proxy pattern immediately |
| RLS silent failures | New tables will inherit problem | Audit and fix RLS before schema additions |
| Inventory display loop bug | Rental availability queries may compound | Fix root cause before adding complexity |

**Recommendation:** Reliability & Stability phase should complete BEFORE major feature work to prevent debt multiplication.

---

## Sources

**Official Documentation:**
- [Texas webDEALER Dealer User Guide (June 2025)](https://www.txdmv.gov/sites/default/files/body-files/webDEALER_4.1.1_Dealer_User_Guide_0.pdf)
- [TxDMV webDEALER Troubleshooting](https://www.txdmv.gov/dealers/webdealer/troubleshooting)
- [TxDMV Form 130-U Detailed Instructions](https://www.txdmv.gov/sites/default/files/form_files/VTR-130-UIF.pdf)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase RLS Troubleshooting](https://supabase.com/docs/guides/troubleshooting/rls-simplified-BJTcS8)
- [NHTSA VIN Decoder](https://www.nhtsa.gov/vin-decoder)

**Industry Research:**
- [Supabase RLS Complete Guide 2025 - VibeAppScanner](https://vibeappscanner.com/supabase-row-level-security)
- [Preventing Dealership GPS Tracking Liability - Recovr](https://www.recovr.biz/news/dealership-gps-tracking-liability-from-forgotten-hardwired-devices)
- [Push Notifications Best Practices 2025 - Upshot.ai](https://upshot-ai.medium.com/push-notifications-best-practices-for-2025-dos-and-don-ts-34f99de4273d)
- [How to Help Users Avoid Notification Fatigue - MagicBell](https://www.magicbell.com/blog/help-your-users-avoid-notification-fatigue)
- [Magic Links Security Analysis - BayTech Consulting](https://www.baytechconsulting.com/blog/magic-links-ux-security-and-growth-impacts-for-saas-platforms-2025)
- [7 Pitfalls in Refactoring Projects - vFunction](https://vfunction.com/blog/7-pitfalls-to-avoid-in-application-refactoring-projects/)
- [Technical Debt in React - CodeScene](https://codescene.com/blog/codescene-prioritize-technical-debt-in-react/)
- [Car Dealership GPS Trackers 2025 - Tracki](https://tracki.com/blogs/post/car-dealership-gps-trackers)

**Regulatory:**
- [Texas BHPH GPS Disclosure Requirements](https://autofraudlegalcenter.com/custom-posts/dealership-tracking-your-every-move/)
- [Mandatory webDEALER 2025 - TXIADA](https://www.txiada.org/blog_home.asp?display=575)
- [Updated 130-U for State Inspection Phase Out - TXIADA](https://www.txiada.org/blog_home.asp?display=576)
