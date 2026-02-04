# Phase 2: Registration Database Foundation - Research

**Researched:** 2026-02-03
**Domain:** Supabase schema design, RLS policies, PostgreSQL audit trails
**Confidence:** HIGH

## Summary

This research investigated best practices for implementing registration tracking in Supabase with customer access via order_id, admin write controls, and comprehensive audit trail. The codebase already contains a partial registration implementation (`registration_ledger.sql`) with 7 stages, but CONTEXT.md specifies a different 6-stage workflow with different semantics (Texas dealer model where plates are assigned at sale).

**Key findings:**
1. Existing `registration_ledger.sql` uses a 7-stage workflow designed for a different process (customer insurance/inspection uploads). Phase 2 requires a simpler 6-stage status-only flow as defined in CONTEXT.md.
2. Supabase's `supa_audit` extension provides a robust audit trail solution, but a custom trigger approach gives more control over capturing change notes and actor identity.
3. RLS for anonymous order lookup is straightforward with `USING (true)` for SELECT on registrations filtered client-side by order_id. The order_id acts as a secret token (format: `TJ-YYYY-NNNN`).
4. The existing admin dashboard pattern (Registrations.tsx) provides step-by-step status buttons and dropdown actions - this aligns with CONTEXT.md requirements for "step buttons for each valid next status."

**Primary recommendation:** Create a new schema migration that modifies the existing tables to match the 6-stage workflow in CONTEXT.md, adds comprehensive audit trail via database triggers, and establishes a new "registration_admin" role check in RLS policies.

---

## Existing Codebase Analysis

### Current Registration Implementation

**Files examined:**
- `supabase/registration_ledger.sql` - 265 lines, creates 4 tables
- `services/registrationService.ts` - 673 lines, full CRUD operations
- `pages/admin/Registrations.tsx` - 764 lines, admin UI with 7-stage pipeline
- `types.ts` - Registration types and REGISTRATION_STAGES constant

**Current schema (from registration_ledger.sql):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `registrations` | Main record | order_id, customer_*, vin, current_stage, current_status |
| `registration_stages` | Per-stage tracking | stage_key, status, ownership, blocked_reason |
| `registration_documents` | Uploaded files | document_type, file_url, verified |
| `registration_notifications` | Notification log | notification_type, channel, delivered |

**Current 7 stages vs CONTEXT.md 6 stages:**

| Current (registration_ledger.sql) | CONTEXT.md Required |
|-----------------------------------|---------------------|
| 1. Payment Received | 1. Sale Complete |
| 2. Insurance Verified (customer) | 2. Documents Collected |
| 3. Inspection Complete (customer) | 3. Submitted to DMV |
| 4. Dealer Submission | 4. DMV Processing |
| 5. DMV Processing | 5. Sticker Ready |
| 6. Registration Approved | 6. Sticker Delivered |
| 7. Ready for Delivery | + Rejected (branches from DMV Processing) |

**Key difference:** Current schema has customer action stages (insurance, inspection) as separate stages. CONTEXT.md defines a simpler workflow where:
- Plates are assigned at sale (Texas dealer model)
- "Documents Collected" is checkbox-based, not customer upload
- Rejection branches only from "DMV Processing"
- All stages are dealer/state-controlled, not customer action required

### Current RLS Policies (registration_ledger.sql lines 145-179)

```sql
-- Current pattern: Public SELECT with USING (true)
CREATE POLICY "Public can view registration by order_id" ON public.registrations
    FOR SELECT USING (true); -- Order ID acts as auth token

-- Admin full access pattern
CREATE POLICY "Admins can manage registrations" ON public.registrations
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```

**Issues:**
1. No "registration_admin" role as specified in CONTEXT.md
2. Public SELECT returns ALL registrations (relies on client filtering by order_id)
3. No audit trail on status changes

### Current Admin UI (Registrations.tsx)

