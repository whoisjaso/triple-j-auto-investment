# Phase 1: Reliability & Stability - Research

**Researched:** 2026-01-30
**Domain:** React state management, Supabase RLS, error handling patterns
**Confidence:** HIGH

## Summary

This research investigated the existing codebase to understand the three stability issues requiring remediation: the inventory display loop bug (STAB-01), RLS silent failure pattern (STAB-02), and the Store.tsx monolith (STAB-03). The codebase analysis reveals clear root causes for each issue and establishes the migration scope for the decomposition work.

**Key findings:**
1. The inventory loop bug is caused by a lack of loading state coordination and no empty state handling - when vehicles array is empty, the "loading" state never resolves meaningfully
2. RLS silent failures occur because Supabase returns empty arrays (not errors) when RLS blocks operations - the code does detect this but only after the fact via `data.length === 0` checks
3. Store.tsx at 893 lines contains auth, vehicles, leads, UI state, and sync logic intertwined - 10 consumer files import `useStore`

**Primary recommendation:** Fix bugs first (STAB-01, STAB-02), then decompose Store.tsx in a way that maintains backward compatibility via re-exported hooks.

---

## Inventory Loop Bug Analysis (STAB-01)

### Root Cause Identification

**Location:** `context/Store.tsx` lines 240-331 (`loadVehicles` function)

**The Bug Pattern:**
```typescript
// From Store.tsx lines 240-331
const loadVehicles = async () => {
  setIsLoading(true);  // Sets loading to true

  // Safety timer at 12 seconds - forces loader off
  const safetyTimer = setTimeout(() => {
    setIsLoading(false);
  }, 12000);

  // ... fetch logic ...

  if (error) {
    // Error path: uses FALLBACK_ASSETS if vehicles.length === 0
    if (vehicles.length === 0) {
      setVehicles(FALLBACK_ASSETS);
    }
    return;  // BUG: setIsLoading(false) may not be called before return
  }

  // Success path: sets vehicles, then setIsLoading(false) in finally
};
```

**Problems Identified:**

1. **Early return without loader cleanup:** When an error occurs and `vehicles.length > 0`, the function returns early without clearing `isLoading`. The `finally` block doesn't catch this path.

2. **No empty state distinction:** The UI cannot distinguish between "loading" and "loaded but empty". When Supabase returns 0 vehicles legitimately, the user sees a loading spinner indefinitely (until 12s safety valve).

3. **Real-time subscription re-fetches:** Lines 215-221 set up a Supabase real-time subscription that calls `loadVehicles()` on any vehicle change. If the initial load fails, the subscription may trigger retry loops.

4. **Safety valve is a symptom, not a fix:** The 12-second timeout (line 245-248) was added to force the loader off, indicating awareness of the loop issue but not addressing the root cause.

### Current Loading State Usage

**Consumers of `isLoading`:**

| File | Usage |
|------|-------|
| `pages/Inventory.tsx` | Shows "UPLINKING COMMAND LEDGER..." with Loader2 animation when `isLoading` is true |
| `pages/admin/Inventory.tsx` | Uses for form submission states (different concern) |

**Current loading UI (from Inventory.tsx lines 480-485):**
```tsx
{isLoading && (
  <div className="py-32 text-center border border-white/10 mt-12 bg-white/5">
    <Loader2 size={32} className="mx-auto text-tj-gold mb-4 animate-spin" />
    <p className="font-display text-xl text-white tracking-widest animate-pulse">
      UPLINKING COMMAND LEDGER...
    </p>
  </div>
)}
```

**Current empty state UI (from Inventory.tsx lines 487-553):**
- Shows "Connection Issue Detected" with troubleshooting steps
- Only appears when `!isLoading && sortedVehicles.length === 0`
- This is correct logic but the bug prevents reaching this state properly

### What Triggers the Bug

