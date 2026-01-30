# Technology Stack

**Project:** Triple J Auto Investment - Milestone 2 Features
**Researched:** 2025-01-29
**Mode:** Ecosystem (stack dimension)

## Executive Summary

This research covers the technology stack needed to add three feature areas to the existing React 19 + Supabase dealership platform:

1. **Customer Registration Portal** - Progress tracker with animations
2. **Document Validation System** - PDF parsing and cross-document checks
3. **Rental Management** - Availability calendar with LoJack GPS integration

The existing stack (React 19.2, Supabase, framer-motion 12.x, pdf-lib, Vite) provides a strong foundation. Key additions needed are minimal due to existing dependencies. The main gap is LoJack integration, which requires direct contact with Spireon for API access.

---

## Existing Stack (Confirmed from package.json)

| Technology | Current Version | Status |
|------------|-----------------|--------|
| React | 19.2.0 | Current |
| TypeScript | 5.8.2 | Current |
| Supabase JS | 2.87.1 | Current |
| framer-motion | 12.23.26 | Current (React 19 compatible) |
| pdf-lib | 1.17.1 | Current |
| jsPDF | 3.0.4 | Current |
| Vite | 6.2.0 | Current |
| react-router-dom | 7.9.6 | Current |
| Tailwind CSS | 3.4.19 | Current |

**Assessment:** The existing stack is well-maintained and current. Framer-motion v12 already supports React 19 with improved layout animations.

---

## Feature 1: Customer Registration Portal

### Animation Stack

**Recommendation: Use existing framer-motion (now "Motion")**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| framer-motion | 12.23.26 (existing) | Progress tracker animations | HIGH |

**Rationale:**
- Already installed and working in the codebase
- v11+ added "improved Layout Animations with more reliable handling of complex layout transitions, especially in React 19 projects with concurrent rendering" ([Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide))
- 12+ million monthly downloads, actively maintained
- `useScroll` hook available for progress bar animations
- Variants API for orchestrating multi-step animations

**What NOT to use:**
- **GSAP** - Already in the project but adds complexity for this use case. Framer-motion handles progress trackers better with less code.
- **CSS-only animations** - Harder to coordinate with state changes
- **react-spring** - Different paradigm, would add learning curve

**Implementation Pattern:**
```typescript
// Progress tracker with framer-motion
import { motion, AnimatePresence } from "framer-motion"

const stages = ["Sale Complete", "Documents Needed", "All Received", "Submitted", "Processing", "Complete"]

// Use variants for step-by-step reveal
const stepVariants = {
  inactive: { scale: 0.8, opacity: 0.5 },
  active: { scale: 1, opacity: 1, transition: { type: "spring" } },
  complete: { scale: 1, opacity: 1, backgroundColor: "#22c55e" }
}
```

### Unique Link Generation

**Recommendation: nanoid**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| nanoid | 5.1.6 | Short, URL-safe unique IDs for customer portal links | HIGH |

**Rationale:**
- 118 bytes minified - negligible bundle impact
- URL-safe by default (A-Za-z0-9_-)
- Cryptographically secure (uses Web Crypto API)
- 21-character IDs have UUID v4 collision probability
- Can customize length: `nanoid(10)` for shorter URLs

