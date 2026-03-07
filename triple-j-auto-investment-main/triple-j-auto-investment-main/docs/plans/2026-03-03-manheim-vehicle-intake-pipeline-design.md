# Design: Automated Manheim Vehicle Intake Pipeline

**Date:** 2026-03-03
**Status:** Approved

## Problem

Vehicles bought on Manheim are manually typed into Google Sheets, which syncs to the website. At scale ($500K/month, ~100+ vehicles/month), this manual step is a bottleneck and Google Sheets as a source of truth is a liability.

## Solution

Automated pipeline: Manheim purchase → Supabase (direct) → website. Two phases: email-triggered (immediate, no API needed) then Manheim API (richer data, after approval).

## Architecture

### Phase 1: Email-Triggered Pipeline (No API needed)

```
Manheim purchase confirmation email
     ↓
Gmail → Google Apps Script (trigger on new email)
     ↓
Parse VIN + purchase price from email body
     ↓
Supabase Edge Function (vehicle-intake)
     ↓
AI enrichment pipeline:
  • NHTSA API → VIN decode → year, make, model, trim, engine, body
  • Gemini → identity headline (en + es)
  • Gemini → vehicle story (en + es)
  • Gemini → listing description (en + es)
  • Market estimate calculation (existing heuristic)
  • Suggested listing price (cost + target margin)
  • Auto-generate slug
     ↓
INSERT to vehicles table (status = 'Draft')
     ↓
Admin panel: review draft → add photos → set price → Publish → live
```

### Phase 2: Manheim API (After approval)

Swap email parser for Manheim API polling. Same enrichment pipeline, plus:
- Auction photos → vehicle gallery
- Condition report → diagnostics array
- CR score → auto-verify threshold

## New Vehicle Status: Draft

- `Draft | Available | Pending | Sold | Wholesale`
- Draft vehicles hidden from public website (RLS filters them out)
- Visible only in admin panel with "Draft" badge
- Admin reviews, edits, adds photos, then publishes to Available

## Mobile-First Photo Upload

### UX Principles

- Camera-first on mobile (Take Photo primary, Choose from Library secondary)
- Bulk select up to 15 photos from gallery, parallel upload with individual progress
- Hero image = first photo in grid; drag-to-reorder with long-press gesture
- Quick capture: camera icon on draft cards skips to photo upload directly
- Proportional grid layout — photos display at consistent aspect ratio

### Technical

- Supabase Storage bucket for vehicle photos
- Client-side compression: cap 1200px wide, JPEG 80% quality (4-8MB → 150-300KB)
- Direct upload via signed URL (no Edge Function for binary data)
- 400px thumbnails generated on upload for fast grid rendering
- `vehicles.gallery` JSONB stores Supabase Storage URLs
- `vehicles.image_url` always mirrors `gallery[0]`

### Components

| Component | Purpose |
|-----------|---------|
| VehiclePhotoUploader | Camera button, gallery picker, drag-drop zone, progress bars |
| PhotoGrid | Sortable thumbnail grid with drag-reorder, delete, hero indicator |
| QuickPhotoButton | Camera icon on draft cards for skip-to-upload shortcut |
| Image compression util | Client-side resize/compress before upload |

## New Components

### Google Apps Script (Phase 1 trigger)
- Watches Gmail for Manheim purchase confirmation emails
- Parses VIN and purchase price from email body
- Calls vehicle-intake Edge Function webhook
- Deduplicates (won't fire twice for same VIN)

### `vehicle-intake` Edge Function
- Receives `{ vin, purchasePrice, source: 'manheim' }`
- NHTSA VIN decode → full specs
- Gemini AI → headline, story, description (en + es)
- Market estimate + suggested listing price
- Slug generation
- INSERT with status = 'Draft', dedup on VIN

### Admin Panel Enhancements
- Drafts filter/tab with count badge
- Publish button (Draft → Available)
- Mobile-first photo upload with camera integration
- Quick photo button on draft vehicle cards

## Data Flow for a Single Vehicle

1. Win 2019 Honda Accord on Manheim for $3,200
2. Purchase confirmation email arrives
3. Apps Script fires, extracts VIN + price
4. Edge Function: NHTSA decode → specs, Gemini → AI content, compute estimates
5. Draft inserted in Supabase
6. Open admin on phone, see "1 new draft"
7. Tap camera icon, take 5-10 photos at the lot
8. Photos compress + upload automatically
9. Reorder, set hero image
10. Review AI content, adjust price to $4,500
11. Publish → live on website

## What Stays the Same

- Existing Google Sheets sync remains as legacy fallback (not removed)
- Admin manual add works for non-Manheim vehicles
- All website display, search, filtering unchanged
- AI generation, market estimate, slug reuse existing services

## What Changes

| Component | Change |
|-----------|--------|
| Vehicle status enum | Add `Draft` |
| RLS policies | Filter out `Draft` from public queries |
| Admin Inventory page | Drafts tab, Publish button, photo upload, draft count |
| New Edge Function | `vehicle-intake` |
| New Apps Script | Gmail trigger for Manheim emails |
| types.ts | Add `Draft` to VehicleStatus |
| Supabase Storage | New `vehicle-photos` bucket with upload policies |

## Scaling Considerations

- Manheim is primary source (95%+); admin form handles rare non-Manheim purchases
- Google Sheets relegated to optional read-only export for accounting
- Supabase is single source of truth
- Architecture supports swapping email trigger for API with zero downstream changes
