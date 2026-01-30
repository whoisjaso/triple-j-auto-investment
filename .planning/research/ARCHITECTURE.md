# Architecture Patterns for Milestone Features

**Domain:** Dealership operations platform - new feature integration
**Researched:** 2025-01-29
**Confidence:** HIGH (based on existing codebase analysis + verified patterns)

## Executive Summary

The existing architecture (React 19 SPA + Supabase) can accommodate all three new features without major structural changes. However, the monolithic Store.tsx (892 lines) is a critical bottleneck that must be addressed to safely add new features. The recommended approach is **progressive decomposition** - split the Store while adding features, rather than refactoring first.

Key architectural decisions:
1. **Customer Portal**: Same SPA with route-based separation, NOT a separate app
2. **Document Validation**: New service module, minimal Store changes
3. **Rental Management**: Extend existing Vehicle model, new context slice for rentals

## Current Architecture Assessment

### What Works Well

```
[Browser] --> [React SPA / HashRouter]
                    |
         +-------------------+
         |                   |
    [Public Pages]     [Admin Pages]
         |                   |
         +-------------------+
                    |
              [StoreContext]  <-- Single source of truth
                    |
         +-------------------+
         |                   |
    [Services]         [Supabase]
    (Email, AI)        (Auth, DB, RT)
```

**Strengths:**
- Single deployment artifact
- Real-time subscriptions working
- Auth flow established
- PDF generation patterns proven

### What Needs Addressing

| Issue | Impact on New Features | Priority |
|-------|------------------------|----------|
| Store.tsx monolith (892 lines) | Adding rental state will make it unmaintainable | HIGH |
| No customer auth separate from admin | Customer portal needs different access pattern | HIGH |
| RLS silent failures | Document uploads could fail silently | MEDIUM |
| No test coverage | Risky to modify shared components | MEDIUM |

## Recommended Architecture

### Component Boundaries

```
triple-j-auto-investment-main/
├── App.tsx                    # Router, providers (unchanged)
├── context/
│   ├── AuthContext.tsx        # NEW: Split from Store - auth only
│   ├── VehicleContext.tsx     # NEW: Split from Store - vehicles + inventory
│   ├── RentalContext.tsx      # NEW: Rental-specific state
│   ├── RegistrationContext.tsx # NEW: Registration tracking state
│   └── Store.tsx              # DEPRECATED: Facade for backward compatibility
├── services/
│   ├── documentValidationService.ts  # NEW: Registration checker logic
│   ├── rentalService.ts              # NEW: Rental CRUD
│   └── [existing services]
├── pages/
│   ├── portal/                # NEW: Customer-facing pages
│   │   ├── RegistrationStatus.tsx    # Replaces RegistrationTracker
│   │   ├── CustomerLogin.tsx         # Customer auth
│   │   └── DocumentUpload.tsx        # Customer uploads
│   ├── admin/
│   │   ├── RegistrationChecker.tsx   # NEW: Validation tool
│   │   ├── RentalCalendar.tsx        # NEW: Availability view
│   │   └── [existing admin pages]
│   └── [existing public pages]
└── hooks/
    ├── useRentalAvailability.ts      # NEW: Calendar logic
    └── useDocumentValidation.ts      # NEW: Validation logic
```

### Data Flow

#### Customer Portal Flow

```
Customer Access:
[Unique Link: /portal/track/TJ-2024-0001]
              |
              v
   [Route Guard: OrderIDContext]
              |
              v
    [RegistrationStatus.tsx]
              |
              v
  [registrationService.ts] --> [Supabase: registrations table]
              |                        |
              v                        v
     [Real-time updates]       [RLS: anon role can SELECT
                                where order_id matches]
```

**Key Insight:** The existing `RegistrationTracker.tsx` already uses order_id lookup without requiring auth. This pattern is correct for customer access - extend it, don't change it.

#### Document Validation Flow

```
Admin triggers validation:
[RegistrationChecker.tsx]
         |
         v
[documentValidationService.ts]
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
[Title] [130-U] [Affidavit] [Inspection] [Cross-checks]
    |    |    |    |    |
    +----+----+----+----+
         |
         v
   [Validation Report]
   - Missing fields
   - VIN mismatches
   - Date inconsistencies
   - Name variations
```

**No Supabase needed** for validation - it's pure business logic operating on document data already in the system.

#### Rental Management Flow

```
[RentalContext.tsx]
         |
    +----+----+
    |         |
    v         v
[Rentals]  [Availability]
    |         |
    v         v
[rentalService.ts] --> [Supabase: rentals table]
    |                          |
    v                          v
[VehicleContext]        [Real-time subscription]
(extends vehicle          (calendar updates)
 with rental_status)
```

## Database Schema Extensions

### registrations Table (Existing - Enhance)

```sql
-- Current schema works for customer portal
-- Add columns for document tracking:
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  documents_received JSONB DEFAULT '{
    "title_front": false,
    "title_back": false,
    "form_130u": false,
    "affidavit": false,
    "inspection": false,
    "insurance": false
  }';

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  validation_status TEXT DEFAULT 'pending';  -- pending, passed, failed

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  validation_errors JSONB DEFAULT '[]';
```

