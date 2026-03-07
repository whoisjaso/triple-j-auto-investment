# Phase 1: Reliability & Stability - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix foundational stability issues so features can be built without cascading failures. This includes:
- STAB-01: Fix inventory display loop bug
- STAB-02: Fix RLS silent failure pattern
- STAB-03: Decompose Store.tsx monolith into separate contexts

This is infrastructure/refactoring work. The goal is a stable platform, not new features.

</domain>

<decisions>
## Implementation Decisions

### Error Handling UX
- Modal dialog for error notification (not toast or inline)
- Auto-retry 2-3 times before showing error modal to user
- During retry: visible countdown ("Retrying in 3... 2... 1...")
- Error modal shows user-friendly message + error code + timestamp
- Warnings vs errors: warnings can have "Don't remind me", errors always require acknowledgment
- RLS/permission errors: show detailed permission info to admins only
- Partial failures: keep partial progress, show what failed so user can fix and continue
- Empty inventory: show empty state message with call-to-action to add a vehicle
- Manual refresh: pull-to-refresh on mobile, explicit refresh button on desktop

### Context Architecture
- Functional naming: AuthContext, VehicleContext, UIContext (not domain names)
- Base state (after extraction): UI state only — theme, sidebar, modals
- No localStorage persistence — database is always source of truth
- Create a context template for future contexts (rental, registration, etc.)

### Loading States
- Page/list loading: horizontal progress bar at top
- Individual actions (save, delete): overlay covers affected area only
- Block affected area only during operations, rest of page remains interactive
- Text + visual: "Loading inventory...", "Saving...", etc.
- Determinate progress where measurable (file uploads show actual %)
- Completion feel: progress bar fills to 100%, holds briefly, then fades
- Preserve existing: keep the logo splash screen with yellow outline animation — don't change working UI elements

### Logging & Debugging
- Debug mode toggle available in admin settings
- When enabled: shows API calls, responses, timing, and state changes
- Verbose debug info includes before/after values on state changes

### Claude's Discretion
- Severity levels (warning vs error thresholds)
- Whether to include "copy error details" button
- Slow loading threshold timing
- Optimistic UI decisions per-operation
- Global loading indicator in navbar
- Image upload feedback design
- Which operations should be cancellable
- File organization (one file per context vs feature folders)
- Provider pattern (combined vs explicit nesting)
- Access pattern (custom hooks vs direct context)
- Data fetching strategy (contexts vs separate layer)
- Store.tsx migration approach (remove vs re-export)
- TypeScript strictness level
- useState vs useReducer per-context
- Context access boundaries
- Logging destination (console only vs remote)
- Debug info display location (console vs panel)

</decisions>

<specifics>
## Specific Ideas

- "I like how my logo shows now in the beginning before the website, with the yellow animation outlining it"
- Don't change working UI elements — only fix what's broken or inconsistent with the rest of the website
- Error codes should be support-referenceable (e.g., "Error: RLS-403")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-reliability-stability*
*Context gathered: 2026-01-29*