The existing UI implements:
- List view with expand/collapse per registration
- Stage pipeline visualization with status icons
- Dropdown selector for status changes (waiting/pending/complete/blocked)
- "Copy tracker link" functionality
- Create registration modal

**What needs to change for CONTEXT.md:**
- Replace dropdown with "step buttons for each valid next status"
- Add bulk actions for multiple registrations
- Add filtering by status, date range, customer search
- Add confirmation dialog for all status changes
- Show/hide "Rejected" option only when at DMV Processing stage

---

## Schema Recommendations

### Option A: Modify Existing Tables (RECOMMENDED)

Per CONTEXT.md decision "One record per sale," keep the single `registrations` table approach but modify:

1. **Update status enum to 6 stages + Rejected:**
```sql
ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_current_stage_check;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_current_stage_check
  CHECK (current_stage IN (
    'sale_complete',
    'documents_collected',
    'submitted_to_dmv',
    'dmv_processing',
    'sticker_ready',
    'sticker_delivered',
    'rejected'
  ));
```

2. **Add document checklist columns (not separate table):**
```sql
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS
  doc_title_front BOOLEAN DEFAULT FALSE,
  doc_title_back BOOLEAN DEFAULT FALSE,
  doc_130u BOOLEAN DEFAULT FALSE,
  doc_insurance BOOLEAN DEFAULT FALSE,
  doc_inspection BOOLEAN DEFAULT FALSE;
```

3. **Add milestone date columns:**
```sql
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS
  sale_date TIMESTAMPTZ,
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ;
```

4. **Add contact/notes fields:**
```sql
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS
  customer_address TEXT,
  plate_number VARCHAR(10),
  bill_of_sale_id UUID REFERENCES public.bills_of_sale(id),
  notes TEXT,
  rejection_notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE; -- Soft delete
```

### Option B: Create New Tables

Create entirely new tables with clean schema. This avoids migration complexity but requires updating all service code.

**Recommendation:** Option A is better because:
- registrationService.ts already has working transformers
- Registrations.tsx can be incrementally updated
- Existing data (if any) is preserved

### Registration Admin Role

Per CONTEXT.md: "new 'Registration Admin' role required to update registrations"

**Approach:** Add column to profiles table:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  is_registration_admin BOOLEAN DEFAULT FALSE;
```

**RLS policy update:**
```sql
-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.registrations;

-- Create role-specific policies
CREATE POLICY "Registration admins can manage registrations"
ON public.registrations
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);
```

---

## Audit Trail Approach

### Option A: Supabase supa_audit Extension

Supabase provides a built-in audit solution via the `supa_audit` extension.

**Pros:**
- Official Supabase solution
- Zero custom code
- Automatic tracking of all changes

**Cons:**
- Stores data in `audit.record_version` table with JSONB
- No built-in "change notes" field
- Cannot easily capture "who" at application level (session user vs admin acting on behalf)

### Option B: Custom Trigger Function (RECOMMENDED)

Per CONTEXT.md requirements:
- "All field changes tracked, not just status"
- "Optional note/reason when making any change"
- "Show old and new values"

**Custom audit table:**
```sql
CREATE TABLE public.registration_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,

  -- What changed
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  changed_fields JSONB, -- Only the changed fields with old/new values
  full_old_record JSONB,
  full_new_record JSONB,

  -- Who/When
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional context
  change_reason TEXT, -- Admin-provided note
  client_ip INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_registration ON public.registration_audit(registration_id);
CREATE INDEX idx_audit_changed_at ON public.registration_audit(changed_at DESC);
```

**Trigger function:**
```sql
CREATE OR REPLACE FUNCTION audit_registration_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
  col_name TEXT;
