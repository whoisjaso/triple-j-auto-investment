# Manheim Vehicle Intake Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate the flow from Manheim vehicle purchase to website listing — email triggers intake, AI enriches content, photos upload from phone, admin reviews and publishes.

**Architecture:** A Google Apps Script watches Gmail for Manheim purchase confirmations, extracts VIN + price, calls a Supabase Edge Function that decodes the VIN (NHTSA), generates AI content (Gemini), computes pricing, and inserts the vehicle as a Draft. The admin reviews on their phone, uploads photos via a camera-first mobile UI backed by Supabase Storage, and publishes. No Google Sheets in the pipeline.

**Tech Stack:** Supabase (Edge Functions/Deno, Storage, Postgres), Google Apps Script, NHTSA API, Gemini 2.5 Flash, React/TypeScript/Tailwind

---

## Task 1: Database Migration — Draft Status + Vehicle Source Tracking

**Files:**
- Create: `triple-j-auto-investment-main/supabase/phase-20-migration.sql`

**Context:** The vehicles table has a CHECK constraint limiting status to `('Available', 'Pending', 'Sold', 'Wholesale')`. The public RLS policy only shows `Available` and `Pending`. We need to add `Draft` to the CHECK and ensure Draft is excluded from public view (already is — the RLS policy uses an allowlist, so Draft is automatically hidden).

**Step 1: Write the migration**

```sql
-- Phase 20: Manheim Vehicle Intake Pipeline
-- Adds Draft status, intake_source tracking, and vehicle-photos storage bucket

-- =============================================================================
-- 1. Add 'Draft' to vehicles status CHECK constraint
-- =============================================================================

-- Drop old constraint and re-create with Draft included
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('Available', 'Pending', 'Sold', 'Wholesale', 'Draft'));

-- =============================================================================
-- 2. Add intake source tracking columns
-- =============================================================================

-- Where this vehicle came from (manheim_email, manheim_api, manual, sheets)
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS intake_source TEXT DEFAULT 'manual';

-- Raw purchase price from auction (before any markup to listing price)
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);

-- Suggested listing price computed by intake pipeline
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10, 2);

-- Timestamp when vehicle was ingested by the automated pipeline
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS intake_at TIMESTAMPTZ;

-- =============================================================================
-- 3. Create vehicle-photos storage bucket
-- =============================================================================
-- NOTE: Run in Supabase Dashboard > Storage > New Bucket:
--   Name: vehicle-photos
--   Public: true (images are public listing photos)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage RLS policies (run in SQL Editor after bucket creation):
-- Allow authenticated users (admins) to upload
-- CREATE POLICY "Admins can upload vehicle photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'vehicle-photos'
--     AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
--   );

-- Allow public read access (photos are on public listings)
-- CREATE POLICY "Public can view vehicle photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'vehicle-photos');

-- Allow admins to delete photos
-- CREATE POLICY "Admins can delete vehicle photos"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'vehicle-photos'
--     AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
--   );

-- =============================================================================
-- 4. Index for filtering drafts efficiently
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_intake_source ON public.vehicles (intake_source);
```

**Step 2: Apply migration**

Run the SQL in Supabase Dashboard > SQL Editor (same process as all prior migrations). Then create the `vehicle-photos` storage bucket via Dashboard > Storage > New Bucket with the settings in the comments.

**Step 3: Commit**

```bash
git add triple-j-auto-investment-main/supabase/phase-20-migration.sql
git commit -m "feat(20): add Draft vehicle status, intake tracking columns, vehicle-photos bucket migration"
```

---

## Task 2: Update TypeScript Types — Draft Status + Intake Fields

**Files:**
- Modify: `triple-j-auto-investment-main/types.ts` (lines 2-7 for enum, lines 9-52 for interface)

**Step 1: Add DRAFT to VehicleStatus enum**

In `types.ts`, add `DRAFT` to the enum:

```typescript
export enum VehicleStatus {
  DRAFT = 'Draft',
  AVAILABLE = 'Available',
  PENDING = 'Pending',
  SOLD = 'Sold',
  WHOLESALE = 'Wholesale'
}
```

**Step 2: Add intake fields to Vehicle interface**

After `marketEstimate?: number;` (line 51), add:

```typescript
  // Phase 20: Vehicle Intake Pipeline
  intakeSource?: 'manheim_email' | 'manheim_api' | 'manual' | 'sheets';
  purchasePrice?: number;
  suggestedPrice?: number;
  intakeAt?: string;
```

**Step 3: Verify build passes**

Run: `cd triple-j-auto-investment-main && npx tsc --noEmit 2>&1 | head -20`

