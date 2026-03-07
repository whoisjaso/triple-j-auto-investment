# Phase 5: Registration Checker - Research

**Researched:** 2026-02-11
**Domain:** Texas dealer title transfer document validation, VIN validation, webDEALER submission workflow
**Confidence:** MEDIUM (domain knowledge verified with official sources where possible; webDEALER internal UI details could not be fully extracted from PDF guides)

## Summary

Phase 5 adds a pre-submission validation checklist to the existing admin Registration Ledger. The checker verifies document completeness, VIN format/consistency, mileage consistency, and SURRENDERED stamp presence before the admin submits a title transfer packet through Texas webDEALER.

This is a **purely frontend feature** with a small database extension. No new services, APIs, or external integrations are needed. The existing Registration model already has VIN and document booleans. The main additions are: (1) a mileage/odometer field on the registration record, (2) VIN check digit validation logic, (3) a checker UI component integrated into the expanded registration row, and (4) persistent checker state.

**Primary recommendation:** Build the checker as a collapsible section within the existing registration expanded view, following the same patterns already used for Document Checklist and Stage Progress sections. VIN validation should be a pure TypeScript function (no library needed). Persist checker results in new database columns on the registrations table.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | existing | UI components | Already in project |
| Tailwind CSS | existing | Styling | Already in project |
| Lucide React | existing | Icons | Already in project (Check, Circle, AlertCircle, Shield, ClipboardCheck all available) |
| Supabase | existing | Database persistence | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | - | No new libraries needed for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom VIN validator | `vin-validator` npm package | Package adds dependency for ~30 lines of code; hand-roll is appropriate here since algorithm is well-defined |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
triple-j-auto-investment-main/
├── components/
│   └── admin/
│       └── RegistrationChecker.tsx    # New: Checker panel component
├── services/
│   └── registrationService.ts         # Extended: checker result persistence
├── utils/
│   └── vinValidator.ts                # New: VIN check digit + format validation
├── types.ts                           # Extended: CheckerResult interface, Registration mileage field
├── pages/admin/
│   └── Registrations.tsx              # Modified: integrate checker section
└── supabase/migrations/
    └── 05_registration_checker.sql    # New: add mileage + checker columns