**Source:** [nanoid GitHub](https://github.com/ai/nanoid)

**What NOT to use:**
- **UUID** - Too long for shareable URLs (36 chars vs 10-21)
- **shortid** - Deprecated in favor of nanoid
- **Custom random strings** - Security concerns with Math.random()

**Implementation Pattern:**
```typescript
import { nanoid } from 'nanoid'

// Generate 12-char portal access token
const portalToken = nanoid(12) // e.g., "V1StGXR8_Z5j"

// Store in Supabase registrations table
// Customer accesses: /portal/{token}
```

### Real-time Status Updates

**Recommendation: Use existing Supabase Realtime**

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| @supabase/supabase-js | 2.87.1 (existing) | Real-time subscription for status changes | HIGH |

**Rationale:**
- Already integrated in the codebase
- Postgres Changes feature listens to database updates
- No additional dependencies needed
- Works with existing RLS policies

**Source:** [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

**Implementation Pattern:**
```typescript
// Customer portal subscription
const channel = supabase
  .channel('registration-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'registrations',
    filter: `portal_token=eq.${token}`
  }, (payload) => {
    setStatus(payload.new.status)
  })
  .subscribe()
```

---

## Feature 2: Document Validation System

### PDF Text Extraction

**Recommendation: pdfjs-dist**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| pdfjs-dist | 5.4.530 | Extract text content from uploaded PDFs | HIGH |

**Rationale:**
- Maintained by Mozilla, 5.9M+ weekly downloads
- Extracts text with position data for field validation
- Works in browser (no server required)
- pdf-lib (existing) creates/modifies PDFs but cannot extract text
- "When precision rules, pdfjs-dist delivers" ([Strapi PDF Libraries Guide](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025))

**Source:** [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist)

**What NOT to use:**
- **pdf-lib alone** - Cannot extract text from existing PDFs, only create/modify
- **pdf-parse** - Wrapper around pdfjs-dist, adds unnecessary abstraction
- **pdf2json** - Overkill for field extraction, designed for structural analysis

**Implementation Pattern:**
```typescript
import * as pdfjsLib from 'pdfjs-dist'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const texts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    texts.push(pageText)
  }
  return texts
}
```

### Form Field Reading (from pdf-lib)

**Use existing pdf-lib for form fields**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| pdf-lib | 1.17.1 (existing) | Read form field values from fillable PDFs | HIGH |

**Rationale:**
- Already installed
- Can read form fields: `pdfDoc.getForm().getFields()`
- Good for checking if 130-U fields are filled correctly
- Complements pdfjs-dist (form fields vs text extraction)

**Source:** [pdf-lib Form Docs](https://pdf-lib.js.org/docs/api/classes/pdfform)

**Implementation Pattern:**
```typescript
import { PDFDocument } from 'pdf-lib'

async function validateFormFields(pdfBytes: Uint8Array) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  const fieldData: Record<string, string> = {}
  fields.forEach(field => {
    const name = field.getName()
    if (field.constructor.name === 'PDFTextField') {
      fieldData[name] = (field as PDFTextField).getText() || ''
    }
  })
  return fieldData
}
```

### Cross-Document Validation Schema

**Recommendation: Zod**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| zod | 3.24.x | Schema validation for document consistency checks | HIGH |

**Rationale:**
- TypeScript-first with automatic type inference
- Composable schemas for cross-field validation
- Works with React Hook Form via @hookform/resolvers/zod
- "Bridges the gap between compile-time type safety and runtime validation" ([Zod Docs](https://zod.dev/))
- 40M+ weekly downloads

**What NOT to use:**
- **Yup** - Less TypeScript-native, larger bundle
- **Joi** - Server-focused, heavy for client-side
- **Manual validation** - Error-prone, no type inference

**Implementation Pattern:**
```typescript
import { z } from 'zod'

const DocumentSchema = z.object({
  vin: z.string().length(17, "VIN must be 17 characters"),
  mileage: z.number().positive(),
  buyerName: z.string().min(1),
  sellerName: z.string().min(1),
  saleDate: z.date(),
})

// Cross-document consistency check
const RegistrationPacketSchema = z.object({
  title: DocumentSchema,
  form130U: DocumentSchema,
  billOfSale: DocumentSchema,
}).refine(
  (data) => data.title.vin === data.form130U.vin && data.form130U.vin === data.billOfSale.vin,
  { message: "VIN mismatch across documents" }
).refine(
  (data) => data.title.mileage <= data.form130U.mileage,
  { message: "Mileage on 130-U cannot be less than title mileage" }
)
```

---

## Feature 3: Rental Management

### Availability Calendar

**Recommendation: react-day-picker**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| react-day-picker | 9.13.0 | Vehicle availability display and date selection | HIGH |

**Rationale:**
- 6M+ weekly downloads, foundation for shadcn calendar
- Native disabled date support for blocked periods
- Range selection for rental periods
- Lightweight compared to full schedulers
- Works with date-fns (recommended pairing)
- "Powers a massive chunk of the modern React calendar ecosystem" ([Builder.io](https://www.builder.io/blog/best-react-calendar-component-ai))

**Source:** [React DayPicker](https://daypicker.dev/)

**What NOT to use:**
- **FullCalendar** - Resource scheduling requires paid Premium license
- **react-big-calendar** - Overkill for rental availability display
- **Syncfusion/DHTMLX** - Enterprise pricing, complex setup
- **Custom calendar** - Reinventing the wheel

**Implementation Pattern:**
```typescript
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

function VehicleAvailability({ vehicleId, bookedDates }: Props) {
  // bookedDates: Array of { from: Date, to: Date }
  const disabledDays = bookedDates.map(b => ({ from: b.from, to: b.to }))

  return (
    <DayPicker
      mode="range"
      disabled={[
        ...disabledDays,
        { before: new Date() } // Can't book in the past
      ]}
      onSelect={(range) => handleRangeSelect(range)}
    />
  )
}
```

### Date Utilities

**Recommendation: date-fns**

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| date-fns | 4.1.x | Date manipulation for rental calculations | HIGH |

**Rationale:**
- 40M+ weekly downloads, actively maintained
- Tree-shakeable - only import what you use
- Functional programming style (immutable)
- Required by react-day-picker
- "When precision rules... Master its API once" ([npm compare](https://npm-compare.com/date-fns,dayjs,moment))

**What NOT to use:**
- **Moment.js** - Deprecated, large bundle, mutable
- **dayjs** - Good alternative but date-fns pairs better with react-day-picker

**Implementation Pattern:**
```typescript
import { addDays, differenceInDays, isWithinInterval, format } from 'date-fns'

function calculateRentalDays(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1
}

function isDateAvailable(date: Date, bookedRanges: DateRange[]): boolean {
  return !bookedRanges.some(range =>
    isWithinInterval(date, { start: range.from, end: range.to })
  )
}
```

### LoJack GPS Integration

**Assessment: API Access Required**

| Integration | Status | Confidence |
|-------------|--------|------------|
| Spireon LoJack API | Requires direct contact | LOW |

**What We Found:**

1. **Official API exists**: Spireon provides a developer API at [api.spireon.com/doc](https://api.spireon.com/doc)
2. **No public documentation**: The API requires authentication; documentation is not publicly accessible
3. **Dealer solutions available**: Spireon offers GoldStar for BHPH dealers and Kahu for lot management
4. **Unofficial OpenAPI specs**: An unofficial Python package ([lojack-clients on PyPI](https://pypi.org/project/lojack-clients/)) documents the API structure

**Identified API Services (from unofficial docs):**
- Identity service (authentication)
- Automotive service (vehicle data)
- Maintenance service
- Services endpoint

**Recommended Approach:**
1. Contact Spireon sales/support for dealer API access
2. Request API documentation and authentication credentials
3. If API unavailable, consider manual dashboard integration via iframe or status sync

**Alternative if API Unavailable:**
- Embed LoJack dashboard link in admin interface
- Manual GPS coordinate entry
- Alternative GPS tracker with open API (e.g., Traccar, GPS Trackit)

**What NOT to do:**
- Scrape the LoJack mobile app API (security violation, unstable)
- Assume API structure from unofficial docs without verification
- Build dependency on integration before confirming API access

---

## Installation Summary

### New Dependencies

```bash
# Document validation
npm install pdfjs-dist@5.4.530 zod@3.24.2

# Rental management
npm install react-day-picker@9.13.0 date-fns@4.1.0

# Customer portal
npm install nanoid@5.1.6
```

### Total New Dependencies: 5

| Package | Size (unpacked) | Purpose |
|---------|-----------------|---------|
| pdfjs-dist | ~15 MB | PDF text extraction |
| zod | ~700 KB | Schema validation |
| react-day-picker | ~300 KB | Calendar component |
| date-fns | ~22 MB (tree-shakeable) | Date utilities |
| nanoid | ~25 KB | Unique ID generation |

**Note:** date-fns is large unpacked but tree-shakeable. Only imported functions are bundled.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Animation | framer-motion (existing) | react-spring, GSAP | Already installed, simpler API |
| PDF extraction | pdfjs-dist | pdf-parse, unpdf | Most mature, Mozilla-maintained |
| Calendar | react-day-picker | react-big-calendar, FullCalendar | Simpler, MIT license, no premium features needed |
| Date utils | date-fns | dayjs | Better tree-shaking, pairs with react-day-picker |
| Validation | zod | yup, joi | TypeScript-native, smaller bundle |
| Short IDs | nanoid | uuid, shortid | URL-safe, secure, tiny |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Animation (Motion) | HIGH | Verified in existing package.json, v12 React 19 support confirmed |
| PDF extraction (pdfjs-dist) | HIGH | Official Mozilla library, 5.9M weekly downloads, verified docs |
| Calendar (react-day-picker) | HIGH | 6M+ downloads, official docs verified, v9 current |
| Date utilities (date-fns) | HIGH | 40M+ downloads, required by react-day-picker |
| Validation (zod) | HIGH | Industry standard, official docs verified |
| Unique IDs (nanoid) | HIGH | 15K+ dependents, active maintenance |
| LoJack API | LOW | No public documentation; requires direct Spireon contact |

---

## Sources

### Animation
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) - React 19 compatibility, rebranding info
- [framer-motion npm](https://www.npmjs.com/package/framer-motion) - Version 12.27.0 current

### PDF Processing
- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist) - Version 5.4.530
- [pdf-lib Documentation](https://pdf-lib.js.org/) - Form field API
- [7 PDF Parsing Libraries for Node.js](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) - Comparison guide

### Calendar & Scheduling
- [React DayPicker](https://daypicker.dev/) - Official documentation
- [React Calendar Components Comparison](https://www.builder.io/blog/best-react-calendar-component-ai) - 2025 comparison
- [date-fns vs dayjs](https://npm-compare.com/date-fns,dayjs,moment) - Performance comparison

### Validation
- [Zod Documentation](https://zod.dev/) - Official docs
- [Zod + React Hook Form](https://refine.dev/blog/zod-typescript/) - Integration guide

### Real-time & Auth
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - Official docs
- [nanoid GitHub](https://github.com/ai/nanoid) - Documentation and security

### LoJack/Spireon
- [Spireon Developer API](https://api.spireon.com/doc) - Login required
- [lojack-clients PyPI](https://pypi.org/project/lojack-clients/) - Unofficial OpenAPI specs
- [High Mobility LoJack](https://www.high-mobility.com/fleet-solutions/lojack) - Integration platform

---

## Open Questions

1. **LoJack API Access**: Dealer needs to contact Spireon to request API credentials and documentation. This is blocking for GPS integration.

2. **PDF Worker Configuration**: pdfjs-dist requires a web worker. Need to configure Vite to serve the worker file correctly.

3. **Date-fns Locale**: If Spanish rental agreements needed, confirm date-fns Spanish locale handling.

---

*Research completed: 2025-01-29*