### vehicles Table (Existing - Extend for Rentals)

```sql
-- Add rental-related columns to existing vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS
  is_rentable BOOLEAN DEFAULT false;

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS
  rental_daily_rate DECIMAL(10,2);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS
  rental_status TEXT DEFAULT 'available';  -- available, rented, maintenance

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS
  lojack_device_id TEXT;  -- For GPS tracking integration
```

### rentals Table (New)

```sql
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Customer info (not linked to auth.users - external customers)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_license_number TEXT,
  customer_address TEXT,

  -- Rental period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE,

  -- Financial
  daily_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_status TEXT DEFAULT 'pending',  -- pending, collected, returned, forfeited

  -- Status
  status TEXT DEFAULT 'reserved',  -- reserved, active, completed, cancelled

  -- Mileage tracking
  start_mileage INTEGER,
  end_mileage INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for availability queries
CREATE INDEX idx_rentals_vehicle_dates ON rentals(vehicle_id, start_date, end_date);
CREATE INDEX idx_rentals_status ON rentals(status);
```

### RLS Policies

```sql
-- Customer portal: Anyone can view their registration by order_id
-- (Already exists in current schema - verify it works)
CREATE POLICY "anon_select_by_order_id" ON registrations
  FOR SELECT
  TO anon
  USING (true);  -- Filter happens in query with order_id

-- Rentals: Admin only (authenticated + is_admin)
CREATE POLICY "admin_all_rentals" ON rentals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Vehicles rental fields: Admin can update
CREATE POLICY "admin_update_vehicles" ON vehicles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

## Authentication Architecture

### Current Pattern (Keep)

```
Admin Auth:
[Login Page] --> [authService.login()]
                        |
                        v
               [Supabase Auth]
                        |
                        v
               [profiles.is_admin check]
                        |
                        v
               [StoreContext.user = { isAdmin: true }]
```

### Customer Portal Access (New - No Auth Required)

```
Customer Access (Recommended):
[Unique Link with Order ID]
         |
         v
   [Route: /portal/track/:orderId]
         |
         v
   [OrderIDContext - stores orderId in memory]
         |
         v
   [registrationService.getRegistrationByOrderId()]
         |
         v
   [RLS allows anon SELECT on registrations]
         |
         v
   [Display registration status]
```

**Why no customer login for MVP:**
1. The order ID is already a unique, hard-to-guess identifier (format: TJ-2024-XXXX)
2. Customers only need read access to their own registration
3. Adding customer auth adds complexity with minimal security benefit for this use case
4. Can add optional customer login later without breaking the link-based access

### Future: Optional Customer Login

If customer login is needed later:
```sql
-- Add customer_user_id to registrations (nullable)
ALTER TABLE registrations ADD COLUMN customer_user_id UUID REFERENCES auth.users(id);

-- RLS policy for logged-in customers
CREATE POLICY "customer_select_own" ON registrations
  FOR SELECT
  TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR order_id = current_setting('app.current_order_id', true)
  );
```

## Store.tsx Decomposition Strategy

### Phase 1: Extract Auth (During Customer Portal Work)

**Before:**
```tsx
// Store.tsx (892 lines)
const StoreProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  // ... 800+ more lines
}
```

**After:**
```tsx
// AuthContext.tsx (NEW - ~150 lines)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Move: login, logout, getSession, onAuthStateChange
  // Move: session verification in useEffect

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Store.tsx (MODIFIED - now ~700 lines)
export const StoreProvider = ({ children }) => {
  const { user } = useAuth(); // Use new AuthContext
  // ... vehicles, leads, etc stay here for now
};
```

### Phase 2: Extract Vehicles (During Rental Work)

```tsx
// VehicleContext.tsx (NEW - ~300 lines)
export const VehicleProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Move: loadVehicles, addVehicle, updateVehicle, removeVehicle
  // Move: syncWithGoogleSheets
  // Move: real-time subscription for vehicles

  return (
    <VehicleContext.Provider value={{ vehicles, isLoading, /* CRUD methods */ }}>
      {children}
    </VehicleContext.Provider>
  );
};
```

### Phase 3: Add Rental Context (New Feature)

```tsx
// RentalContext.tsx (NEW - ~200 lines)
export const RentalProvider = ({ children }) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});

  // New: loadRentals, createRental, updateRental, completeRental
  // New: calculateAvailability(vehicleId, dateRange)
  // New: real-time subscription for rentals

  return (
    <RentalContext.Provider value={{ rentals, availability, /* methods */ }}>
      {children}
    </RentalContext.Provider>
  );
};
```

### Provider Composition (App.tsx)

```tsx
// App.tsx
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <VehicleProvider>
          <RentalProvider>
            <RegistrationProvider>
              <Router>
                <AppContent />
              </Router>
            </RegistrationProvider>
          </RentalProvider>
        </VehicleProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