1. User visits `/inventory` page
2. `StoreProvider` mounts, `loadVehicles()` is called via `initializeData()`
3. If Supabase fetch fails OR returns empty array:
   - Error path: May not clear `isLoading` properly
   - Empty path: Sets vehicles to `[]`, `isLoading` to `false`, but then real-time subscription triggers reload
4. User sees spinning loader indefinitely

### Existing Loader Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CrestLoader` | `components/CrestLoader.tsx` | Full-screen branded loader with animated shield outline |
| `SplashScreen` | `components/SplashScreen.tsx` | Initial app load splash (session-cached) |
| `Loader2` (lucide) | Various | Inline spinner icon |

**Note:** The `CrestLoader` component is a full-screen loader that preserves the "yellow outline animation" the user likes. This can be adapted for the progress bar approach specified in CONTEXT.md.

---

## RLS Silent Failure Pattern (STAB-02)

### Root Cause Identification

**Location:** `context/Store.tsx` - all CRUD operations

**The Pattern:** Supabase RLS does NOT return errors when operations are blocked. Instead:
- SELECT returns empty array `[]`
- INSERT/UPDATE/DELETE return empty `data` array with no error

**Current Detection (Store.tsx lines 533-552):**
```typescript
// In updateVehicle function
const { data, error } = await supabase
  .from('vehicles')
  .update(dbUpdate)
  .eq('id', id)
  .select();

if (error) {
  // This rarely triggers for RLS blocks
  alert(`Failed to update vehicle:...`);
}

if (data && data.length > 0) {
  console.log('Vehicle updated successfully');
} else {
  // RLS silently blocks updates by returning empty array
  console.error('Update returned no data - RLS may have blocked');
  alert('UPDATE FAILED: Your changes were not saved...');
}
```

**Problem:** The detection is reactive (after the fact) and uses browser `alert()` which is poor UX. The user submits a form, waits, then sees a generic alert.

### RLS Policy Structure

**From `supabase/schema.sql` (lines 105-157):**

```sql
-- Vehicles Table RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Public can view available/pending vehicles
CREATE POLICY "Public can view available vehicles" ON public.vehicles
  FOR SELECT USING (status IN ('Available', 'Pending'));

-- Admins can do everything (separate policies per operation)
CREATE POLICY "Admins can select vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can update vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can delete vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```

**From `supabase/FINAL_FIX_RLS.sql`:**
```sql
-- Simplified approach (currently deployed)
CREATE POLICY "allow_public_select_vehicles" ON public.vehicles
  FOR SELECT USING (true);

CREATE POLICY "allow_admin_all_vehicles" ON public.vehicles
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );
```

**Issues with RLS:**

1. **Multiple overlapping policies:** The codebase has multiple SQL files suggesting policy rewrites happened multiple times
2. **Session dependency:** `auth.uid()` requires active session - if session expires mid-operation, RLS blocks silently
3. **No server-side validation:** The frontend relies entirely on RLS without server-side error codes

### Current Error Handling Patterns

**Error handling approaches currently in use:**

| Approach | Usage | UX Quality |
|----------|-------|------------|
| `alert()` | All CRUD operations | Poor - blocks UI, no retry option |
| `console.error()` | Everywhere | Invisible to user |
| `setConnectionError()` | Global connection state | Good - banner shown |
| `setVinError()` | VIN validation | Good - inline feedback |

**Example of current error handling (addVehicle, lines 432-458):**
```typescript
if (error) {
  if (errorMessage.includes('too large')) {
    alert('ADD FAILED: Images are too large!...');
  } else if (errorMessage.includes('duplicate')) {
    alert('ADD FAILED: A vehicle with this VIN already exists.');
  } else {
    alert(`Failed to add vehicle: ${errorMessage}...`);
  }
  throw new Error(`Add failed: ${error.message}`);
}
```

### Session Verification Pattern

**Current pre-operation checks (lines 380-400):**
```typescript
// Before every write operation:
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !sessionData?.session) {
  alert('ADD FAILED: You are not logged in!...');
  throw new Error('No active session');
}

const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', sessionData.session.user.id)
  .single();

if (profileError || !profileData?.is_admin) {
  alert('ADD FAILED: Your account is not set as admin...');
  throw new Error('Not an admin user');
}
```