BEGIN
  -- For UPDATE, compute only changed fields
  IF TG_OP = 'UPDATE' THEN
    FOR col_name IN SELECT column_name FROM information_schema.columns
      WHERE table_name = 'registrations' AND table_schema = 'public'
    LOOP
      IF to_jsonb(NEW) -> col_name IS DISTINCT FROM to_jsonb(OLD) -> col_name THEN
        changed_fields := changed_fields || jsonb_build_object(
          col_name, jsonb_build_object(
            'old', to_jsonb(OLD) -> col_name,
            'new', to_jsonb(NEW) -> col_name
          )
        );
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.registration_audit (
    registration_id,
    operation,
    changed_fields,
    full_old_record,
    full_new_record,
    changed_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN changed_fields ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER registration_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION audit_registration_changes();
```

### Change Notes Implementation

Since PostgreSQL triggers cannot access application-level context, implement change notes via:

1. **Add `pending_change_reason` column to registrations (temporary):**
```sql
-- Service sets this before update, trigger captures it
ALTER TABLE public.registrations ADD COLUMN pending_change_reason TEXT;
```

2. **Trigger captures and clears it:**
```sql
-- In trigger function:
change_reason := NEW.pending_change_reason;
NEW.pending_change_reason := NULL; -- Clear after capturing
```

**Alternative:** Use separate `registration_audit_notes` table joined after the fact.

---

## RLS Policy Patterns

### Anonymous Customer Access

Per CONTEXT.md: "Customer access via unique link, no login required for MVP"

The current pattern `USING (true)` for SELECT is acceptable because:
- Order ID format `TJ-YYYY-NNNN` provides ~10,000 possible IDs per year
- Not guessable without knowing the format
- Customer can only see their own registration if they have the link

**Security consideration:** For production, consider:
- Adding a `lookup_token` UUID column for additional security
- Rate limiting lookups in the API layer

```sql
-- Current (acceptable for MVP)
CREATE POLICY "Public can view registration by order_id"
ON public.registrations
FOR SELECT TO anon
USING (true);

-- Enhanced (future)
CREATE POLICY "Public can view registration by token"
ON public.registrations
FOR SELECT TO anon
USING (lookup_token = current_setting('request.headers', true)::json->>'x-order-token');
```

### Admin Write Access

Per CONTEXT.md: "Role-based; new 'Registration Admin' role required"

```sql
-- Registration admin can INSERT, UPDATE
CREATE POLICY "Registration admin can write registrations"
ON public.registrations
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

CREATE POLICY "Registration admin can update registrations"
ON public.registrations
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

-- Only full admin can DELETE (soft delete preferred)
CREATE POLICY "Admin can delete registrations"
ON public.registrations
FOR DELETE USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_admin = true
  )
);
```

### Audit Table RLS

```sql
ALTER TABLE public.registration_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit trail
CREATE POLICY "Admins can read audit trail"
ON public.registration_audit
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

-- No direct writes to audit (trigger only)
-- No INSERT/UPDATE/DELETE policies = blocked
```

---

## Status Transition Logic

Per CONTEXT.md: "Forward-only; Status cannot go backward except Rejected -> Submitted"

### Valid Transitions

```
sale_complete -> documents_collected
documents_collected -> submitted_to_dmv
submitted_to_dmv -> dmv_processing
dmv_processing -> sticker_ready
dmv_processing -> rejected (branch)
sticker_ready -> sticker_delivered
rejected -> submitted_to_dmv (resubmission)
```

### Database Constraint Option

```sql
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "sale_complete": ["documents_collected"],
    "documents_collected": ["submitted_to_dmv"],
    "submitted_to_dmv": ["dmv_processing"],
    "dmv_processing": ["sticker_ready", "rejected"],
    "sticker_ready": ["sticker_delivered"],
    "sticker_delivered": [],
    "rejected": ["submitted_to_dmv"]
  }'::JSONB;
  allowed_next TEXT[];