Expected: Type errors will appear for places that enumerate VehicleStatus exhaustively (status filters, switch statements). These are expected and will be fixed in Task 4.

**Step 4: Commit**

```bash
git add triple-j-auto-investment-main/types.ts
git commit -m "feat(20): add Draft status to VehicleStatus enum and intake fields to Vehicle interface"
```

---

## Task 3: Update Store — Draft Status in Vehicle CRUD

**Files:**
- Modify: `triple-j-auto-investment-main/lib/store/vehicles.ts`
- Modify: `triple-j-auto-investment-main/lib/store/sheets.ts` (status normalization)

**Step 1: Update addVehicle in vehicles.ts**

In the `addVehicle` function, the `dbVehicle` object construction maps camelCase to snake_case. Add the new intake fields to that mapping, after the existing Phase 14 fields:

```typescript
intake_source: vehicle.intakeSource || 'manual',
purchase_price: vehicle.purchasePrice || null,
suggested_price: vehicle.suggestedPrice || null,
intake_at: vehicle.intakeAt || null,
```

**Step 2: Update loadVehicles transform**

In the `loadVehicles` function where rows are mapped from snake_case to camelCase, add:

```typescript
intakeSource: row.intake_source,
purchasePrice: row.purchase_price,
suggestedPrice: row.suggested_price,
intakeAt: row.intake_at,
```

**Step 3: Update updateVehicle transform**

In the `updateVehicle` function where the `dbUpdate` object is built, add handling for the new fields:

```typescript
if (updatedVehicle.intakeSource !== undefined) dbUpdate.intake_source = updatedVehicle.intakeSource;
if (updatedVehicle.purchasePrice !== undefined) dbUpdate.purchase_price = updatedVehicle.purchasePrice;
if (updatedVehicle.suggestedPrice !== undefined) dbUpdate.suggested_price = updatedVehicle.suggestedPrice;
if (updatedVehicle.intakeAt !== undefined) dbUpdate.intake_at = updatedVehicle.intakeAt;
```

**Step 4: Update sheets.ts status normalization**

In `sheets.ts`, the `normalizeStatus` function maps strings to `VehicleStatus`. Add a `'draft'` case:

```typescript
case 'draft': return VehicleStatus.DRAFT;
```

This ensures any Google Sheet row with status "Draft" maps correctly (backward compatibility).

**Step 5: Commit**

```bash
git add triple-j-auto-investment-main/lib/store/vehicles.ts triple-j-auto-investment-main/lib/store/sheets.ts
git commit -m "feat(20): wire Draft status and intake fields through Store CRUD operations"
```

---

## Task 4: Admin Inventory — Draft Filter + Publish Button

**Files:**
- Modify: `triple-j-auto-investment-main/pages/admin/Inventory.tsx`

This is the largest UI task. Changes are isolated to the admin page — no customer-facing changes.

**Step 1: Add Draft count and filter state**

Near the top of `AdminInventory` component (around line 194), add a computed draft count:

```typescript
const draftCount = vehicles.filter(v => v.status === VehicleStatus.DRAFT).length;
```

**Step 2: Add "Drafts" filter option to the status dropdown**

The status filter dropdown (around line 1284) currently maps `Object.values(VehicleStatus)`. This will automatically include `DRAFT` now. No change needed — the enum update in Task 2 handles it.

Add a draft count badge next to the filter when drafts exist. Above the existing filter `<select>`, add a drafts indicator:

```tsx
{draftCount > 0 && (
  <button
    onClick={() => setFilterStatus(VehicleStatus.DRAFT)}
    className={`px-4 py-2 text-[9px] uppercase tracking-widest rounded border transition-all ${
      filterStatus === VehicleStatus.DRAFT
        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-400/70 hover:border-amber-500/60'
    }`}
  >
    {draftCount} Draft{draftCount !== 1 ? 's' : ''} Awaiting Review
  </button>
)}
```

**Step 3: Add Publish button to vehicle table rows**

In the vehicle table row actions (around line 1342 where `sortedVehicles.map` renders rows), add a Publish button for Draft vehicles. Next to the existing Edit/Delete buttons:

```tsx
{v.status === VehicleStatus.DRAFT && (
  <button
    onClick={async () => {
      if (confirm(`Publish ${v.year} ${v.make} ${v.model} to the website?`)) {
        await updateVehicle(v.id, { ...v, status: VehicleStatus.AVAILABLE });
      }
    }}
    className="px-3 py-2 bg-green-600/20 border border-green-500/40 text-green-400 text-[9px] uppercase tracking-widest hover:bg-green-600/40 transition-all rounded"
    title="Publish to website"
  >
    Publish
  </button>
)}
```