```

## Build Order (Dependencies)

### Suggested Phase Structure

```
Phase 1: Foundation + Customer Portal
├── Extract AuthContext from Store.tsx
├── Create RegistrationContext (refactor existing registration logic)
├── Build customer portal pages (/portal/*)
├── RLS verification for anon access
└── Deliverable: Customers can track registration via link

Phase 2: Document Validation
├── Create documentValidationService.ts
├── Build RegistrationChecker admin page
├── Add documents_received column to registrations
├── No context changes needed
└── Deliverable: Admin can validate docs before webDealer submission

Phase 3: Rental Management
├── Extract VehicleContext from Store.tsx
├── Extend vehicles table with rental columns
├── Create rentals table
├── Create RentalContext
├── Build rental admin pages (calendar, agreements)
├── Integrate LoJack API (separate service)
└── Deliverable: Full rental workflow operational
```

### Dependency Graph

```
                    [AuthContext]
                         |
            +------------+------------+
            |            |            |
            v            v            v
    [VehicleContext] [RentalContext] [RegistrationContext]
            |            |            |
            +------------+------------+
                         |
                         v
                   [Services Layer]
                         |
            +------------+------------+
            |            |            |
            v            v            v
       [Supabase]   [LoJack API]  [EmailJS]
```

## Addressing Technical Debt During Development

### RLS Silent Failure Pattern

**Current Problem:**
```tsx
// Store.tsx - update returns empty array silently when RLS blocks
const { data, error } = await supabase.from('vehicles').update(dbUpdate).eq('id', id).select();
if (!data || data.length === 0) {
  // RLS blocked but no error - confusing
}
```

**Fix (Apply During Phase 1):**
```tsx
// Add explicit session verification before every write operation
const verifyAdminSession = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('SESSION_EXPIRED');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('NOT_ADMIN');
  }

  return true;
};

// Use in all write operations
const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
  try {
    await verifyAdminSession();
    const { data: result, error } = await supabase
      .from('vehicles')
      .update(transformToSnakeCase(data))
      .eq('id', id)
      .select()
      .single(); // Use .single() to get clear error if nothing updated

    if (error) throw error;
    return result;
  } catch (err) {
    // Clear error handling
    if (err.message === 'SESSION_EXPIRED') {
      // Redirect to login
    } else if (err.message === 'NOT_ADMIN') {
      // Show permission error
    }
    throw err;
  }
};
```

### API Keys in Frontend

**Current State:** Gemini and Retell keys exposed in bundle

**Recommendation:** Address in Phase 2 when adding document validation

```tsx
// Move AI calls to Supabase Edge Function
// supabase/functions/validate-document/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

Deno.serve(async (req) => {
  const { documentData } = await req.json();

  // API key stored in Supabase secrets, not in client bundle
  const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
  // ... validation logic
});
```

## Anti-Patterns to Avoid

### 1. Separate Customer SPA

**Don't:**
```
/customer-portal/  <-- Separate React app
/admin/           <-- Main app
```

**Why:** Doubles build complexity, deployment, and shared code management.

**Do:** Same SPA, route-based separation with different layouts.

### 2. Customer Auth Table

**Don't:**
```sql
CREATE TABLE customer_users (
  id UUID PRIMARY KEY,
  email TEXT,
  password_hash TEXT
);
```

**Why:** Duplicates Supabase Auth, creates security maintenance burden.

**Do:** Use order_id as implicit auth for MVP. If login needed later, use Supabase Auth with role metadata.

### 3. Monolithic Rental Entity

**Don't:**
```tsx
interface Vehicle {
  // ... existing fields
  rentals: Rental[];           // Deeply nested
  availability: boolean[];     // Computed in entity
  currentRenter: Customer;     // Circular reference
}
```

**Why:** Creates tight coupling, makes queries expensive.

**Do:** Separate rentals table with vehicle_id foreign key, compute availability on demand.

### 4. Global State for Everything

**Don't:**
```tsx
const GlobalContext = createContext({
  vehicles: [],
  rentals: [],
  registrations: [],
  documents: [],
  users: [],
  // ... 20 more fields
});
```

**Why:** Every state change re-renders everything.

**Do:** Split contexts by domain, components subscribe only to what they need.

## Scalability Considerations

| Concern | Current (10 vehicles) | At 100 vehicles | At 500 rentals/year |
|---------|----------------------|-----------------|---------------------|
| Vehicle list load | <100ms | 200-500ms | N/A |
| Rental availability calc | N/A | <200ms | 500ms-1s |
| Real-time subscriptions | 2 channels | 4-5 channels | Monitor quota |
| PDF generation | <2s | <2s | <2s per doc |
| Storage (documents) | <1GB | <5GB | 10-50GB (upgrade plan) |

**Mitigation strategies:**
- Pagination for vehicle lists (implement when > 50 vehicles)
- Date-range filtering for rentals (implement from start)
- Lazy load rental history (only on demand)
- Consider Supabase Storage for document uploads (built-in CDN)

## Sources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [How to write performant React apps with Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context)
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Setting Up Row-Level Security in Supabase for User and Admin Roles](https://dev.to/shahidkhans/setting-up-row-level-security-in-supabase-user-and-admin-2ac1)

---

*Architecture research: 2025-01-29*