```

### Pattern 1: Checker as Inline Section (within Registration expanded row)
**What:** Add a "Pre-Submission Checker" collapsible section within the existing expanded registration card, positioned between the Document Checklist and Stage Progress sections.
**When to use:** This is the only placement pattern -- decided by architectural alignment with existing UI.
**Why this pattern:**
- The existing Registrations.tsx already uses expandable row pattern with sections (Customer Info, Document Checklist, Stage Progress, Admin Notes, etc.)
- Adding another section follows the established pattern exactly
- No routing changes needed; no new pages or tabs
- Admin stays in context while checking documents

**Example structure within expanded row:**
```
[Customer Info section]
[Document Checklist section]           -- existing (boolean toggles)
[Pre-Submission Checker section]       -- NEW (validation panel)
[Stage Progress section]               -- existing
[Admin Notes section]                  -- existing
```

### Pattern 2: Pre-fill + Confirm Validation Pattern
**What:** System pre-fills VIN and mileage from the registration record. Admin visually compares each physical document against the displayed values and confirms match via checkbox/button for each document.
**When to use:** For cross-document consistency validation without OCR.
**Why this pattern:**
- Context doc explicitly requires "pre-fill + confirm" not "re-enter"
- Reduces data entry burden
- Admin is looking at physical documents and confirming they match system values

### Pattern 3: Computed Check Result with DB Persistence
**What:** Checker results are computed from registration data + admin confirmations. Results persist to DB columns so admin sees last check status without re-running.
**When to use:** When checker results should survive page reloads and be visible across sessions.
**Implementation options:**
- **Recommended:** Store checker state as JSONB column `checker_results` on registrations table containing: `{ completedAt, overriddenAt, checks: { docComplete, vinConsistent, mileageConsistent, surrenderedFront, surrenderedBack }, overrideConfirmed }`
- Results invalidated (set to null) when `vin` or `mileage` fields change on the registration record
- Checker UI reads from DB on load; writes on each admin confirmation

### Anti-Patterns to Avoid
- **Separate checker page/route:** Don't create a new page; the checker belongs inline with the registration it validates
- **Re-entry pattern for VIN/mileage:** Don't make admin type VIN again; pre-fill from record
- **Hard-coded mileage tolerance:** Context says exact match required; no tolerance threshold needed
- **Complex state machine for checks:** Use simple boolean checks, not a step-by-step wizard flow
- **Using a VIN validation library:** The algorithm is exactly 30 lines of TypeScript; a library adds unnecessary dependency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VIN format check (I/O/Q, length) | Already exists | `validateVin()` in `Inventory.tsx` line 242-248 | Existing function checks alphanumeric, forbidden chars, length |
| VIN decode (year/make/model lookup) | N/A | `decodeVin()` in `nhtsaService.ts` | Already integrated with NHTSA API |
| Confirmation dialog | Custom modal | Existing confirm dialog pattern in `Registrations.tsx` | Same modal pattern used for stage changes |
| Document toggle buttons | Custom checkbox | Existing toggle button pattern in Registrations.tsx line 565-586 | Same green/gray toggle pattern |
| Service layer transforms | New service | Existing `registrationService.ts` transformer pattern | Add new fields to existing transform |

**Key insight:** Most of the UI building blocks already exist in Registrations.tsx. The checker reuses existing patterns (toggle buttons, section headers, modals) with validation logic layered on top.

## Common Pitfalls

### Pitfall 1: Missing Mileage Field on Registration
**What goes wrong:** The Registration interface and DB table have NO mileage/odometer field. The Vehicle interface has `mileage` and BillOfSaleData has `odometer`, but Registration does not.
**Why it happens:** Registration was designed for status tracking, not document validation.
**How to avoid:** Add `mileage INTEGER` column to registrations table via migration. Pre-populate from linked vehicle if `vehicleId` exists. Add to Registration interface and transformer.
**Warning signs:** If you try to implement mileage consistency checks and find there's no source of truth for the registration's mileage.

### Pitfall 2: VIN Check Digit vs. Format Validation Confusion
**What goes wrong:** The existing `validateVin()` in Inventory.tsx only checks format (length=17, no I/O/Q, alphanumeric). It does NOT perform check digit validation.
**Why it happens:** Format validation and check digit validation are different things. Both are needed per CONTEXT.md.
**How to avoid:** Create a separate `vinValidator.ts` utility with two functions: `validateVinFormat()` (reuse existing logic) and `validateVinCheckDigit()` (new, implements ISO 3779 algorithm). The checker runs both.
**Warning signs:** VIN passes format check but has invalid check digit.

### Pitfall 3: Registrations.tsx is Already 1150 Lines
**What goes wrong:** Adding checker logic directly to Registrations.tsx makes it even larger and harder to maintain.
**Why it happens:** Temptation to add "just one more section" to the existing component.
**How to avoid:** Extract the checker into a separate `RegistrationChecker.tsx` component that receives the registration as a prop and handles its own state. It calls back to parent only for data refresh after persistence.
**Warning signs:** Registrations.tsx growing beyond 1300+ lines.

### Pitfall 4: SURRENDERED Stamp Is Two Checkboxes, Not One
**What goes wrong:** Implementing a single "SURRENDERED stamp verified" checkbox instead of separate front/back checkboxes.
**Why it happens:** Quick implementation shortcut.
**How to avoid:** Context doc explicitly requires two separate checkboxes: "SURRENDERED stamp on front" and "SURRENDERED stamp on back". Both must be checked for the check to pass.

### Pitfall 5: Checker Results Not Invalidated on Data Change
**What goes wrong:** Admin runs checker, results persist as "all pass". Then admin changes VIN on the registration. Old checker results still show "pass" with the old VIN.
**Why it happens:** Persisted results become stale when underlying data changes.
**How to avoid:** Store a hash of `vin + mileage` alongside checker results. On load, compare hash. If different, clear persisted results and require re-check. Alternatively, use a DB trigger to null out checker_results when vin or mileage change.
**Warning signs:** Checker shows "pass" for a VIN that was corrected after the check ran.

### Pitfall 6: webDEALER Link Shown Prematurely
**What goes wrong:** webDEALER link is always visible, bypassing the checker flow.
**Why it happens:** Adding the link as a standalone element instead of as the endpoint of the checker flow.
**How to avoid:** Context doc says webDEALER link appears ONLY after all checks pass OR are overridden. The link should be conditionally rendered inside the checker component, not elsewhere in the UI.

## Code Examples

### VIN Check Digit Validation Algorithm (verified from multiple sources)

```typescript
// Source: ISO 3779 standard, verified via multiple references
// https://scientificgems.wordpress.com/2018/04/27/mathematics-in-action-vehicle-identifications-numbers/