**Step 4: Add Draft badge styling in table rows**

In the status badge rendering section of each table row, add the Draft case. Find where Available/Pending/Sold/Wholesale badges are styled and add:

```tsx
{v.status === VehicleStatus.DRAFT && (
  <span className="px-3 py-1 text-[9px] uppercase tracking-widest border border-amber-500/40 text-amber-400 rounded">
    Draft
  </span>
)}
```

**Step 5: Add Draft to the status dropdown in the form**

In the vehicle add/edit form, the status `<select>` dropdown lists the enum values. It already maps `Object.values(VehicleStatus)`, so `Draft` will automatically appear. No change needed.

**Step 6: Add intake info display for Draft vehicles**

In the vehicle table row, below the VIN display, show intake source and purchase price for draft vehicles:

```tsx
{v.intakeSource && v.intakeSource !== 'manual' && (
  <span className="text-[8px] text-gray-500 ml-2">
    via {v.intakeSource}{v.purchasePrice ? ` · Bought $${v.purchasePrice.toLocaleString()}` : ''}
  </span>
)}
```

**Step 7: Verify build passes**

Run: `cd triple-j-auto-investment-main && npx vite build 2>&1 | tail -5`

Expected: Build succeeds with no errors.

**Step 8: Commit**

```bash
git add triple-j-auto-investment-main/pages/admin/Inventory.tsx
git commit -m "feat(20): add Draft filter, publish button, and intake source display to admin Inventory"
```

---

## Task 5: Image Compression Utility — Shared Module

**Files:**
- Create: `triple-j-auto-investment-main/utils/imageCompression.ts`

**Context:** The existing `resizeImage` in Inventory.tsx returns base64 strings (for DB storage). We need a new utility that returns Blobs (for Supabase Storage upload) with higher quality settings suitable for listing photos.

**Step 1: Create the utility**

```typescript
/**
 * Compress an image file for upload to Supabase Storage.
 * Returns a JPEG Blob optimized for web display.
 *
 * - Max dimension: 1200px (wider than the 800px admin thumbnail — these are listing photos)
 * - JPEG quality: 0.8 (higher than admin's 0.5 — listing photos need to look good)
 * - Maintains aspect ratio
 */
export function compressImageForUpload(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression produced empty blob'));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a thumbnail Blob for fast grid rendering.
 * 400px max dimension, lower quality.
 */
export function compressImageForThumbnail(file: File): Promise<Blob> {
  return compressImageForUpload(file, 400, 0.6);
}
```

**Step 2: Commit**

```bash
git add triple-j-auto-investment-main/utils/imageCompression.ts
git commit -m "feat(20): add shared image compression utility for Supabase Storage uploads"
```

---

## Task 6: Vehicle Photo Service — Supabase Storage Upload/Delete

**Files:**
- Create: `triple-j-auto-investment-main/services/vehiclePhotoService.ts`

**Context:** Existing image handling stores base64 in the database. This service handles the Supabase Storage upload flow: compress → upload → get public URL. It also handles deletion and reordering.

**Step 1: Create the service**

```typescript
import { supabase } from '../supabase/config';
import { compressImageForUpload } from '../utils/imageCompression';

const BUCKET = 'vehicle-photos';

export interface UploadProgress {
  index: number;
  total: number;
  status: 'compressing' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

/**
 * Upload a single photo for a vehicle.
 * Compresses client-side, uploads to Supabase Storage, returns public URL.
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  file: File,
  index: number
): Promise<string> {
  const blob = await compressImageForUpload(file);
  const timestamp = Date.now();
  const filePath = `${vehicleId}/${timestamp}-${index}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload multiple photos with progress callback.
 * Returns array of public URLs in upload order.
 */
export async function uploadVehiclePhotos(
  vehicleId: string,
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.({ index: i, total: files.length, status: 'compressing' });
      const url = await uploadVehiclePhoto(vehicleId, files[i], i);
      urls.push(url);
      onProgress?.({ index: i, total: files.length, status: 'done', url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      onProgress?.({ index: i, total: files.length, status: 'error', error: msg });
      // Continue uploading remaining photos — don't abort batch on single failure
    }
  }

  return urls;
}

/**
 * Delete a photo from Supabase Storage.
 * Extracts the storage path from the public URL.
 */
export async function deleteVehiclePhoto(publicUrl: string): Promise<void> {
  // Public URL format: https://<project>.supabase.co/storage/v1/object/public/vehicle-photos/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // Not a storage URL (legacy base64) — skip silently

  const filePath = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) console.error('Failed to delete photo:', error.message);
}