**This pattern is repeated in:** `addVehicle`, `updateVehicle`, `removeVehicle`

---

## Store.tsx Decomposition Analysis (STAB-03)

### Current Structure

**File:** `context/Store.tsx` - 893 lines

**Logical Groupings Identified:**

| Group | Lines | State | Functions |
|-------|-------|-------|-----------|
| **Auth** | 352-377 | `user` | `login`, `logout`, `triggerRecovery` |
| **Vehicles** | 240-597 | `vehicles`, `isLoading`, `connectionError` | `loadVehicles`, `addVehicle`, `updateVehicle`, `removeVehicle`, `refreshVehicles` |
| **Leads** | 333-350, 799-838 | `leads` | `loadLeads`, `addLead` |
| **Sync** | 605-797 | `lastSync`, `isSyncingRef` | `syncWithGoogleSheets`, `parseCSVLine`, `resetToDefault` |
| **Registration** | 840-861 | (uses vehicles) | `updateRegistration` |
| **UI/Base** | 141-150 | None directly | (configuration only) |

### Consumer Analysis

**Files importing `useStore`:**

| File | What It Uses |
|------|--------------|
| `App.tsx` | `user`, `logout` |
| `pages/Inventory.tsx` | `vehicles`, `addLead`, `isLoading`, `refreshVehicles` |
| `pages/admin/Inventory.tsx` | `vehicles`, `addVehicle`, `updateVehicle`, `removeVehicle`, `syncWithGoogleSheets`, `lastSync`, `resetToDefault`, `connectionError` |
| `pages/admin/Dashboard.tsx` | `vehicles`, `leads`, `connectionError`, `logout` |
| `pages/admin/Registrations.tsx` | `vehicles` |
| `pages/Login.tsx` | `login` |
| `pages/Contact.tsx` | `addLead` |
| `pages/Finance.tsx` | `vehicles` |
| `pages/Home.tsx` | `vehicles` |

### Recommended Context Boundaries

Based on CONTEXT.md decisions:

| Context | State | Functions | Consumers |
|---------|-------|-----------|-----------|
| **AuthContext** | `user` | `login`, `logout`, `getSession` | App.tsx, Admin pages, Login.tsx |
| **VehicleContext** | `vehicles`, `isLoading`, `connectionError` | `loadVehicles`, `addVehicle`, `updateVehicle`, `removeVehicle` | Inventory pages, Dashboard, Finance, Home |
| **UIContext** | (future: theme, sidebar, modals) | (minimal for now) | Minimal |
| **LeadsContext** (defer)** | `leads` | `addLead`, `loadLeads` | Contact.tsx, Dashboard.tsx |

**Deferred per CONTEXT.md:** RentalContext, RegistrationContext (future phases)

### Migration Approach Options

**Option A: Big Bang (NOT recommended)**
- Rewrite Store.tsx entirely
- Update all 10 consumer files at once
- High risk of regression

**Option B: Incremental with Re-exports (RECOMMENDED)**
- Extract AuthContext first (simplest, used by App.tsx)
- Store.tsx re-exports `useAuth` from AuthContext
- Existing `useStore` continues to work
- Extract VehicleContext second
- Eventually deprecate unified `useStore`

**Re-export pattern:**
```typescript
// In context/Store.tsx (after extraction)
export { useAuth } from './AuthContext';
export { useVehicles } from './VehicleContext';

// Backward-compatible useStore for migration period
export const useStore = () => {
  const auth = useAuth();
  const vehicles = useVehicles();
  return { ...auth, ...vehicles };
};
```

---

## Existing UI Patterns

### Modal Components