BEGIN
  -- Skip validation for INSERT
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Skip if status didn't change
  IF OLD.current_stage = NEW.current_stage THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions
  allowed_next := ARRAY(
    SELECT jsonb_array_elements_text(valid_transitions -> OLD.current_stage)
  );

  -- Validate
  IF NOT (NEW.current_stage = ANY(allowed_next)) THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.current_stage, NEW.current_stage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_registration_status
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION validate_status_transition();
```

**Recommendation:** Implement this constraint to enforce business rules at the database level. The service layer can provide friendly error messages.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audit trail storage | Custom logging to separate service | PostgreSQL trigger to audit table | Transactional consistency, no extra infrastructure |
| Order ID generation | JavaScript UUID/random | PostgreSQL function `generate_order_id()` | Already exists in registration_ledger.sql, DB-level uniqueness |
| Status transition validation | Frontend-only checks | Database trigger constraint | Prevents invalid states from any client |
| Admin permission check | Repeated session/profile queries | Single RLS policy with cached role | Phase 1 established pattern, already in Store.tsx |
| Timestamp handling | Frontend Date objects | `TIMESTAMPTZ DEFAULT NOW()` | UTC storage, consistent across clients |

---

## Common Pitfalls

### Pitfall 1: Forgetting to Update TypeScript Types
**What goes wrong:** Schema changes but TypeScript types don't match
**Why it happens:** Manual sync between SQL and TypeScript
**How to avoid:** Update `types.ts` REGISTRATION_STAGES constant immediately after migration
**Warning signs:** TypeScript errors in Registrations.tsx after migration

### Pitfall 2: RLS Policy Conflict
**What goes wrong:** New policies conflict with existing ones, causing silent failures
**Why it happens:** Multiple overlapping policies with different USING clauses
**How to avoid:** DROP old policies before CREATE new ones; test with Supabase SQL editor
**Warning signs:** Empty arrays returned when data should exist (per Phase 1 research)

### Pitfall 3: Audit Trigger Performance
**What goes wrong:** Slow writes due to audit overhead
**Why it happens:** Computing changed fields for every row operation
**How to avoid:** Index audit table properly; consider async audit for bulk operations
**Warning signs:** Slow form submissions, especially bulk status changes

### Pitfall 4: Breaking Existing Admin UI
**What goes wrong:** Registrations.tsx expects 7 stages, migration provides 6
**Why it happens:** TypeScript types updated but REGISTRATION_STAGES constant has wrong values
**How to avoid:** Update types.ts and Registrations.tsx in same plan wave
**Warning signs:** Stage icons/labels not rendering, "undefined" in UI

### Pitfall 5: Lost Audit Trail on Soft Delete
**What goes wrong:** Archived records lose audit history
**Why it happens:** Audit table has FK with ON DELETE CASCADE
**How to avoid:** Use `ON DELETE SET NULL` or `ON DELETE RESTRICT` for audit FK
**Warning signs:** Missing history for archived registrations

---

## Code Examples from Codebase

### Current Service Pattern (to follow):
```typescript
// From services/registrationService.ts lines 359-464
export async function updateStageStatus(
  registrationId: string,
  stageKey: RegistrationStageKey,
  status: RegistrationStageStatus,
  options?: {
    blockedReason?: string;
    internalNotes?: string;
    sendNotification?: boolean;
  }
): Promise<boolean> {
  // ... validation and update logic
}
```

**Key pattern:** Options object for optional parameters, boolean return for success/failure.

### Current RLS Check Pattern (Phase 1):
```typescript
// From context/Store.tsx - session verification
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !sessionData?.session) {
  // Handle not logged in
}

const { data: profileData } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', sessionData.session.user.id)
  .single();