/**
 * Check if a URL is a Supabase Storage URL (vs legacy base64 data URI).
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('http') && url.includes(BUCKET);
}
```

**Step 2: Commit**

```bash
git add triple-j-auto-investment-main/services/vehiclePhotoService.ts
git commit -m "feat(20): add vehiclePhotoService for Supabase Storage upload/delete"
```

---

## Task 7: VehiclePhotoUploader Component — Mobile-First UI

**Files:**
- Create: `triple-j-auto-investment-main/components/admin/VehiclePhotoUploader.tsx`

**Context:** This replaces the existing drag-and-drop image section in the admin Inventory form. Camera-first on mobile, drag-drop on desktop. Proportional grid. Individual progress per photo. Drag-to-reorder. Hero image indicator.

**Step 1: Create the component**

```tsx
import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, Star, GripVertical, Loader2 } from 'lucide-react';
import { uploadVehiclePhotos, deleteVehiclePhoto, isStorageUrl, type UploadProgress } from '../../services/vehiclePhotoService';

interface Props {
  vehicleId: string;
  photos: string[];                          // Array of URLs (storage or legacy base64)
  onChange: (photos: string[]) => void;       // Called when photos array changes
  maxPhotos?: number;
}

export default function VehiclePhotoUploader({ vehicleId, photos, onChange, maxPhotos = 15 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxPhotos - photos.length;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, remaining);
    if (fileArray.length === 0) return;

    setUploading(true);
    setProgress(null);

    const urls = await uploadVehiclePhotos(
      vehicleId,
      fileArray,
      (p) => setProgress(p)
    );

    if (urls.length > 0) {
      onChange([...photos, ...urls]);
    }

    setUploading(false);
    setProgress(null);
  }, [vehicleId, photos, onChange, remaining]);

  const handleRemove = async (index: number) => {
    const url = photos[index];
    if (isStorageUrl(url)) {
      await deleteVehiclePhoto(url);
    }
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleMakeHero = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  };

  // Drag-to-reorder handlers
  const handleDragStart = (index: number) => {
    setDragSourceIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragSourceIndex === null || dragSourceIndex === targetIndex) {
      setDragOverIndex(null);
      setDragSourceIndex(null);
      return;
    }
    const next = [...photos];
    const [moved] = next.splice(dragSourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragOverIndex(null);
    setDragSourceIndex(null);
  };

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDropZone}
          className="border border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-tj-gold/50 transition-colors"
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-tj-gold animate-spin mx-auto" />
              {progress && (
                <p className="text-xs text-gray-400">
                  {progress.status === 'compressing' ? 'Compressing' : 'Uploading'} photo {progress.index + 1} of {progress.total}...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center gap-3">
                {/* Camera button — primary on mobile */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-tj-gold text-black text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95 transition-transform min-h-[48px]"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>

                {/* Gallery picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-600 text-gray-300 text-xs uppercase tracking-widest rounded-lg hover:border-gray-400 active:scale-95 transition-all min-h-[48px]"
                >
                  <ImagePlus className="w-5 h-5" />
                  Library
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {remaining} photo{remaining !== 1 ? 's' : ''} remaining · Drop files here on desktop
              </p>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragOverIndex(null); setDragSourceIndex(null); }}
              className={`relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-colors ${
                dragOverIndex === idx
                  ? 'border-tj-gold'
                  : idx === 0
                  ? 'border-tj-gold/50'
                  : 'border-transparent'
              }`}
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Hero badge */}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-tj-gold text-black px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  Cover
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
              </div>

              {/* Action overlay on hover/touch */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleMakeHero(idx)}
                    className="p-2 bg-tj-gold rounded-full text-black"
                    title="Set as cover photo"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-2 bg-red-600 rounded-full text-white"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more button in grid */}
          {remaining > 0 && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-400 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-[9px] mt-1">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add triple-j-auto-investment-main/components/admin/VehiclePhotoUploader.tsx
git commit -m "feat(20): add VehiclePhotoUploader component with camera-first mobile UI"
```

---

## Task 8: Wire Photo Uploader into Admin Inventory Form

**Files:**
- Modify: `triple-j-auto-investment-main/pages/admin/Inventory.tsx`

**Context:** Replace the existing base64 image handling section with VehiclePhotoUploader. The existing `resizeImage`, `processFiles`, and inline drag-drop zone get replaced. The form's `imageUrl` and `gallery` fields now store Supabase Storage URLs instead of base64 for new uploads. Existing base64 URLs continue to display correctly (img src handles both).

**Step 1: Add import**

At the top of Inventory.tsx, add:

```typescript
import VehiclePhotoUploader from '../../components/admin/VehiclePhotoUploader';
```

**Step 2: Add photos helper**

Inside the `AdminInventory` component, add a computed value that combines imageUrl and gallery into a single array (matching the existing `allImages` pattern):

```typescript
const currentPhotos = [newCar.imageUrl, ...(newCar.gallery || [])].filter(
  (url) => url && url.length > 10 // Filter out empty strings and placeholder-length strings
);
```

**Step 3: Add photo change handler**

```typescript
const handlePhotosChange = (photos: string[]) => {
  if (photos.length === 0) {
    setNewCar(prev => ({ ...prev, imageUrl: '', gallery: [] }));
  } else {
    setNewCar(prev => ({
      ...prev,
      imageUrl: photos[0],
      gallery: photos.slice(1),
    }));
  }
};
```

**Step 4: Replace the image upload section**

Find the existing drag-and-drop image section in the form (the area with `processFiles`, the file input, the drag-drop zone, and the image grid with "Make Cover" / "Delete" controls — approximately around lines 900-1000). Replace it with:

```tsx
<VehiclePhotoUploader
  vehicleId={editingId || `new-${Date.now()}`}
  photos={currentPhotos}
  onChange={handlePhotosChange}
/>
```

**Note:** For new vehicles (not yet saved), use a temporary ID. After the vehicle is saved and gets a real UUID, photos are already uploaded under the temp ID — this is fine, they're referenced by URL in the gallery array.

**Step 5: Keep the old resizeImage function for backward compatibility**

Don't delete `resizeImage` yet — it may still be used by the Google Sheets sync path for base64 images. Just stop using it in the form's photo section.

**Step 6: Verify build**

Run: `cd triple-j-auto-investment-main && npx vite build 2>&1 | tail -5`

**Step 7: Commit**

```bash
git add triple-j-auto-investment-main/pages/admin/Inventory.tsx
git commit -m "feat(20): replace base64 image handling with VehiclePhotoUploader in admin Inventory form"
```

---

## Task 9: Vehicle Intake Edge Function

**Files:**
- Create: `triple-j-auto-investment-main/supabase/functions/vehicle-intake/index.ts`

**Context:** This Edge Function receives `{ vin, purchasePrice, source }` from the Gmail trigger (or any other caller). It decodes the VIN via NHTSA, generates AI content via Gemini, computes market estimate and suggested price, generates a slug, and inserts the vehicle as Draft. Uses service_role key (no RLS restrictions). Follows the existing Edge Function pattern from process-review-requests.

**Step 1: Create the Edge Function**

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// NHTSA VIN Decode
// ---------------------------------------------------------------------------
interface VinData {
  make: string;
  model: string;
  year: number;
  bodyClass: string;
  trim: string;
  engineCylinders: string;
  fuelType: string;
  driveType: string;
  transmissionStyle: string;
}

async function decodeVin(vin: string): Promise<VinData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.Results?.[0];
    if (!raw || !raw.Make) return null;

    return {
      make: raw.Make || '',
      model: raw.Model || '',
      year: parseInt(raw.ModelYear) || 0,
      bodyClass: raw.BodyClass || '',
      trim: raw.Trim || '',
      engineCylinders: raw.EngineCylinders || '',
      fuelType: raw.FuelTypePrimary || '',
      driveType: raw.DriveType || '',
      transmissionStyle: raw.TransmissionStyle || '',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini AI Content Generation (server-side — uses fetch, not browser SDK)
// ---------------------------------------------------------------------------
function cleanJson(text: string): string {
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateDescription(make: string, model: string, year: number): Promise<string> {
  const prompt = `Write a helpful, honest 2-3 sentence listing description (max 40 words) for a ${year} ${make} ${model} at Triple J Auto Investment, a family-friendly Houston dealership selling reliable pre-owned vehicles in the $3K-$8K range. Focus on practical benefits. Tone: warm, straightforward.`;
  try {
    return (await callGemini(prompt)).trim() || `${year} ${make} ${model} — reliable and ready for its next owner.`;
  } catch {
    return `${year} ${make} ${model} — reliable and ready for its next owner.`;
  }
}

async function generateHeadline(make: string, model: string, year: number, bodyClass: string): Promise<{ en: string; es: string }> {
  const fallback = { en: `${year} ${make} ${model}`, es: `${year} ${make} ${model}` };
  const prompt = `Generate a bilingual identity-first headline for a ${year} ${make} ${model} (${bodyClass}) at a Houston BHPH dealership. Format: "[Identity Label] | [2-3 punchy words]." Max 15 words. Return ONLY valid JSON: {"en": "...", "es": "..."}`;
  try {
    const raw = await callGemini(prompt);
    return JSON.parse(cleanJson(raw)) as { en: string; es: string };
  } catch {
    return fallback;
  }
}

async function generateStory(make: string, model: string, year: number, mileage: number): Promise<{ en: string; es: string }> {
  const fallback = {
    en: `This ${year} ${make} ${model} is available at Triple J Auto Investment. Contact us to learn more.`,
    es: `Este ${year} ${make} ${model} esta disponible en Triple J Auto Investment. Contactenos para mas informacion.`,
  };
  const prompt = `Write a bilingual 3-5 sentence honest vehicle story for a ${year} ${make} ${model} with ${mileage || 'unknown'} miles at Triple J Auto Investment, a Houston BHPH dealership. Include ideal owner, strengths, condition transparency. Do NOT fabricate history. Return ONLY valid JSON: {"en": "...", "es": "..."}`;
  try {
    const raw = await callGemini(prompt);
    return JSON.parse(cleanJson(raw)) as { en: string; es: string };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Market Estimate + Slug (replicated from browser-side utils)
// ---------------------------------------------------------------------------
function estimateMarketValue(price: number, year: number, mileage: number): number {
  const age = new Date().getFullYear() - year;
  let multiplier = 1.20;
  if (age > 10) multiplier = 1.12;
  else if (age > 7) multiplier = 1.15;

  let estimate = price * multiplier;
  if (mileage > 150000) estimate = price * 1.10;
  else if (mileage > 120000) estimate *= 0.95;

  return Math.round(estimate / 100) * 100;
}

function generateSlug(year: number, make: string, model: string, id: string): string {
  const base = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${id.slice(0, 6)}`;
}

