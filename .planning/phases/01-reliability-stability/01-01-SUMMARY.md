---
phase: 01-reliability-stability
plan: 01
subsystem: error-handling
tags: [typescript, react, hooks, components, error-handling]

dependency_graph:
  requires: []
  provides:
    - AppError type and ErrorCodes constants
    - useRetry hook with countdown state
    - ErrorModal component with retry UI
  affects:
    - 01-02 (STAB-01 loop bug fix)
    - 01-03 (STAB-02 RLS failures)

tech_stack:
  added: []
  patterns:
    - Error type with code, message, details, timestamp, retryable
    - Retry hook with AbortController and countdown
    - Modal component following existing BillOfSaleModal patterns

file_tracking:
  created:
    - triple-j-auto-investment-main/hooks/useRetry.ts
    - triple-j-auto-investment-main/components/ErrorModal.tsx
  modified:
    - triple-j-auto-investment-main/types.ts

decisions:
  - id: err-01
    decision: Error codes grouped by category (RLS, NET, DB)
    rationale: Easy identification of error source for debugging
  - id: err-02
    decision: Retryable flag on AppError type
    rationale: Allows UI to decide whether to show retry button
  - id: err-03
    decision: useRetry returns abort function
    rationale: Component can cancel pending retries on unmount

metrics:
  duration: ~10 minutes
  completed: 2026-02-01
---

# Phase 01 Plan 01: Error Handling Infrastructure Summary

**One-liner:** Reusable error handling infrastructure with AppError type, useRetry hook with countdown, and animated ErrorModal component.

## What Was Built

### 1. AppError Type and ErrorCodes (types.ts)

Added error handling types at the end of the existing types.ts file:

```typescript
export interface AppError {
  code: string;           // e.g., "RLS-403", "NET-TIMEOUT"
  message: string;        // User-friendly message
  details?: string;       // Technical details (shown to admins only)
  timestamp: Date;
  retryable: boolean;
}

export const ErrorCodes = {
  // RLS errors (STAB-02)
  RLS_BLOCKED: 'RLS-403',
  RLS_NO_SESSION: 'RLS-401',
  RLS_NOT_ADMIN: 'RLS-FORBIDDEN',
  // Network errors (STAB-01)
  NET_TIMEOUT: 'NET-TIMEOUT',
  NET_FETCH_FAILED: 'NET-FETCH',
  NET_ABORTED: 'NET-ABORT',
  // Database errors
  DB_DUPLICATE: 'DB-DUP',
  DB_CONSTRAINT: 'DB-CONSTRAINT',
  DB_UNKNOWN: 'DB-ERR',
} as const;
```

### 2. useRetry Hook (hooks/useRetry.ts)

Auto-retry hook with visible countdown state:

- Configurable max attempts (default 3) and base delay (default 1000ms)
- Countdown state exposed for UI display
- AbortController support for cancellation
- Error classification: determines if error is retryable
- User-friendly error messages mapped from error codes
- Callback when max attempts reached

**Usage example:**
```typescript
const { execute, state, reset, abort } = useRetry({ maxAttempts: 3 });
const result = await execute(async (signal) => fetchData(signal), ErrorCodes.NET_FETCH_FAILED);
```

### 3. ErrorModal Component (components/ErrorModal.tsx)

Animated error modal following existing patterns from BillOfSaleModal:

- Framer-motion enter/exit animations
- Displays error code, user-friendly message
- Retry countdown display during retry attempts
- "Copy Details" button for support
- Admin-only technical details (collapsible)
- Proper scroll lock via useScrollLock hook
- Backdrop click to close (disabled during retry)
- tj-gold accent color for brand consistency

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AppError type and ErrorCodes | e2a8091 | types.ts |
| 2 | useRetry hook | f926e42 | hooks/useRetry.ts |
| 3 | ErrorModal component | ba25b3c | components/ErrorModal.tsx |

## Verification Results

- [x] All three files exist with expected exports
- [x] `npx tsc --noEmit` passes with no errors
- [x] types.ts only has additive changes (no existing types modified)
- [x] ErrorModal imports AppError from types (key_link verified)

## Deviations from Plan

None - plan executed exactly as written.

## Next Plan Readiness

**Ready for 01-02 (STAB-01 loop bug fix):**
- ErrorModal can be imported to display errors
- useRetry can wrap inventory fetches
- ErrorCodes.NET_* available for network errors

**Ready for 01-03 (STAB-02 RLS failures):**
- ErrorCodes.RLS_* available for RLS errors
- useRetry configured with onMaxAttemptsReached callback
- ErrorModal shows admin-only technical details

## Integration Notes

To use the new infrastructure:

```typescript
import { ErrorModal } from '../components/ErrorModal';
import { useRetry } from '../hooks/useRetry';
import { ErrorCodes, AppError } from '../types';

// In component:
const [error, setError] = useState<AppError | null>(null);
const { execute, state, reset } = useRetry({
  maxAttempts: 3,
  onMaxAttemptsReached: (err) => setError(err)
});

// Fetch with retry:
const { data, error: fetchError } = await execute(
  async (signal) => supabase.from('vehicles').select().abortSignal(signal),
  ErrorCodes.NET_FETCH_FAILED
);

// Render modal:
<ErrorModal
  error={error}
  onClose={() => setError(null)}
  onRetry={() => execute(...)}
  isRetrying={state.isRetrying}
  retryCountdown={state.countdown}
  retryAttempt={state.attempt}
  maxAttempts={state.maxAttempts}
  showAdminDetails={user?.isAdmin}
/>
```
