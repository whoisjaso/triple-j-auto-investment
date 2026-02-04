# Registration Schema Migrations

## Migration Order

1. `../registration_ledger.sql` - Creates base registration tables
2. `02_registration_schema_update.sql` - Updates schema for 6-stage workflow

## What This Migration Does

Updates the registration schema for a 6-stage dealer-controlled workflow:

- Adds `is_registration_admin` role to profiles
- Adds document checklist (5 booleans) and milestone timestamps
- Creates `registration_audit` table with trigger for all field changes
- Enforces forward-only status transitions at database level
- Updates RLS policies for granular permissions

## Breaking Changes

### Stage Keys Changed

| Old Stage | New Stage |
|-----------|-----------|
| payment | sale_complete |
| insurance | documents_collected |
| inspection | documents_collected |
| submission | submitted_to_dmv |
| dmv_processing | dmv_processing |
| approved | sticker_ready |
| ready | sticker_delivered |

### Data Migration (run BEFORE applying constraint)

```sql
UPDATE public.registrations SET current_stage = CASE
  WHEN current_stage = 'payment' THEN 'sale_complete'
  WHEN current_stage = 'insurance' THEN 'documents_collected'
  WHEN current_stage = 'inspection' THEN 'documents_collected'
  WHEN current_stage = 'submission' THEN 'submitted_to_dmv'
  WHEN current_stage = 'dmv_processing' THEN 'dmv_processing'
  WHEN current_stage = 'approved' THEN 'sticker_ready'
  WHEN current_stage = 'ready' THEN 'sticker_delivered'
  ELSE 'sale_complete'
END;
```

## New Roles: is_registration_admin

Grants permission to manage registrations without full admin access.

**Permissions:** INSERT, UPDATE, SELECT on registrations; SELECT on audit
**NOT permitted:** DELETE registrations (requires is_admin)

```sql
UPDATE public.profiles SET is_registration_admin = true WHERE id = 'user-uuid';
```

## Rollback

```sql
-- Drop triggers and functions
DROP TRIGGER IF EXISTS registration_audit_trigger ON public.registrations;
DROP TRIGGER IF EXISTS validate_registration_status ON public.registrations;
DROP TRIGGER IF EXISTS auto_milestone_dates ON public.registrations;
DROP FUNCTION IF EXISTS audit_registration_changes();
DROP FUNCTION IF EXISTS validate_status_transition();
DROP FUNCTION IF EXISTS auto_set_milestone_dates();

-- Drop audit table and policies
DROP TABLE IF EXISTS public.registration_audit;
DROP POLICY IF EXISTS "Registration admins can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Registration admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Only admins can delete registrations" ON public.registrations;

-- Restore old admin policy
CREATE POLICY "Admins can manage registrations" ON public.registrations
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Drop columns and role (optional, causes data loss)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_registration_admin;
```