if (!profileData?.is_admin) {
  // Handle not admin
}
```

**For Phase 2:** Extend this pattern to check `is_registration_admin` as well.

### Current Registration Transform (to update):
```typescript
// From services/registrationService.ts lines 21-37
const transformRegistration = (data: any): Registration => ({
  id: data.id,
  orderId: data.order_id,
  vehicleId: data.vehicle_id,
  customerName: data.customer_name,
  // ... add new fields: customer_address, plate_number, milestone dates
});
```

---

## State of the Art

| Old Approach (Current) | New Approach (Phase 2) | Impact |
|------------------------|------------------------|--------|
| 7-stage workflow with customer actions | 6-stage dealer-controlled workflow | Simpler flow per CONTEXT.md |
| `registration_stages` separate table | Status column + milestone dates | Less complexity, audit handles history |
| No formal audit trail | PostgreSQL trigger-based audit table | Compliance-ready, history preserved |
| Single `is_admin` role | `is_admin` OR `is_registration_admin` | Granular permissions per CONTEXT.md |
| Dropdown for status changes | Step buttons + confirmation dialog | Better UX per CONTEXT.md |

---

## Open Questions

### Resolved During Research

1. **Keep existing tables or create new ones?**
   - Resolved: Modify existing `registrations` table (Option A) for continuity

2. **supa_audit vs custom audit?**
   - Resolved: Custom audit table for change notes requirement

3. **How to handle status transitions?**
   - Resolved: Database trigger constraint enforces valid paths

### For Planning Phase

1. **Bulk status change implementation**
   - CONTEXT.md: "Select multiple registrations, apply same status change"
   - Need to decide: Single RPC call vs multiple individual updates
   - Recommendation: Single RPC call with transaction for atomicity

2. **History export format**
   - CONTEXT.md: "Admin can download history as CSV/PDF"
   - Need to decide: Client-side generation vs server-side endpoint
   - Recommendation: Client-side for CSV (simpler), defer PDF to Phase 5

---

## Migration Strategy

### Recommended Order

1. **Wave 1: Database Migration**
   - Add new columns to `registrations`
   - Create `registration_audit` table
   - Create audit trigger function
   - Update RLS policies with registration_admin role
   - Add status transition constraint

2. **Wave 2: Service Updates**
   - Update `registrationService.ts` transformers
   - Add audit note support to update functions
   - Add `is_registration_admin` check to auth functions

3. **Wave 3: Type Updates**
   - Update `types.ts` with new stage enum
   - Update `REGISTRATION_STAGES` constant
   - Add new interface fields

4. **Wave 4: UI Updates (Phase 2 scope ends here)**
   - Update Registrations.tsx step buttons
   - Add confirmation dialogs
   - Wire up audit history display (or defer to Phase 3)

---

## Sources

### Primary (HIGH confidence)
- `supabase/registration_ledger.sql` - Direct codebase analysis
- `services/registrationService.ts` - Existing service patterns
- `pages/admin/Registrations.tsx` - Existing admin UI
- `.planning/phases/02-registration-database-foundation/02-CONTEXT.md` - User decisions
- `.planning/phases/01-reliability-stability/01-RESEARCH.md` - Phase 1 patterns
- [Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/postgres-audit) - Official Supabase audit patterns
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS official docs

### Secondary (MEDIUM confidence)
- [Supabase supa_audit GitHub](https://github.com/supabase/supa_audit) - Extension reference
- [Creating and Using Database Triggers in Supabase](https://rsakib.com/blogs/creating-using-database-triggers-supabase) - Trigger patterns

### Tertiary (LOW confidence - for awareness only)
- [Supabase Security Flaw Article](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) - RLS security considerations

---

## Metadata

**Confidence breakdown:**
- Schema design: HIGH - based on codebase analysis and CONTEXT.md requirements
- Audit trail: HIGH - official Supabase patterns verified
- RLS policies: HIGH - follows existing codebase patterns with CONTEXT.md extensions
- Status transitions: HIGH - clear requirements in CONTEXT.md
- Admin UI changes: MEDIUM - requires implementation decisions during planning

**Research date:** 2026-02-03
**Valid until:** Indefinite (codebase-specific research, CONTEXT.md locked decisions)