/**
 * VIN character-to-value transliteration table.
 * Letters I, O, Q are invalid in VINs.
 */
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

/**
 * Position weight factors for the 17 VIN positions.
 * Position 9 (index 8) has weight 0 because it IS the check digit.
 */
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Validate VIN format: 17 chars, valid characters (no I, O, Q), alphanumeric only.
 */
export function validateVinFormat(vin: string): { valid: boolean; error?: string } {
  if (!vin) return { valid: false, error: 'VIN is required' };
  const upper = vin.toUpperCase();
  if (/[^A-Z0-9]/.test(upper)) return { valid: false, error: 'VIN must be alphanumeric only' };
  if (/[IOQ]/.test(upper)) return { valid: false, error: `VIN contains invalid character(s): ${upper.match(/[IOQ]/g)?.join(', ')}` };
  if (upper.length !== 17) return { valid: false, error: `VIN must be 17 characters (got ${upper.length})` };
  return { valid: true };
}

/**
 * Validate VIN check digit (position 9) per ISO 3779.
 * Returns true if check digit is correct.
 */
export function validateVinCheckDigit(vin: string): boolean {
  const upper = vin.toUpperCase();
  if (upper.length !== 17) return false;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = VIN_TRANSLITERATION[upper[i]];
    if (value === undefined) return false;
    sum += value * VIN_WEIGHTS[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);
  return upper[8] === checkDigit;
}
```

### Checker Component Pattern (following existing UI conventions)

```typescript
// Follows existing section pattern from Registrations.tsx
// Uses same Tailwind classes, same icon patterns, same toggle button style

interface CheckerProps {
  registration: Registration;
  onRefresh: () => void;
}

// Check result interface
interface CheckResult {
  docComplete: boolean;      // All 5 documents marked as received
  vinFormatValid: boolean;   // VIN passes format + check digit
  vinConfirmedOnAll: boolean;// Admin confirmed VIN matches all docs
  mileageConfirmedOnAll: boolean; // Admin confirmed mileage matches all docs
  surrenderedFront: boolean; // Admin confirmed SURRENDERED on front
  surrenderedBack: boolean;  // Admin confirmed SURRENDERED on back
}
```

### webDEALER Link Pattern

```typescript
// Source: Confirmed working URL from webDEALER system
const WEBDEALER_LOGIN_URL = 'https://webdealer.txdmv.gov/title/login.do';

