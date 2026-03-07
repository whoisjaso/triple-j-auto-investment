# Architecture

**Analysis Date:** 2025-01-28

## Pattern Overview

**Overall:** Component-Based Single Page Application (SPA) with Context-Based State Management

**Key Characteristics:**
- React 19 SPA with hash-based routing (HashRouter)
- Centralized state via React Context (Store pattern)
- Service layer for external API integrations
- Supabase as backend-as-a-service (BaaS) for auth, database, and real-time subscriptions
- Lazy loading for non-critical pages
- Multi-language support (English/Spanish)

## Layers

**Presentation Layer:**
- Purpose: Renders UI components and handles user interactions
- Location: `triple-j-auto-investment-main/components/`, `triple-j-auto-investment-main/pages/`
- Contains: React functional components, page-level components, reusable UI elements
- Depends on: Context layer (Store, LanguageContext), Services layer, Types
- Used by: App.tsx router

**Context Layer (State Management):**
- Purpose: Manages global application state, authentication, and data synchronization
- Location: `triple-j-auto-investment-main/context/`
- Contains: `Store.tsx` (vehicles, leads, user auth, CRUD operations), `LanguageContext.tsx` (i18n)
- Depends on: Services layer, Supabase config
- Used by: All page and component files

**Service Layer:**
- Purpose: Abstracts external API calls and business logic
- Location: `triple-j-auto-investment-main/services/`
- Contains: API integrations (email, AI, VIN lookup, registration management)
- Depends on: Supabase config, external APIs (NHTSA, EmailJS, Google Gemini, Retell AI)
- Used by: Context layer, Page components

**Data Layer (Supabase):**
- Purpose: Provides authentication, database operations, and real-time subscriptions
- Location: `triple-j-auto-investment-main/supabase/config.ts`, `triple-j-auto-investment-main/lib/auth.ts`
- Contains: Supabase client configuration, auth service wrapper
- Depends on: Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Used by: Context layer, Service layer

**Utilities Layer:**
- Purpose: Shared helper functions and constants
- Location: `triple-j-auto-investment-main/utils/`
- Contains: Translation strings (`translations.ts`), Texas county lookup (`texasCountyLookup.ts`)
- Depends on: Nothing
- Used by: Context layer, Components

**Types Layer:**
- Purpose: TypeScript type definitions and constants
- Location: `triple-j-auto-investment-main/types.ts`
- Contains: Vehicle, Lead, User, Registration types, enums, stage configurations
- Depends on: Nothing
- Used by: All layers

## Data Flow

**Vehicle Data Flow:**

1. App initializes `StoreProvider` which calls `loadVehicles()` on mount
2. `loadVehicles()` fetches from Supabase `vehicles` table with 10s timeout
3. Data transformed from snake_case (DB) to camelCase (frontend)
4. Vehicles stored in React state, components re-render
5. Real-time subscription (`postgres_changes`) auto-reloads on DB changes
6. Fallback assets shown if Supabase fails

**Authentication Flow:**

1. User submits credentials on Login page
2. `authService.login()` calls `supabase.auth.signInWithPassword()`
3. On success, fetches `profiles` table for `is_admin` status
4. Updates `user` state in Store context
5. `ProtectedRoute` component guards admin routes checking `user?.isAdmin`
6. Session persisted via localStorage, auto-refreshed by Supabase SDK

**Lead Submission Flow:**

1. User fills form in Inventory modal (name, phone, email)
2. `handleSubmit()` calls `addLead()` in Store
3. Lead inserted to Supabase `leads` table
4. `sendLeadNotification()` emails dealer via EmailJS
5. `triggerOutboundCall()` initiates AI voice call via Retell API
6. Success state shown to user

**State Management:**
- Global state via `StoreContext` providing vehicles, leads, user, CRUD operations
- Language state via `LanguageContext` providing current language and translations
- Component-local state for UI concerns (modals, forms, filters)
- No external state library (Redux/Zustand) - pure React Context

## Key Abstractions

**Vehicle:**
- Purpose: Core business entity representing a car in inventory
- Examples: `triple-j-auto-investment-main/types.ts` (lines 9-36)
- Pattern: Interface with financial tracking (cost breakdown), status enum, gallery support

**Registration:**
- Purpose: Tracks DMV registration workflow for sold vehicles
- Examples: `triple-j-auto-investment-main/types.ts` (lines 164-191), `triple-j-auto-investment-main/services/registrationService.ts`
- Pattern: Multi-stage workflow with ownership tracking (customer/dealer/state)

**Store Context:**
- Purpose: Centralized state container with data operations
- Examples: `triple-j-auto-investment-main/context/Store.tsx`
- Pattern: Provider/Consumer with exposed CRUD methods and real-time sync

**Auth Service:**
- Purpose: Wraps Supabase auth with admin role checking
- Examples: `triple-j-auto-investment-main/lib/auth.ts`
- Pattern: Service object with async methods returning domain types

## Entry Points

**Application Entry:**
- Location: `triple-j-auto-investment-main/index.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Mounts React app to `#root`, wraps in StrictMode

**Router Entry:**
- Location: `triple-j-auto-investment-main/App.tsx`
- Triggers: React app mount
- Responsibilities: Configures providers (Language, Store), sets up routes, renders Navbar/Footer

**Admin Entry:**
- Location: `triple-j-auto-investment-main/pages/admin/Dashboard.tsx`
- Triggers: Authenticated admin navigates to `/admin/dashboard`
- Responsibilities: Financial analytics, leads inbox, AI-powered insights

## Error Handling

**Strategy:** Multi-layer with graceful degradation

**Patterns:**
- **Component Level:** ErrorBoundary class component in `App.tsx` catches render errors
- **Lazy Loading:** `lazyWithErrorHandling()` wrapper returns fallback UI on chunk load failure
- **Network Level:** Timeout (10s) + abort controller on Supabase fetches
- **Fallback Data:** `FALLBACK_ASSETS` array loaded when Supabase fails
- **Form Validation:** Client-side validation with error messages in state
- **Console Logging:** Extensive `console.log`/`console.error` for debugging

**Error Display:**
- User-friendly error cards with reload buttons
- Browser-specific hints (Brave shields detection)
- Connection error banner on admin pages

## Cross-Cutting Concerns

**Logging:** Console-based logging throughout (`console.log`, `console.warn`, `console.error`)
- Prefixed with emojis for quick visual scanning in dev tools
- Examples: `"Loading..."`, `"Session restored: {email}"`, `"Update failed: {error}"`

**Validation:**
- VIN validation: 17 chars, alphanumeric, no I/O/Q characters
- Phone formatting: `(XXX) XXX-XXXX` pattern
- Form validation via HTML5 `required` + custom checks

**Authentication:**
- Supabase Auth for session management
- Row Level Security (RLS) on Supabase tables
- `profiles.is_admin` flag determines admin access
- Session auto-refresh via Supabase SDK

**Internationalization:**
- `LanguageContext` provides `lang` ('en'|'es') and `t` (translations object)
- Translations in `utils/translations.ts`
- Toggle via navbar button, persisted in localStorage

**Build Version Cache Busting:**
- `tj_build_version` in localStorage triggers hard refresh on version mismatch
- Prevents stale JS chunks after deployments

---

*Architecture analysis: 2025-01-28*