function suggestListingPrice(purchasePrice: number): number {
  // Target ~40-50% gross margin for BHPH (covers reconditioning buffer + profit)
  const markup = purchasePrice < 3000 ? 1.50 : 1.40;
  return Math.round((purchasePrice * markup) / 100) * 100;
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const { vin, purchasePrice, source, mileage: inputMileage } = await req.json();

    if (!vin || typeof vin !== 'string' || vin.length !== 17) {
      return new Response(
        JSON.stringify({ error: 'Valid 17-character VIN required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 1. Check for duplicate VIN
    // -----------------------------------------------------------------------
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('vin', vin.toUpperCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Vehicle with this VIN already exists', vehicleId: existing.id }),
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 2. NHTSA VIN decode
    // -----------------------------------------------------------------------
    const vinData = await decodeVin(vin);
    if (!vinData || !vinData.make) {
      return new Response(
        JSON.stringify({ error: 'VIN decode failed — could not identify vehicle' }),
        { status: 422, headers: CORS_HEADERS }
      );
    }

    const cost = parseFloat(String(purchasePrice)) || 0;
    const mileage = parseInt(String(inputMileage)) || 0;
    const suggestedPrice = suggestListingPrice(cost);
    const marketEst = estimateMarketValue(suggestedPrice, vinData.year, mileage);

    // -----------------------------------------------------------------------
    // 3. AI content generation (parallel)
    // -----------------------------------------------------------------------
    const [description, headline, story] = await Promise.all([
      generateDescription(vinData.make, vinData.model, vinData.year),
      generateHeadline(vinData.make, vinData.model, vinData.year, vinData.bodyClass),
      generateStory(vinData.make, vinData.model, vinData.year, mileage),
    ]);

    // -----------------------------------------------------------------------
    // 4. Insert as Draft
    // -----------------------------------------------------------------------
    const { data: inserted, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        vin: vin.toUpperCase(),
        make: vinData.make,
        model: vinData.model,
        year: vinData.year,
        mileage: mileage,
        price: suggestedPrice,
        cost: cost,
        status: 'Draft',
        description: description,
        image_url: '',
        gallery: [],
        diagnostics: [],
        date_added: new Date().toISOString().split('T')[0],
        identity_headline: headline.en,
        identity_headline_es: headline.es,
        vehicle_story: story.en,
        vehicle_story_es: story.es,
        is_verified: false,
        market_estimate: marketEst,
        intake_source: source || 'manheim_email',
        purchase_price: cost,
        suggested_price: suggestedPrice,
        intake_at: new Date().toISOString(),
      })
      .select('id, slug')
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Insert failed: ${insertError.message}` }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // -----------------------------------------------------------------------
    // 5. Generate slug (needs the ID from insert) and update
    // -----------------------------------------------------------------------
    const slug = generateSlug(vinData.year, vinData.make, vinData.model, inserted.id);
    await supabase.from('vehicles').update({ slug }).eq('id', inserted.id);

    return new Response(
      JSON.stringify({
        success: true,
        vehicleId: inserted.id,
        slug,
        vehicle: {
          vin: vin.toUpperCase(),
          year: vinData.year,
          make: vinData.make,
          model: vinData.model,
          suggestedPrice,
          marketEstimate: marketEst,
        },
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
```

**Step 2: Commit**

```bash
git add triple-j-auto-investment-main/supabase/functions/vehicle-intake/index.ts
git commit -m "feat(20): create vehicle-intake Edge Function (NHTSA decode + Gemini AI + Draft insert)"
```

---

## Task 10: Google Apps Script — Manheim Email Trigger

**Files:**
- Create: `triple-j-auto-investment-main/docs/manheim-gmail-trigger.gs`

**Context:** This is a Google Apps Script that runs in the user's Google account (not in the codebase). It watches Gmail for Manheim purchase confirmation emails, extracts VIN and purchase price, and calls the vehicle-intake Edge Function. We save it in docs/ for reference — the user copies it into Google Apps Script editor.

**Step 1: Create the Apps Script**

```javascript
/**
 * Manheim Purchase Email → Vehicle Intake Trigger
 *
 * SETUP:
 * 1. Go to https://script.google.com
 * 2. Create new project, paste this code
 * 3. Set SUPABASE_URL and SUPABASE_ANON_KEY in Script Properties
 *    (File > Project properties > Script properties)
 * 4. Run setupTrigger() once to create the Gmail watch
 * 5. Authorize when prompted
 *
 * HOW IT WORKS:
 * - Checks Gmail every 5 minutes for new Manheim emails
 * - Parses VIN and purchase price from the email body
 * - Calls the vehicle-intake Edge Function
 * - Labels processed emails so they're not processed twice
 */

// Configuration — set these in Script Properties
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_ANON_KEY: props.getProperty('SUPABASE_ANON_KEY'),
  };
}

/**
 * Run this ONCE to set up the time-based trigger.
 */
function setupTrigger() {
  // Remove existing triggers to prevent duplicates
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Check every 5 minutes
  ScriptApp.newTrigger('processManheimEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  // Create the label for tracking processed emails
  GmailApp.createLabel('Manheim/Processed');

  Logger.log('Trigger set up. Checking Gmail every 5 minutes.');
}

/**
 * Main function — called by the trigger every 5 minutes.
 */
function processManheimEmails() {
  const config = getConfig();
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    Logger.log('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not set in Script Properties');
    return;
  }

  // Search for unprocessed Manheim emails
  // Adjust the search query based on actual Manheim email sender/subject patterns
  const query = 'from:(manheim.com OR simulcast@manheim.com OR noreply@manheim.com) subject:(purchase OR confirmation OR "you won" OR "congratulations") -label:Manheim/Processed';
  const threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) return;

  const processedLabel = GmailApp.getUserLabelByName('Manheim/Processed')
    || GmailApp.createLabel('Manheim/Processed');

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      try {
        const body = message.getPlainBody() || message.getBody();
        const parsed = parseManheimEmail(body);

        if (parsed && parsed.vin) {
          const result = callVehicleIntake(config, parsed);
          Logger.log(`Processed VIN ${parsed.vin}: ${JSON.stringify(result)}`);
        } else {
          Logger.log(`Could not parse VIN from email: ${message.getSubject()}`);
        }
      } catch (e) {
        Logger.log(`Error processing email "${message.getSubject()}": ${e.message}`);
      }
    }
    // Mark thread as processed
    thread.addLabel(processedLabel);
  }
}

/**
 * Extract VIN and purchase price from Manheim email body.
 * Multiple regex patterns to handle different Manheim email formats.
 */
function parseManheimEmail(body) {
  // VIN patterns — 17 alphanumeric characters (no I, O, Q)
  const vinPatterns = [
    /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /Vehicle\s*Identification[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /\b([A-HJ-NPR-Z0-9]{17})\b/,
  ];

  let vin = null;
  for (const pattern of vinPatterns) {
    const match = body.match(pattern);
    if (match) {
      vin = match[1].toUpperCase();
      break;
    }
  }

  // Price patterns
  const pricePatterns = [
    /(?:purchase|sold|winning|bid|sale)\s*(?:price|amount)?[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:purchase|sold|winning|bid)/i,
    /amount[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ];

  let purchasePrice = null;
  for (const pattern of pricePatterns) {
    const match = body.match(pattern);
    if (match) {
      purchasePrice = parseFloat(match[1].replace(/,/g, ''));
      if (purchasePrice > 100 && purchasePrice < 100000) break; // Sanity check
      purchasePrice = null; // Reset if out of range
    }
  }

  // Mileage patterns
  const mileagePatterns = [
    /(?:mileage|odometer|miles)[:\s]*([\d,]+)/i,
    /([\d,]+)\s*(?:miles|mi)\b/i,
  ];

  let mileage = null;
  for (const pattern of mileagePatterns) {
    const match = body.match(pattern);
    if (match) {
      mileage = parseInt(match[1].replace(/,/g, ''));
      if (mileage > 0 && mileage < 500000) break;
      mileage = null;
    }
  }

  return vin ? { vin, purchasePrice, mileage } : null;
}

/**
 * Call the vehicle-intake Supabase Edge Function.
 */
function callVehicleIntake(config, parsed) {
  const url = `${config.SUPABASE_URL}/functions/v1/vehicle-intake`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
    },
    payload: JSON.stringify({
      vin: parsed.vin,
      purchasePrice: parsed.purchasePrice,
      mileage: parsed.mileage,
      source: 'manheim_email',
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code === 409) {
    return { status: 'duplicate', message: body.error };
  } else if (code >= 400) {
    throw new Error(`Edge Function error ${code}: ${body.error}`);
  }

  return { status: 'created', vehicleId: body.vehicleId, vehicle: body.vehicle };
}

/**
 * Manual test — call this from the Script Editor to test with a known VIN.
 */
function testIntake() {
  const config = getConfig();
  const result = callVehicleIntake(config, {
    vin: '1HGCV1F34KA028465',  // Example: 2019 Honda Accord
    purchasePrice: 3200,
    mileage: 85000,
  });
  Logger.log(JSON.stringify(result));
}
```

**Step 2: Commit**

```bash
git add triple-j-auto-investment-main/docs/manheim-gmail-trigger.gs
git commit -m "feat(20): add Google Apps Script for Manheim email parsing and vehicle-intake trigger"
```

---

## Task 11: Build Verification + Manual Testing Checklist

**Files:** None (verification only)

**Step 1: Verify full build passes**

Run: `cd triple-j-auto-investment-main && npx vite build 2>&1 | tail -10`

Expected: Build completes with no errors.

**Step 2: Verify TypeScript compilation**

Run: `cd triple-j-auto-investment-main && npx tsc --noEmit 2>&1 | head -30`

Expected: No type errors (or only pre-existing ones unrelated to this feature).

**Step 3: Manual testing checklist**

After deploying, verify:

1. **Migration applied:** Run `SELECT DISTINCT status FROM vehicles;` — should accept 'Draft'
2. **Admin page:** Filter dropdown shows "Draft" option
3. **Draft badge:** Draft vehicles show amber "Draft" badge in table
4. **Publish button:** "Publish" button appears on Draft rows, changes status to Available
5. **Photo upload:** Camera button opens device camera on mobile
6. **Photo upload:** Library button opens file picker, multiple select works
7. **Photo grid:** Photos display in proportional aspect-square grid
8. **Reorder:** Drag a photo to a new position — grid updates
9. **Hero badge:** First photo shows gold "Cover" badge
10. **Delete photo:** X button removes photo from grid and Storage
11. **Edge Function:** POST to `/functions/v1/vehicle-intake` with `{"vin":"1HGCV1F34KA028465","purchasePrice":3200}` — returns created vehicle with AI content
12. **Duplicate check:** Same VIN again returns 409
13. **Apps Script:** Run `testIntake()` in Apps Script editor — vehicle appears in admin Drafts

**Step 4: Final commit with all verification passing**

```bash
git add -A
git commit -m "feat(20): Manheim vehicle intake pipeline — complete implementation"
```

---

## Deployment Steps (Post-Implementation)

These are manual steps to be done in the Supabase Dashboard and Google:

1. **Apply phase-20-migration.sql** in Supabase SQL Editor
2. **Create vehicle-photos bucket** in Storage (public, 5MB limit, image/* types)
3. **Add Storage RLS policies** from the migration comments
4. **Deploy vehicle-intake Edge Function:** `supabase functions deploy vehicle-intake`
5. **Set Edge Function secret:** `GEMINI_API_KEY` (same key as VITE_GEMINI_API_KEY value)
6. **Set up Google Apps Script:**
   - Create new project at script.google.com
   - Paste contents of `docs/manheim-gmail-trigger.gs`
   - Set Script Properties: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - Run `setupTrigger()` and authorize
   - Test with `testIntake()`
7. **Verify end-to-end:** Send yourself a test email mimicking Manheim format, watch it auto-create a Draft