| Component | Location | Pattern |
|-----------|----------|---------|
| `BillOfSaleModal` | `components/admin/BillOfSaleModal.tsx` | Full-screen overlay, X close button, uses createPortal |
| `PdfPreviewModal` | `components/admin/PdfPreviewModal.tsx` | Preview modal for PDF documents |
| Vehicle Detail Modal | `pages/Inventory.tsx` (inline) | Motion-animated, createPortal, tabs |

**Common modal patterns:**
- `createPortal(content, document.body)` for z-index management
- `AnimatePresence` from framer-motion for enter/exit animations
- Backdrop click to close
- X button in top-right corner
- Sticky header with close action

### Loading State Patterns

| Pattern | Current Usage | UX Quality |
|---------|---------------|------------|
| `Loader2` spinner | Form submissions, data fetching | Adequate |
| Full-screen `CrestLoader` | Initial app load | Good - branded |
| Safety timeout | Vehicle loading (12s) | Poor - band-aid |
| `isLoading` boolean | Global loading state | Insufficient granularity |

### Error Display Patterns

| Pattern | Current Usage | UX Quality |
|---------|---------------|------------|
| `alert()` | CRUD operations | Poor |
| `connectionError` state + banner | Dashboard, Admin Inventory | Good |
| `formError` state + inline display | Lead form in Inventory.tsx | Good |
| Console logging | Everywhere | Developer only |

---

## Existing Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useStore` | `context/Store.tsx` | Unified state access |
| `useLanguage` | `context/LanguageContext.tsx` | i18n support |
| `useScrollLock` | `hooks/useScrollLock.ts` | Modal scroll lock with nesting support |

**useScrollLock pattern (good example):**
```typescript
// Global lock counter for nested modals
let lockCount = 0;
let savedScrollY = 0;

export function useScrollLock(isLocked: boolean) {
  // Handles nested modals correctly
  // Preserves and restores scroll position
}
```

---

## Technical Constraints

### React Version
- React 18.2 (per package.json analysis in prior research)
- Using React.createContext, not React 19 `use()` hook
- framer-motion 12.x for animations

### Supabase Version
- Supabase JS 2.87.1
- Uses `@supabase/supabase-js` createClient
- Real-time subscriptions via `.channel().subscribe()`