// Rendered only when all checks pass or override confirmed
{allChecksPassed || overrideConfirmed ? (
  <a
    href={WEBDEALER_LOGIN_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors"
  >
    <ExternalLink size={16} />
    Open webDEALER
  </a>
) : null}
```

### Document Ordering Guide Data Structure

```typescript
// Based on research into Texas webDEALER requirements
// Source: TxDMV webDEALER Dealer User Guide (multiple versions)
// Confidence: MEDIUM - exact upload order could not be extracted from PDF guides,
// but document list is confirmed from multiple official sources

interface DocumentGuideStep {
  order: number;
  documentName: string;
  tip: string;
  hasVin: boolean;       // Whether to check VIN on this doc
  hasMileage: boolean;   // Whether to check mileage on this doc
}

const WEBDEALER_DOCUMENT_ORDER: DocumentGuideStep[] = [
  {
    order: 1,
    documentName: 'Evidence of Ownership — Title (Front)',
    tip: 'Verify SURRENDERED stamp is clearly visible. Must be stamped on original, not a copy.',
    hasVin: true,
    hasMileage: false,
  },
  {
    order: 2,
    documentName: 'Evidence of Ownership — Title (Back)',
    tip: 'Verify SURRENDERED stamp on back. Check that all assignment fields are properly signed.',
    hasVin: true,
    hasMileage: false,
  },
  {
    order: 3,
    documentName: 'Application for Texas Title (Form 130-U)',
    tip: 'Verify VIN in Box 1, Odometer in Box 9. Confirm applicant info matches buyer.',
    hasVin: true,
    hasMileage: true,
  },
  {
    order: 4,
    documentName: 'Vehicle Inspection Report (VIR)',
    tip: 'Inspection must be current on date of webDEALER submission. Verify VIN matches.',
    hasVin: true,
    hasMileage: true,
  },
  {
    order: 5,
    documentName: 'Proof of Insurance',
    tip: 'Verify policy is active and VIN matches. Must show liability coverage.',
    hasVin: true,
    hasMileage: false,
  },
];
```

## Texas webDEALER Domain Knowledge

### Required Documents for Dealer Title Transfer (HIGH confidence)
Based on official TxDMV documentation, the following documents are required for a webDEALER title transfer submission:

1. **Evidence of Ownership** (Texas title, out-of-state title, or MCO) — must be stamped SURRENDERED on front AND back, scanned from originals at minimum 200 DPI
2. **Form 130-U** (Application for Texas Title and/or Registration) — unless Electronic Seller Disclosure process was completed
3. **Vehicle Inspection Report (VIR)** — inspection must be current at time of webDEALER transaction creation AND county submission
4. **Proof of Insurance** — liability coverage required

### SURRENDERED Stamp Requirements (HIGH confidence)
- **Source:** TxDMV webDEALER Dealer User Guide, TxDMV Form VTR-340
- The SURRENDERED stamp must appear on BOTH the front and back of the evidence of ownership
- Once stamped, the title becomes invalid and cannot be used in another title application
- If stamped in error, the dealer must replace the evidence of ownership document
- Scanned images must be of the ORIGINAL stamped document, not copies

### Form 130-U Key Fields (HIGH confidence)
- **Source:** TxDMV Form 130-U, pdfService.ts field mapping (confirmed in codebase)
- Box 1: Vehicle Identification Number (VIN)
- Box 2: Year
- Box 3: Make
- Box 4: Body Style
- Box 5: Model
- Box 6: Major Color
- Box 7: Minor Color
- Box 8: Texas License Plate No.
- Box 9: Odometer Reading (no tenths — whole numbers only)
- Box 10: Texas Plant No.
- Box 11: Empty Weight

### webDEALER Document Submission Order (MEDIUM confidence)
**Note:** The exact upload sequence within the webDEALER UI could not be definitively extracted from the official PDF user guides (they are not web-parseable). The order below is based on the logical document flow described across multiple TxDMV sources and standard dealer practice:

1. Evidence of Ownership — Front (title front with SURRENDERED stamp)
2. Evidence of Ownership — Back (title back with SURRENDERED stamp and assignments)
3. Form 130-U (title application)
4. Vehicle Inspection Report
5. Proof of Insurance

**Important caveat:** This order reflects the logical checklist order for document preparation, not necessarily a strict webDEALER upload sequence (the webDEALER system may accept documents in any order via its upload interface). The CONTEXT.md decision states the order should be "fixed/hardcoded" and "researched during the research phase." This is the best available order based on research. It follows the natural flow: verify ownership first, then application, then supporting documents.

### webDEALER Login URL (HIGH confidence)
- **URL:** `https://webdealer.txdmv.gov/title/login.do`
- **Source:** Confirmed by fetching the URL directly; returned the webDEALER login page (version v26.1-738)
- **Mandatory as of July 1, 2025:** All licensed Texas dealers must use webDEALER for title and registration

### Title Transfer Timeline (HIGH confidence)
- Must transfer title within 30 calendar days of date of sale
- **Source:** TxDMV "Buying or Selling a Vehicle" official page

## VIN Validation Algorithm

### Algorithm Details (HIGH confidence)
**Source:** ISO 3779 standard, verified via Wikipedia Vehicle Identification Number article, Scientific Gems blog, CJ Pony Parts calculator, FAXVIN validator

**Letter-to-Number Transliteration:**
| A=1 | B=2 | C=3 | D=4 | E=5 | F=6 | G=7 | H=8 |
|-----|-----|-----|-----|-----|-----|-----|-----|
| J=1 | K=2 | L=3 | M=4 | N=5 | P=7 | R=9 | |
| S=2 | T=3 | U=4 | V=5 | W=6 | X=7 | Y=8 | Z=9 |

**Invalid characters:** I, O, Q (excluded to avoid confusion with 1, 0)

**Position weights:** 8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2
- Position 9 (index 8) has weight 0 because it IS the check digit

**Calculation:**
1. Convert each character to its numeric value
2. Multiply each value by its position weight
3. Sum all products
4. Divide sum by 11, take remainder
5. Remainder 0-9 = that digit; remainder 10 = "X"
6. Result must match position 9 of the VIN

### Existing VIN Validation in Codebase (HIGH confidence)
The project already has partial VIN validation in `pages/admin/Inventory.tsx` lines 242-248:
```typescript
const validateVin = (value: string): string | null => {
  if (/[^A-Z0-9]/.test(value)) return 'ALPHANUMERIC_ONLY';
  const forbiddenMatch = value.match(/[IOQ]/);
  if (forbiddenMatch) return `ILLEGAL_CHARACTER '${forbiddenMatch[0]}'`;
  if (value.length !== 17) return `INVALID_LENGTH (${value.length}/17)`;
  return null;
};
```
This checks format only, NOT check digit. The new utility should include both.

## Database Schema Gap Analysis

### Existing Registration Fields (relevant to checker)
```
vin VARCHAR(17)          -- YES, exists
vehicle_year INTEGER     -- YES, exists
vehicle_make TEXT         -- YES, exists
vehicle_model TEXT        -- YES, exists
doc_title_front BOOLEAN  -- YES, exists
doc_title_back BOOLEAN   -- YES, exists
doc_130u BOOLEAN         -- YES, exists
doc_insurance BOOLEAN    -- YES, exists
doc_inspection BOOLEAN   -- YES, exists
```

### Missing Fields (need migration)
```
mileage INTEGER          -- MISSING: Required for mileage consistency checks
checker_results JSONB    -- MISSING: Persist checker state between sessions
checker_completed_at TIMESTAMPTZ  -- MISSING: When checker was last completed
checker_override BOOLEAN DEFAULT FALSE -- MISSING: Whether admin overrode failed checks
checker_override_at TIMESTAMPTZ   -- MISSING: When override happened
```

### Existing Related Data
- `Vehicle.mileage` (integer) — can pre-populate registration mileage from linked vehicle
- `BillOfSaleData.odometer` (string) — the Bill of Sale PDF service already uses odometer
- `Registration.vehicleId` (UUID, nullable) — links to Vehicle for pre-population

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paper checklist for doc verification | webDEALER electronic submission | July 1, 2025 (mandatory) | All Texas dealers must use webDEALER |
| Optional webDEALER | Mandatory webDEALER | HB 718, July 2025 | No more paper-only submissions |

**Deprecated/outdated:**
- Paper-only title applications to county: No longer accepted as of July 1, 2025
- webDEALER optional usage: Now mandatory for all licensed Texas dealers

## Open Questions

1. **Exact webDEALER upload sequence**
   - What we know: The 5 required document types are confirmed from official sources. The logical preparation order (ownership first, then application, then supporting docs) is well-established.
   - What's unclear: Whether webDEALER enforces a strict upload order in its UI or if documents can be uploaded in any order.
   - Recommendation: Use the logical preparation order as the hardcoded order in the checker. This matches how dealers prepare their packets. If the admin later reports that webDEALER has a different preferred order, it's a single array to reorder.

2. **Odometer disclosure type on 130-U**
   - What we know: Box 9 is the odometer reading. Box 10 has odometer disclosure options (Actual, Not Actual, Exceeds Mechanical Limits, Exempt).
   - What's unclear: Whether the checker should validate the odometer disclosure type or just the reading.
   - Recommendation: Only validate the mileage number for consistency. The disclosure type is a separate legal decision, not a data consistency check.

3. **Bill of Sale as additional VIN/mileage source**
   - What we know: BillOfSaleData includes VIN and odometer fields. Registration has optional `billOfSaleId` link.
   - What's unclear: Whether the checker should also cross-reference the Bill of Sale.
   - Recommendation: The CONTEXT.md lists 5 documents to check (Title front/back, 130-U, Inspection, Insurance). Bill of Sale is not listed. Keep scope to the 5 specified documents.

## Sources

### Primary (HIGH confidence)
- **TxDMV webDEALER page:** https://www.txdmv.gov/dealers/webdealer — System overview, mandatory July 2025
- **TxDMV webDEALER Dealer User Guide (Dec 2025):** https://www.txdmv.gov/sites/default/files/body-files/webDEALER_Dealer_User_Guide.pdf — Document requirements, SURRENDERED stamp rules, scanning specs
- **TxDMV Form 130-U:** https://www.txdmv.gov/sites/default/files/form_files/130-U.pdf — Official form
- **TxDMV Form 130-U Instructions:** https://www.txdmv.gov/sites/default/files/form_files/VTR-130-UIF.pdf — Field descriptions
- **TxDMV VTR-340 (SURRENDERED evidence):** https://content.govdelivery.com/attachments/TXDMV/2016/09/28/file_attachments/629613/Form+VTR-340.pdf — SURRENDERED stamp requirements
- **webDEALER login URL verified:** https://webdealer.txdmv.gov/title/login.do — Confirmed working (v26.1)
- **Existing codebase:** `types.ts`, `registrationService.ts`, `Registrations.tsx`, `pdfService.ts` — Existing patterns and data model

### Secondary (MEDIUM confidence)
- **TxDMV Buying/Selling page:** https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle — General requirements
- **Texas Dealer Education - Transferring Titles:** https://texasdealereducation.com/transferring-titles/ — Dealer education context
- **TXIADA mandatory webDEALER article:** https://www.txiada.org/blog_home.asp?display=575 — July 2025 deadline context
- **Scientific Gems VIN article:** https://scientificgems.wordpress.com/2018/04/27/mathematics-in-action-vehicle-identifications-numbers/ — VIN algorithm verification
- **node-vin-lite GitHub:** https://github.com/ApelSYN/node-vin-lite — VIN algorithm reference

### Tertiary (LOW confidence)
- **webDEALER document upload order:** Inferred from document flow descriptions across multiple sources, not directly extracted from webDEALER UI documentation (PDF guides could not be parsed by web tools)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components use existing project libraries
- Architecture: HIGH - Follows established patterns in codebase, CONTEXT.md decisions are clear
- VIN algorithm: HIGH - ISO 3779 standard verified across multiple authoritative sources
- Domain knowledge (docs/stamps): HIGH - Confirmed via multiple official TxDMV sources
- webDEALER upload order: MEDIUM - Document list confirmed; exact upload sequence inferred
- Database schema changes: HIGH - Gap analysis directly from codebase inspection
- Pitfalls: HIGH - Identified from direct codebase analysis

**Research date:** 2026-02-11
**Valid until:** 2026-05-11 (stable domain; webDEALER may release updates but core document requirements are unlikely to change)
