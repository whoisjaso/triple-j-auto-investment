---
phase: 06-rental-management-core
plan: 05
subsystem: ui
tags: [react, pdf, jspdf, signature, rental-agreement, legal, modal]

dependency_graph:
  requires:
    - phase: 06-02
      provides: RentalBooking, RentalCustomer TypeScript interfaces and rentalService.ts
    - phase: existing
      provides: pdfService.ts drawing primitives (drawHeader, drawSection, drawDataBox, drawSecurityBackground, drawFooter)
    - phase: existing
      provides: BillOfSaleModal pattern (portal, two-panel, preview iframe, download/print)
  provides:
    - SignatureCapture.tsx reusable digital signature component
    - RentalAgreementModal.tsx agreement review, signature, and PDF preview modal
    - generateRentalAgreementPDF function with RentalAgreementData interface
    - Multi-page branded PDF with 14 legal clauses
  affects: [06-03, 06-04, 06-06]

tech_stack:
  added:
    - react-signature-canvas (digital signature capture)
    - "@types/react-signature-canvas" (TypeScript definitions)
  patterns:
    - signature-capture-pattern
    - rental-agreement-pdf-pattern
    - dual-signing-flow-pattern
    - page-overflow-handling-pattern

key_files:
  created:
    - triple-j-auto-investment-main/components/admin/SignatureCapture.tsx
    - triple-j-auto-investment-main/components/admin/RentalAgreementModal.tsx
  modified:
    - triple-j-auto-investment-main/services/pdfService.ts
    - triple-j-auto-investment-main/package.json

decisions:
  - id: signature-canvas-responsive-width
    description: "Measure container width via ref for responsive signature canvas sizing"
    rationale: "react-signature-canvas needs explicit pixel width; container ref ensures it fills parent"
  - id: dual-signing-flow
    description: "Support both digital (captured in canvas) and manual (print-then-confirm) signing"
    rationale: "Per CONTEXT.md, not all customers can or want to sign on a screen"
  - id: graceful-storage-failure
    description: "Save signature_data to booking record even if Supabase Storage upload fails"
    rationale: "Signature is the critical artifact; PDF storage is secondary"
  - id: page-overflow-clause-handling
    description: "Estimate clause height before rendering; auto-add page if would exceed footer limit"
    rationale: "14 legal clauses span multiple pages; must not render into footer area"
  - id: per-page-footer-with-numbering
    description: "drawPageFooter adds page X of Y to each page after full document generation"
    rationale: "Multi-page agreement needs page numbers for legal reference"

metrics:
  duration: ~6 minutes
  completed: 2026-02-12
  tasks: 2/2
  lines_added: ~1930
---

# Phase 6 Plan 5: Rental Agreement System Summary

**One-liner:** Digital/manual signature capture, branded multi-page rental agreement PDF with 14 legal clauses, and two-panel review modal with live preview.

## What Was Built

### Task 1: SignatureCapture Component
- Installed `react-signature-canvas` and `@types/react-signature-canvas`
- Created `SignatureCapture.tsx` - reusable digital signature pad component
- Responsive canvas width (measures parent container via ref)
- White canvas background with black pen (min/max width for natural stroke feel)
- Three modes: active canvas, saved signature (with re-sign), disabled (static image)
- Accept/Clear buttons; base64 PNG output via `toDataURL('image/png')`
- Mobile touch support via `touch-action: none` CSS property

### Task 2: RentalAgreementModal & PDF Generator

**generateRentalAgreementPDF (pdfService.ts):**
- `RentalAgreementData` interface: 22 fields covering booking, vehicle, customer, terms, signature
- Page 1: Branded header, agreement info, lessor/lessee details, vehicle description, rental terms
- Pages 2-3: 14 numbered legal clauses with auto page-break handling
- Clauses cover: use restrictions, geographic limits, authorized drivers, insurance, liability, accident procedures, maintenance, return conditions, late fees, vehicle condition, indemnification, termination, governing law, entire agreement
- Signature page: acknowledgment text, lessee signature image embed, lessor blank line
- Per-page footer with page numbering (X of Y)
- Reuses all existing pdfService.ts primitives: drawHeader, drawSection, drawDataBox, drawSecurityBackground

**RentalAgreementModal.tsx (697 lines):**
- Portal modal following BillOfSaleModal pattern (dark theme, two-panel layout)
- Left panel: auto-populated agreement summary (customer, vehicle, terms, authorized drivers, geographic restrictions)
- Left panel: SignatureCapture component for digital signing
- Left panel: "Print for Manual Signature" button + "Signed manually" checkbox confirmation
- Left panel: "I confirm customer reviewed all terms" checkbox gate
- Right panel: Live PDF preview in iframe (regenerates when signature captured)
- Right panel: Print and Download buttons
- On completion: generates final PDF with embedded signature, uploads to Supabase Storage (`rental-agreements/{bookingId}/agreement.pdf`), updates booking record
- Graceful fallback: if storage upload fails, still saves signature_data to booking

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

- The `generateRentalAgreementPDF` returns a `jsPDF` instance (not a blob URL or void) so the modal can call both `.output('bloburl')` for preview and `.output('blob')` for storage upload
- `formatCurrencyNum` helper added (accepts number vs existing `formatCurrency` which accepts string) to avoid type mismatches in the rental agreement
- `drawPageFooter` is a new helper (separate from `drawFooter`) that includes page numbering; it is called after all pages are rendered using `doc.setPage(i)` loop
- `FOOTER_LIMIT` constant (PAGE_HEIGHT - 28) defines the maximum Y position before content would overlap the footer

## Verification Results

- `react-signature-canvas` in package.json dependencies
- SignatureCapture outputs base64 PNG via toDataURL
- Agreement PDF reuses drawHeader, drawSection, drawDataBox primitives
- PDF contains all 14 legal clauses
- RentalAgreementModal supports both digital and print-for-manual-signature flows
- PDF preview renders in iframe
- Build passes with `npx tsc --noEmit` (no new errors)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 6021df7 | SignatureCapture component with react-signature-canvas |
| 2 | ea0d61a | RentalAgreementModal and PDF generator |

## Next Phase Readiness

- SignatureCapture is reusable and can be imported by any admin component
- RentalAgreementModal can be integrated into the booking management UI (06-03/06-04)
- The "Sign & Complete" flow updates the booking's `agreement_signed`, `agreement_pdf_url`, and `signature_data` columns
- Supabase Storage bucket `rental-agreements` must be created before the upload will work