### Styling
- Tailwind CSS 3.4.19
- Custom `tj-gold` color (#D4AF37)
- Dark theme (black backgrounds, gold accents)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom portal management | Existing pattern from BillOfSaleModal + framer-motion AnimatePresence | Already working, styled consistently |
| Loading spinners | New spinner component | Existing `CrestLoader` or `Loader2` from lucide | Branded, tested |
| Scroll locking | Manual body overflow | Existing `useScrollLock` hook | Handles nesting correctly |
| Toast notifications | Custom toast system | (Recommend adding) react-hot-toast or build modal-based per CONTEXT.md | CONTEXT.md specifies modal, not toast |

---

## Common Pitfalls for This Phase

### Pitfall 1: Breaking Existing Consumers During Decomposition
**What goes wrong:** Extracting state into new context breaks imports
**Why it happens:** Consumers rely on specific shape of `useStore()` return value
**How to avoid:** Use re-export pattern; keep `useStore` working during transition
**Warning signs:** TypeScript errors in consumer files after extraction

### Pitfall 2: Async State Updates After Component Unmount
**What goes wrong:** `setVehicles()` called after component unmounted causes React warning
**Why it happens:** Real-time subscriptions continue after navigation
**How to avoid:** Cleanup subscriptions in useEffect return; use AbortController
**Warning signs:** "Can't perform state update on unmounted component" console warnings

### Pitfall 3: RLS Check Becoming a Performance Bottleneck
**What goes wrong:** Every operation does session + profile check = 2 extra round trips
**Why it happens:** Current pattern queries `profiles` table on every write
**How to avoid:** Cache admin status in context; verify session only, trust RLS for permission
**Warning signs:** Slow form submissions, visible delay before operation starts

### Pitfall 4: Error Modal Interrupting User Flow
**What goes wrong:** Modal for minor errors (retryable) annoys users
**Why it happens:** Same error handling for transient vs permanent errors
**How to avoid:** Per CONTEXT.md - auto-retry 2-3 times before showing modal
**Warning signs:** Users complaining about too many popups

### Pitfall 5: Loading State Granularity Mismatch
**What goes wrong:** Page shows "loading" when only one operation is in progress
**Why it happens:** Single `isLoading` boolean for all operations
**How to avoid:** Per-operation loading states (e.g., `isLoadingVehicles`, `isSaving`)
**Warning signs:** Entire page goes into loading state during single item save

---

## Code Examples from Codebase

### Current Error Handling (to improve):
```typescript
// From Store.tsx - current pattern with alert()
if (error) {
  console.error('Failed to update vehicle:', error);
  alert(`Failed to update vehicle: ${errorMessage}`);
  throw new Error(`Update failed: ${error.message}`);
}
```

### Current Session Verification (to extract):
```typescript
// From Store.tsx - repeated in every write function
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !sessionData?.session) {
  console.error('No active session for update:', sessionError);
  alert('UPDATE FAILED: You are not logged in!');
  throw new Error('No active session');
}
```

### Current Loading State Management:
```typescript
// From Store.tsx - loadVehicles function
const loadVehicles = async () => {
  setIsLoading(true);

  const safetyTimer = setTimeout(() => {
    console.warn('Safety Valve: Fetch took too long.');
    setIsLoading(false);
  }, 12000);

  try {
    // ... fetch logic ...
  } finally {
    clearTimeout(safetyTimer);
    setIsLoading(false);
  }
};
```

### Modal Pattern from Codebase:
```typescript
// From pages/Inventory.tsx - createPortal usage
{typeof document !== 'undefined' && createPortal(
  <AnimatePresence>
    {selectedVehicle && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Modal content */}
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
)}
```

---

## State of the Art

| Old Approach (Current) | Current Approach (Recommended) | Impact |
|------------------------|-------------------------------|--------|
| Single `useStore` hook | Separate domain contexts with re-export | Better separation, easier testing |
| `alert()` for errors | Modal with retry logic | Better UX per CONTEXT.md |
| Boolean `isLoading` | Operation-specific loading states | Granular feedback |
| Safety timeout | Proper async cleanup | No artificial delays |

---

## Open Questions

### Resolved During Research

1. **Where is the inventory loop bug?**
   - Resolved: `loadVehicles()` in Store.tsx, early returns without clearing `isLoading`

2. **What causes RLS silent failures?**
   - Resolved: Supabase returns empty arrays, not errors. Current code detects but handles poorly.

3. **How many consumers use useStore?**
   - Resolved: 10 files, all mapped above

### Remaining Questions (For Planning)

1. **Should debug mode panel be a drawer or overlay?**
   - CONTEXT.md says "Debug mode toggle in admin settings" but doesn't specify display format
   - Recommendation: Start with console logging, add visual panel later

2. **How to handle partially failed operations?**
   - CONTEXT.md: "keep partial progress, show what failed"
   - Applies to: Bulk operations (not currently implemented)
   - For single operations: Either succeed or fail entirely

---

## Sources

### Primary (HIGH confidence)
- `context/Store.tsx` - Direct codebase analysis (893 lines)
- `supabase/schema.sql` - RLS policy definitions
- `supabase/FINAL_FIX_RLS.sql` - Current deployed RLS
- `pages/Inventory.tsx` - Consumer analysis
- `pages/admin/Inventory.tsx` - Admin consumer analysis
- `.planning/phases/01-reliability-stability/01-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` - Prior project research

---

## Metadata

**Confidence breakdown:**
- Inventory bug analysis: HIGH - direct code examination
- RLS failure pattern: HIGH - code + SQL analysis
- Store decomposition scope: HIGH - full consumer mapping
- Error handling recommendations: HIGH - based on CONTEXT.md decisions

**Research date:** 2026-01-30
**Valid until:** Indefinite (codebase-specific research)
